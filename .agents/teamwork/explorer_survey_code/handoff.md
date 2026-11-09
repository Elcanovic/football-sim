# Codebase Architecture Survey & Gap Analysis Report

## 1. Observation

### 1.1 Project Structure & File Inventory
The project at `/Users/elcanovic/Documents/Football Sim` is structured into five primary areas:
- **Root Configuration & Artifacts**:
  - `deno.json`: Deno configuration defining tasks `"demo": "deno run --allow-read --allow-write src/demo.ts"` and `"serve": "deno run --allow-net --allow-read src/server.ts"`, with `compilerOptions.lib: ["deno.window", "dom"]` (lines 1–10).
  - `standalone.html`: Monolithic compiled offline HTML client (1,239,474 bytes).
  - `career_summary.txt`: Output log produced by `src/demo.ts`.
  - `README.md`: Documentation overview.
- **Build Scripts (`scripts/`)**:
  - `scripts/build_standalone.js` (157 lines): Reads JSON catalogs and JavaScript engine files (`src/engine/*.js`), uses `stripImportsExports` (lines 24–31), injects embedded catalog and `src/web/app.js` into `src/web/index.html`, and writes `standalone.html`.
  - `scripts/build_standalone.ts` (165 lines): Alternative TypeScript variant using `stripTypeScript` (lines 20–32) and replacing `/api/start` and `/api/decision` fetch calls with inline function calls.
- **Data Catalog (`src/data/`)**:
  - `competitions.json` (14,678 lines, 594,824 bytes): Contains leagues and competitions across UEFA, CONMEBOL, CONCACAF, AFC, CAF, OFC. Each competition contains `teams` with fields `id`, `name`, `short_name`, `abbreviation`, `logo_url`, `primary_color`, `domestic_reputation`, `continental_reputation`, and `international_reputation` (e.g. `qarabag-fk` lines 12–22).
  - `countries.json`: 211 FIFA-affiliated nations with `fifa_code`, `iso_alpha2`, `name_en`, `confederation`, `international_reputation`, and `flag_url`.
  - `confederations.json`: Confederation codes and names.
  - `domesticCups.json`: Mapping of domestic cup tournaments to league IDs.
  - `globalTrophies.json`: Definitions for World Cup and Club World Cup.
  - `index.ts` / `index.js`: Exposes `CATALOG` and instantiates `catalogIndex` (`CatalogIndex` class with maps for fast lookups by teamId, country FIFA/ISO, reputation, and confederation).
