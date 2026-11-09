# Football Sim E2E Test Suite Infrastructure Specification

## 1. Executive Summary & Philosophy

The Football Sim End-to-End (E2E) Test Suite provides an industry-grade, opaque-box validation harness for the complete transformation of the simulation platform. In accordance with the project's Dual-Track architecture defined in `PROJECT.md`, the test suite operates independently from internal implementation details, validating behavior, mathematical invariants, deterministic state transitions, UI element integrity, and long-term simulation stability.

### Core Principles
1. **Opaque-Box Verification**: Tests validate public module interfaces, observable side effects, and contract invariants without inspecting private state or monkey-patching engine internals.
2. **Deterministic Reproducibility**: Under fixed PRNG seeds, all match simulations, season outcomes, and multi-decade career paths must produce identical, bit-for-bit reproducible outcomes.
3. **Progressive Testability & Graceful Signaling**: During concurrent milestone implementation (M1 through M5), the harness differentiates between verified passing baselines and unimplemented feature interfaces, reporting clear diagnostic failure signals rather than catastrophic runtime crashes.
4. **Zero-Dependency & Offline Execution**: The test harness relies exclusively on native Deno runtime capabilities (`deno test` and `deno run`) without external network downloads or third-party test framework packages.
5. **Multi-Tiered Granularity**: Tests are partitioned into four distinct tiers covering isolated feature contracts, adversarial boundary edge cases, cross-feature system interactions, and multi-decade real-world career workloads.

---

## 2. Test Suite Architecture & Directory Layout

The test harness is organized under `/Users/elcanovic/Documents/Football Sim/tests/`:

```
tests/
├── assert.ts                           # Self-contained zero-dependency assertion library
├── helpers.ts                          # Test registration, dynamic module loader, and mock fixtures
├── runner.ts                           # CLI test runner executable with tier filtering and reporting
│
├── tier1_features/                     # Tier 1: Unit & Feature Isolation (All 55 Features)
│   ├── m1_determinism_perf_test.ts     # Features 1–4: PRNG, 20-Season Demo (<25ms), Timestamps, TS/JS Parity
│   ├── m2_loans_test.ts                # Features 5–14: Loan structures, wage splits, buy triggers, recall, restrictions
│   ├── m2_contracts_hotseat_test.ts    # Features 15–21: Deadline-day hot-seat, patience/leverage/urgency, perks, status
│   ├── m2_agents_test.ts               # Features 22–25: 4 Agent archetypes (Super-Agent, Relative, Mentor, Self-Rep)
│   ├── m3_tactics_roles_test.ts        # Features 26–35: 5 Frameworks, 4 Roles, out-of-role penalties
│   ├── m3_manager_cliques_test.ts      # Features 36–41: Manager personalities, sackings, cliques, leadership tiers
│   ├── m4_fatigue_congestion_test.ts   # Features 42–44: Fixture congestion, physical load index, soft tissue injury
│   ├── m4_medical_recovery_test.ts     # Features 45–47: Conservative rehab, cortisone injections, specialist surgery
│   ├── m5_ui_svg_assets_test.ts        # Features 48–51: Obsidian design system tokens, CDN marks, procedural SVG shields
│   ├── m5_retirement_museum_test.ts    # Features 52–55: Eras scrapbook, silverware sanctuary, GOAT index, pathways
│   └── m5_bundler_integrity_test.ts    # Features 56–57: Standalone HTML bundler, 100% DOM element binding integrity
│
├── tier2_boundaries/                   # Tier 2: Boundary & Corner Cases (20+ Edge Cases)
│   ├── loans_boundaries_test.ts        # Winter half-season scaling, MLS non-relegation, parent restrictions, injury shortfall
│   ├── hotseat_boundaries_test.ts      # Exorbitant wage walkout, deadline hour 0 expiration, self-represented blunder
│   ├── tactics_boundaries_test.ts      # Unnatural foot inverted winger, Regista vs Gegenpress, underperforming sacking
│   ├── medical_boundaries_test.ts      # Cortisone permanent degradation, zero funds surgery fallback, aging tissue
│   ├── svg_boundaries_test.ts          # Missing/invalid primary color fallback (#334155), SVG sanitization
│   ├── determinism_boundaries_test.ts  # Bit-for-bit multi-run comparison across 20 seasons, extreme seeds
│   └── dom_bundler_boundaries_test.ts  # Dynamic modal ID resolution, bundler TypeScript stripping, offline immunity
│
├── tier3_interactions/                 # Tier 3: Pairwise Cross-Feature Interactions
│   ├── tactics_congestion_cortisone_test.ts # Gegenpress + Congestion + Cortisone compounding breakdown
│   ├── loan_trigger_sacking_test.ts         # Loan mandatory buy trigger + Mid-season manager sacking
│   ├── wage_clique_hotseat_test.ts          # Exorbitant contract hotseat victory + Dressing room wage tension
│   ├── superagent_disciplinarian_test.ts    # Super-agent wage demands vs Disciplinarian manager trust friction
│   └── mentor_youth_development_test.ts     # Tactical mentor guaranteed starts + Youth Developer manager growth
│
└── tier4_workloads/                    # Tier 4: Multi-Decade Career Real-World Simulations
    ├── multi_decade_career_test.ts          # 20–25 Season career simulation: holistic stability & attribute curves
    ├── trophy_stats_accumulation_test.ts    # Silverware sanctuary, stats accumulation & GOAT legacy index (0–1000)
    └── journeyman_multi_club_test.ts        # Journeyman career (5+ clubs, loan stints, sackings, eras scrapbook)
```

