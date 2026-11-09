// scripts/verify_determinism.ts
// Comprehensive verification suite for M1 PRNG Determinism & Performance

import {
  type CareerState,
  executeDecisionAndSimulate,
  initPlayerCareer,
  postSocialMediaUpdate,
  renegotiateWageWithCurrentAgent,
} from "../src/index.ts";
import { executeDecisionAndSimulate as simJS, initPlayerCareer as initJS } from "../src/index.js";
import { createPRNG, nextRandom } from "../src/engine/prng.ts";
import { generatePressConference } from "../src/engine/pressEngine.ts";

function runFullCareer(
  initFn: typeof initPlayerCareer,
  simFn: typeof executeDecisionAndSimulate,
  seed: string,
  minRetirementAge = 36,
  maxAge = 38,
): CareerState {
  let state = initFn(seed, "long", "DeterministicValente", 10, "right", "AR", "ST", "normal");
  if (state.player) {
    state.player.minRetirementAge = minRetirementAge;
  }
  while (state.phase === "career" && state.player && state.player.age < maxAge) {
    const event = state.currentEvent;
    if (!event || event.options.length === 0) break;
    // Deterministic greedy decision: pick first valid option
    state = simFn(state, event.options[0].id);
  }
  return state;
}

// =========================================================================
// 1. Bit-for-Bit Determinism Verification
// =========================================================================
export function verifyBitForBitDeterminism(seed = "audit-seed-fixed-2026"): void {
  console.log(`\n🔍 [VERIFY 1] Checking Bit-for-Bit Determinism under seed: "${seed}"`);

  const run1 = runFullCareer(initPlayerCareer, executeDecisionAndSimulate, seed, 36);
  const run2 = runFullCareer(initPlayerCareer, executeDecisionAndSimulate, seed, 36);

  // A. Season count parity
  if (run1.seasons.length !== run2.seasons.length) {
    throw new Error(`Season count mismatch: Run1=${run1.seasons.length}, Run2=${run2.seasons.length}`);
  }
  if (run1.seasons.length < 20) {
    throw new Error(`Season count below 20: ${run1.seasons.length}`);
  }

  // B. Season-by-season deep inspection
  for (let i = 0; i < run1.seasons.length; i++) {
    const s1 = run1.seasons[i];
    const s2 = run2.seasons[i];

    if (s1.age !== s2.age) throw new Error(`Season ${i} age mismatch: ${s1.age} vs ${s2.age}`);
    if (s1.overall !== s2.overall) throw new Error(`Season ${i} OVR mismatch: ${s1.overall} vs ${s2.overall}`);
    if (s1.teamId !== s2.teamId) throw new Error(`Season ${i} teamId mismatch: ${s1.teamId} vs ${s2.teamId}`);

    // Attributes bit-for-bit
    const s2Attrs = s2.attributes as unknown as Record<string, number>;
    for (const [k, v] of Object.entries(s1.attributes)) {
      if (s2Attrs[k] !== v) {
        throw new Error(`Season ${i} attribute ${k} mismatch: ${v} vs ${s2Attrs[k]}`);
      }
    }

    // Match counts & goals
    if (s1.stats.appearances !== s2.stats.appearances) {
      throw new Error(`Season ${i} appearances mismatch: ${s1.stats.appearances} vs ${s2.stats.appearances}`);
    }
    if (s1.stats.goals !== s2.stats.goals) {
      throw new Error(`Season ${i} goals mismatch: ${s1.stats.goals} vs ${s2.stats.goals}`);
    }
    if (s1.stats.assists !== s2.stats.assists) {
      throw new Error(`Season ${i} assists mismatch: ${s1.stats.assists} vs ${s2.stats.assists}`);
    }
    if (s1.stats.xG !== s2.stats.xG) {
      throw new Error(`Season ${i} xG mismatch: ${s1.stats.xG} vs ${s2.stats.xG}`);
    }

    // Injury bit-for-bit (including deterministic ID)
    if (JSON.stringify(s1.injuryOccurred) !== JSON.stringify(s2.injuryOccurred)) {
      throw new Error(
        `Season ${i} injury mismatch:\nRun1: ${JSON.stringify(s1.injuryOccurred)}\nRun2: ${
          JSON.stringify(s2.injuryOccurred)
        }`,
      );
    }
  }

  // C. Career totals bit-for-bit
  const t1 = run1.player?.careerTotals;
  const t2 = run2.player?.careerTotals;
  if (!t1 || !t2) throw new Error("Missing career totals in player state");

  if (t1.appearances !== t2.appearances) throw new Error(`Total apps mismatch: ${t1.appearances} vs ${t2.appearances}`);
  if (t1.goals !== t2.goals) throw new Error(`Total goals mismatch: ${t1.goals} vs ${t2.goals}`);
  if (t1.assists !== t2.assists) throw new Error(`Total assists mismatch: ${t1.assists} vs ${t2.assists}`);
  if (t1.trophies !== t2.trophies) throw new Error(`Total trophies mismatch: ${t1.trophies} vs ${t2.trophies}`);
  if (t1.totalWagesEarned !== t2.totalWagesEarned) {
    throw new Error(`Total wages mismatch: ${t1.totalWagesEarned} vs ${t2.totalWagesEarned}`);
  }

  // D. Full serialized state equality
  const json1 = JSON.stringify(run1.seasons);
  const json2 = JSON.stringify(run2.seasons);
  if (json1 !== json2) {
    throw new Error("Serialized seasons JSON is not 100% bit-for-bit identical!");
  }

  // E. Social Media and Wage Renegotiation and Press Conference determinism check
  const p1 = JSON.parse(JSON.stringify(run1.player));
  const p2 = JSON.parse(JSON.stringify(run2.player));
  p1.socialMedia.instagram.active = true;
  p2.socialMedia.instagram.active = true;
  const postRes1 = postSocialMediaUpdate(p1, "instagram", seed);
  const postRes2 = postSocialMediaUpdate(p2, "instagram", seed);
  if (JSON.stringify(postRes1) !== JSON.stringify(postRes2)) {
    throw new Error("Social media update produces non-deterministic results!");
  }

  const rngP1 = createPRNG(`${seed}-press`);
  const rngP2 = createPRNG(`${seed}-press`);
  const press1 = generatePressConference(rngP1, p1, "FC Test", 1);
  const press2 = generatePressConference(rngP2, p2, "FC Test", 1);
  if (JSON.stringify(press1.conference) !== JSON.stringify(press2.conference)) {
    throw new Error("Press conference produces non-deterministic IDs or results!");
  }

  const reneg1 = renegotiateWageWithCurrentAgent(run1);
  const reneg2 = renegotiateWageWithCurrentAgent(run2);
  if (reneg1.success !== reneg2.success || reneg1.state.rngState !== reneg2.state.rngState) {
    throw new Error("Wage renegotiation produces non-deterministic outcome or rngState!");
  }

  console.log(`✅ [PASS] 100% bit-for-bit equality verified across ${run1.seasons.length} seasons.`);
}

