# BRIEFING — 2026-10-07T17:05:25Z

## Mission
Investigate PRNG determinism leaks across all engine files (Math.random, Date.now, non-seeded rolls), formulate deterministic replacement strategy, and recommend function signatures/worker changes for Milestone 1.

## 🔒 My Identity
- Archetype: explorer
- Roles: investigation, synthesis
- Working directory: /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_1
- Original parent: 34225fa2-4900-4a1a-bad4-c01d8be1f52e
- Milestone: Milestone 1 (Deterministic Core PRNG & Performance Foundations)

## 🔒 Key Constraints
- Read-only investigation — do NOT implement
- Focus on PRNG determinism leaks across all engine files
- Ensure parity recommendations for both .ts and .js files
- Deliver handoff.md with 5 components
- Maintain progress.md with "Last visited" timestamps

## Current Parent
- Conversation ID: 34225fa2-4900-4a1a-bad4-c01d8be1f52e
- Updated: 2026-10-07T17:05:25Z

## Investigation State
- **Explored paths**:
  - `src/engine/careerEngine.ts` and `careerEngine.js`
  - `src/engine/pressEngine.ts` and `pressEngine.js`
  - `src/engine/prng.ts` and `prng.js`
  - `src/demo.ts`
  - `src/web/app.js` and `src/server.ts`
  - All other engine files: attributes, agents, economics, leagueSim, cupSim, matchEngine, rosterGen, careerEvents, continental, sponsorships, types
  - `scripts/build_standalone.js` and `tests/tier1_features/m1_determinism_perf_test.ts`
- **Key findings**:
  - Found 4 direct `Math.random()` leaks in `careerEngine.ts` (lines 1216, 1228) and `careerEngine.js` (lines 1172, 1184) inside `postSocialMediaUpdate`.
  - Found multiple `Date.now()` leaks in `careerEngine.ts:526` (`inj-${currentSeasonAge}-${Date.now()}`), `careerEngine.ts:1154` (`${state.seed}-reneg-${Date.now()}`), `pressEngine.ts:204` (`press-${Date.now()}`), `demo.ts:16` (`career-${Date.now()}`), `app.js:2941` (unseeded PRNG object with `Date.now()`).
  - Discovered premature retirement hazard in `checkRetirement` (`continental.js:189`) cutting careers short before reaching the required 20+ season benchmark in `demo.ts`.
  - Verified `scripts/build_standalone.js` bundles `.js` engine files, requiring strict parity between `.ts` and `.js`.
- **Unexplored areas**: None for M1 scope. Full engine inventory completed.

## Key Decisions Made
- Formulated exact deterministic ID format: `inj-${state.seed}-s${seasonIndex}-${injuryCount}`, `press-${rng.seed}-s${seasonIndex}-${scenario}`, etc.
- Designed `postSocialMediaUpdate` deterministic PRNG derivation using `player.id` and `totalPosts` counter with optional PRNG parameter.
- Designed `renegotiateWageWithCurrentAgent` state PRNG threading without `Date.now()`.
- Designed CLI `demo.ts` fixed deterministic seed with CLI override and retirement hazard guard for 20+ seasons.
- Detailed dual TS/JS replacement code snippets for implementer.

## Artifact Index
- /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_1/DISPATCH.md — Incoming dispatches
- /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_1/BRIEFING.md — Working memory
- /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_1/progress.md — Liveness heartbeat
- /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_1/handoff.md — 5-component deliverable
