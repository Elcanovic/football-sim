// Tier 1 Feature Tests: Milestone 5 Retirement Museum Suite (Features 52–55)
// Eras scrapbook, Silverware sanctuary hover stats, GOAT index, Post-career pathways

import { loadEngineModule, test } from "../helpers.ts";
import { assert, assertEquals, assertStrictEquals } from "../assert.ts";

// F52: Multi-Chapter "Eras" Scrapbook
test(1, "F52", "Multi-Chapter Career Eras Scrapbook Generation", async () => {
  const museum = await loadEngineModule("../../src/engine/retirementMuseum.ts", "F52");
  const careerSnapshots = [
    { index: 1, age: 18, teamId: "team-arg-boca", stats: { appearances: 30, goals: 15, assists: 8 } },
    { index: 2, age: 19, teamId: "team-arg-boca", stats: { appearances: 34, goals: 20, assists: 10 } },
    { index: 3, age: 20, teamId: "team-esp-madrid", stats: { appearances: 38, goals: 32, assists: 14 } },
  ];

  const eras = museum.generateCareerEras(careerSnapshots);
  assert(eras.length >= 2, "Expected at least 2 era chapters (Boca Era + Madrid Era)");
  assert(eras[0].title.length > 0, "Era chapter must have procedural narrative title");
  assert(Array.isArray(eras[0].keyTeammates), "Era chapter must track teammates");
  assert(Array.isArray(eras[0].clutchMoments), "Era chapter must track clutch moments");
});

// F53: Silverware Sanctuary & Hover Stats
test(1, "F53", "Silverware Sanctuary Hover Details (Year, Opponent, Score)", async () => {
  const museum = await loadEngineModule("../../src/engine/retirementMuseum.ts", "F53");
  const trophyRecords = [
    {
      trophyId: "ucl",
      trophyName: "UEFA Champions League",
      year: 2030,
      club: "Real Madrid",
      finalOpponent: "Bayern Munich",
      finalScore: "3-1",
      playerContribution: "Scored 89' clincher",
    },
  ];

  const sanctuary = museum.compileSilverwareSanctuary(trophyRecords);
  assert(sanctuary.length > 0);
  const card = sanctuary[0];
  assertEquals(card.finalOpponent, "Bayern Munich");
  assertEquals(card.finalScore, "3-1");
  assertEquals(card.year, 2030);
});

// F54: Algorithmic GOAT Legacy Index (0 to 1000)
test(1, "F54", "Algorithmic GOAT Legacy Index (0–1000) Normalization and Tier Classification", async () => {
  const museum = await loadEngineModule("../../src/engine/retirementMuseum.ts", "F54");

  // Legendary career: 8 trophies, 90 OVR peak, 600 appearances
  const goatCareer = {
    totalTrophies: 12,
    peakOVR: 93,
    careerAppearances: 720,
    careerGoals: 540,
    ballonDorCount: 3,
    clutchMomentsCount: 15,
  };

  const goatResult = museum.calculateGoatLegacyIndex(goatCareer);
  assert(
    goatResult.score >= 850 && goatResult.score <= 1000,
    `GOAT career score must be 850-1000, got ${goatResult.score}`,
  );
  assertStrictEquals(goatResult.tierName, "Immortal Legend");

  // Modest career: 0 trophies, 74 OVR peak, 250 appearances
  const modestCareer = {
    totalTrophies: 0,
    peakOVR: 74,
    careerAppearances: 250,
    careerGoals: 45,
    ballonDorCount: 0,
    clutchMomentsCount: 1,
  };

  const modestResult = museum.calculateGoatLegacyIndex(modestCareer);
  assert(
    modestResult.score >= 0 && modestResult.score < 500,
    `Modest career score must be < 500, got ${modestResult.score}`,
  );
});

// F55: Post-Career Pathways Suite
test(1, "F55", "Post-Career Pathway Options (Manager, Pundit, Ambassador) and Epilogue", async () => {
  const museum = await loadEngineModule("../../src/engine/retirementMuseum.ts", "F55");
  const pathways = museum.getAvailablePostCareerPathways();
  assert(pathways.includes("Head Coach") || pathways.includes("manager"));
  assert(pathways.includes("Pundit") || pathways.includes("media_broadcaster"));
  assert(pathways.includes("Club Ambassador") || pathways.includes("technical_director"));

  const coachEpilogue = museum.generatePostCareerEpilogue({
    pathway: "Head Coach",
    goatScore: 850,
    lastClubId: "team-esp-madrid",
  });
  assert(coachEpilogue.narrative.length > 50, "Coach epilogue must generate narrative summary");
});
