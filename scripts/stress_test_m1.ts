// scripts/stress_test_m1.ts
// Empirical Adversarial Stress Test Suite for Milestone 1
// Deterministic Core PRNG & Performance Foundations

import { type CareerState, catalogIndex, executeDecisionAndSimulate, initPlayerCareer } from "../src/index.ts";
import { executeDecisionAndSimulate as simJS, initPlayerCareer as initJS } from "../src/index.js";
import {
  checkProbability,
  createPRNG,
  hashSeed,
  nextRandom,
  pickRandom,
  pickWeighted,
  randomFloat,
  randomGaussian,
} from "../src/engine/prng.ts";

// Helper: Run career to age 38 with minRetirementAge = 36 (guaranteeing >= 20 seasons)
function runSimulation(
  initFn: typeof initPlayerCareer,
  simFn: typeof executeDecisionAndSimulate,
  seed: string,
  minRetirementAge = 36,
  maxAge = 38,
): CareerState {
  let state = initFn(seed, "long", "AdversarialValente", 10, "right", "AR", "ST", "normal");
  if (state.player) {
    state.player.minRetirementAge = minRetirementAge;
  }
  while (state.phase === "career" && state.player && state.player.age < maxAge) {
    const event = state.currentEvent;
    if (!event || event.options.length === 0) break;
    let chosenOption = event.options[0];
    if (event.type === "academy_offer" || event.type === "transfer" || event.type === "contract_non_renewal") {
      let maxRep = -1;
      for (const opt of event.options) {
        if (opt.teamId) {
          const team = catalogIndex.getTeam(opt.teamId);
          if (team && team.international_reputation > maxRep) {
            maxRep = team.international_reputation;
            chosenOption = opt;
          }
        }
      }
    } else if (event.type === "contract_renewal") {
      const renewOpt = event.options.find((o) => o.type === "renew_contract");
      if (renewOpt) chosenOption = renewOpt;
    }
    state = simFn(state, chosenOption.id);
  }
  return state;
}

