# Handoff Report: Milestone 1 Deterministic Core PRNG & Performance Foundations

**Author**: M1 Explorer 1 (Milestone 1)  
**Target**: Milestone 1 Implementer ("Worker") & Parent Orchestrator  
**Date**: 2026-10-07  
**Working Directory**: `/Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_1/`

---

## 1. Observation

A full static and dynamic audit was conducted across all files in `src/engine/`, `src/demo.ts`, `src/web/app.js`, `src/server.ts`, `scripts/build_standalone.js`, and `tests/`.

### 1.1 Pinpointed Determinism Leaks (Exact Locations)

#### A. Direct `Math.random()` Invocations in Social Media Updates
- **`src/engine/careerEngine.ts` (lines 1216 & 1228)**:
  ```typescript
  1216:   const gain = Math.round(15000 + (player.overall * 800) + Math.random() * 25000);
  ...
  1228:   const caption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
  ```
- **`src/engine/careerEngine.js` (lines 1172 & 1184)**:
  ```javascript
  1172:   const gain = Math.round(15000 + (player.overall * 800) + Math.random() * 25000);
  ...
  1184:   const caption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
  ```
  *Impact*: Calling `postSocialMediaUpdate` produces unseeded random follower gains and caption selections, violating bit-for-bit determinism.

#### B. `Date.now()` Wall-Clock Timestamps in State and IDs
1. **Injury ID Generation**:
   - `src/engine/careerEngine.ts` (line 526):
     ```typescript
     seasonInjury = {
       id: `inj-${currentSeasonAge}-${Date.now()}`,
     ```
   - `src/engine/careerEngine.js` (line 497):
     ```javascript
     seasonInjury = {
       id: `inj-${currentSeasonAge}-${Date.now()}`,
     ```
   *Impact*: Identical seeds run at different times produce different `seasonInjury.id` strings in `player.injuryHistory` and `SeasonSnapshot.injuryOccurred`.

2. **Contract Wage Renegotiation Seed**:
   - `src/engine/careerEngine.ts` (line 1154):
     ```typescript
     const curRng = createPRNG(`${state.seed}-reneg-${Date.now()}`);
     const { success } = checkProbability(curRng, successChance);
     ```
   - `src/engine/careerEngine.js` (line 1110):
     ```javascript
     const curRng = createPRNG(`${state.seed}-reneg-${Date.now()}`);
     const { success } = checkProbability(curRng, successChance);
     ```
   *Impact*: Contract renegotiation outcome depends on execution timestamp and discards RNG state advancement instead of committing to `state.rngState`.

3. **Press Conference ID Generation**:
   - `src/engine/pressEngine.ts` (line 204):
     ```typescript
     conference: {
       id: `press-${Date.now()}`,
     ```
   - `src/engine/pressEngine.js` (line 162):
     ```javascript
     conference: {
       id: `press-${Date.now()}`,
     ```
   *Impact*: Press conference instances contain wall-clock timestamps in `id`.

4. **CLI Headless Simulation Seed in `demo.ts`**:
   - `src/demo.ts` (line 16):
     ```typescript
     let state = initPlayerCareer(
       `career-${Date.now()}`,
       "long",
     ```
   *Impact*: Each execution of `deno task demo` generates a random timestamp seed, preventing automated regression testing and bit-for-bit validation.

5. **Frontend Web Controller Press Trigger**:
   - `src/web/app.js` (lines 2940–2943):
     ```javascript
     if (typeof generatePressConference !== 'undefined') {
       const rng = { seed: (state.seasons.length * 37 + Date.now()) % 2147483647 };
       const res = generatePressConference(rng, p, teamName);
     ```
   *Impact*: (1) Passes `Date.now()`; (2) Passes an invalid `rng` object without `state: number`, causing `nextRandom` in `prng.js` to read `undefined` and enter a degenerate fallback state.

