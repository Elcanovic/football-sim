# Handoff Report: Performance, CLI Execution & UI/Bundling Pipeline Survey

**Author**: Performance & UI Pipeline Explorer  
**Date**: 2026-10-07T21:05:00Z  
**Project Working Directory**: `/Users/elcanovic/Documents/Football Sim`  
**Working Directory**: `/Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_survey_perf_ui/`

---

## 1. Observation

### 1.1 CLI Execution Profile & `deno task demo`
- **Command executed**: `deno task demo`
- **Task Definition in `deno.json` (line 3)**:
  ```json
  "demo": "deno run --allow-read --allow-write src/demo.ts"
  ```
- **Observed CLI Output**:
  ```text
  CAREER TIMELINE (19 Seasons simulated in 13.41 ms)
  Peak OVR: 73 | Peak Market Value: €4,600,000
  Club + National Totals: 194 Apps | 160 Goals | 32 Assists | 0 Trophies
  National Team: 0 Caps | 0 Int. Goals | 0 Int. Trophies
  Total Wages: €5,902,620
  ```
- **Observed Premature Season Cutoff**:
  - In `src/demo.ts` line 34: `while (state.phase === "career" && state.player && state.player.age < 38)`
  - The simulation halted at age 34 (simulating only **19 seasons** from age 16 to 34, recorded in `career_summary.txt` lines 3–21), **failing the requirement to simulate 20+ full seasons**.
  - In `src/engine/continental.js` (lines 189–226), `checkRetirement` executes an annual hazard model starting at age 30:
    ```javascript
    const RETIREMENT_HAZARD = { 30: 0.01, 31: 0.02, 32: 0.04, 33: 0.08, 34: 0.14, 35: 0.22, 36: 0.32, 37: 0.45, 38: 0.58, 39: 0.70 };
    ```
  - When tested across 20 distinct random seeds, **only 9 out of 20 seeds reached >= 20 seasons** (counts: `[22, 21, 23, 21, 19, 19, 20, 18, 20, 17, 19, 18, 18, 20, 14, 22, 22, 19, 19, 18]`). Over 50% of runs naturally retire before season 20 without explicit demo-mode enforcement.

### 1.2 Microbenchmark & Memory Telemetry
- Using an in-memory test across 30 full careers (600+ seasons) via `Deno.memoryUsage()` and `performance.now()`:
  - **Single Season Compute**: ~35–50 µs total per season.
    - `simulateLeagueSeason` (`src/engine/leagueSim.ts`): **23.29 µs** per season (380 matches in a 20-team league).
    - `simulateSeasonPlayerStats` (`src/engine/matchEngine.ts`): **1.66 µs** per season.
    - `simulateCupTournament` (`src/engine/cupSim.ts`): **0.58 µs** per season.
    - `simulateContinentalCompetition` (`src/engine/continental.js`): **0.66 µs** per season.
    - `simulateNationalTeamSeason` (`src/engine/nationalTeam.ts`): **0.36 µs** per season.
    - `evolveAttributes` (`src/engine/attributes.ts`): **0.76 µs** per season.
  - **Full Career Compute (20–23 seasons)**:
    - Pure computation time for 22 seasons: **1.79 ms**.
    - Pure computation time for 23 seasons: **2.26 ms**.
    - Process RSS: 82.73 MB -> 88.63 MB (+5.9 MB after 30 careers).
    - V8 Heap Used: 12.17 MB (Heap Total: 19.89 MB).
  - The 13.41 ms reported by `demo.ts` is dominated by first-time catalog loading, V8 JIT warmup, and synchronous terminal stdout `console.log` statements executed while the performance timer is running (`src/demo.ts` lines 12–30).

### 1.3 PRNG Determinism Violations in Codebase
Verbatim grep results found non-deterministic calls violating reproducibility:
1. `src/engine/careerEngine.ts` (line 1216):
   ```typescript
   const gain = Math.round(15000 + (player.overall * 800) + Math.random() * 25000);
   ```
2. `src/engine/careerEngine.ts` (line 1228):
   ```typescript
   const caption = sampleCaptions[Math.floor(Math.random() * sampleCaptions.length)];
   ```
3. `src/engine/careerEngine.ts` (line 1154):
   ```typescript
   const curRng = createPRNG(`${state.seed}-reneg-${Date.now()}`);
   ```
