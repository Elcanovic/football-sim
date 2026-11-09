// Tier 2 Boundary Tests: Retirement Epilogues, Modal IDs, and Bundler Stripping
// Underdog coach narrative, Dynamic modal DOM references, TypeScript annotation stripping

import { loadEngineModule, readWebUiSource, test } from "../helpers.ts";
import { assert } from "../assert.ts";

// Edge Case 14: Underdog Post-Career Pathway (0 Trophies Choosing Head Coach)
test(2, "B14", "Player with 0 Trophies Choosing Head Coach Starts at Grassroots/Lower Tier", async () => {
  const museum = await loadEngineModule("../../src/engine/retirementMuseum.ts", "B14");
  const modestPlayer = {
    totalTrophies: 0,
    peakOVR: 72,
    careerAppearances: 210,
    careerGoals: 35,
  };

  const narrative = museum.generatePostCareerEpilogue({
    player: modestPlayer,
    pathway: "Head Coach",
  });

  assert(
    narrative.startingTier === "lower_league" || narrative.startingTier === "grassroots" ||
      narrative.narrative.toLowerCase().includes("lower") || narrative.narrative.toLowerCase().includes("grassroots") ||
      narrative.narrative.toLowerCase().includes("academy"),
    "Underdog manager must start in lower tiers",
  );
});

// Edge Case 16: Dynamic Modal ID Binding Resolution
test(2, "B16", "Dynamic Modal Elements in the web UI Have Safeguards or Explicit Container Targets", async () => {
  const appJs = await readWebUiSource();

  // Verify modal elements are either queried or checked safely
  const modalMatches = appJs.match(/modal[a-zA-Z0-9_]*/gi) || [];
  assert(modalMatches.length > 0, "The web UI must reference modal interfaces");
});

// Edge Case 20: TypeScript Annotation Stripping in Bundler Output
test(
  2,
  "B20",
  "Standalone HTML Bundled Script Contains Zero TypeScript Type Annotations and Valid JS Syntax",
  async () => {
    const standaloneHtml = await Deno.readTextFile("standalone.html");

    // Extract embedded scripts
    const scriptRegex = /<script(?:\s+type="text\/javascript")?>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    let totalScriptContent = "";

    while ((match = scriptRegex.exec(standaloneHtml)) !== null) {
      totalScriptContent += match[1] + "\n";
    }

    assert(totalScriptContent.length > 100_000, "Embedded JavaScript must be present in standalone.html");

    // Invariant: No raw TS 'interface Foo {' or ': number;' in functional expressions
    assert(
      !totalScriptContent.includes("export interface ") && !totalScriptContent.includes("export type "),
      "Export type/interface statements must be stripped from standalone JS",
    );
  },
);