### 1.2 Premature Retirement Hazard in `demo.ts`
- In `continental.js` lines 189–218, `checkRetirement` enforces an annual retirement hazard starting at age 30:
  ```javascript
  const RETIREMENT_HAZARD = { 30: 0.01, 31: 0.02, 32: 0.04, 33: 0.08, 34: 0.14, 35: 0.22, 36: 0.32, 37: 0.45, 38: 0.58, 39: 0.70 };
  ```
- Starting player age is 16 (`careerEngine.ts:196`).
- When running `deno task demo`:
  - Run 1 completed **19 seasons** (stopped at age 35, 16.28 ms).
  - Run 2 completed **16 seasons** (stopped at age 32, 14.61 ms) due to early retirement hazard.
- Feature 2 in `PROJECT.md` mandates:
  *"Guaranteed 20+ season simulation loop without premature retirement hazard under 25ms"*.
  Neither run reached 20 seasons because retirement hazard terminated the career prematurely.

### 1.3 Audit of Remaining Engine Files
The following files were inspected line-by-line and confirmed to **properly thread PRNG** with zero unseeded random calls:
- `src/engine/prng.ts` / `prng.js`: Correct 32-bit FNV-1a / Xorshift implementation.
- `src/engine/attributes.ts` / `attributes.js`: Threaded `curRng` across all attribute rolls and Gaussian evolutions.
- `src/engine/economics.ts` / `economics.js`: Pure mathematical curves and threaded PRNG for market value variance.
- `src/engine/leagueSim.ts` / `leagueSim.js`: Pure Poisson distribution generator with threaded `curRng`.
- `src/engine/cupSim.ts` / `cupSim.js`: Threaded `curRng` across domestic and international cups.
- `src/engine/matchEngine.ts` / `matchEngine.js`: Threaded `curRng` across appearances, match ratings, xG/xA Gaussian distributions.
- `src/engine/nationalTeam.ts` / `nationalTeam.js`: Threaded `curRng`.
- `src/engine/rosterGen.ts` / `rosterGen.js`: Threaded `curRng` for squad name generation.
- `src/engine/careerEvents.ts` / `careerEvents.js`: Threaded `curRng`. Event IDs are deterministic:
  - `clutch-${player.age}-${clutchType}`
  - `dilemma-${player.age}-${dilemmaType}`
- `src/engine/sponsorships.ts` / `sponsorships.js`: Pure deterministic threshold lookups.
- `src/engine/agents.ts` / `agents.js`: Static catalogs and deterministic formulas.

### 1.4 Dual TS/JS Synchronization Mechanics
- `scripts/build_standalone.js` embeds raw `.js` engine files directly from `src/engine/*.js` into `standalone.html` via regex-based import/export stripping.
- `src/demo.ts` and headless CLI tests import TypeScript engines from `src/index.ts` -> `src/engine/*.ts`.
- Any modification to `.ts` that is not mirrored to `.js` leaves `standalone.html` broken or out-of-sync.

---

## 2. Logic Chain

1. **Determinism Break from Wall-Clock Time**:
   - `Date.now()` returns milliseconds since Unix epoch (Observation 1.1).
   - Any ID incorporating `Date.now()` (e.g. `inj-${currentSeasonAge}-${Date.now()}` or `press-${Date.now()}`) produces different state representations when run on identical seeds at different times.
   - When career logs or snapshots are serialized, compared, or snapshotted, equality assertions fail.
2. **Determinism Break from `Math.random()`**:
   - `Math.random()` uses runtime-dependent V8 unseeded PRNG state (Observation 1.1.A).
   - Calling `postSocialMediaUpdate` introduces non-deterministic state drift into `player.socialMedia.followers`, which in turn modifies overall career progression.
3. **State RNG Continuity**:
   - `renegotiateWageWithCurrentAgent` currently constructs a throwaway PRNG using `Date.now()` instead of drawing from `state.rngState` or a deterministic sub-seed.
   - To maintain mathematical reproducibility, operations must either advance and return `state.rngState`, or derive a seed deterministically from `(state.seed, state.step, state.player.age)`.
