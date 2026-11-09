# BallSim Architecture & Codebase Indexing Blueprint

> **Role & Purpose**: This document serves as the high-density architectural source of truth for AI agents and developers. It details the simulation lifecycle, domain data structures, UI conventions, and the optimized `ctags` indexing pipeline to ensure precision edits with minimal context consumption.

---

## 1. System Overview & Core Tenets

```
               ┌────────────────────────────────────────────────────────┐
               │       PRNG Core (FNV-1a seed hash + xorshift32)        │
               │               src/engine/prng.ts / .js                 │
               └───────────────────────────┬────────────────────────────┘
                                           │ Deterministic Seed
                                           ▼
┌───────────────────────────────────────────────────────────────────────────────────────────┐
│                                   MASTER CAREER ENGINE                                    │
│                              src/engine/careerEngine.ts / .js                             │
│   initPlayerCareer() ───► advanceSeason() ───► executeDecisionAndSimulate()               │
└───────┬───────────────────────────┬───────────────────────────┬───────────────────────────┘
        │                           │                           │
        ▼                           ▼                           ▼
┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
│  Match & League  │        │  Economics &     │        │  Events &        │
│  Simulation      │        │  Negotiations    │        │  Narrative       │
├──────────────────┤        ├──────────────────┤        ├──────────────────┤
│ matchEngine.ts   │        │ economics.ts     │        │ careerEvents.ts  │
│ leagueSim.ts     │        │ loansEngine.ts   │        │ pressEngine.ts   │
│ cupSim.ts        │        │ negotiation.ts   │        │ nationalTeam.ts  │
│ continental.ts   │        │ agents.ts        │        │ sponsorships.ts  │
└──────────────────┘        └──────────────────┘        └──────────────────┘
        │                           │                           │
        └───────────────────────────┼───────────────────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    ▼                               ▼
    ┌───────────────────────────────┐   ┌───────────────────────────────┐
    │     Headless CLI Engine       │   │    Single-File Standalone     │
    │         src/demo.ts           │   │    scripts/build_standalone.js│
    │   (deno task demo < 15ms)     │   │    standalone.html / index    │
    └───────────────────────────────┘   └───────────────┬───────────────┘
                                                        ▼
                                        ┌───────────────────────────────┐
                                        │        Reactive Web UI        │
                                        │       src/web/app.js          │
                                        │  src/web/index.template.html  │
                                        └───────────────────────────────┘
```

### Architectural Tenets
1. **Zero External Runtime Dependencies**: Built with pure vanilla TypeScript/ES6+ and modern native DOM APIs (Tailwind CSS loaded via CDN, no frameworks).
2. **Deterministic Parity**: Bit-for-bit reproducibility via a fixed-seed xorshift32 PRNG, seeded by an FNV-1a string hash, with Box-Muller for Gaussian draws (`src/engine/prng.ts`).
3. **Dual TS/JS Engine Parity**: Modules in `src/engine/` exist as both `.ts` (strict type-checking, headless test suites) and `.js` (single-file bundler ingestion). **Any engine logic edit must be mirrored across both files.**
4. **Sub-25ms CLI Benchmark**: A 20+ season career simulation must complete in under 25 milliseconds via `deno task demo`.
5. **Standalone Offline Portability**: `scripts/build_standalone.js` compiles all catalogs, engine code, and UI into self-contained HTML files (`standalone.html`, `index.html`, and `src/web/index.html`).

---

## 2. Directory Map & Functional Roles

