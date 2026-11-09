# Project: Football Sim Transformation

## Architecture
Football Sim is transformed into an industry-grade, ultra-realistic Football Career Simulator architected with modular TypeScript/JavaScript simulation engines, deterministic PRNG state pipelines, high-performance O(1) seasonal simulation loops, a zero-dependency obsidian glassmorphism UI, a 3-tier resilient SVG asset pipeline, an interactive retirement museum, and an automated standalone HTML bundler.

### High-Level Architecture Diagram
```
                     +---------------------------------------+
                     |         Deterministic Engine          |
                     |         (src/engine/prng.ts)          |
                     +-------------------+-------------------+
                                         |
     +-------------------+---------------+-------------------+-------------------+
     |                   |                                   |                   |
+----+----+         +----+----+                         +----+----+         +----+----+
|   R1    |         |   R2    |                         |   R3    |         |   R5    |
|Economics|         | Tactics |                         | Health  |         | CLI &   |
|& Loans  |         |& Manager|                         |& Medical|         | Engine  |
+----+----+         +----+----+                         +----+----+         +----+----+
     |                   |                                   |                   |
     +-------------------+---------------+-------------------+-------------------+
                                         |
                                         v
                     +---------------------------------------+
                     |      Master Career Orchestration      |
                     |    (src/engine/careerEngine.ts/.js)   |
                     +-------------------+-------------------+
                                         |
                       +-----------------+-----------------+
                       |                                   |
                       v                                   v
        +-----------------------------+     +-----------------------------+
        |             R4              |     |             R5              |
        | Obsidian UI & Asset Pipeline|     | Standalone Offline Bundler  |
        | (index.html, svgGenerator)  |     | (scripts/build_standalone)  |
        +-----------------------------+     +-----------------------------+
```

---