4. **Premature Retirement Hazard vs Benchmark Invariant**:
   - R5 and Milestone 1 require a headless CLI benchmark simulating **20+ seasons** under 25ms.
   - Player starts at age 16. Reaching 20 seasons requires playing through age 35 (completing 20 seasons, ending at age 36).
   - In `continental.js`, `RETIREMENT_HAZARD` triggers starting at age 30 (Observation 1.2), causing careers to abort at 16–19 seasons.
   - Therefore, a guard must ensure early retirement hazard is bypassed until at least 20 seasons have elapsed (age >= 36) or provide a parameter protecting the benchmark runner.
5. **Worker / Implementer Parity**:
   - Because `build_standalone.js` reads `.js` and `demo.ts` reads `.ts` (Observation 1.4), both source files must receive verbatim identical logic.

---

## 3. Caveats

1. **Ad-hoc Server / UI Starts**: In `server.ts` (line 57) and `app.js` (line 795), when an end-user begins a brand new game without specifying an explicit seed, defaulting to a fresh random seed (`career-${Date.now()}`) is legitimate user-facing behavior. However, once that seed is chosen, all internal engine processes MUST be 100% deterministic under that seed.
2. **`nextRandom` PRNG State Guard**: While existing engine files use `createPRNG(seed)`, external callers or sloppy triggers (like `app.js:2941`) may pass `{ seed: ... }` without `state`. Adding a defensive guard to `nextRandom` in `prng.ts`/`prng.js` prevents subtle NaN / stuck-state bugs.
3. **Retirement Realism vs Benchmark**: Deferring retirement hazard until 20 seasons ensures the benchmark always simulates 20+ seasons without prematurely ending. For longevity realism, hazard curves after 20 seasons (age >= 36) should remain intact up to `MAX_CAREER_AGE = 43`.

---

## 4. Conclusion & Concrete Implementation Recommendations

The Milestone 1 Implementer ("Worker") must apply the following specific changes across 6 files:

### 4.1 Exact ID Generation Scheme

All IDs across the simulation must adhere to deterministic hierarchical schemes:

| Entity | Old Format (Non-deterministic) | Recommended Deterministic Format |
|---|---|---|
| **Injury ID** | `inj-${currentSeasonAge}-${Date.now()}` | `inj-${state.seed}-s${newSeasons.length + 1}-${(player.injuryHistory?.length \|\| 0) + 1}` |
| **Press ID** | `press-${Date.now()}` | `press-${rng.seed}-s${seasonIndex \|\| player.age}-${scenario}` |
| **Season Snapshot** | `season-${state.seed}-${newSeasons.length + 1}` | `season-${state.seed}-${newSeasons.length + 1}` *(already deterministic)* |
| **Player ID** | `player-${seed}` | `player-${seed}` *(already deterministic)* |
| **Career Event** | `event-transfer-${player.age}` | `event-transfer-${player.age}` *(already deterministic)* |
| **Clutch Event** | `clutch-${player.age}-${clutchType}` | `clutch-${player.age}-${clutchType}` *(already deterministic)* |
| **Dilemma Event** | `dilemma-${player.age}-${dilemmaType}` | `dilemma-${player.age}-${dilemmaType}` *(already deterministic)* |
| **Social Media Post** | *(no ID, unseeded Math.random)* | `curRng = createPRNG(\`${player.id}-post-${platform}-${acc.totalPosts}\`)` |

---

### 4.2 Exact Replacement Snippets

#### 1. `src/engine/careerEngine.ts` and `src/engine/careerEngine.js`

**A. Injury ID Replacement (around line 526 in .ts, 497 in .js)**:
```typescript
// BEFORE:
seasonInjury = {
  id: `inj-${currentSeasonAge}-${Date.now()}`,
  name: pickedInjury.name,
  severity: pickedInjury.severity,
  gamesMissed: pickedInjury.gamesMissed,
  paceImpact: pickedInjury.paceImpact,
  seasonAge: currentSeasonAge,
  recovered: false,
};

// AFTER:
const injuryIndex = (player.injuryHistory?.length || 0) + 1;
seasonInjury = {
  id: `inj-${state.seed}-s${newSeasons.length + 1}-${injuryIndex}`,
  name: pickedInjury.name,
  severity: pickedInjury.severity,
  gamesMissed: pickedInjury.gamesMissed,
  paceImpact: pickedInjury.paceImpact,
  seasonAge: currentSeasonAge,
  recovered: false,
};
```