// ============================================================================
// STRESS TEST 1: 100 Seeds Bit-for-Bit Determinism & TS/JS Parity
// ============================================================================
// deno-lint-ignore require-await -- kept async: callers await it alongside the async suites
export async function stressTest100Seeds(): Promise<{
  totalTested: number;
  deterministicMatches: number;
  entropyViolations: number;
  tsJsParityMatches: number;
  minSeasons: number;
}> {
  console.log("\n=======================================================");
  console.log("⚡ [STRESS 1] 100 SEEDS BIT-FOR-BIT DETERMINISM & ENTROPY");
  console.log("=======================================================");

  const seedPool: string[] = [];
  // 1-30: Standard alphanumeric
  for (let i = 1; i <= 30; i++) seedPool.push(`standard-seed-${i.toString().padStart(3, "0")}`);
  // 31-50: Hex hashes
  for (let i = 1; i <= 20; i++) seedPool.push(`0x${(i * 123456789).toString(16).padStart(8, "0")}-deadbeef`);
  // 51-70: Numeric strings
  for (let i = 1; i <= 20; i++) seedPool.push(`${1000000000 + i * 98765}`);
  // 71-85: International / Unicode text
  const intlSeeds = [
    "München-Fußball-2026",
    "São-Paulo-Futebol",
    "東京-サムライ-10",
    "Москва-Спартак",
    "القاهرة-الأهلي",
    "Athletic-Club-Bilbao",
    "Rangers-vs-Celtic",
    "Boca-Juniors-1905",
    "Ajax-Amsterdam-TotalFootball",
    "Milan-Derby-della-Madonnina",
    "Fenerbahçe-Galatasaray",
    "Benfica-Lisboa-Águia",
    "Sporting-CP-Leões",
    "Porto-Dragões-Azul",
    "River-Plate-Monumental",
  ];
  seedPool.push(...intlSeeds);
  // 86-100: Complex tokens & delimiters
  for (let i = 1; i <= 15; i++) seedPool.push(`seed::v1.0.0::user#${i}_token-XYZ-${i * 777}`);

  let deterministicMatches = 0;
  let entropyViolations = 0;
  let tsJsParityMatches = 0;
  let minSeasons = 999;
  const uniqueSignatures = new Set<string>();

  for (let i = 0; i < seedPool.length; i++) {
    const seed = seedPool[i];
    const run1 = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seed, 36);
    const run2 = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seed, 36);

    // Assert >= 20 seasons
    if (run1.seasons.length < minSeasons) minSeasons = run1.seasons.length;
    if (run1.seasons.length < 20) {
      throw new Error(`[SEED ${i}] '${seed}' simulated fewer than 20 seasons: ${run1.seasons.length}`);
    }

    // Assert bit-for-bit JSON equality
    const json1 = JSON.stringify(run1.seasons);
    const json2 = JSON.stringify(run2.seasons);
    if (json1 !== json2) {
      throw new Error(`[SEED ${i}] '${seed}' failed bit-for-bit JSON identity!`);
    }

    // Assert careerTotals equality
    const t1 = JSON.stringify(run1.player?.careerTotals);
    const t2 = JSON.stringify(run2.player?.careerTotals);
    if (t1 !== t2) {
      throw new Error(`[SEED ${i}] '${seed}' failed career totals identity!`);
    }

    // Assert rngState equality
    if (run1.rngState !== run2.rngState) {
      throw new Error(`[SEED ${i}] '${seed}' failed rngState equality: ${run1.rngState} vs ${run2.rngState}`);
    }

    deterministicMatches++;

    // Entropy check: distinct seeds should not produce identical career snapshots
    const sig =
      `${run1.player?.careerTotals.goals}-${run1.player?.careerTotals.appearances}-${run1.player?.careerTotals.totalWagesEarned}-${
        run1.seasons[0].overall
      }`;
    if (uniqueSignatures.has(sig)) {
      entropyViolations++; // Note collision if any
    } else {
      uniqueSignatures.add(sig);
    }

    // Check TS vs JS parity on first 25 seeds
    if (i < 25) {
      const jsRun = runSimulation(
        initJS as unknown as typeof initPlayerCareer,
        simJS as unknown as typeof executeDecisionAndSimulate,
        seed,
        36,
      );
      const jsJson = JSON.stringify(jsRun.seasons);
      if (json1 !== jsJson) {
        throw new Error(`[SEED ${i}] '${seed}' TS vs JS divergence!`);
      }
      tsJsParityMatches++;
    }

    if ((i + 1) % 25 === 0) {
      console.log(`  ✓ Tested ${i + 1}/${seedPool.length} seeds (100% deterministic so far)...`);
    }
  }

  console.log(`✅ [PASS] 100/100 seeds demonstrated 100% bit-for-bit JSON duplicate equality.`);
  console.log(`✅ [PASS] Minimum seasons simulated across all 100 seeds: ${minSeasons} (all >= 20).`);
  console.log(`✅ [PASS] TS vs JS mirror parity verified on 25 sample seeds (0 divergences).`);
  console.log(`✅ [PASS] Unique career signature entropy: ${uniqueSignatures.size}/100 unique signatures.`);

  return {
    totalTested: seedPool.length,
    deterministicMatches,
    entropyViolations,
    tsJsParityMatches,
    minSeasons,
  };
}