4. `src/engine/careerEngine.ts` (line 526):
   ```typescript
   id: `inj-${currentSeasonAge}-${Date.now()}`
   ```
5. `src/engine/pressEngine.ts` (lines 162, 204):
   ```typescript
   id: `press-${Date.now()}`
   ```
6. `src/demo.ts` (line 16):
   ```typescript
   let state = initPlayerCareer(`career-${Date.now()}`, ...);
   ```

### 1.4 Bundler & UI Pipeline (`scripts/build_standalone.js`, `src/web/`)
- **Dual Architecture**: `src/engine/` contains twin `.ts` and `.js` files for all 14 engine modules.
  `src/index.ts` re-exports `.ts` files, while `src/index.js` re-exports `.js` files.
- `scripts/build_standalone.js` builds `standalone.html` by:
  1. Reading 5 JSON files (`countries.json`, `competitions.json`, `confederations.json`, `domesticCups.json`, `globalTrophies.json`).
  2. Reading 14 `.js` engine files and stripping `import`/`export` keywords via regex `stripImportsExports` (lines 24–31).
  3. Embedding data as `const CATALOG = { ... };` and the `CatalogIndex` class.
  4. Inlining `src/web/app.js` into `src/web/index.html` replacing `<script src="/app.js"></script>`.
- **External Dependency Violations in `src/web/index.html` and `standalone.html`**:
  - Line 7: `<script src="https://cdn.tailwindcss.com"></script>` (relies on Tailwind CDN).
  - Line 10: `<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans..." rel="stylesheet">` (relies on Google Fonts).
  - Lines 278, 336, 364, 823: external flag SVG links to `https://media.copero.com.ar/flags/4x3/...`.
  - When opened offline without network access, Tailwind fails to load and the entire UI layout and styling collapse into raw unstyled HTML.
- **Club Asset Database**:
  - `src/data/competitions.json` contains **1,254 clubs across 6 continents**.
  - **All 1,254 clubs** possess `primary_color`, `abbreviation`, `name`, `short_name`, and `logo_url`.
  - `src/web/assets/logos/` only contains 13 Azerbaijani clubs locally (`src/web/assets/logos/azerbaijan/`). The remaining 1,241 clubs rely exclusively on external CDN images that fail when offline or rate-limited.
- **DOM Binding Audit**:
  - `src/web/app.js` declares **196 top-level `document.getElementById` variables**.
  - An automated AST/regex scan confirms **196 / 196** top-level IDs exist in `src/web/index.html`.
  - Two IDs (`btnAgentRenegotiate`, `btnAgentFire`) are dynamically rendered in template literals (`src/web/app.js` lines 2387, 2390) and bound cleanly using optional chaining (`?.addEventListener`).

---

## 2. Logic Chain

1. **Premature Retirement & Determinism Cause**:
   - *Observation*: `demo.ts` uses `Date.now()` for initial seed and halts after 19 seasons in the default run because `checkRetirement` rolled a true value at age 34.
   - *Logic*: Because `ORIGINAL_REQUEST.md` (R5) strictly mandates:
     > "`deno task demo` must simulate a 20+ season career in under 25 milliseconds without runtime warnings or unhandled exceptions"
     the retirement logic must be constrained for demo runs (e.g. `minSeasons = 20` or suppressing retirement until age 36), and `demo.ts` must use a fixed canonical deterministic seed (e.g. `"copero-demo-deterministic-seed-v1"`).
   - *Logic*: Eliminating `Math.random()` and `Date.now()` in `careerEngine.ts` and `pressEngine.ts` guarantees that two runs with the same seed generate bit-for-bit identical player career stats, trophy counts, and match logs.

2. **Performance Budget & New Systems Headroom**:
   - *Observation*: Simulating 22 seasons currently takes 1.79 ms of pure compute, leaving **~23.2 ms of headroom** against the 25 ms budget.
   - *Logic*: The new systems in R1, R2, and R3 operate at distinct temporal granularities:
     - **R1 (Loans & Deadline Negotiations)**: Event-driven. Evaluated 1–2 times per season during transfer windows. Cost: ~5 µs per season.
     - **R2 (Tactical Systems & Positional Familiarity)**: Applied as scalar rating multipliers during match calculations (`attackLambda` and `defenseLambda` adjustments in `leagueSim.ts`). Manager DNA sackings and locker room cliques are evaluated at season checkpoints. Cost: ~5 µs per season.
     - **R3 (Cumulative Fatigue, Congestion & Injury Recovery)**: Scalar accumulator based on fixture count (league + cup + continental + international). Soft-tissue injury roll is an O(1) PRNG check. Recovery pathway selection is an O(1) branch. Cost: ~3 µs per season.
   - *Logic*: Total compute for 20 seasons with all new systems will remain **under 3.0 ms**, easily satisfying the < 25 ms requirement as long as implementers avoid per-match heap allocations, deep JSON cloning inside loops, or day-by-day nested iterations.