**B. Contract Wage Renegotiation Replacement (around line 1154 in .ts, 1110 in .js)**:
```typescript
// BEFORE:
export function renegotiateWageWithCurrentAgent(state: CareerState): { state: CareerState; success: boolean; message: string } {
  ...
  const curRng = createPRNG(`${state.seed}-reneg-${Date.now()}`);
  const { success } = checkProbability(curRng, successChance);

// AFTER:
export function renegotiateWageWithCurrentAgent(state: CareerState): { state: CareerState; success: boolean; message: string } {
  if (!state.player || !state.player.contract) {
    return { state, success: false, message: "No active club contract to renegotiate." };
  }
  const agent = state.player.agent;
  const neg = agent?.negotiation ?? 4;
  const successChance = 0.40 + (neg * 0.05);

  let curRng: PRNG = { seed: state.seed, state: state.rngState };
  const { rng: nextRng, success } = checkProbability(curRng, successChance);

  const player = { ...state.player, contract: { ...state.player.contract } };
  const newLog = [...state.log];
  if (success) {
    const boostPct = 0.10 + (neg * 0.02);
    player.contract.weeklyWage = Math.round(player.contract.weeklyWage * (1 + boostPct));
    player.contract.annualSalary = player.contract.weeklyWage * 52;
    player.morale = Math.min(100, player.morale + 10);
    const msg = `Success! ${agent ? agent.name : 'You'} successfully renegotiated with club leadership, boosting weekly wage to €${player.contract.weeklyWage.toLocaleString()}/wk (+${Math.round(boostPct * 100)}%)!`;
    newLog.push({ age: player.age, type: "contract_renegotiated", description: msg });
    return { state: { ...state, rngState: nextRng.state, player, log: newLog }, success: true, message: msg };
  } else {
    player.managerTrust = Math.max(0, player.managerTrust - 6);
    const msg = `The club board rejected the wage demands. The manager expressed frustration with mid-season contract demands (-6 Trust).`;
    newLog.push({ age: player.age, type: "contract_renegotiation_failed", description: msg });
    return { state: { ...state, rngState: nextRng.state, player, log: newLog }, success: false, message: msg };
  }
}
```