- **Core Engine (`src/engine/`) — Dual TS/JS Mirror**:
  Every engine module exists as both a `.ts` (TypeScript) and `.js` (pure JavaScript) file:
  - `types.ts` (333 lines): Data models for positions, attributes, contracts, players, season snapshots, injuries, lifestyle, boot deals, brand sponsorships, and career events.
  - `prng.ts` / `prng.js` (78 lines): Deterministic xorshift32 PRNG initialized via FNV-1a `hashSeed`. Provides `randomFloat`, `randomInt`, `checkProbability`, `pickRandom`, `pickWeighted`, and Box-Muller `randomGaussian`.
  - `attributes.ts` / `attributes.js` (226 lines): Positional attribute weights across 13 positions, `calculateOverall`, `createInitialAttributes`, and `evolveAttributes` implementing an asymmetric age progression curve (growth 16–24, peak 25–28, decline 29+).
  - `economics.ts` / `economics.js` (154 lines): Piecewise `VALUE_CURVE` (50 OVR = €100k to 99 OVR = €250M), age multipliers, `calculateMarketValue`, `calculateWeeklyWage`, `createContract`, and `calculateTransferFee`.
  - `leagueSim.ts` / `leagueSim.js` (278 lines): Fast Poisson matchday simulator for round-robin leagues based on team reputation and player OVR delta. Computes final table, champions, European qualification ranks, relegation, and top 5 scorers/playmakers.
  - `cupSim.ts` / `cupSim.js` (156 lines): Knockout tournament engine (`simulateCupTournament`, `simulateNationalContinentalTournament`, `simulateWorldCup`).
  - `matchEngine.ts` / `matchEngine.js` (236 lines): On-pitch appearance bracket evaluation (`evaluateSquadRole`), attribute/form-driven expected goals/assists (`xG`/`xA`), Gaussian match stats generator, and match ratings.
  - `rosterGen.ts` / `rosterGen.js` (79 lines): Procedural generator for 3 teammates (positional rival, star, veteran) using regional name pools.
  - `careerEvents.ts` / `careerEvents.js` (689 lines): Procedural clutch match moments (`generateClutchMoment`, `resolveClutchAction`) and career dilemmas (`generateCareerDilemma`, `resolveCareerDilemma`).
  - `continental.ts` / `continental.js` (227 lines): League coefficient prestige ratings (0.15–1.0), continental slots, multi-stage knockout simulator (`simulateContinentalCompetition`), and variable retirement hazard model (`checkRetirement`).
  - `agents.ts` / `agents.js` (761 lines): 40 static agents catalog with ratings for negotiation, transferLeverage, prSavvy, loyaltyRisk, commission, and hiring fees.
  - `sponsorships.ts` / `sponsorships.js` (233 lines): Boot deals (Nike, Adidas, Puma, Mizuno) and luxury brand sponsorships.
  - `pressEngine.ts` / `pressEngine.js` (241 lines): Post-match media conferences, journalist questions, and front-page newspaper headlines.
  - `careerEngine.ts` / `careerEngine.js` (1,241 lines): Master orchestration engine containing `initPlayerCareer`, `executeDecisionAndSimulate`, `generateNextCareerEvent`, agent actions, lifestyle choice toggles, and social media updates.
  - `index.ts` / `index.js`: Main barrel exports.
- **Web UI (`src/web/`)**:
  - `index.html` (1,472 lines, 90,303 bytes): UI template with three primary sections: `#screenCreation` (lines 310–424), `#screenCareer` (lines 426–812), and `#screenSummary` (lines 814–1069), plus celebration overlay and modals. Loads Tailwind CSS via CDN (`https://cdn.tailwindcss.com`) and Google Fonts (lines 7–10).
  - `app.js` (3,045 lines, 141,815 bytes): Client application controller binding 141 top-level DOM element IDs, managing HUD updates, event decision cards, God mode developer modal, lifestyle modal, agent modal, boots modal, press modal, and rendering summary tabs.
- **Server (`src/server.ts`)**:
  - Static file and JSON API server on port 8000 handling `/api/catalog`, `/api/start`, `/api/decision`, `/api/agents`, `/api/agent/hire`, `/api/agent/fire`, `/api/agent/renegotiate`, and `/api/state`.
- **Demo Script (`src/demo.ts`)**:
  - Headless multi-decade career simulation script benchmarking 20+ seasons and saving `career_summary.txt`.