// =========================================================================
// 2. TS vs JS Mirror Parity Verification
// =========================================================================
export function verifyTsJsMirrorParity(seed = "parity-audit-seed-88"): void {
  console.log(`\n🔍 [VERIFY 2] Checking TS vs JS Mirror Parity under seed: "${seed}"`);

  const tsRun = runFullCareer(initPlayerCareer, executeDecisionAndSimulate, seed, 36);
  const jsRun = runFullCareer(
    initJS as unknown as typeof initPlayerCareer,
    simJS as unknown as typeof executeDecisionAndSimulate,
    seed,
    36,
  );

  if (tsRun.seasons.length !== jsRun.seasons.length) {
    throw new Error(`TS/JS season count divergence: TS=${tsRun.seasons.length}, JS=${jsRun.seasons.length}`);
  }

  if (tsRun.player?.careerTotals.goals !== jsRun.player?.careerTotals.goals) {
    throw new Error(
      `TS/JS total goals divergence: TS=${tsRun.player?.careerTotals.goals}, JS=${jsRun.player?.careerTotals.goals}`,
    );
  }

  if (tsRun.player?.careerTotals.appearances !== jsRun.player?.careerTotals.appearances) {
    throw new Error(
      `TS/JS total apps divergence: TS=${tsRun.player?.careerTotals.appearances}, JS=${jsRun.player?.careerTotals.appearances}`,
    );
  }

  for (let i = 0; i < tsRun.seasons.length; i++) {
    const tsS = tsRun.seasons[i];
    const jsS = jsRun.seasons[i];
    if (tsS.overall !== jsS.overall) {
      throw new Error(`Season ${i} OVR divergence: TS=${tsS.overall}, JS=${jsS.overall}`);
    }
    if (tsS.stats.goals !== jsS.stats.goals) {
      throw new Error(`Season ${i} goals divergence: TS=${tsS.stats.goals}, JS=${jsS.stats.goals}`);
    }
  }

  console.log(
    `✅ [PASS] TS and JS mirror engines produced identical career totals (${tsRun.seasons.length} seasons, ${tsRun.player?.careerTotals.goals} goals).`,
  );
}