3. **Bundler & Offline Zero-Dependency Architecture**:
   - *Observation*: `standalone.html` retains `<script src="https://cdn.tailwindcss.com"></script>`. If offline, styling is completely lost.
   - *Logic*: Requirement R4 and Acceptance Criteria mandate:
     > "Standalone UI renders dark-mode obsidian glassmorphism with custom CSS variables, CSS Grid, and cubic-bezier transitions with zero npm/runtime framework dependencies."
     > "`deno run --allow-read --allow-write scripts/build_standalone.js` successfully compiles `standalone.html`."
     > "`standalone.html` parses and executes cleanly with 0 syntax errors and 100% DOM element binding integrity."
   - *Logic*: `scripts/build_standalone.js` must:
     1. Strip the external Tailwind CDN and Google Fonts tags.
     2. Inject an embedded Obsidian Glassmorphism CSS design system with custom CSS variables, CSS grid classes, elevated glass cards, and cubic-bezier micro-interactions into `<style>`.
     3. Bundle the 7 new engine modules (`tactics.js`, `managerDNA.js`, `dressingRoom.js`, `medicalEngine.js`, `loansEngine.js`, `svgGenerator.js`, `retirementMuseum.js`).
     4. Inline the 3-tier resilient asset pipeline so vector SVG crests render immediately in official club colors without external CDN requests.

---

## 3. Caveats

1. **Terminal stdout latency in CLI**: Writing extensive season logs to the terminal stdout can take 5–10 ms depending on the user's terminal emulator buffer. The 25 ms requirement must measure the simulation engine lifecycle or pre-format output in memory before a single flush.
2. **Dual-file sync responsibility**: Engine code is currently maintained as paired `.ts` and `.js` files. Any new module must either have both `.ts` and `.js` versions created, or `build_standalone.js` must transpile `.ts` using Deno or regex. Providing paired `.ts` and `.js` files remains the safest, zero-dependency approach for Deno.
3. **Local file protocol restrictions**: When opening `standalone.html` directly via `file://`, modern browsers block `fetch('/api/...')` due to CORS. The client-side controller in `app.js` must continue to invoke inlined engine functions directly (`typeof initPlayerCareer !== 'undefined'`) without any fallback fetch attempts.

---

## 4. Conclusion & Architectural Recommendations

### 4.1 CLI & Performance Architecture Recommendations
1. **Canonical Fixed Seed for `demo.ts`**:
   Change `src/demo.ts` line 16 from:
   ```typescript
   let state = initPlayerCareer(`career-${Date.now()}`, ...);
   ```
   to:
   ```typescript
   const DEMO_SEED = "copero-career-deterministic-2026";
   let state = initPlayerCareer(DEMO_SEED, ...);
   ```
2. **Guaranteed 20+ Seasons in Demo Mode**:
   Update `demo.ts` loop to ensure a minimum of 20 seasons are simulated:
   ```typescript
   while ((state.phase === "career" || state.seasons.length < 20) && state.player && state.player.age <= 38)
   ```
   And in `checkRetirement(rng, player, seasonInjury, minSeasons = 20)`: bypass the retirement hazard check if `player.seasons.length < minSeasons`.
3. **Strict PRNG Determinism Fixes**:
   - Replace `Math.random()` in `src/engine/careerEngine.ts` lines 1216 and 1228 with `randomInt(curRng, ...)` or deterministic follower/caption indexing.
   - Replace `${Date.now()}` in `careerEngine.ts` (lines 526, 1154) and `pressEngine.ts` (lines 162, 204) with deterministic counters (`${state.seed}-reneg-${state.step}`, `inj-${player.id}-${currentSeasonAge}-${index}`).
4. **Zero-Allocation Hot Path Discipline**:
   - In `tactics.ts`, `medicalEngine.ts`, and `managerDNA.ts`, pass scalar ratings or reuse static lookup tables.
   - Do not call `JSON.parse(JSON.stringify(...))` inside the season loop.