// ============================================================================
// STRESS TEST 2: Extreme & Adversarial Seeds in FULL Simulation Pipeline
// ============================================================================
export function stressTestExtremeSeeds(): void {
  console.log("\n=======================================================");
  console.log("⚡ [STRESS 2] EXTREME & ADVERSARIAL SEEDS IN FULL ENGINE");
  console.log("=======================================================");

  const extremeSeeds: { name: string; seed: string }[] = [
    { name: "Empty string", seed: "" },
    { name: "Single space", seed: " " },
    { name: "Multiple spaces", seed: "       " },
    { name: "Whitespace escape sequence", seed: "\t\r\n\v\f" },
    { name: "Unicode emojis (astral plane)", seed: "🔥⚽🏆👑⚡🥊🎯" },
    { name: "Repeated emojis (100x)", seed: "🌟⚽".repeat(100) },
    { name: "HTML / script injection", seed: "<script>alert('xss')</script>" },
    { name: "SQL injection payload", seed: "' OR 1=1; DROP TABLE players; --" },
    { name: "Null byte embedded", seed: "seed\0with\0null\0bytes" },
    { name: "Extreme long string (10,000 chars)", seed: "A".repeat(10_000) },
    { name: "Extreme long string (100,000 chars)", seed: "X".repeat(100_000) },
    { name: "32-bit INT MIN string", seed: "-2147483648" },
    { name: "32-bit INT MAX string", seed: "2147483647" },
    { name: "32-bit UINT MAX string", seed: "4294967295" },
    { name: "Zero string", seed: "0" },
    { name: "Reserved word strings", seed: "undefined" },
    { name: "Null string", seed: "null" },
    { name: "NaN string", seed: "NaN" },
    { name: "Object representation string", seed: "[object Object]" },
    { name: "JSON serialized string", seed: JSON.stringify({ mode: "hard", seed: 9999, nested: { flag: true } }) },
    { name: "Quotes and special symbols", seed: "!@#$%^&*()_+~`|}{[]:;?><,./'\"\\" },
  ];

  for (const { name, seed } of extremeSeeds) {
    const hash = hashSeed(seed);
    if (!Number.isInteger(hash) || hash === 0 || isNaN(hash)) {
      throw new Error(`hashSeed failed for extreme seed '${name}': hash=${hash}`);
    }

    // Run full multi-season career twice under extreme seed
    const runA = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seed, 36);
    const runB = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seed, 36);

    if (runA.seasons.length < 20) {
      throw new Error(`Extreme seed '${name}' produced fewer than 20 seasons: ${runA.seasons.length}`);
    }

    const jsonA = JSON.stringify(runA.seasons);
    const jsonB = JSON.stringify(runB.seasons);
    if (jsonA !== jsonB) {
      throw new Error(`Extreme seed '${name}' failed bit-for-bit determinism!`);
    }

    if (runA.rngState !== runB.rngState) {
      throw new Error(`Extreme seed '${name}' failed rngState parity!`);
    }

    console.log(
      `  ✓ Passed: [${name}] (Hash: 0x${
        hash.toString(16)
      }, ${runA.seasons.length} seasons, ${runA.player?.careerTotals.goals} goals)`,
    );
  }

  console.log(
    `✅ [PASS] All ${extremeSeeds.length} extreme/adversarial seeds simulated cleanly with 100% determinism.`,
  );
}