| Directory / File | Type | Functional Role |
| :--- | :--- | :--- |
| `src/engine/careerEngine.ts` / `.js` | Engine Core | Master state machine, lifecycle ticks, season transitions, and option resolution. |
| `src/engine/types.ts` | Type Definitions | Domain interfaces (`Player`, `CareerState`, `Club`, `Contract`, `Agent`, etc.). |
| `src/engine/matchEngine.ts` / `.js` | Match Sim | Tactical roles (Gegenpress, Tiki-Taka, etc.), match ratings, and goal/assist distributions. |
| `src/engine/leagueSim.ts` / `.js` | League Sim | Fixture generation, standings, point accumulation, and promotion/relegation tables. |
| `src/engine/cupSim.ts` / `.js` | Cup Sim | Knockout brackets, extra time, penalty shootouts, and domestic cups. |
| `src/engine/continental.ts` / `.js` | Continental | UEFA Champions League / Copa Libertadores simulation and retirement triggers. |
| `src/engine/nationalTeam.ts` / `.js` | International | Senior call-ups, World Cup / Euros / Copa América tournaments, and dual nationality. |
| `src/engine/negotiationEngine.ts` / `.js`| Negotiations | Turn-based Deadline Day bargaining table (Club Patience, Agent Leverage, Urgency). |
| `src/engine/loansEngine.ts` / `.js` | Transfers | Season, 6-month, and multi-year developmental loans with buy/recall clauses. |
| `src/engine/agents.ts` / `.js` | Representation | 40 global agents across 4 archetypes (Super-Agent, Family, Tactical Mentor, Self). |
| `src/engine/sponsorships.ts` / `.js` | Commercial | Technical boot endorsements, signature boots, and brand sponsorships. |
| `src/engine/pressEngine.ts` / `.js` | Media | Procedural post-match press conferences, quotes, and fan sentiment impacts. |
| `src/engine/retirementMuseum.ts` / `.js`| Post-Career | Eras scrapbook, Silverware Sanctuary, algorithmic GOAT legacy index, and epilogue. |
| `src/data/*.json` | Static DB | 211 FIFA nations (`countries.json`), global leagues (`competitions.json`), domestic cups, confederations. |
| `src/data/index.ts` / `.js` | Data Index | `CatalogIndex` providing $O(1)$ indexed lookups by ID, ISO, FIFA code, and reputation. |
| `src/web/index.template.html` | UI Template | Master HTML structure (Creation Screen, Career Dashboard, Modals, Trophy Overlay). |
| `src/web/app.js` | UI Entry | Imports the view modules, registers the dashboard renderer and attaches every module's listeners once (`init*()`). |
| `src/web/ui/*.js` | UI Modules | One ES module per view (`career-view`, `decision-card`, `celebration-overlay`, `creation-screen`, `agents-hub`, …). Views read `store.state` and redraw via `store.rerender()`. |
| `src/web/ui/engine-bridge.js` | UI ↔ Engine | The only place the UI changes career state for gameplay: start career, decisions, agents, sponsorships, press, hot seat. Calls the in-page engine, or `/api/*` on the dev server. |
| `src/web/ui/dev-tools.js` | God Menu | Developer cheats (stat overrides, transfers, title grants), kept apart from gameplay actions. |
| `scripts/build_standalone.js` | Bundler | Compiles catalog JSON + engine JS + UI into `standalone.html` & `index.html`. Follows `src/web/app.js` imports dependency-first, wraps the UI in one function scope, and fails the build on a circular import. |
| `tests/` | Test Suites | Multi-tier test matrix (Tier 1 core features, Tier 2 boundaries, Tier 3 interactions, Tier 4 workloads). |
| `tags` | Code Index | Filtered Universal Ctags index optimized for the `ctags` MCP server. |

---

## 3. Key Domain Entities & State Structures

### `Player` (`src/engine/types.ts`)
- **Identity**: `id`, `lastName`, `preferredNumber`, `preferredFoot`, `position`, `roleCategory`, `nationality`, `secondNationality`.
- **Attributes & Growth**: `overall`, `attributes` (`PAC`, `SHO`, `PAS`, `DRI`, `DEF`, `PHY` or GK equivalents), `developmentProfile` ("early" | "normal" | "late"), `age`.
- **Valuation & Contract**: `marketValue`, `contract` (`yearsRemaining`, `weeklyWage`, `squadRole`, `releaseClauses`), `morale`, `form`, `managerTrust`.
- **Career Accumulation**: `careerTotals` (Apps, Goals, Assists, Trophies, Wages, Avg Rating), `nationalTeamStats`.
- **Ecosystem Items**: `activeInjury`, `lifestyleChoices`, `agent`, `bootDeal`, `captaincyStatus`, `socialMedia`.

### `CareerState` (`src/engine/types.ts`)
```typescript
interface CareerState {
  seed: string;
  rngState: number;
  mode: "long" | "normal" | "express";
  step: number;
  phase: "career" | "summary";
  player: Player;
  currentTeamId: string | null;
  currentCompetitionId: string | null;
  currentEvent: CareerEvent | null;
  seasons: SeasonHistory[];
  log: CareerLogEntry[];
}
```

---

## 4. Simulation Tick & Event Pipeline

1. **Initialization (`initPlayerCareer`)**:
   - PRNG initialized from `seed`.
   - Player generated with position-weighted baseline attributes (`50` OVR baseline at age 16).
   - Market value and initial wage scale calculated.
   - Default agent assigned based on nationality ISO (`src/engine/agents.ts`).
   - Default boot contract assigned (`src/engine/sponsorships.ts`).
   - Generates opening `academy_offer` event with 3 procedurally matched domestic/confederation clubs.

