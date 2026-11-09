## 2026-10-07T17:18:54Z
You are the M1 Core PRNG & Performance Worker for the Football Sim transformation project.
Your assigned working directory is:
/Users/elcanovic/Documents/Football Sim/.agents/teamwork/worker_m1/

The project root is:
/Users/elcanovic/Documents/Football Sim

MANDATORY READINGS (Read ALL before modifying code):
1. /Users/elcanovic/Documents/Football Sim/.agents/teamwork/ORIGINAL_REQUEST.md
2. /Users/elcanovic/Documents/Football Sim/PROJECT.md
3. /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_1/handoff.md
4. /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_2/handoff.md
5. /Users/elcanovic/Documents/Football Sim/.agents/teamwork/explorer_m1_3/handoff.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE OWNERSHIP:
You exclusively own and may edit:
- src/engine/prng.ts and src/engine/prng.js
- src/engine/continental.ts and src/engine/continental.js
- src/engine/careerEngine.ts and src/engine/careerEngine.js
- src/engine/pressEngine.ts and src/engine/pressEngine.js
- src/engine/types.ts
- src/engine/index.ts and src/engine/index.js
- src/index.ts and src/index.js
- src/demo.ts
- src/web/app.js (press trigger line ~2940)
- scripts/verify_determinism.ts
DO NOT edit files in tests/ or TEST_INFRA.md (owned by concurrent test writer).

IMPLEMENTATION REQUIREMENTS:
1. Fix all PRNG determinism leaks:
   - In careerEngine.ts & careerEngine.js: Replace Math.random() in postSocialMediaUpdate with deterministic PRNG; replace Date.now() in injury ID (inj-${state.seed}-s${newSeasons.length + 1}-${injuryIndex}) and wage renegotiation (use and advance state.rngState);
   - In pressEngine.ts & pressEngine.js: Replace Date.now() in press conference ID with deterministic id (press-${curRng.seed}-${sTag}-${scenario});
   - In prng.ts & prng.js: Add defensive state initialization in nextRandom so { seed } without state recovers gracefully;
   - In web/app.js: Update press trigger at line ~2940 to use deterministic seed.
2. 20-Season Guarantee & Benchmark Performance:
   - In continental.js and continental.ts: Update checkRetirement to support minRetirementAge options parameter (default 30, but if options.minRetirementAge or player.minRetirementAge is set, enforce age < minRetirementAge returns retire: false).
   - In types.ts: Add minRetirementAge?: number to Player interface.
   - In demo.ts: Use deterministic seed `Deno.args[0] || "career-benchmark-deterministic-2026"`; set `state.player.minRetirementAge = 36` to guarantee 20 full seasons (ages 16 through 35); isolate simulation timer (performance.now()) around the simulation while-loop to eliminate console stdout latency.
3. Fix TS vs JS simulation divergence:
   - In careerEngine.ts line 778, synchronize `roleMult` with careerEngine.js line 734:
     `const roleMult = currentSeasonAge < 20 ? 1.0 : seasonStats.appearances > 25 ? 1.0 : 0.8;`
   - Create `src/engine/index.ts` and `src/engine/index.js` barrels exporting all engine modules including nationalTeam.
   - Update `src/index.ts` and `src/index.js` to re-export nationalTeam.
4. Implement `scripts/verify_determinism.ts` with the test suite designed in Explorer 3's handoff (verifying bit-for-bit determinism, TS/JS mirror parity, and <25ms performance across 20 runs).
5. Verify your changes:
   - Run `deno task demo` (must simulate >= 20 seasons in < 25ms).
   - Run `deno run --allow-read --allow-write scripts/verify_determinism.ts`.
   - Run `deno run --allow-read --allow-write scripts/build_standalone.js`.

DELIVERABLES:
Write a comprehensive handoff report to:
/Users/elcanovic/Documents/Football Sim/.agents/teamwork/worker_m1/handoff.md
Maintain progress.md with regular "Last visited" timestamps.
When finished, send a message to orchestrator with your results and verification evidence.