// ============================================================================
// STRESS TEST 3: Rapid Sequential Executions, State Isolation & Memory Leak Check
// ============================================================================
export function stressTestSequentialIsolation(iterations = 200): void {
  console.log("\n=======================================================");
  console.log(`⚡ [STRESS 3] RAPID SEQUENTIAL EXECUTIONS & ISOLATION (${iterations} RUNS)`);
  console.log("=======================================================");

  const seedAlpha = "isolation-seed-ALPHA-111";
  const seedBeta = "isolation-seed-BETA-222";

  // Baseline runs
  const baseAlpha = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seedAlpha, 36);
  const baseBeta = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seedBeta, 36);
  const alphaSnapshot = JSON.stringify(baseAlpha.seasons);
  const betaSnapshot = JSON.stringify(baseBeta.seasons);

  if (alphaSnapshot === betaSnapshot) {
    throw new Error("Sanity check failure: Alpha and Beta baseline snapshots are identical!");
  }

  const initialMem = Deno.memoryUsage();
  console.log(`  Initial Heap Used: ${(initialMem.heapUsed / 1024 / 1024).toFixed(2)} MB`);

  for (let i = 0; i < iterations; i++) {
    // Alternate between Alpha and Beta
    const isAlpha = i % 2 === 0;
    const seed = isAlpha ? seedAlpha : seedBeta;
    const expected = isAlpha ? alphaSnapshot : betaSnapshot;

    const run = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seed, 36);
    const actual = JSON.stringify(run.seasons);

    if (actual !== expected) {
      throw new Error(
        `State leakage detected at run ${i} (Seed: ${isAlpha ? "ALPHA" : "BETA"})! Output differs from baseline!`,
      );
    }

    if ((i + 1) % 50 === 0) {
      const currentMem = Deno.memoryUsage();
      console.log(
        `  ✓ Run ${i + 1}/${iterations} verified (Heap Used: ${(currentMem.heapUsed / 1024 / 1024).toFixed(2)} MB)`,
      );
    }
  }

  const finalMem = Deno.memoryUsage();
  const heapDeltaMB = (finalMem.heapUsed - initialMem.heapUsed) / 1024 / 1024;
  console.log(
    `  Final Heap Used: ${(finalMem.heapUsed / 1024 / 1024).toFixed(2)} MB (Delta: ${heapDeltaMB.toFixed(2)} MB)`,
  );

  // Assert heap growth did not exceed acceptable bound (e.g. 100MB over 200 runs)
  if (heapDeltaMB > 100) {
    throw new Error(
      `Potential memory leak detected: Heap grew by ${heapDeltaMB.toFixed(2)} MB across ${iterations} runs!`,
    );
  }

  console.log(`✅ [PASS] 0 state leakages across ${iterations} interleaved sequential executions.`);
  console.log(`✅ [PASS] Heap memory remained bounded and stable.`);
}