// =========================================================================
// 3. Defensive PRNG Recovery & Entropy Verification
// =========================================================================
export function verifyPrngDefensiveAndEntropy(): void {
  console.log(`\n🔍 [VERIFY 3] Checking PRNG Defensive Recovery & Entropy`);

  // A. Defensive recovery when { seed } without state is provided
  const defectiveRng = { seed: "recovery-test-seed", state: 0 };
  const { rng: recoveredRng, value } = nextRandom(defectiveRng);
  if (typeof value !== "number" || isNaN(value) || value < 0 || value >= 1) {
    throw new Error(`Defensive nextRandom produced invalid value: ${value}`);
  }
  if (typeof recoveredRng.state !== "number" || recoveredRng.state === 0) {
    throw new Error(`Defensive nextRandom failed to recover valid state: ${recoveredRng.state}`);
  }

  // B. Entropy: distinct seeds produce distinct careers
  const runA = runFullCareer(initPlayerCareer, executeDecisionAndSimulate, "seed-alpha-1234", 36);
  const runB = runFullCareer(initPlayerCareer, executeDecisionAndSimulate, "seed-beta-5678", 36);
  if (JSON.stringify(runA.seasons) === JSON.stringify(runB.seasons)) {
    throw new Error("Entropy failure: two different seeds produced identical seasons!");
  }

  console.log(`✅ [PASS] PRNG defensive state recovery and seed entropy confirmed.`);
}

// =========================================================================
// 4. Performance Benchmark (< 25ms) across 20 Runs
// =========================================================================
export function verifyPerformanceBenchmark(runs = 20, maxThresholdMs = 25.0): void {
  console.log(`\n🔍 [VERIFY 4] Checking Performance Benchmark across ${runs} runs (< ${maxThresholdMs}ms threshold)`);

  // Warm-up run for JIT
  runFullCareer(initPlayerCareer, executeDecisionAndSimulate, "warmup-seed", 36);

  const durations: number[] = [];
  const seasonCounts: number[] = [];

  for (let i = 0; i < runs; i++) {
    const seed = `bench-seed-${i}-benchmark`;
    const start = performance.now();
    const result = runFullCareer(initPlayerCareer, executeDecisionAndSimulate, seed, 36);
    const end = performance.now();
    const elapsed = end - start;
    durations.push(elapsed);
    seasonCounts.push(result.seasons.length);

    if (elapsed >= maxThresholdMs) {
      throw new Error(`Run ${i} exceeded latency threshold: ${elapsed.toFixed(2)}ms >= ${maxThresholdMs}ms`);
    }
  }

  const avg = durations.reduce((acc, d) => acc + d, 0) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const minSeasons = Math.min(...seasonCounts);

  if (minSeasons < 20) {
    throw new Error(`At least one benchmark run simulated fewer than 20 seasons: min=${minSeasons}`);
  }

  console.log(`✅ [PASS] 20/20 runs completed >= 20 seasons (min=${minSeasons}).`);
  console.log(
    `✅ [PASS] Latency metrics: Min=${min.toFixed(2)}ms, Max=${max.toFixed(2)}ms, Avg=${
      avg.toFixed(2)
    }ms (all < ${maxThresholdMs}ms).`,
  );
}

// Execute if run directly via Deno
if (import.meta.main) {
  console.log("=================================================");
  console.log("   M1 DETERMINISM & PERFORMANCE VERIFICATION     ");
  console.log("=================================================");
  verifyBitForBitDeterminism();
  verifyTsJsMirrorParity();
  verifyPrngDefensiveAndEntropy();
  verifyPerformanceBenchmark(20, 25.0);
  console.log("\n=================================================");
  console.log("   ALL M1 VERIFICATION SUITES PASSED CLEANLY!     ");
  console.log("=================================================");
}