### 4.2 UI & Bundling Pipeline Architecture Recommendations
1. **Obsidian Glassmorphism CSS Design System**:
   Create a pure CSS stylesheet embedded directly into `src/web/index.html` and `standalone.html`:
   ```css
   :root {
     --obsidian-base: #0B0E14;
     --card-elevated: #161B22;
     --card-glass: rgba(22, 27, 34, 0.75);
     --border-highlight: #21262D;
     --border-glass: rgba(255, 255, 255, 0.08);
     --neon-cyan: #00F2FE;
     --neon-blue: #4FACFE;
     --neon-gold: #F5D061;
     --text-primary: #F0F6FC;
     --text-secondary: #8B949E;
     --text-dim: #484F58;
     --ease-smooth: cubic-bezier(0.16, 1, 0.3, 1);
     --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
   }
   ```
   Define utility and layout classes (`grid`, `flex`, `card-glass`, `btn-obsidian`, `badge-neon`, `modal-glass`) to replace all Tailwind CDN classes with zero runtime dependencies.

2. **3-Tier Resilient Asset Pipeline (`src/engine/svgGenerator.js` & `.ts`)**:
   Implement inline vector SVG generators:
   - `generateClubCrestSVG(team, size = 48)`:
     Generates an SVG shield using `team.primary_color`, a contrasting geometric diagonal sash or chevron, an outer gold/silver border, and `team.abbreviation` in bold sans-serif font.
   - `generateCountryFlagSVG(country, size = 32)`:
     Generates an SVG rectangle with `kit_primary_color` / `kit_secondary_color` stripes and FIFA code monogram.
   - `generateTrophySVG(trophyId, size = 64)`:
     Generates an SVG trophy cup in gleaming gold (`#F5D061`) with pedestal and ribbon.
   - In `src/web/app.js`: Club crest elements feature automatic fallback:
     ```javascript
     function renderClubBadge(team, imgElement, containerElement) {
       if (!team) return;
       imgElement.src = team.logo_url;
       imgElement.onerror = () => {
         imgElement.style.display = 'none';
         containerElement.innerHTML = generateClubCrestSVG(team);
       };
     }
     ```