2. **Decision & Simulation Tick (`executeDecisionAndSimulate`)**:
   - User commits an option ID (`join_club`, `renew_contract`, `permanent_transfer`, `clutch_action`, `dilemma_choice`, etc.).
   - If contract agreed, updates `player.contract` and `currentTeamId`.
   - Triggers `advanceSeason(state, curRng, player, currentTeamId)`:
     - Simulates domestic league fixtures (`leagueSim.ts`) with tactical system modifiers (`matchEngine.ts`).
     - Simulates cup tournaments (`cupSim.ts`, `continental.ts`).
     - Simulates international duty if player meets call-up threshold (`nationalTeam.ts`).
     - Applies physical load, fatigue congestion, and injury checks.
     - Computes attribute growth or aging degradation (`attributes.ts`).
     - Updates financial dividends, lifestyle costs, and social follower growth.
     - Records season history and silverware won.
   - Evaluates next decision dilemma: Contract renewal (if final year), Bosman free agency (if expired), high-stakes moral dilemma, or transfer window offers.
   - If age >= retirement threshold or forced medical exit, switches `state.phase` to `"summary"`.

---

## 5. UI Architecture & View Registry (`src/web/`)

- **Layering**: `src/engine/` owns all simulation rules, randomness and `state.rngState`. The UI never advances the simulation: views call `ui/engine-bridge.js` actions (or `ui/dev-tools.js` for God Menu cheats), then redraw. `ui/store.js` holds the one career state; only those two modules write to it.
- **Modules**: no UI module runs code at import time. Each exports `init<Name>()` for its listeners, called once from `app.js`. Module imports form a DAG (the bundler rejects cycles); views that need a dashboard redraw call `store.rerender()` instead of importing `career-view.js`.

- **Screen Containers**:
  - `#screenCreation`: Initial character generator (Name, Preferred Number, Country picker with search, Dual Nationality switch, Position grid, Foot, Pacing mode).
  - `#screenCareer`: Active dashboard containing:
    - **Header HUD**: Flag, Player Name, Age, Wage, OVR Badge with flash animation, Attributes grid.
    - **Status Indicators**: Manager Trust gauge, Squad Morale gauge, Fitness badge, Agent pill, Boot pill.
    - **News Wire Ticker**: Continuous horizontal Marquee displaying procedural press headlines.
    - **Official Standings Card**: Live table with club logos, points, and records (`#tbodyLeagueStandings`).
    - **Timeline Feed**: Reverse-chronological history cards showing apps, goals, and trophies per season.
    - **Decision Card Container** (`#eventOptionsContainer`): Grid of offer/dilemma cards with embedded primary action buttons (`Sign Deal →`) and turn-based negotiation (`💼 Negotiate in Hot-Seat`).
  - `#screenSummary`: Post-career retirement retrospective (Eras scrapbook, Silverware Sanctuary, GOAT index).

- **Interactive Modals**:
  - `#hotSeatModal`: Deadline Day turn-based negotiation table (`renderHotSeatUI`).
  - `#agentModal`: 40-agent hiring/firing agency roster.
  - `#lifestyleModal`: Personal habit investments and biometrics.
  - `#bootModal`: Commercial footwear endorsement offers.
  - `#pressModal`: Post-match press room quote choices.
  - `#celebrationOverlay`: Particle burst silverware fanfare (strictly guarded by `lastCelebratedSeasonIndex`).

---

## 6. Ctags MCP Indexing Protocol for AI Agents

To minimize token usage and avoid reading massive files, agents **MUST** query the `ctags` MCP server before inspecting or modifying source files.

### Ctags Configuration (`.ctags.d/default.ctags`)
- **Languages**: Strictly restricted to `JavaScript` and `TypeScript`.
- **Excluded**:
  - Large generated bundles (`standalone.html`, `index.html`, `src/web/index.html`).
  - Raw JSON databases (`src/data/*.json`).
  - Legacy/backup copies (`src/original_script.js`, `src/reference_original.js`).
  - Internal caches (`.chrome_data/`, `.git/`, `.agents/`, `node_modules/`).
  - Anonymous object literals (`--extras=-{anonymous}`).
- **Fields Enabled**: Line numbers (`+n`), language (`+l`), signature (`+S`), sorted (`--sort=yes`).

### Rules of Engagement for Code Edits
1. **Locate Symbols via Ctags**:
   ```json
   call_mcp_tool("ctags_ctags", "ctags_find_symbol", {
     "query": "functionOrClassOrTypeName",
     "exact_match": true,
     "working_dir": "/Users/elcanovic/Documents/Football Sim"
   })
   ```
2. **Never Dump Entire Files**:
   - The UI is split into `src/web/ui/*.js` modules (largest: `career-view.js`, ~470 lines).
   - `src/engine/careerEngine.js` has ~1,200 lines.
   - Use `read_file` with targeted `StartLine` and `EndLine` parameters based on ctags locations.
3. **Synchronize JS & TS**:
   - Always update both `src/engine/<module>.ts` and `src/engine/<module>.js`.
4. **Rebuild Standalone Bundles After Changes**:
   ```bash
   deno run --allow-read --allow-write scripts/build_standalone.js
   ```
5. **Verify Headless CLI Benchmark**:
   ```bash
   deno task demo
   ```
   *Must complete in < 25ms with 0 runtime errors.*