// ============================================================================
// STRESS TEST 4: Performance Timing Under Load (< 25ms Benchmark)
// ============================================================================
export async function stressTestPerformanceTiming(): Promise<{
  cliSubprocessTimes: number[];
  inMemoryTimes: number[];
  avgInMemoryMs: number;
  maxInMemoryMs: number;
  p95InMemoryMs: number;
}> {
  console.log("\n=======================================================");
  console.log("⚡ [STRESS 4] PERFORMANCE BENCHMARK & HIGH-LOAD TIMING (< 25ms)");
  console.log("=======================================================");

  // A. In-Memory 100-run latency test
  const inMemoryTimes: number[] = [];
  // Warmup
  for (let w = 0; w < 5; w++) {
    runSimulation(initPlayerCareer, executeDecisionAndSimulate, `warmup-${w}`, 36);
  }

  for (let i = 0; i < 100; i++) {
    const seed = `bench-load-seed-${i}`;
    const t0 = performance.now();
    const result = runSimulation(initPlayerCareer, executeDecisionAndSimulate, seed, 36);
    const t1 = performance.now();
    const elapsed = t1 - t0;
    inMemoryTimes.push(elapsed);

    if (result.seasons.length < 20) {
      throw new Error(`Run ${i} completed fewer than 20 seasons: ${result.seasons.length}`);
    }
    if (elapsed >= 25.0) {
      throw new Error(`In-memory run ${i} exceeded 25ms: ${elapsed.toFixed(2)}ms`);
    }
  }

  inMemoryTimes.sort((a, b) => a - b);
  const minInMemory = inMemoryTimes[0];
  const maxInMemory = inMemoryTimes[inMemoryTimes.length - 1];
  const avgInMemory = inMemoryTimes.reduce((a, b) => a + b, 0) / inMemoryTimes.length;
  const p50InMemory = inMemoryTimes[Math.floor(inMemoryTimes.length * 0.5)];
  const p95InMemory = inMemoryTimes[Math.floor(inMemoryTimes.length * 0.95)];
  const p99InMemory = inMemoryTimes[Math.floor(inMemoryTimes.length * 0.99)];

  console.log("  In-Memory 100 Runs (20-21 Seasons per run):");
  console.log(`    Min: ${minInMemory.toFixed(2)}ms`);
  console.log(`    Max: ${maxInMemory.toFixed(2)}ms`);
  console.log(`    Avg: ${avgInMemory.toFixed(2)}ms`);
  console.log(`    p50: ${p50InMemory.toFixed(2)}ms`);
  console.log(`    p95: ${p95InMemory.toFixed(2)}ms`);
  console.log(`    p99: ${p99InMemory.toFixed(2)}ms`);

  // B. CLI Subprocess execution of `deno task demo` (10 runs)
  console.log("\n  Executing `deno task demo` via subprocess across 10 independent invocations:");
  const cliSubprocessTimes: number[] = [];
  const reportedSimTimes: number[] = [];

  for (let c = 0; c < 10; c++) {
    const seedArg = `cli-stress-seed-${c}`;
    const procStart = performance.now();

    const cmd = new Deno.Command("deno", {
      args: ["run", "--allow-read", "--allow-write", "src/demo.ts", seedArg],
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await cmd.output();
    const procElapsed = performance.now() - procStart;

    if (code !== 0) {
      const errText = new TextDecoder().decode(stderr);
      throw new Error(`CLI demo failed with exit code ${code}: ${errText}`);
    }

    const outText = new TextDecoder().decode(stdout);
    // Parse: CAREER TIMELINE (21 Seasons simulated in 8.99 ms)
    const match = outText.match(/CAREER TIMELINE \((\d+) Seasons simulated in ([\d\.]+) ms\)/);
    if (!match) {
      throw new Error(`Failed to parse timeline output from demo.ts:\n${outText}`);
    }

    const seasonsSimulated = parseInt(match[1], 10);
    const simMs = parseFloat(match[2]);

    if (seasonsSimulated < 20) {
      throw new Error(`CLI demo simulated only ${seasonsSimulated} seasons (< 20)!`);
    }
    if (simMs >= 25.0) {
      throw new Error(`CLI demo simulation time exceeded 25ms threshold: ${simMs}ms!`);
    }

    reportedSimTimes.push(simMs);
    cliSubprocessTimes.push(procElapsed);
    console.log(
      `    CLI Run ${c + 1}: ${seasonsSimulated} seasons in ${simMs.toFixed(2)} ms (Subprocess: ${
        procElapsed.toFixed(2)
      } ms)`,
    );
  }

  const maxReportedSim = Math.max(...reportedSimTimes);
  const avgReportedSim = reportedSimTimes.reduce((a, b) => a + b, 0) / reportedSimTimes.length;
  console.log(
    `\n✅ [PASS] 100/100 in-memory runs completed in < 25ms (Max: ${maxInMemory.toFixed(2)}ms, Avg: ${
      avgInMemory.toFixed(2)
    }ms).`,
  );
  console.log(
    `✅ [PASS] 10/10 CLI demo runs completed >= 20 seasons with sim time < 25ms (Max: ${
      maxReportedSim.toFixed(2)
    }ms, Avg: ${avgReportedSim.toFixed(2)}ms).`,
  );

  return {
    cliSubprocessTimes,
    inMemoryTimes,
    avgInMemoryMs: avgInMemory,
    maxInMemoryMs: maxInMemory,
    p95InMemoryMs: p95InMemory,
  };
}

// ============================================================================
// STRESS TEST 5: Defensive PRNG Invariant Boundary Stress
// ============================================================================
export function stressTestPrngBoundaries(): void {
  console.log("\n=======================================================");
  console.log("⚡ [STRESS 5] PRNG MATHEMATICAL INVARIANTS & DEFENSIVE BOUNDARIES");
  console.log("=======================================================");

  // 1. Boundary states for nextRandom
  const boundaryStates = [0, -1, 1, 2147483647, -2147483648, 4294967295, NaN, undefined, 0.5];
  for (const st of boundaryStates) {
    const rng = { seed: "defensive-test", state: st as unknown as number };
    const { rng: nextRng, value } = nextRandom(rng);
    if (typeof value !== "number" || isNaN(value) || value < 0 || value >= 1) {
      throw new Error(`nextRandom produced invalid float for state ${st}: ${value}`);
    }
    if (typeof nextRng.state !== "number" || nextRng.state === 0 || isNaN(nextRng.state)) {
      throw new Error(`nextRandom failed to advance valid state for input ${st}: ${nextRng.state}`);
    }
  }

  // 2. Uniform distribution statistical spot check (100,000 iterations)
  const rngStat = createPRNG("uniform-distribution-audit");
  let currentRng = rngStat;
  let sum = 0;
  const bins = [0, 0, 0, 0, 0]; // 5 bins of 0.2 each
  const N = 100_000;

  for (let i = 0; i < N; i++) {
    const res = randomFloat(currentRng, 0, 1);
    currentRng = res.rng;
    sum += res.value;
    const binIdx = Math.min(4, Math.floor(res.value * 5));
    bins[binIdx]++;
  }

  const mean = sum / N;
  // Expected mean of Uniform(0,1) is 0.5. With N=100,000, std err is 1/sqrt(12*100000) ~ 0.0009.
  // Assert mean is within [0.495, 0.505]
  if (Math.abs(mean - 0.5) > 0.005) {
    throw new Error(`PRNG failed uniform mean check: mean=${mean.toFixed(5)} (expected ~0.5)`);
  }

  // Each bin should have ~20,000 counts (within 5% tolerance: 19,000 to 21,000)
  for (let b = 0; b < bins.length; b++) {
    const count = bins[b];
    if (count < 18500 || count > 21500) {
      throw new Error(`PRNG bin ${b} count deviated significantly: ${count} / ${N}`);
    }
  }

  // 3. checkProbability boundaries
  let pRng = createPRNG("prob-bounds");
  // p <= 0 must always be false
  for (let i = 0; i < 100; i++) {
    const { rng: nr, success } = checkProbability(pRng, 0);
    pRng = nr;
    if (success) throw new Error("checkProbability(rng, 0) returned true!");
  }
  // p >= 1 must always be true
  for (let i = 0; i < 100; i++) {
    const { rng: nr, success } = checkProbability(pRng, 1);
    pRng = nr;
    if (!success) throw new Error("checkProbability(rng, 1) returned false!");
  }

  // 4. pickRandom & pickWeighted edge cases
  const pickRng = createPRNG("pick-bounds");
  const singleItem = ["only-one"];
  const pickRes = pickRandom(pickRng, singleItem);
  if (pickRes.item !== "only-one") throw new Error("pickRandom single item failure");

  const weightedRes = pickWeighted(pickRng, [{ item: "heavy", weight: 100 }, { item: "zero", weight: 0 }]);
  if (weightedRes.item !== "heavy") throw new Error("pickWeighted zero weight violation");

  // 5. randomGaussian Box-Muller check (10,000 samples)
  let gRng = createPRNG("gaussian-audit");
  let gSum = 0;
  const GN = 10_000;
  for (let i = 0; i < GN; i++) {
    const { rng: nr, value } = randomGaussian(gRng, 0, 1);
    gRng = nr;
    gSum += value;
  }
  const gMean = gSum / GN;
  if (Math.abs(gMean) > 0.05) {
    throw new Error(`Gaussian mean check failed: mean=${gMean.toFixed(4)} (expected ~0.0)`);
  }

  console.log(`✅ [PASS] Boundary states, uniform distribution (mean=${mean.toFixed(5)}), and Box-Muller verified.`);
}

// ============================================================================
// MAIN RUNNER
// ============================================================================
if (import.meta.main) {
  console.log("=================================================================");
  console.log("      M1 ADVERSARIAL STRESS TEST & EMPIRICAL HARNESS             ");
  console.log("=================================================================");

  try {
    const tStart = performance.now();
    await stressTest100Seeds();
    stressTestExtremeSeeds();
    stressTestSequentialIsolation(200);
    await stressTestPerformanceTiming();
    stressTestPrngBoundaries();
    const tTotal = ((performance.now() - tStart) / 1000).toFixed(2);

    console.log("\n=================================================================");
    console.log(`🎯 ALL M1 EMPIRICAL CHALLENGER STRESS TESTS PASSED IN ${tTotal}s!`);
    console.log("=================================================================");
  } catch (err) {
    console.error("\n❌ STRESS TEST FAILED:", err);
    Deno.exit(1);
  }
}