## Feature Inventory
Every feature from the Survey phase is enumerated below with its assigned milestone.

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Deterministic PRNG Core | Elimination of unseeded `Math.random()` and `Date.now()`; bit-for-bit reproducibility | M1 | Survey (R5) |
| 2 | CLI 20-Season Benchmark (<25ms) | Guaranteed 20+ season simulation loop without premature retirement hazard under 25ms | M1 | Survey (R5) |
| 3 | Shared Deterministic Timestamps | Deterministic sequential IDs for events, press conferences, and injuries | M1 | Survey (R5) |
| 4 | Dual TS/JS Sync Pipeline | Mirror synchronization between `.ts` and `.js` engine files for CLI and bundler | M1 | Survey (R5) |
| 5 | Full-Season Loans | 1-season loan deal allowing playing minutes while remaining contracted to parent club | M2 | Survey (R1) |
| 6 | 6-Month Winter Loans | Mid-season January loan lasting remaining ~15-19 matches | M2 | Survey (R1) |
| 7 | Multi-Year Developmental Loans | 2-season loan agreement for young prospects (age <= 21) | M2 | Survey (R1) |
| 8 | Customizable Wage Splits | Wage split percentage (0% to 100%) between parent and loaning clubs | M2 | Survey (R1) |
| 9 | Option-to-Buy Loan Clause | Pre-agreed permanent purchase fee exercisable at loan end | M2 | Survey (R1) |
| 10 | Mandatory Relegation Survival Trigger | Mandatory transfer executed automatically upon league safety | M2 | Survey (R1) |
| 11 | Mandatory Promotion Trigger | Mandatory transfer executed automatically upon league promotion | M2 | Survey (R1) |
| 12 | Mandatory Appearance Trigger | Mandatory buy triggered if appearance threshold (e.g. >= 20) is reached | M2 | Survey (R1) |
| 13 | Loan Recall Clause | Parent club right to recall loan player under specified conditions | M2 | Survey (R1) |
| 14 | Parent Club Match Restriction | Enforcement preventing loaned player from competing against parent club | M2 | Survey (R1) |
| 15 | Turn-Based Contract Hot-Seat | 1-5 turn interactive negotiation session with dynamic counter-offers | M2 | Survey (R1) |
| 16 | Club Patience / Walkout Risk Meter | Dynamic 0-100 meter tracking club tolerance; 0 triggers immediate walkout | M2 | Survey (R1) |
| 17 | Agent Leverage Meter | Dynamic 0-100 meter reflecting player leverage based on form, value, suitors | M2 | Survey (R1) |
| 18 | Manager Urgency Meter | Dynamic 0-100 meter reflecting club desperation / deadline hours | M2 | Survey (R1) |
| 19 | Comprehensive Contract Perks | Base wage, appearance fees, goal bonuses, clean sheet bonuses | M2 | Survey (R1) |
| 20 | Tiered Release Clauses | Domestic, continental/UCL, and relegation-activated buyout clauses | M2 | Survey (R1) |
| 21 | Squad Status Guarantees | Crucial, Important, Rotation, Prospect guarantees with breach morale penalties | M2 | Survey (R1) |
| 22 | Agent: The Super-Agent | High commission (12-15%), max wages, high leverage boost, aggressive walkouts | M2 | Survey (R1) |
| 23 | Agent: The Family Relative | Low commission (2-5%), loyalty prioritization, lower walkout risk | M2 | Survey (R1) |
| 24 | Agent: The Tactical Mentor | Moderate commission (5-8%), prioritizes development and guaranteed starts | M2 | Survey (R1) |
| 25 | Agent: Self-Represented | Zero commission (0%), player negotiates, 1.4x patience drain, blunder risk | M2 | Survey (R1) |
| 26 | Gegenpress Tactical Framework | High-tempo pressing: +25% goals, +50% physical load, +40% injury risk | M3 | Survey (R2) |
| 27 | Tiki-Taka Tactical Framework | Possession-based passing: +35% possession, -20% load, low injury risk | M3 | Survey (R2) |
| 28 | Low Block Counter Framework | Compact defensive block: -30% conceded goals, high counter conversion | M3 | Survey (R2) |
| 29 | Fluid Direct Framework | High-tempo vertical direct balls, aerial duels, volatile scorelines | M3 | Survey (R2) |
| 30 | Catenaccio Framework | Ultra-defensive lock, man-to-man marking, lowest conceded goals, yellow cards | M3 | Survey (R2) |
| 31 | Inverted Winger Role | Winger cutting inside on dominant foot; penalties for incorrect foot/position | M3 | Survey (R2) |
| 32 | Box-to-Box Midfielder Role | Transition engine covering both boxes; stamina requirements | M3 | Survey (R2) |
| 33 | Regista Role | Deep-lying playmaker dictating tempo; passing/vision requirements | M3 | Survey (R2) |
| 34 | Sweeper Keeper Role | High line goalkeeper sweeping through balls and distributing | M3 | Survey (R2) |
| 35 | Out-of-Role Performance Penalties | Performance rating (-0.3 to -0.8) and xG/xA (-25%) penalties for role mismatch | M3 | Survey (R2) |
| 36 | Manager: Youth Developer | Accelerates U-23 attribute growth (+20%), long board leash, youth priority | M3 | Survey (R2) |
| 37 | Manager: Win-Now Tyrant | Demands immediate results, benches underperforming form, volatile trust | M3 | Survey (R2) |
| 38 | Manager: Pragmatic Disciplinarian | Strict tactical adherence, severe trust penalties for lifestyle distractions | M3 | Survey (R2) |
| 39 | Mid-Season Sackings & Appointments | Dynamic manager sackings based on board expectations and new appointments | M3 | Survey (R2) |
| 40 | Dressing Room Social Cliques | Nationality/language factions, youth vs veterans, wage disparity tensions | M3 | Survey (R2) |
| 41 | Progressive Leadership Tiers | Squad Player -> Core Member -> Vice-Captain -> Club Captain progression | M3 | Survey (R2) |
| 42 | Fixture Congestion Modeling | Schedule congestion tracking league, cup replays, European travel, internationals | M4 | Survey (R3) |
| 43 | Cumulative Physical Load Index | Dynamic 0-100 load index driven by minutes played, travel, and pressing tactics | M4 | Survey (R3) |
| 44 | Non-Contact Soft Tissue Injuries | Fatigue-driven injury risks (hamstring, groin, ACL) under high load | M4 | Survey (R3) |
| 45 | Conservative Rehabilitation Pathway | Long downtime (+40%), zero attribute degradation, -50% reinjury risk | M4 | Survey (R3) |
| 46 | Aggressive Cortisone Injections Pathway | Immediate return, permanent pace/stamina penalty (-2 to -4), chronic breakdown | M4 | Survey (R3) |
| 47 | Specialist Surgery Abroad Pathway | Balanced downtime, high medical fee (€50k-€250k), optimal restoration | M4 | Survey (R3) |
| 48 | Obsidian Glassmorphism Design System | Dark-mode base (#0B0E14), elevated cards (#161B22), borders (#21262D), neon accents | M5 | Survey (R4) |
| 49 | Tier 1: Dynamic CDN Marks | Remote loading of high-res club crests when online | M5 | Survey (R4) |
| 50 | Tier 2: Procedural Inline SVG Shields | Procedural vector crests using club primary colors and abbreviation initials | M5 | Survey (R4) |
| 51 | Tier 3: Zero-Latency Offline Fallback | Zero broken image placeholders when offline | M5 | Survey (R4) |
| 52 | Multi-Chapter "Eras" Scrapbook | Narrative era titles, teammates, clutch moments, and transfer fees | M5 | Survey (R4) |
| 53 | Silverware Sanctuary & Hover Stats | Grouped trophy cases with hover cards: year, club, opponent, final score | M5 | Survey (R4) |
| 54 | Algorithmic GOAT Legacy Index | Normalized 0-1000 legacy score benchmarking trophies, stats, longevity, clutch | M5 | Survey (R4) |
| 55 | Post-Career Pathways Suite | Selection of Head Coach, Pundit/Media, or Club Ambassador with epilogue | M5 | Survey (R4) |
| 56 | Standalone Offline Bundler | `scripts/build_standalone.js` compiles self-contained `standalone.html` with 0 deps | M5 | Survey (R5) |
| 57 | DOM Element Binding Integrity | 100% of DOM IDs in the web UI (`app.js` + `ui/*.js`) resolved cleanly in `index.html` and `standalone.html` | M5 | Survey (R5) |
| 58 | Comprehensive E2E Test Suite | Full multi-tier test suite (Tiers 1-4) covering all 55 features independently | M6 | Survey (Dual Track) |
| 59 | Adversarial Coverage Hardening | Tier 5 white-box edge case testing & regression hardening | M6 | Survey (Dual Track) |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Deterministic Core PRNG & CLI Performance | Eliminate `Math.random()` and `Date.now()`; enforce PRNG determinism; guarantee 20+ season simulation under 25ms in `demo.ts` | none | DONE |
| M2 | Deep Economic Architecture & Transfer Hot-Seat | Multi-type loans, wage splits, buy triggers; turn-based hot-seat negotiation with patience/leverage/urgency meters; contract perks; 4 agent archetypes | M1 | PLANNED |
| M3 | Tactical Systems, Manager DNA & Hierarchy | 5 tactical frameworks, 4 positional roles with penalties; 3 manager archetypes, board expectations, sackings; dressing room cliques & 4 leadership tiers | M1 | PLANNED |
| M4 | Cumulative Fatigue, Congestion & Medicine | Fixture congestion, physical load index; non-contact soft tissue injuries; 3 actionable medical recovery pathways | M1, M3 | PLANNED |
| M5 | Obsidian UI, SVG Assets, Retirement & Bundler | Obsidian glassmorphism stylesheet; 3-tier SVG asset pipeline; Post-career retirement museum suite; standalone offline bundler & DOM binding integrity | M1, M2, M3, M4 | PLANNED |
| M6 | Final Integration & E2E Validation | Pass 100% of E2E test suite (Tiers 1-4) from E2E Testing Track; Tier 5 adversarial hardening; final <25ms CLI verification | M5, TEST_READY.md | PLANNED |

---

## Interface Contracts

### M1 ↔ All Engines
- `createPRNG(seed: string): PRNG`
- `randomFloat(rng: PRNG): number`
- `randomInt(rng: PRNG, min: number, max: number): number`
- `checkProbability(rng: PRNG, prob: number): boolean`
- `pickRandom<T>(rng: PRNG, items: T[]): T`

### M2 (Loans & Economics) ↔ Career State & Match Engine
```typescript
export interface LoanDeal {
  id: string;
  type: "full_season" | "winter_six_month" | "multi_year_dev";
  parentClubId: string;
  loaningClubId: string;
  parentWageShare: number;   // 0 to 100
  loaningWageShare: number;  // 0 to 100
  optionToBuyFee: number | null;
  mandatoryTriggers: {
    relegationSurvival?: boolean;
    promotion?: boolean;
    minAppearances?: number;
    buyFee: number;
  } | null;
  recallAllowed: boolean;
  parentMatchRestricted: boolean;
  seasonsRemaining: number;
  appearancesMade: number;
}

export interface ContractPerks {
  baseWeeklyWage: number;
  appearanceFee: number;
  goalBonus: number;
  cleanSheetBonus: number;
  releaseClauses: {
    domestic?: number;
    continental?: number;
    relegation?: number;
  };
  squadStatus: "Crucial" | "Important" | "Rotation" | "Prospect";
}

export interface HotSeatState {
  currentRound: number;
  maxRounds: number;
  clubPatience: number;      // 0 to 100
  agentLeverage: number;     // 0 to 100
  managerUrgency: number;    // 0 to 100
  offeredPerks: ContractPerks;
  walkedAway: boolean;
  dealAgreed: boolean;
}
```

### M3 (Tactics & Manager) ↔ Match Engine & Squad
```typescript
export type TacticalFramework = "Gegenpress" | "Tiki-Taka" | "Low Block Counter" | "Fluid Direct" | "Catenaccio";
export type TacticalRole = "Inverted Winger" | "Box-to-Box" | "Regista" | "Sweeper Keeper" | "Standard";

export interface TacticalEvaluation {
  framework: TacticalFramework;
  playerRole: TacticalRole;
  isOutOfRole: boolean;
  ratingDelta: number;       // e.g. -0.3 to -0.8
  xGMultiplier: number;      // e.g. 0.75 for non-inverted foot
  loadMultiplier: number;    // e.g. 1.5 for Gegenpress
}

export type ManagerPersonality = "Youth Developer" | "Win-Now Tyrant" | "Pragmatic Disciplinarian";

export interface ClubManager {
  name: string;
  personality: ManagerPersonality;
  tacticalFramework: TacticalFramework;
  boardExpectation: "survive" | "mid_table" | "continental" | "champions";
  boardPatience: number;     // 0 to 100
}

export type LeadershipTier = "Squad Player" | "Core Member" | "Vice-Captain" | "Club Captain";
```

### M4 (Health & Medical) ↔ Match Engine & Calendar
```typescript
export interface PhysicalLoadState {
  cumulativeLoad: number;    // 0 to 100
  congestionStreak: number;  // count of matches in short succession
  injuryRiskModifier: number;// scalar multiplier
}

export type MedicalPathway = "conservative_rehab" | "cortisone_injection" | "specialist_surgery";

export interface MedicalChoiceConsequences {
  pathway: MedicalPathway;
  additionalGamesMissed: number;
  statDegradation: { pace?: number; stamina?: number };
  financialCost: number;
  reinjuryRiskMultiplier: number;
}
```

### M5 (UI, SVG, Retirement) ↔ Web Controller
```typescript
export interface ProceduralSVGOptions {
  primaryColor: string;
  secondaryColor?: string;
  abbreviation: string;
  name: string;
  size?: number;
}

export interface EraChapter {
  id: string;
  title: string;
  clubName: string;
  yearsSpan: string;
  appearances: number;
  goals: number;
  assists: number;
  trophies: string[];
  keyTeammates: string[];
  clutchMoments: string[];
  transferFeePaid: number;
}

export interface GoatLegacyScore {
  score: number;             // 0 to 1000
  tierName: string;          // e.g. "Immortal Legend", "Continental Icon"
  breakdown: { trophies: number; peakOVR: number; longevity: number; clutch: number };
}
```

---

## Code Layout

```
src/
├── demo.ts                    # Headless CLI multi-season benchmark
├── server.ts                  # Development API & static server
├── data/                      # Global catalogs (competitions, countries, etc.)
│   ├── competitions.json
│   ├── countries.json
│   └── index.ts / index.js
├── engine/                    # Dual TypeScript and JavaScript mirrored engines
│   ├── types.ts / types.js
│   ├── prng.ts / prng.js
│   ├── attributes.ts / attributes.js
│   ├── economics.ts / economics.js
│   ├── loansEngine.ts / loansEngine.js
│   ├── negotiationEngine.ts / negotiationEngine.js
│   ├── agents.ts / agents.js
│   ├── tactics.ts / tactics.js
│   ├── managerDNA.ts / managerDNA.js
│   ├── dressingRoom.ts / dressingRoom.js
│   ├── medicalEngine.ts / medicalEngine.js
│   ├── leagueSim.ts / leagueSim.js
│   ├── cupSim.ts / cupSim.js
│   ├── matchEngine.ts / matchEngine.js
│   ├── rosterGen.ts / rosterGen.js
│   ├── careerEvents.ts / careerEvents.js
│   ├── continental.ts / continental.js
│   ├── sponsorships.ts / sponsorships.js
│   ├── pressEngine.ts / pressEngine.js
│   ├── svgGenerator.ts / svgGenerator.js
│   ├── retirementMuseum.ts / retirementMuseum.js
│   ├── careerEngine.ts / careerEngine.js
│   └── index.ts / index.js
└── web/
    ├── index.template.html    # UI markup and the "Floodlight" broadcast design system (no glass/blur)
    ├── app.js                 # UI entry point: wires the view modules in ui/
    ├── celebration.js         # Celebration slate builder
    ├── ui/                    # View modules, store.js, engine-bridge.js, dev-tools.js
    └── assets/                # Local asset fallback icons
scripts/
├── build_standalone.js        # Self-contained standalone.html compiler
└── build_standalone.ts
tests/                         # E2E Test Suite (Opaque-box)
├── runner.ts                  # Test runner executable
├── tier1_features/            # Tier 1: Feature Isolation (>=5 per feature)
├── tier2_boundaries/          # Tier 2: Boundary & Corner Cases (>=5 per feature)
├── tier3_interactions/        # Tier 3: Cross-Feature Combinations
└── tier4_workloads/           # Tier 4: Real-World Multi-Decade Scenarios
```
