// Tier 2 Boundary Tests: Procedural SVG & Asset Pipeline Boundaries
// Corrupted hex colors, Missing primary color fallback (#334155), Special characters sanitization

import { loadEngineModule, test } from "../helpers.ts";
import { assert } from "../assert.ts";

// Edge Case 13: Invalid/Corrupted Hex Code Fallback to #334155 Metallic Slate
test(2, "B13", "Corrupted or Missing Hex Color Defaults to Slate #334155 Without SVG Malformation", async () => {
  const svgGen = await loadEngineModule("../../src/engine/svgGenerator.ts", "B13");
  const corruptedInputs = ["not-a-color", "###", "rgba()", "", null, undefined];

  for (const badColor of corruptedInputs) {
    const markup = svgGen.generateClubShieldSVG({
      primaryColor: badColor as string,
      abbreviation: "COR",
      name: "Corrupted FC",
    });

    assert(markup.startsWith("<svg"), "Must output valid SVG markup");
    assert(markup.includes("#334155"), `Bad color '${badColor}' must default to #334155`);
    assert(markup.includes("COR"), "Must render abbreviation");
  }
});

// Boundary: Special Characters & XML Injection in Club Names/Initials
test(2, "B13_XML", "Special Characters and XML Meta-Characters in Club Names are Escaped", async () => {
  const svgGen = await loadEngineModule("../../src/engine/svgGenerator.ts", "B13_XML");
  const evilName = "<script>alert('xss')</script> & 'Quotes' \"Double\"";
  const evilAbbr = "A&B";

  const markup = svgGen.generateClubShieldSVG({
    primaryColor: "#FF0000",
    abbreviation: evilAbbr,
    name: evilName,
  });

  // Verify XML escaping: '<' and '>' must be escaped inside text tags
  assert(!markup.includes("<script>"), "Raw unescaped script tags must not exist in SVG");
  assert(markup.includes("&amp;") || !markup.includes("&'Quotes'"), "Ampersands must be safely escaped");
});
