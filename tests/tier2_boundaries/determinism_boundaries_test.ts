// Tier 2 Boundary Tests: PRNG Determinism & Extreme Seed Boundaries
// Multi-run 20-season bit-for-bit comparison, Extreme seed strings, State isolation

import { test } from "../helpers.ts";
import { assert, assertEquals } from "../assert.ts";
import { createPRNG, hashSeed, randomFloat, randomInt } from "../../src/engine/prng.ts";
import { executeDecisionAndSimulate, initPlayerCareer } from "../../src/index.ts";

// Edge Case 15: Fixed Seed Determinism Across 20 Seasons
test(2, "B15", "Fixed Seed career-fixed-seed-99 Produces 100% Bit-for-Bit Identical 20-Season Career", () => {
  const seed = "career-fixed-seed-99";

  const simulateFullCareer = () => {
    let state = initPlayerCareer(seed, "long", "Valente", 10, "right", "AR", "ST", "normal");
    const snapshotLog: Record<string, unknown>[] = [];

    while (state.phase === "career" && state.player && state.player.age < 38) {
      if (!state.currentEvent || state.currentEvent.options.length === 0) break;
      const opt = state.currentEvent.options[0];
      state = executeDecisionAndSimulate(state, opt.id);
      if (state.player) {
        snapshotLog.push({
          age: state.player.age,
          overall: state.player.overall,
          goals: state.player.careerTotals.goals,
          appearances: state.player.careerTotals.appearances,
          trophies: state.player.careerTotals.trophies,
          attributes: { ...state.player.attributes },
        });
      }
    }
    return snapshotLog;
  };

  const runA = simulateFullCareer();
  const runB = simulateFullCareer();

  assertEquals(runA.length, runB.length, "Both career runs must simulate identical number of seasons");
  for (let i = 0; i < runA.length; i++) {
    assertEquals(runA[i], runB[i], `Season snapshot ${i} must match bit-for-bit`);
  }
});

// Boundary: Extreme Seed Formats (Empty, Unicode, Huge String)
test(2, "B15_Seeds", "Extreme Seeds (Empty, 10,000 chars, Unicode Emoji) Never Crash PRNG", () => {
  const extremeSeeds = [
    "",
    "   ",
    "⚡⚽🔥🏆🌟",
    "A".repeat(10_000),
    "\0\n\t\r",
    "-1234567890",
  ];

  for (const s of extremeSeeds) {
    const hash = hashSeed(s);
    assert(Number.isInteger(hash), `hashSeed for '${s.slice(0, 10)}' must be integer`);
    assert(hash > 0, `hashSeed must be non-zero positive integer: ${hash}`);

    const rng = createPRNG(s);
    const floatRes = randomFloat(rng);
    assert(floatRes.value >= 0 && floatRes.value < 1);

    const intRes = randomInt(floatRes.rng, 1, 100);
    assert(intRes.value >= 1 && intRes.value <= 100);
  }
});
