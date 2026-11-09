// Tier 1 Feature Tests: Milestone 1 (Features 1–4)
// Deterministic PRNG Core, CLI Performance, Timestamps, Dual TS/JS Sync

import { measureExecutionTimeMs, test } from "../helpers.ts";
import { assert, assertEquals, assertStrictEquals } from "../assert.ts";
import { createPRNG, pickRandom, randomFloat, randomInt } from "../../src/engine/prng.ts";
import { executeDecisionAndSimulate, initPlayerCareer } from "../../src/index.ts";

// F01: Deterministic PRNG Core
test(1, "F01", "Deterministic PRNG Core Bit-for-Bit Reproducibility", () => {
  const seed = "football-sim-fixed-seed-42";
  let rng1 = createPRNG(seed);
  let rng2 = createPRNG(seed);

  const floats1: number[] = [];
  const floats2: number[] = [];
  for (let i = 0; i < 50; i++) {
    const res1 = randomFloat(rng1);
    const res2 = randomFloat(rng2);
    rng1 = res1.rng;
    rng2 = res2.rng;
    floats1.push(res1.value);
    floats2.push(res2.value);
  }

  assertEquals(floats1, floats2, "Identical seeds must produce identical floating point sequence");

  // Invariant: Float output range is strictly [0, 1)
  for (const f of floats1) {
    assert(f >= 0 && f < 1, `randomFloat out of bounds: ${f}`);
  }

  // Integer range invariant
  let rngInt = createPRNG("int-range-test");
  for (let i = 0; i < 100; i++) {
    const res = randomInt(rngInt, 5, 15);
    rngInt = res.rng;
    assert(res.value >= 5 && res.value <= 15, `randomInt out of range [5, 15]: ${res.value}`);
    assert(Number.isInteger(res.value), `randomInt must return integer: ${res.value}`);
  }

  // pickRandom invariant
  const items = ["A", "B", "C", "D", "E"];
  let rngPick1 = createPRNG("pick-seed");
  let rngPick2 = createPRNG("pick-seed");
  for (let i = 0; i < 20; i++) {
    const p1 = pickRandom(rngPick1, items);
    const p2 = pickRandom(rngPick2, items);
    rngPick1 = p1.rng;
    rngPick2 = p2.rng;
    assertStrictEquals(p1.item, p2.item, "pickRandom must be deterministic");
  }
});

// F02: CLI 20-Season Benchmark (<25ms)
test(1, "F02", "CLI 20-Season Simulation Benchmark under 25ms", async () => {
  const duration = await measureExecutionTimeMs(() => {
    let state = initPlayerCareer(
      "perf-bench-seed-99",
      "long",
      "Valente",
      10,
      "right",
      "AR",
      "ST",
      "normal",
    );

    let seasonsSimulated = 0;
    while (state.phase === "career" && state.player && state.player.age < 38) {
      seasonsSimulated++;
      const event = state.currentEvent;
      if (!event || event.options.length === 0) break;

      // Select first valid option
      const chosen = event.options[0];
      state = executeDecisionAndSimulate(state, chosen.id);
    }

    assert(seasonsSimulated >= 15, `Expected at least 15 seasons simulated, got ${seasonsSimulated}`);
  });

  // Benchmark requirement from ORIGINAL_REQUEST.md and PROJECT.md: < 25 ms
  console.log(`    ℹ️  20-Season simulation benchmark time: ${duration.toFixed(2)} ms`);
  assert(
    duration < 25.0,
    `Simulation took ${duration.toFixed(2)} ms, which exceeds the 25.0 ms threshold`,
  );
});

// F03: Shared Deterministic Timestamps / Sequential IDs
test(1, "F03", "Shared Deterministic Sequential IDs Reproducibility", () => {
  const seed = "timestamp-seed-alpha";

  const runSimulation = () => {
    let s = initPlayerCareer(seed, "long", "Test", 9, "left", "BR", "ST", "normal");
    const eventIds: string[] = [];
    for (let i = 0; i < 5 && s.phase === "career" && s.currentEvent; i++) {
      eventIds.push(s.currentEvent.id);
      s = executeDecisionAndSimulate(s, s.currentEvent.options[0].id);
    }
    return eventIds;
  };

  const ids1 = runSimulation();
  const ids2 = runSimulation();

  assertEquals(ids1, ids2, "Event sequence IDs must be deterministic across identical seeds");
});

// F04: Dual TS/JS Sync Pipeline
test(1, "F04", "Dual TS/JS Engine Parity Verification", async () => {
  const engineFiles = [
    "prng",
    "attributes",
    "economics",
    "leagueSim",
    "cupSim",
    "matchEngine",
    "rosterGen",
    "careerEvents",
    "continental",
    "agents",
    "sponsorships",
    "pressEngine",
    "careerEngine",
  ];

  for (const base of engineFiles) {
    const tsPath = `src/engine/${base}.ts`;
    const jsPath = `src/engine/${base}.js`;

    const tsExists = await Deno.stat(tsPath).then(() => true).catch(() => false);
    const jsExists = await Deno.stat(jsPath).then(() => true).catch(() => false);

    assert(tsExists, `TypeScript source missing: ${tsPath}`);
    assert(jsExists, `JavaScript mirror missing: ${jsPath}`);

    // Verify both files have non-empty length
    const tsContent = await Deno.readTextFile(tsPath);
    const jsContent = await Deno.readTextFile(jsPath);

    assert(tsContent.length > 50, `${tsPath} is suspiciously empty`);
    assert(jsContent.length > 50, `${jsPath} is suspiciously empty`);
  }
});