---

## 3. Test Runner Specification (`runner.ts`)

The test runner provides dual-mode execution:
1. **Native Deno Test Execution**:
   ```bash
   deno test --allow-read --allow-write tests/
   ```
2. **Dedicated CLI Runner Execution**:
   ```bash
   deno run --allow-read --allow-write tests/runner.ts [OPTIONS]
   ```

### Command-Line Arguments & Flags

| Flag | Argument | Description | Default |
|------|----------|-------------|---------|
| `--tier` | `1`, `2`, `3`, `4`, `all` | Filter test execution by tier number | `all` |
| `--filter` | `<regex>` or `<substring>` | Filter test names matching substring or regex | None (all) |
| `--bail` | boolean flag | Immediately halt test execution on first failure | `false` |
| `--verbose` | boolean flag | Print individual assertion logs and execution traces | `false` |
| `--strict` | boolean flag | Treat unimplemented feature signals as fatal errors (exit code 1) | `false` |
| `--json` | boolean flag | Output results as structured JSON for CI ingestion | `false` |

### Exit Code Semantics
- `0`: All executed tests passed successfully (or in standard mode, all implemented tests passed with unimplemented features cleanly cataloged).
- `1`: One or more implemented test assertions failed, or in `--strict` mode unimplemented features were encountered.
- `2`: Critical runner harness fault (e.g. invalid arguments, unhandled filesystem error).

---

## 4. Tier Definitions & Feature Coverage Matrix

### Tier 1: Feature Isolation (55 Features)

Tier 1 isolates every feature enumerated in `PROJECT.md` to verify contract compliance.