**C. Social Media Follower & Caption Replacement (around line 1210 in .ts, 1166 in .js)**:
```typescript
// BEFORE:
export function postSocialMediaUpdate(player: Player, platform: "instagram" | "tiktok" | "x"): { success: boolean; gain?: number; caption?: string; followers?: number; message?: string } {
  if (!player.socialMedia || !player.socialMedia[platform] || !player.socialMedia[platform].active) {
    return { success: false, message: "Account not active." };
  }
  const acc = player.socialMedia[platform];
  acc.totalPosts += 1;
  const gain = Math.round(15000 + (player.overall * 800) + Math.random() * 25000);
  acc.followers += gain;
  if (acc.followers >= 100000) acc.verified = true;
  player.socialMedia.totalFollowers = (player.socialMedia.instagram?.followers || 0) + (player.socialMedia.tiktok?.followers || 0) + (player.socialMedia.x?.followers || 0);

  const sampleCaptions = [
    "Three points in the bag! Focused on next week 🔥⚽",
    "Honored to wear this jersey every weekend. Thank you fans! 🙌",
    "Recovery session done. Locked in on next match 🧊💪",
    "Dream big, work in silence, let success make the noise ⚡",
    "Big performance from the boys today. We keep pushing 🚀"
  ];
  const caption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
  return { success: true, gain, caption, followers: acc.followers };
}

// AFTER:
export function postSocialMediaUpdate(
  player: Player,
  platform: "instagram" | "tiktok" | "x",
  seedOrRng?: string | PRNG,
): { success: boolean; gain?: number; caption?: string; followers?: number; message?: string } {
  if (!player.socialMedia || !player.socialMedia[platform] || !player.socialMedia[platform].active) {
    return { success: false, message: "Account not active." };
  }
  const acc = player.socialMedia[platform];
  acc.totalPosts += 1;

  let curRng: PRNG;
  if (typeof seedOrRng === "object" && seedOrRng && "state" in seedOrRng) {
    curRng = seedOrRng;
  } else if (typeof seedOrRng === "string" && seedOrRng.length > 0) {
    curRng = createPRNG(`${seedOrRng}-social-${platform}-${acc.totalPosts}`);
  } else {
    curRng = createPRNG(`${player.id || "player"}-social-${platform}-${acc.totalPosts}`);
  }

  const { rng: r1, value: randFactor } = randomFloat(curRng, 0, 1);
  const gain = Math.round(15000 + (player.overall * 800) + randFactor * 25000);
  acc.followers += gain;
  if (acc.followers >= 100000) acc.verified = true;
  player.socialMedia.totalFollowers =
    (player.socialMedia.instagram?.followers || 0) +
    (player.socialMedia.tiktok?.followers || 0) +
    (player.socialMedia.x?.followers || 0);

  const sampleCaptions = [
    "Three points in the bag! Focused on next week 🔥⚽",
    "Honored to wear this jersey every weekend. Thank you fans! 🙌",
    "Recovery session done. Locked in on next match 🧊💪",
    "Dream big, work in silence, let success make the noise ⚡",
    "Big performance from the boys today. We keep pushing 🚀",
  ];
  const { item: caption } = pickRandom(r1, sampleCaptions);
  return { success: true, gain, caption, followers: acc.followers };
}
```

---

#### 2. `src/engine/pressEngine.ts` and `src/engine/pressEngine.js`

**Update Signature & Press ID (around line 59 & 204 in .ts, 17 & 162 in .js)**:
```typescript
// BEFORE:
export function generatePressConference(
  rng: PRNG,
  player: Player,
  clubName: string = "Club",
): { rng: PRNG; conference: PressConference } {
  ...
  return {
    rng: curRng,
    conference: {
      id: `press-${Date.now()}`,
      outlet,
  ...

// AFTER:
export function generatePressConference(
  rng: PRNG,
  player: Player,
  clubName: string = "Club",
  seasonIndex?: number,
): { rng: PRNG; conference: PressConference } {
  ...
  const sTag = seasonIndex !== undefined ? `s${seasonIndex}` : `${player.age}`;
  return {
    rng: curRng,
    conference: {
      id: `press-${curRng.seed}-${sTag}-${scenario}`,
      outlet,
  ...
```

---

#### 3. `src/engine/prng.ts` and `src/engine/prng.js`

**Add Defensive Auto-Initialization in `nextRandom`**:
```typescript
// In nextRandom:
export function nextRandom(rng: PRNG): { rng: PRNG; value: number } {
  let e = (typeof rng.state === "number" && rng.state !== 0)
    ? rng.state
    : hashSeed(String(rng.seed || 1));
  e ^= e << 13;
  e ^= e >>> 17;
  e ^= e << 5;
  const a = e >>> 0 || 1;
  return {
    rng: { seed: rng.seed, state: a },
    value: a / 4294967296,
  };
}
```

---

#### 4. `src/engine/continental.js` (and `continental.ts`)

**Guaranteed 20+ Season Benchmark Protection in `checkRetirement`**:
```javascript
// BEFORE:
export function checkRetirement(rng, player, seasonInjury) {
  const age = player.age;
  if (age >= MAX_CAREER_AGE) {
    return { rng, retire: true, reason: `Body finally calls time at ${age} after an iron-man career.` };
  }
  if (age < 30) return { rng, retire: false };
  let hazard = RETIREMENT_HAZARD[age] ?? 0.82;
  ...

// AFTER:
export function checkRetirement(rng, player, seasonInjury, minSeasons = 20) {
  const age = player.age;
  if (age >= MAX_CAREER_AGE) {
    return { rng, retire: true, reason: `Body finally calls time at ${age} after an iron-man career.` };
  }
  // Guarantee at least 20 seasons simulated (player starts at age 16; 16 + 20 = 36)
  if (age < 36) return { rng, retire: false };

  let hazard = RETIREMENT_HAZARD[age] ?? 0.82;
  ...
```
*Note*: This guarantees that player career simulations always complete 20 seasons (ages 16 through 35), satisfying Acceptance Criteria R5 and Feature 2 without premature termination hazard.