### 1.2 Baseline Execution Measurements
1. **CLI Execution Benchmark**:
   - Command: `deno task demo`
   - Output: `CAREER TIMELINE (20 Seasons simulated in 18.28 ms)`
   - Exit code: `0`. Simulates 20 seasons of player Valente (#10, ST) from age 16 to 36 with full attribute evolutions, match statistics, domestic league, cup, continental tournaments, and transfers in 18.28 milliseconds (well within the < 25 ms requirement).
2. **Standalone Build Execution**:
   - Command: `deno run --allow-read --allow-write scripts/build_standalone.js`
   - Output: `Successfully built standalone.html!` (exit code 0).
3. **Syntax Validation**:
   - Evaluated all 4 `<script>` tags in `standalone.html` via dynamic Function evaluation. All 4 script blocks parsed with zero syntax errors.
4. **DOM ID Binding Integrity**:
   - Evaluated 141 top-level `document.getElementById` bindings declared in `src/web/app.js` against `src/web/index.html`. 100% (141/141) of initial static elements resolve cleanly. Dynamic elements (`btnAgentRenegotiate`, `btnAgentFire`) are rendered inside modal innerHTML.

### 1.3 Exact Code Observations of Existing Mechanics
- **Contracts (`src/engine/types.ts:43–52`)**:
  ```typescript
  export interface Contract {
    clubId: string;
    yearsRemaining: number;
    weeklyWage: number;
    annualSalary: number;
    releaseClause: number | null;
    squadRole: SquadRole;
    goalBonus?: number;
    cleanSheetBonus?: number;
  }
  ```
  Contract contains only basic weekly wage, generic release clause, squad role, and optional goal/clean sheet bonus. It has no appearance fee, no clause categorization (domestic/continental/relegation), and no squad status guarantees.
- **Loans (`src/engine/types.ts:287–289, 301`)**:
  `DecisionType` contains strings `"loan_offer"`, `"post_loan_retained"`, `"post_loan_not_retained"`, and `DecisionOption.type` includes `"join_loan"`. However, in `src/engine/careerEngine.ts` and `src/engine/careerEngine.js`, there is zero logic handling loans. Neither loan offers, wage splits, buy options, mandatory triggers, recall clauses, nor parent club match restrictions exist anywhere in the execution loop.
- **Contract Negotiations (`src/engine/careerEngine.ts:310–357, 1147–1173`)**:
  Contract signing is automatic upon clicking an option. Wage renegotiation (`renegotiateWageWithCurrentAgent`) is a simple single boolean probability roll (`0.40 + neg * 0.05`). There is no interactive deadline-day negotiation hot-seat, no turn-based counter-offers, and no dynamic meters for Club Patience / Walkout Risk, Agent Leverage, or Manager Urgency.
- **Agents (`src/engine/agents.ts:1–18`)**:
  `PlayerAgent` contains fields `personality`, `tier`, `negotiation`, `transferLeverage`, `prSavvy`, `loyaltyRisk`, `commission`, and `hiringFee`. However, the 4 behavioral archetypes (The Super-Agent, The Family Relative, The Tactical Mentor, Self-Represented) are not formalized as behavioral classes or stateful negotiation drivers.
- **Tactics & Roles**:
  `src/engine/matchEngine.ts` contains only standard FIFA positional tags (`ST`, `CB`, `CAM`, etc.). The tactical styles (Gegenpress, Tiki-Taka, Low Block Counter, Fluid Direct, Catenaccio), positional tactical roles (Inverted Winger, Box-to-Box, Regista, Sweeper Keeper), and role unfamiliarity penalties are completely absent.
- **Managers & Sacking**:
  `Player.managerTrust` is a solitary scalar (0–100). There is no Manager data structure, no procedural manager personalities (Youth Developer, Win-Now Tyrant, Pragmatic Disciplinarian), no board expectations, no mid-season sacking or hiring, and no tactical re-evaluations.
- **Locker Room Dynamics (`src/engine/careerEngine.ts:666–674`)**:
  Captaincy is assigned abruptly via `if (player.age >= 24 && player.managerTrust >= 85 && player.captaincyStatus === "none") player.captaincyStatus = "club_captain";`. There are no progressive leadership tiers (`Squad Player -> Core Member -> Vice-Captain -> Club Captain`) and no locker room social cliques (language/nationality factions, youth vs. veterans, wage disparity tension).
- **Physical Load & Fatigue**:
  Fatigue is not tracked. Injury rolls in `careerEngine.ts:510–522` rely exclusively on a static base rate (0.14) plus age and physical attribute modifiers. There is no cumulative match load, no fixture congestion modeling (midweek European travel, cup replays, international duty), and no tactic-dependent injury risk spikes.
- **Medical Recovery**:
  When an injury occurs (`careerEngine.ts:522–542`), games missed are deducted from appearances and pace is penalized. There are no medical recovery pathways (Conservative Rehabilitation, Aggressive Cortisone Injections, Specialist Surgery Abroad).
- **UI Architecture (`src/web/index.html:7–10`)**:
  The interface currently imports Tailwind CSS via CDN (`https://cdn.tailwindcss.com`) and Google Fonts. It does not use the required obsidian glassmorphism color palette (`#0B0E14` base, `#161B22` cards, `#21262D` borders, `#00F2FE`, `#4FACFE`, `#F5D061` neon/gold accents) or native CSS variables/Grid layouts. In offline mode, the Tailwind CDN script fails to load.
- **Asset Pipeline (`src/web/app.js:958, 1071, 1334, 1879`)**:
  Club logos are loaded via `<img src="${team.logo_url}">` with fallback `onerror="this.style.display='none'"`. There is no procedural Tier 2 inline SVG generator rendering vector crests using club colors (`primary_color`) and typography initials.
- **Retirement Suite (`src/web/app.js:1860–1910, 2060–2099`)**:
  The retirement screen contains four tabs (`eras`, `trophies`, `social`, `card`). The Eras scrapbook uses hardcoded title strings (`"The Breakthrough Chapter"`, `"The Veteran Farewell"`), lacks teammate details, clutch moment references, and transfer fees. The silverware cabinet lacks hover stats (year, club, opponent, score), lacks an algorithmic GOAT Legacy Index, and has no post-playing career pathways (Head Coach, Pundit, Club Ambassador).
- **PRNG Determinism (`src/engine/careerEngine.ts:526, 1154, 1216, 1228`)**:
  Non-deterministic calls exist in the codebase:
  - `Date.now()` is used in injury IDs (`inj-${currentSeasonAge}-${Date.now()}`), wage renegotiation seeds (`createPRNG(\`${state.seed}-reneg-${Date.now()}\`)`), and press conference IDs.
  - `Math.random()` is used directly in `postSocialMediaUpdate` (lines 1216, 1228).
  This prevents exact deterministic repeatability under fixed seeds.
- **Standalone Bundler (`scripts/build_standalone.js:148–156`)**:
  `build_standalone.js` injects `src/web/app.js` verbatim without replacing the `/api/*` fetch calls (`/api/start`, `/api/decision`, `/api/agents`, `/api/agent/hire`, `/api/agent/fire`, `/api/agent/renegotiate`). In `standalone.html` when opened offline via `file://`, these `fetch()` calls fail, breaking offline gameplay.

---

## 2. Logic Chain

1. **Premise on System Architecture**:
   From Observation 1.1, the engine exists in both TypeScript (`src/engine/*.ts`) and JavaScript (`src/engine/*.js`), with `demo.ts` importing TypeScript and `build_standalone.js` inlining JavaScript. Therefore, all new models, algorithms, and simulation methods must be implemented symmetrically or compiled so that both the headless CLI (`deno task demo`) and the offline bundler (`build_standalone.js`) remain 100% in sync without discrepancies.

2. **Analysis of Requirement R1 (Economics & Transfer Market)**:
   - Observation 1.3 proves that loans currently only exist as unreferenced enum strings. To satisfy R1, a comprehensive Loan model must be created supporting `full-season`, `6-month winter`, and `multi-year developmental` loans, with configurable wage splits (0–100%), purchase options, mandatory promotion/appearance purchase triggers, recall rights, and parent club match restriction enforcement.
   - Observation 1.3 proves that contract negotiations are static and lack turn-based interaction. To satisfy R1, an interactive deadline-day negotiation hot-seat must be implemented with turn-based counter-offers and live dynamic meters (Club Patience / Walkout Risk, Agent Leverage, Manager Urgency).
   - Contract models must be expanded to include base wage, appearance fees, goal/clean-sheet bonuses, categorized release clauses (domestic, continental, relegation), and squad status guarantees.
   - Observation 1.3 proves that the 4 agent archetypes (The Super-Agent, The Family Relative, The Tactical Mentor, Self-Represented) must be formally introduced with distinctive bargaining weights, commission rates, and priority preferences.

3. **Analysis of Requirement R2 (Tactics, Managers & Dressing Room)**:
   - Observation 1.3 shows that match calculations in `matchEngine.ts` are purely position/OVR-based without tactical philosophies or tactical roles. Incorporating Gegenpress, Tiki-Taka, Low Block Counter, Fluid Direct, and Catenaccio with player tactical roles (Inverted Winger, Box-to-Box, Regista, Sweeper Keeper) and out-of-role chemistry penalties will directly enrich simulation variance and outcome deltas.
   - Procedural managers with personalities (Youth Developer, Win-Now Tyrant, Pragmatic Disciplinarian) must be modeled with board patience meters, dynamic sackings, appointments, and squad re-evaluations.
   - Locker room dynamics must replace the rudimentary captaincy flag with progressive leadership tiers (Squad Player -> Core Member -> Vice-Captain -> Club Captain) and clique tensions (nationality clusters, youth vs. veterans, wage disparity).

4. **Analysis of Requirement R3 (Fatigue, Congestion & Medicine)**:
   - Observation 1.3 confirms that injuries currently use a static baseline probability and lack physical load or congestion mechanics. Modeling midweek fixture congestion (domestic league, cup replays, European travels, international tournaments) and pressing intensity will simulate authentic cumulative fatigue and non-contact soft-tissue breakdown (hamstrings, groins, ACLs).
   - Actionable medical pathways (Conservative Rehabilitation, Aggressive Cortisone Injections, Specialist Surgery Abroad) must be added with permanent attribute consequences, reinjury risks, and recovery timelines.

5. **Analysis of Requirement R4 (UI/UX, Asset Pipeline & Retirement Suite)**:
   - Observation 1.3 demonstrates that `index.html` relies on external Tailwind CDN and Google Fonts, violating offline self-containment. Converting the UI to native CSS variables, CSS Grid, and cubic-bezier transitions using the obsidian glassmorphism palette (`#0B0E14`, `#161B22`, `#21262D`, `#00F2FE`, `#4FACFE`, `#F5D061`) removes all external runtime dependencies.
   - Observation 1.3 shows that club crests have no fallback when CDN images fail. Implementing a 3-tier asset pipeline with procedural inline SVG crests using `primary_color` and club initials (`abbreviation`) ensures zero broken images offline.
   - The Retirement Suite must be overhauled: multi-chapter Eras Scrapbook with procedurally generated titles, teammates, clutch moments, and transfer fees; Silverware Sanctuary with hover match details (year, club, opponent, score) and algorithmic GOAT Legacy Index; and post-career pathway selection (Head Coach, Pundit, Club Ambassador).

6. **Analysis of Requirement R5 (Performance, Determinism & Bundler)**:
   - Observation 1.2 demonstrates that the simulation runs 20 seasons in 18.28 ms, leaving ample headroom under the 25 ms benchmark. All new tactical, fatigue, and managerial loops must remain O(1) per match/season to preserve this speed.
   - Observation 1.3 reveals that `Date.now()` and `Math.random()` are used in `careerEngine` and `pressEngine`. Replacing all non-deterministic calls with stateful PRNG invocations guarantees exact reproducibility across identical seeds.
   - Observation 1.3 shows that `scripts/build_standalone.js` does not replace `/api/*` fetch calls in `app.js`. The bundler must inject client-side engine wrappers that bypass network fetch and directly execute local state transitions, ensuring `standalone.html` runs completely offline with 0 errors.

---

## 3. Caveats

1. **Dual Language Mirror**:
   Because `demo.ts` imports TypeScript modules while `build_standalone.js` reads JavaScript files, any logic implemented in TypeScript must have an identical equivalent in JavaScript (or the build script must transpile TypeScript). Failure to keep them synchronized would result in CLI demo and standalone HTML exhibiting divergent behaviors.
2. **Catalog Immutability**:
   `competitions.json` contains over 1,200 teams and 14,000 lines of data. While clubs contain `primary_color`, `abbreviation`, and `short_name`, secondary colors are not explicitly provided for all teams. The procedural SVG crest generator must algorithmically derive contrasting secondary and accent colors (e.g. via luminance or gold/white/silver accents) if not present.
3. **Performance Budget**:
   The 25 ms requirement for 20 seasons in `deno task demo` allows ~1.25 ms per season. New features (tactics, congestion, manager evaluations, dressing room cliques) must use direct arithmetic calculations and avoid deep nested object allocations or unbounded loops during the automated CLI season cycle.

---

## 4. Conclusion

The current Football Sim repository possesses a sound architectural foundation: a fast Poisson league engine, robust catalog indexing for 211 nations and 1,200+ clubs, and an asymmetric player aging curve that simulates 20 seasons in 18.28 ms.

However, significant gaps exist between the current codebase and requirements R1 through R5:
- **R1 Gap**: Loans are completely unimplemented; contract negotiations lack turn-based mechanics, patience meters, and leverage; contract perks (appearance fees, clause categories) are missing; agent archetypes are not formalized.
- **R2 Gap**: Tactical systems (Gegenpress, Tiki-Taka, etc.) and player roles are absent; managers are not modeled (no personalities, board expectations, sackings); dressing room cliques and progressive leadership tiers do not exist.
- **R3 Gap**: Fixture congestion and cumulative physical load are not modeled; actionable medical pathways (Conservative Rehab, Cortisone Injections, Specialist Surgery) do not exist.
- **R4 Gap**: The UI relies on external Tailwind CDN; missing club images lack procedural inline SVG vector crest fallbacks; the retirement suite lacks narrative Eras titles, teammate links, hover trophy stats, algorithmic GOAT Legacy Index, and post-career pathway selection.
- **R5 Gap**: PRNG determinism is compromised by `Date.now()` and `Math.random()`; `scripts/build_standalone.js` fails to adapt API fetch calls for standalone offline execution.

Closing these gaps requires systematic enhancement across the data models, engine simulation loops, standalone build pipeline, and user interface.

---

## 5. Verification Method

To independently verify the observations and findings in this report, execute the following commands and inspections:

1. **CLI Performance Benchmark**:
   ```bash
   deno task demo
   ```
   *Expected outcome*: Simulates 20 seasons of player Valente in under 25 milliseconds with exit code 0 and logs results to `career_summary.txt`.

2. **Standalone Build Execution**:
   ```bash
   deno run --allow-read --allow-write scripts/build_standalone.js
   ```
   *Expected outcome*: Successfully compiles `standalone.html` with exit code 0.

3. **PRNG Determinism Verification**:
   Inspect `src/engine/careerEngine.ts` lines 526, 1154, 1216, 1228 to confirm instances of `Date.now()` and `Math.random()`. Invalidation condition: any simulation run with a fixed seed produces divergent career totals or event sequences across identical seeds.

4. **Missing Loan & Tactical Logic Inspection**:
   Inspect `src/engine/types.ts` line 287 (`"loan_offer"`), `src/engine/matchEngine.ts` (absence of tactical style multipliers), and `src/engine/careerEngine.ts` (absence of loan handling or manager personality models).

5. **DOM Element Binding Integrity Verification**:
   ```bash
   deno eval "
   const appJs = await Deno.readTextFile('src/web/app.js');
   const html = await Deno.readTextFile('src/web/index.html');
   const topLines = appJs.split('\n').slice(0, 200).join('\n');
   const topIds = [...topLines.matchAll(/const\s+\w+\s*=\s*document\.getElementById\(['\"]([^'\"]+)['\"]\)/g)].map(m => m[1]);
   const idSetInHtml = new Set([...html.matchAll(/id=['\"]([^'\"\s]+)['\"]/g)].map(m => m[1]));
   const missingTop = topIds.filter(id => !idSetInHtml.has(id));
   console.log('Top IDs count:', topIds.length, 'Missing:', missingTop.length);
   "
   ```
   *Expected outcome*: Top IDs count: 141, Missing: 0.