| Feature ID | Category | Feature Name | Test Module | Verification Invariant |
|------------|----------|--------------|-------------|------------------------|
| F01 | M1 / R5 | Deterministic PRNG Core | `m1_determinism_perf_test.ts` | Bit-for-bit reproducibility using Xorshift32 PRNG |
| F02 | M1 / R5 | CLI 20-Season Benchmark (<25ms) | `m1_determinism_perf_test.ts` | `demo.ts` runs 20+ seasons in < 25.0 ms |
| F03 | M1 / R5 | Shared Deterministic Timestamps | `m1_determinism_perf_test.ts` | Event/Injury IDs use deterministic seed sequence |
| F04 | M1 / R5 | Dual TS/JS Sync Pipeline | `m1_determinism_perf_test.ts` | Identical export signatures across `.ts` and `.js` |
| F05 | M2 / R1 | Full-Season Loans | `m2_loans_test.ts` | 1-season loan attaches to loaning club, parent retains rights |
| F06 | M2 / R1 | 6-Month Winter Loans | `m2_loans_test.ts` | Mid-season deal allocates remaining ~15-19 matches |
| F07 | M2 / R1 | Multi-Year Developmental Loans | `m2_loans_test.ts` | 2-season loan for young players (age <= 21) |
| F08 | M2 / R1 | Customizable Wage Splits | `m2_loans_test.ts` | Parent/Loaning wage shares sum to 100% |
| F09 | M2 / R1 | Option-to-Buy Loan Clause | `m2_loans_test.ts` | Agreed buyout fee can be triggered at loan completion |
| F10 | M2 / R1 | Mandatory Survival Trigger | `m2_loans_test.ts` | Automatic permanent buy executed if club avoids relegation |
| F11 | M2 / R1 | Mandatory Promotion Trigger | `m2_loans_test.ts` | Automatic permanent buy executed upon league promotion |
| F12 | M2 / R1 | Mandatory Appearance Trigger | `m2_loans_test.ts` | Buy executed once appearance threshold (e.g. >=20) met |
| F13 | M2 / R1 | Loan Recall Clause | `m2_loans_test.ts` | Parent club can terminate loan under specified terms |
| F14 | M2 / R1 | Parent Club Match Restriction | `m2_loans_test.ts` | Player ineligible against parent club fixtures |
| F15 | M2 / R1 | Turn-Based Contract Hot-Seat | `m2_contracts_hotseat_test.ts` | 1–5 round counter-offer turn loop |
| F16 | M2 / R1 | Club Patience / Walkout Meter | `m2_contracts_hotseat_test.ts` | Meter (0–100); 0 patience causes walkout |
| F17 | M2 / R1 | Agent Leverage Meter | `m2_contracts_hotseat_test.ts` | Meter (0–100) scales counter-offer concessions |
| F18 | M2 / R1 | Manager Urgency Meter | `m2_contracts_hotseat_test.ts` | Meter (0–100) reduces patience decay near deadline |
| F19 | M2 / R1 | Comprehensive Contract Perks | `m2_contracts_hotseat_test.ts` | Weekly wage, appearances, goals, clean-sheet bonuses |
| F20 | M2 / R1 | Tiered Release Clauses | `m2_contracts_hotseat_test.ts` | Domestic, continental/UCL, and relegation triggers |
| F21 | M2 / R1 | Squad Status Guarantees | `m2_contracts_hotseat_test.ts` | Crucial, Important, Rotation, Prospect guarantees |
| F22 | M2 / R1 | Super-Agent Archetype | `m2_agents_test.ts` | 12–15% commission, max wage priority, high walkout risk |
| F23 | M2 / R1 | Family Relative Archetype | `m2_agents_test.ts` | 2–5% commission, high loyalty, low walkout risk |
| F24 | M2 / R1 | Tactical Mentor Archetype | `m2_agents_test.ts` | 5–8% commission, playing time priority, developmental |
| F25 | M2 / R1 | Self-Represented Archetype | `m2_agents_test.ts` | 0% commission, 1.4x patience drain, 10% blunder roll |
| F26 | M3 / R2 | Gegenpress Framework | `m3_tactics_roles_test.ts` | +25% goals, +50% physical load, +40% injury risk |
| F27 | M3 / R2 | Tiki-Taka Framework | `m3_tactics_roles_test.ts` | +35% possession, -20% physical load, low injury hazard |
| F28 | M3 / R2 | Low Block Counter Framework | `m3_tactics_roles_test.ts` | -30% conceded goals, high counter conversion rate |
| F29 | M3 / R2 | Fluid Direct Framework | `m3_tactics_roles_test.ts` | Direct vertical tempo, aerial dominance, volatile scorelines |
| F30 | M3 / R2 | Catenaccio Framework | `m3_tactics_roles_test.ts` | Ultra-defensive block, lowest conceded, yellow card uptick |
| F31 | M3 / R2 | Inverted Winger Role | `m3_tactics_roles_test.ts` | Cutting inside on dominant foot; penalties for wrong foot |
| F32 | M3 / R2 | Box-to-Box Midfielder Role | `m3_tactics_roles_test.ts` | Covers both boxes; dual goal/tackle contribution |
| F33 | M3 / R2 | Regista Role | `m3_tactics_roles_test.ts` | Deep tempo dictator; vision/passing requirements |
| F34 | M3 / R2 | Sweeper Keeper Role | `m3_tactics_roles_test.ts` | High line, through-ball clearances, back distribution |
| F35 | M3 / R2 | Out-of-Role Penalties | `m3_tactics_roles_test.ts` | Rating penalty (-0.3 to -0.8) and xG penalty (-25%) |
| F36 | M3 / R2 | Youth Developer Manager | `m3_manager_cliques_test.ts` | +20% U-23 development boost, long board leash |
| F37 | M3 / R2 | Win-Now Tyrant Manager | `m3_manager_cliques_test.ts` | High win demand, benches low form (<55), volatile trust |
| F38 | M3 / R2 | Pragmatic Disciplinarian | `m3_manager_cliques_test.ts` | Rigid tactics, severe trust penalties for lifestyle choices |
| F39 | M3 / R2 | Mid-Season Sackings | `m3_manager_cliques_test.ts` | Board expectation triggers sackings and appointments |
| F40 | M3 / R2 | Dressing Room Cliques | `m3_manager_cliques_test.ts` | Factions (nationality, age, wage disparity tension) |
| F41 | M3 / R2 | Progressive Leadership Tiers | `m3_manager_cliques_test.ts` | Squad Player -> Core -> Vice-Captain -> Captain |
| F42 | M4 / R3 | Fixture Congestion Modeling | `m4_fatigue_congestion_test.ts` | Tracks league, cups, European travel, internationals |
| F43 | M4 / R3 | Cumulative Physical Load Index | `m4_fatigue_congestion_test.ts` | Dynamic 0–100 load index combining minutes, travel, press |
| F44 | M4 / R3 | Soft Tissue Injuries | `m4_fatigue_congestion_test.ts` | Exponential injury probability increase when load > 70 |
| F45 | M4 / R3 | Conservative Rehab Pathway | `m4_medical_recovery_test.ts` | +40% downtime, 0 stat loss, -50% reinjury risk |
| F46 | M4 / R3 | Cortisone Injection Pathway | `m4_medical_recovery_test.ts` | 0 games missed, -2 to -4 pace/stamina loss, 2x reinjury |
| F47 | M4 / R3 | Specialist Surgery Abroad | `m4_medical_recovery_test.ts` | Balanced downtime, high medical fee (€50k–€250k) |
| F48 | M5 / R4 | Obsidian Design System | `m5_ui_svg_assets_test.ts` | Dark obsidian base `#0B0E14`, cards `#161B22`, neon `#00F2FE` |
| F49 | M5 / R4 | Dynamic CDN Marks (Tier 1) | `m5_ui_svg_assets_test.ts` | Remote badge loading with graceful fallback trigger |
| F50 | M5 / R4 | Procedural SVG Shields (Tier 2)| `m5_ui_svg_assets_test.ts` | Vector shield with official `primary_color` & abbreviation |
| F51 | M5 / R4 | Zero-Latency Fallback (Tier 3) | `m5_ui_svg_assets_test.ts` | Embedded vector asset guarantees zero broken image icons |
| F52 | M5 / R4 | Multi-Chapter "Eras" Scrapbook | `m5_retirement_museum_test.ts` | Chapter titles, teammates, clutch moments, transfer fees |
| F53 | M5 / R4 | Silverware Sanctuary & Hover | `m5_retirement_museum_test.ts` | Grouped trophy shelf with year, opponent, score details |
| F54 | M5 / R4 | GOAT Legacy Index | `m5_retirement_museum_test.ts` | Normalized 0–1000 score benchmarking trophies, stats, longevity |
| F55 | M5 / R4 | Post-Career Pathways Suite | `m5_retirement_museum_test.ts` | Head Coach, Pundit/Media, Club Ambassador selection |
| F56 | M5 / R5 | Standalone Bundler | `m5_bundler_integrity_test.ts` | Compiles self-contained `standalone.html` with zero deps |
| F57 | M5 / R5 | DOM Binding Integrity | `m5_bundler_integrity_test.ts` | 100% of DOM IDs in `app.js` resolved in HTML files |

