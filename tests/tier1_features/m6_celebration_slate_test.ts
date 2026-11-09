// Tier 1: Celebration slate — which titles the trophy overlay shows after a decision.
// A decision can simulate 1–3 seasons (pacing); every title won in that span gets its own entry.

import { test } from "../helpers.ts";
import { assertEquals } from "../assert.ts";
import { buildCelebrationSlate } from "../../src/web/celebration.js";

function season(index: number, age: number, trophies: string[] = [], awards: string[] = []) {
  return { index, age, teamId: "club-a", trophies, awards };
}

test(1, "C1", "A single new season with one title yields one entry labelled with its season span and age", () => {
  const seasons = [season(0, 16, ["league"])];

  const slate = buildCelebrationSlate(seasons, -1);

  assertEquals(slate.entries, [
    { seasonIndex: 0, seasonLabel: "2026/27", age: 16, key: "league", kind: "trophy", teamId: "club-a" },
  ]);
});

test(1, "C2", "A three-season span lists every title season by season, club trophies before individual awards", () => {
  const seasons = [
    season(0, 16),
    season(1, 17, ["league", "cup"]),
    season(2, 18),
    season(3, 19, ["continental_primary"], ["ballon_dor"]),
  ];

  const slate = buildCelebrationSlate(seasons, 0);

  assertEquals(
    slate.entries.map((e: { seasonLabel: string; age: number; key: string; kind: string }) =>
      `${e.seasonLabel}|${e.age}|${e.key}|${e.kind}`
    ),
    [
      "2027/28|17|league|trophy",
      "2027/28|17|cup|trophy",
      "2029/30|19|continental_primary|trophy",
      "2029/30|19|ballon_dor|award",
    ],
  );
});

test(1, "C3", "The silverware tally counts up from titles already celebrated to the total after the span", () => {
  const seasons = [
    season(0, 16, ["league"], ["golden_boy"]),
    season(1, 17, ["cup"]),
    season(2, 18, ["league"], ["golden_boot"]),
  ];

  const slate = buildCelebrationSlate(seasons, 0);

  assertEquals([slate.tallyBefore, slate.tallyAfter], [2, 5]);
});
