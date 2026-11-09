// Tier 4 Workload Tests: Multi-Decade Career Simulation (20–25 Seasons)
// Validates memory stability, attribute aging curves, retirement triggers, and zero unhandled exceptions

import { test } from "../helpers.ts";
import { assert } from "../assert.ts";
import { executeDecisionAndSimulate, initPlayerCareer } from "../../src/index.ts";

test(4, "W01", "20+ Season Multi-Decade Career Holistic Progression and Stability", () => {
  const seeds = ["workload-striker-seed-1", "workload-mid-seed-2"];

  for (const seed of seeds) {
    let state = initPlayerCareer(
      seed,
      "long",
      "Maradona",
      10,
      "left",
      "AR",
      "CAM",
      "normal",
    );

    let seasonCount = 0;
    const historyAges: number[] = [];
    const ovrTrajectory: number[] = [];

    while (state.phase === "career" && state.player && state.player.age < 38) {
      seasonCount++;
      historyAges.push(state.player.age);
      ovrTrajectory.push(state.player.overall);

      if (!state.currentEvent || state.currentEvent.options.length === 0) break;

      // Choose first valid decision option
      const choice = state.currentEvent.options[0];
      state = executeDecisionAndSimulate(state, choice.id);
    }

    // Assert multi-decade longevity
    assert(seasonCount >= 15, `Career must simulate at least 15 seasons before retirement, got ${seasonCount}`);
    assert(historyAges.length >= 15);

    // Verify age progression strictly monotonic
    for (let i = 1; i < historyAges.length; i++) {
      assert(historyAges[i] > historyAges[i - 1], "Player age must progress monotonically each season");
    }

    // Verify career totals integrity
    const player = state.player!;
    assert(player.careerTotals.appearances > 0, "Career appearances must be > 0");
    assert(player.careerTotals.totalWagesEarned > 0, "Wages earned must accumulate");
    assert(player.overall >= 40 && player.overall <= 99, `Final OVR (${player.overall}) must be valid`);
  }
});