---

### Tier 2: Boundary & Corner Cases (20+ Edge Cases)

Tier 2 exercises extreme input ranges, domain-specific edge rules, and stress boundaries.

1. **Winter Loan Mid-Season Scaling**: Match opportunities allocated proportionally to remaining games without wiping out first-half stats.
2. **Parent Club Head-to-Head Restriction**: Player excluded from match squad when facing parent club; appearance count correctly skips fixture.
3. **Survival Trigger in Non-Relegation League (MLS/A-League)**: Clause evaluates gracefully as satisfied without null pointer exceptions.
4. **Appearance Trigger Shortfall via Injury**: Player ending season at 18/20 appearances does not trigger mandatory buyout; returns to parent club.
5. **Exorbitant Wage Demand Walkout**: Wage demands exceeding club tolerance drop patience to 0 and trigger immediate walkout.
6. **Deadline Hour 0 Expiration**: Exhausting negotiation rounds/hours causes deal collapse; player remains at current club.
7. **Self-Represented Blunder & Patience Drain**: 1.4x patience decay and 10% risk of missing perk clause during negotiation.
8. **Unnatural Foot Inverted Winger**: Right-footed winger assigned to RW Inverted Winger incurs -0.4 match rating and -25% goal conversion delta.
9. **Gegenpress in Congestion**: 3 matches in 8 days with Gegenpress pushes load > 85 and triples soft-tissue injury risk.
10. **Manager Underperformance Sacking**: Board sacks manager when trailing target; new Win-Now Tyrant slashes youth trust.
11. **Cortisone Injection for Tournament Final**: Immediate return for final at cost of permanent -3 Pace, -2 Stamina and 2x reinjury risk.
12. **Surgery Abroad with Insufficient Funds**: Insufficient player/club funds falls back to conservative rehab or notes medical debt.
13. **Offline UI Opening Asset Resilience**: Complete network failure triggers Tier 2 procedural inline SVG with `#334155` default fallback.
14. **Underdog Post-Career Pathway**: Player with zero trophies selecting Head Coach begins at lower-tier club rather than elite post.
15. **PRNG Fixed Seed Determinism Across 20 Seasons**: Identical seed produces bit-for-bit identical stats, transfers, and awards.
16. **Dynamic Modal ID Binding Resolution**: Static modal IDs in `app.js` resolve cleanly in DOM templates without null references.
17. **Relegation Release Clause Activation**: Club relegation triggers 60% fee reduction, activating domestic suitor offers.
18. **Regista Facing Gegenpress**: Low passing (<70) under high press spikes turnovers and depresses rating to <= 6.2.
19. **Aging Tissue Fatigue Degeneration**: Age 35+ veteran recovery rate halves; cumulative load carries over into subsequent weeks.
20. **TypeScript Type Stripping in Bundler**: Bundled JavaScript contains zero stray TypeScript annotations, executing cleanly.