3. **Post-Career Retirement Suite & Legacy Museum Integration**:
   - **Eras Scrapbook**: Procedurally grouped career eras (e.g., "The Breakthrough in South America", "European Dynasty", "Twilight Glory") showing club crests, peak market value, teammate leaders, and clutch trophies.
   - **Silverware Sanctuary**: Grouped trophy cases (League titles, Domestic cups, Continental cups, Ballon d'Or, World Cups) displaying hover stats (year, club, opponent, score).
   - **GOAT Legacy Index**: Algorithm calculating:
     `GOAT Score = (Trophies * 100) + (Goals * 2) + (Assists * 1.5) + (Awards * 150) + (Peak OVR * 10)`.
   - **Post-Playing Pathways**: Interactive modal to select:
     - Head Coach / Manager (tactical coaching license).
     - Pundit / Media Broadcaster (studio television contract).
     - Club Ambassador / Technical Director (boardroom transfer operations).

4. **DOM Element Binding Integrity Matrix**:
   All new screens and interactive modals must have static element IDs defined in `index.html` before binding in `app.js`:
   - Deadline Contract Negotiation: `negotiationModal`, `gaugePatience`, `gaugeAgentLeverage`, `gaugeManagerUrgency`, `btnAcceptDeal`, `btnCounterOffer`, `btnWalkAway`.
   - Tactical Systems: `cardTactics`, `selectTacticalFramework`, `badgePlayerRole`, `txtChemistryPenalty`.
   - Manager DNA: `cardManagerDNA`, `txtManagerName`, `badgeManagerStyle`, `gaugeBoardPatience`.
   - Medical Recovery Pathways: `medicalModal`, `btnConservativeRehab`, `btnAggressiveInjections`, `btnSpecialistSurgery`.
   - Retirement Museum: `screenRetirementMuseum`, `museumErasContainer`, `museumSilverwareSanctuary`, `museumGoatScore`, `btnSelectPathwayCoach`, `btnSelectPathwayPundit`, `btnSelectPathwayDirector`.

5. **Updated Bundler Module List in `scripts/build_standalone.js`**:
   `scripts/build_standalone.js` must be updated to read and inline the following 21 modules:
   ```javascript
   const prngCode = await Deno.readTextFile("src/engine/prng.js");
   const attrsCode = await Deno.readTextFile("src/engine/attributes.js");
   const ecoCode = await Deno.readTextFile("src/engine/economics.js");
   const leagueCode = await Deno.readTextFile("src/engine/leagueSim.js");
   const cupCode = await Deno.readTextFile("src/engine/cupSim.js");
   const matchCode = await Deno.readTextFile("src/engine/matchEngine.js");
   const rosterCode = await Deno.readTextFile("src/engine/rosterGen.js");
   const eventsCode = await Deno.readTextFile("src/engine/careerEvents.js");
   const nationalCode = await Deno.readTextFile("src/engine/nationalTeam.js");
   const continentalCode = await Deno.readTextFile("src/engine/continental.js");
   const agentsCode = await Deno.readTextFile("src/engine/agents.js");
   const sponsorshipsCode = await Deno.readTextFile("src/engine/sponsorships.js");
   const pressCode = await Deno.readTextFile("src/engine/pressEngine.js");
   const tacticsCode = await Deno.readTextFile("src/engine/tactics.js");
   const managerCode = await Deno.readTextFile("src/engine/managerDNA.js");
   const dressingRoomCode = await Deno.readTextFile("src/engine/dressingRoom.js");
   const medicalCode = await Deno.readTextFile("src/engine/medicalEngine.js");
   const loansCode = await Deno.readTextFile("src/engine/loansEngine.js");
   const svgCode = await Deno.readTextFile("src/engine/svgGenerator.js");
   const retirementCode = await Deno.readTextFile("src/engine/retirementMuseum.js");
   const careerCode = await Deno.readTextFile("src/engine/careerEngine.js");
   ```

---

## 5. Verification Method

To independently verify all findings and validate the final implementation:

### 5.1 CLI Performance & Determinism Test
Run the headless CLI benchmark command:
```bash
deno task demo
```
**Success criteria**:
- Output verifies: `CAREER TIMELINE (20+ Seasons simulated in < 25.00 ms)`.
- Running `deno task demo` twice produces identical stats, peak OVR, and trophies.
- `career_summary.txt` contains at least 20 season rows.

### 5.2 Standalone Bundler Verification
Run the bundler command specified in R5:
```bash
deno run --allow-read --allow-write scripts/build_standalone.js
```
**Success criteria**:
- Exits with code 0 and logs `Successfully built standalone.html!`.
- `standalone.html` contains no external script tags (`<script src="https://...`) or external stylesheets.

### 5.3 Standalone Offline Syntax & DOM Binding Check
Execute the following verification script in Deno:
```bash
deno eval '
const html = Deno.readTextFileSync("standalone.html");

// 1. Verify 0 syntax errors across all inlined scripts
const scripts = [...html.matchAll(/<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi)];
for (let i = 0; i < scripts.length; i++) {
  const code = scripts[i][1].trim();
  if (code) new Function(code);
}
console.log("Syntax verification: 100% CLEAN");

// 2. Verify DOM element binding integrity
const appJs = Deno.readTextFileSync("src/web/app.js");
const appIds = [...appJs.matchAll(/document\.getElementById\((["\x27])(.*?)\1\)/g)].map(m => m[2]);
const htmlIds = new Set([...html.matchAll(/id=(["\x27])(.*?)\1/g)].map(m => m[2]));
const missing = appIds.filter(id => !htmlIds.has(id));
console.log("Missing DOM IDs in standalone.html:", missing.length === 0 ? "NONE (100% Binding Integrity)" : missing);

// 3. Verify Offline Self-Containment
const externalUrls = [...html.matchAll(/src=["\x27]https?:\/\/[^"\x27]+["\x27]|href=["\x27]https?:\/\/[^"\x27]+["\x27]/g)];
console.log("External script/style dependencies:", externalUrls.filter(m => m[0].includes(".js") || m[0].includes(".css")).length);
'
```

### 5.4 Invalidation Conditions
- Any occurrence of `Math.random()` or `Date.now()` inside simulation loops invalidates determinism.
- Any network request (`fetch`, external CDN `<script>`) required to boot `standalone.html` invalidates offline self-containment.
- If `deno task demo` runs under 20 seasons, the performance criterion is invalidated.
