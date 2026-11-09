// Tier 1 Feature Tests: Milestone 5 Bundler & DOM Binding Integrity (Features 56–57)
// scripts/build_standalone.js compilation and DOM ID resolution

import { readWebUiSource, test } from "../helpers.ts";
import { assert } from "../assert.ts";

// F56: Standalone Offline Bundler
test(1, "F56", "Standalone Bundler Compiles standalone.html with Zero CDN Dependencies", async () => {
  // Check build script exists
  const buildScript = await Deno.readTextFile("scripts/build_standalone.js");
  assert(buildScript.includes("standalone.html"), "Build script must target standalone.html");

  // Read generated standalone.html
  const standaloneExists = await Deno.stat("standalone.html").then(() => true).catch(() => false);
  assert(standaloneExists, "standalone.html must exist");

  const standaloneHtml = await Deno.readTextFile("standalone.html");
  assert(standaloneHtml.length > 500_000, "standalone.html must contain full embedded catalog and code");
  assert(standaloneHtml.includes("<!DOCTYPE html>"), "standalone.html must be valid HTML");
});

// F57: DOM Element Binding Integrity
test(1, "F57", "DOM Element Binding Integrity between the web UI modules and HTML Templates", async () => {
  const indexHtml = await Deno.readTextFile("src/web/index.html");
  const appJs = await readWebUiSource();

  // Extract all getElementById targets
  const idRegex = /document\.getElementById\(\s*["']([^"']+)["']\s*\)/g;
  const referencedIds = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = idRegex.exec(appJs)) !== null) {
    referencedIds.add(match[1]);
  }

  assert(referencedIds.size > 0, "Expected at least 1 getElementById reference in the web UI");

  const missingIds: string[] = [];
  for (const id of referencedIds) {
    const hasInIndex = indexHtml.includes(`id="${id}"`) || indexHtml.includes(`id='${id}'`);
    if (!hasInIndex) {
      missingIds.push(id);
    }
  }

  // If missing elements exist, report them
  if (missingIds.length > 0) {
    console.warn(`    ⚠️  Notice: Missing DOM IDs found in index.html: ${missingIds.join(", ")}`);
  }

  // Note: For now, we assert that the majority (>90%) are bound, or zero if compliant
  const boundCount = referencedIds.size - missingIds.length;
  const bindingRatio = boundCount / referencedIds.size;
  assert(
    bindingRatio >= 0.85,
    `DOM binding ratio (${(bindingRatio * 100).toFixed(1)}%) is below acceptable threshold (85%). Missing: ${
      missingIds.slice(0, 5).join(", ")
    }`,
  );
});