---

#### 5. `src/demo.ts`

**Fixed Seed with CLI Override & 20+ Season Loop**:
```typescript
// BEFORE:
let state = initPlayerCareer(
  `career-${Date.now()}`,
  "long",
  "Valente",
  10,
  "right",
  "AR",
  "ST",
  "normal",
);

// AFTER:
const seed = Deno.args[0] || "career-benchmark-deterministic-2026";
let state = initPlayerCareer(
  seed,
  "long",
  "Valente",
  10,
  "right",
  "AR",
  "ST",
  "normal",
);
```

---

#### 6. `src/web/app.js`

**Trigger Press Conference Fix (line 2940)**:
```javascript
// BEFORE:
if (typeof generatePressConference !== 'undefined') {
  const rng = { seed: (state.seasons.length * 37 + Date.now()) % 2147483647 };
  const res = generatePressConference(rng, p, teamName);
  currentPressQuestion = res.conference;
  renderPressConference(currentPressQuestion);
}

// AFTER:
if (typeof generatePressConference !== 'undefined') {
  const pressSeed = `${state.seed}-press-s${state.seasons.length + 1}`;
  const rng = typeof createPRNG === 'function' ? createPRNG(pressSeed) : { seed: pressSeed, state: 1 };
  const res = generatePressConference(rng, p, teamName, state.seasons.length + 1);
  currentPressQuestion = res.conference;
  renderPressConference(currentPressQuestion);
}
```

---

## 5. Verification Method

To verify the implementation once applied:

1. **Verify M1 Test Suite**:
   ```bash
   deno test --allow-read --allow-write tests/tier1_features/m1_determinism_perf_test.ts
   ```
   *Expected*: All 4 tests pass (`F01`, `F02`, `F03`, `F04`).

2. **Verify 20+ Season CLI Benchmark Under 25ms**:
   ```bash
   deno task demo
   ```
   *Expected*: Simulates >= 20 seasons in < 25.0 ms with zero runtime errors.

3. **Verify Bit-for-Bit Identity Across Repeated Runs**:
   ```bash
   deno eval '
   import { initPlayerCareer, executeDecisionAndSimulate } from "./src/index.ts";
   function sim(seed) {
     let s = initPlayerCareer(seed, "long", "Valente", 10, "right", "AR", "ST", "normal");
     for (let i = 0; i < 20 && s.phase === "career" && s.currentEvent; i++) {
       s = executeDecisionAndSimulate(s, s.currentEvent.options[0].id);
     }
     return JSON.stringify(s.seasons);
   }
   const a = sim("test-deterministic-seed");
   const b = sim("test-deterministic-seed");
   console.log(a === b ? "DETERMINISM VERIFIED: BIT-FOR-BIT IDENTICAL" : "FAILED: DIVERGENCE DETECTED");
   '
   ```
   *Expected*: Prints `"DETERMINISM VERIFIED: BIT-FOR-BIT IDENTICAL"`.

4. **Verify Standalone Compilation**:
   ```bash
   deno run --allow-read --allow-write scripts/build_standalone.js
   ```
   *Expected*: Emits `Successfully built standalone.html!` with 0 errors.

5. **Invalidation Conditions**:
   - Any remaining instance of `Math.random()` in `src/engine/`.
   - Any instance of `Date.now()` within simulation state loops or ID generators.
   - Any simulation run with seed `X` failing to match the JSON output of a subsequent run with seed `X`.
   - `deno task demo` simulating fewer than 20 seasons or exceeding 25ms execution time.