---

### Tier 3: Cross-Feature Interactions

Tier 3 verifies coupled multi-system interactions:
1. **Gegenpress + Fixture Congestion + Cortisone Compounding Breakdown**: High pressing during congested European weeks triggers acute hamstring tear; opting for cortisone injections leads to permanent physical collapse.
2. **Loan Mandatory Trigger + Mid-Season Manager Sacking**: Loaned player on appearance trigger experiences manager sacking; new manager's tactical re-evaluation directly affects appearance quota and subsequent permanent buy execution.
3. **Exorbitant Hot-Seat Contract + Dressing Room Wage Tension**: Player wins huge wage package via Super-Agent; dressing room cohesion drops due to wage disparity, creating social clique friction.
4. **Super-Agent Wage Demands vs Pragmatic Disciplinarian Friction**: Aggressive agent demands clash with disciplinarian manager; failure to meet tactical conduct expectations drops player trust.
5. **Tactical Mentor Guaranteed Starts + Youth Developer Accelerated Growth**: Young player guided by Tactical Mentor secures starting minutes under Youth Developer manager, compounding +20% attribute acceleration.

---

### Tier 4: Multi-Decade Workload Simulations

Tier 4 verifies long-running realistic career simulations:
1. **Multi-Decade Career Progression (20–25 Seasons)**: Validates holistic memory stability, aging curves, retirement triggers, and zero unhandled exceptions over 20+ continuous seasons.
2. **Trophy & Stats Accumulation Engine**: Simulates diverse careers (prolific striker, defensive stalwart) verifying domestic, continental, and international silverware tracking and GOAT Legacy Index calculation (0–1000).
3. **Journeyman Multi-Club Career Experience**: Simulates a 5+ club journeyman career with multiple transfers, loans, manager changes, and validates the multi-chapter Eras Scrapbook generation.

---

## 5. Assertion Library & Diagnostic Protocol

The test harness incorporates a zero-dependency assertion library (`tests/assert.ts`):
- `assert(condition, message?)`
- `assertEquals(actual, expected, message?)`
- `assertNotEquals(actual, expected, message?)`
- `assertStrictEquals(actual, expected, message?)`
- `assertAlmostEquals(actual, expected, tolerance, message?)`
- `assertMatch(actual, regex, message?)`
- `assertThrows(fn, errorType?, message?)`
- `assertExists(actual, message?)`

### Unimplemented Feature Signaling
When testing features whose implementation modules are not yet written (M2 through M5):
- Tests invoke `loadEngineModule(modulePath)`.
- If the module does not exist, `loadEngineModule` throws a structured `FeatureUnimplementedError`:
  `[UNIMPLEMENTED FEATURE]: Module 'src/engine/<name>.ts' is not yet implemented.`
- The runner captures this diagnostic, reporting it as an explicit failure signal against the specification contract, while allowing the rest of the test suite to execute and report results.

---

## 6. Execution Instructions

Run full test suite via dedicated runner:
```bash
deno run --allow-read --allow-write tests/runner.ts
```

Run specific tier:
```bash
deno run --allow-read --allow-write tests/runner.ts --tier=1
deno run --allow-read --allow-write tests/runner.ts --tier=2
deno run --allow-read --allow-write tests/runner.ts --tier=3
deno run --allow-read --allow-write tests/runner.ts --tier=4
```

Filter by feature keyword:
```bash
deno run --allow-read --allow-write tests/runner.ts --filter=loans
deno run --allow-read --allow-write tests/runner.ts --filter=tactics
deno run --allow-read --allow-write tests/runner.ts --filter=determinism
```

Run via standard Deno test runner:
```bash
deno test --allow-read --allow-write tests/
```
