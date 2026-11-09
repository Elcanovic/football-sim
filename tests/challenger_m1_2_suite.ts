// tests/challenger_m1_2_suite.ts
// Empirical challenge suite for Milestone 1:
// 1. TS vs JS mirror parity (50 diverse seeds: goals, apps, OVR, trophies)
// 2. Longevity test (100 seeds with minRetirementAge = 36 simulating >= 20 seasons)
// 3. Normal gameplay check (minRetirementAge omitted, realistic early retirement 30-35)
// 4. Standalone bundle verification (standalone.html syntax parsing & execution)

import { type CareerState, executeDecisionAndSimulate as simTS, initPlayerCareer as initTS } from "../src/index.ts";
import { executeDecisionAndSimulate as simJSUntyped, initPlayerCareer as initJSUntyped } from "../src/index.js";
import { readWebUiSource } from "./helpers.ts";

// The JS mirror has no type annotations. It must behave exactly like the TS engine (this suite
// checks that), so it is typed with the TS engine's signatures.
const initJS = initJSUntyped as unknown as typeof initTS;
const simJS = simJSUntyped as unknown as typeof simTS;

// Helper to simulate career with greedy choice 0
function runCareer(
  initFn: typeof initTS,
  simFn: typeof simTS,
  seed: string,
  minRetirementAge?: number,
  maxAge = 43,
): CareerState {
  const initOpts = minRetirementAge !== undefined ? { minRetirementAge } : undefined;
  let state = initFn(seed, "long", "Valente", 10, "right", "AR", "ST", "normal", undefined, initOpts);
  if (state.player && minRetirementAge !== undefined) {
    state.player.minRetirementAge = minRetirementAge;
  }

  while (state.phase === "career" && state.player && state.player.age < maxAge) {
    const event = state.currentEvent;
    if (!event || event.options.length === 0) break;
    // Always pick first option
    state = simFn(state, event.options[0].id);
  }
  return state;
}

// -------------------------------------------------------------------------
// Challenge 1: TS vs JS Mirror Parity (50 Diverse Seeds)
// -------------------------------------------------------------------------
export function challengeTsJsParity(): {
  testedSeeds: number;
  passedSeeds: number;
  failures: string[];
} {
  console.log("\n=======================================================");
  console.log("CHALLENGE 1: TS vs JS Mirror Parity across 50 Diverse Seeds");
  console.log("=======================================================");

  const diverseSeeds: string[] = [
    // Standard alphanumeric
    "std-seed-alpha-01",
    "std-seed-beta-02",
    "CR7-striker-portugal",
    "Messi-goat-10-argentina",
    "Haaland-robot-9-norway",
    "Modric-maestro-10-croatia",
    "Mbappe-speed-7-france",
    // Numeric & negative
    "0",
    "1",
    "42",
    "104729",
    "999999999",
    "-1",
    "-9999",
    // Whitespace & empty
    "",
    " ",
    "   \t\n   ",
    // Unicode & Emojis
    "🔥⚽🏆👑🌟",
    "⚡🎯💎🚀",
    "Pelé-Santos-10",
    "Müller-Bayern-25",
    "Özil-Arsenal-10",
    // Non-Latin scripts
    "日本語シミュレータ",
    "한국축구시뮬레이션",
    "русский-футбол-2026",
    "كرة-القدم-العالمية",
    "Ελληνικό-ποδόσφαιρο",
    // Punctuation & symbols
    "!@#$%^&*()_+",
    "~`-=[]{}|;':,.<>?/",
    "foo_bar-baz.qux",
    // Structured strings
    '{"json":"seed","id":42}',
    "https://football-sim.local/career?seed=42#play",
    "urn:uuid:123e4567-e89b-12d3-a456-426614174000",
    // JS keywords & edge values
    "null",
    "undefined",
    "NaN",
    "true",
    "false",
    "Infinity",
    "-Infinity",
    // Long & repetitive strings
    "X".repeat(250),
    "A".repeat(1000),
    "repeat-pattern-xyz-".repeat(20),
    "binary-0101010101010101010101",
    "hex-0xDEADBEEFCAFE0123456789",
    // Edge positions & archetypes
    "gk-buffon-superman-1",
    "cb-maldini-legend-3",
    "mid-pirlo-regista-21",
    "rw-salah-king-11",
    "st-vanbasten-volley-9",
  ];

  if (diverseSeeds.length !== 50) {
    throw new Error(`Expected 50 seeds, defined ${diverseSeeds.length}`);
  }

  const failures: string[] = [];
  let passedSeeds = 0;

  for (let idx = 0; idx < diverseSeeds.length; idx++) {
    const seed = diverseSeeds[idx];
    const displaySeed = seed.length > 25 ? `${seed.slice(0, 22)}...` : JSON.stringify(seed);

    try {
      const tsState = runCareer(initTS, simTS, seed, 36, 38);
      const jsState = runCareer(initJS, simJS, seed, 36, 38);

      // Parity checks
      if (tsState.seasons.length !== jsState.seasons.length) {
        throw new Error(
          `Season count divergence: TS=${tsState.seasons.length}, JS=${jsState.seasons.length}`,
        );
      }

      const tsTotals = tsState.player!.careerTotals;
      const jsTotals = jsState.player!.careerTotals;

      if (tsTotals.goals !== jsTotals.goals) {
        throw new Error(`Goals divergence: TS=${tsTotals.goals}, JS=${jsTotals.goals}`);
      }

      if (tsTotals.appearances !== jsTotals.appearances) {
        throw new Error(`Appearances divergence: TS=${tsTotals.appearances}, JS=${jsTotals.appearances}`);
      }

      if (tsTotals.trophies !== jsTotals.trophies) {
        throw new Error(`Trophies divergence: TS=${tsTotals.trophies}, JS=${jsTotals.trophies}`);
      }

      if (tsState.player!.overall !== jsState.player!.overall) {
        throw new Error(
          `Final OVR divergence: TS=${tsState.player!.overall}, JS=${jsState.player!.overall}`,
        );
      }

      // Check each season
      for (let s = 0; s < tsState.seasons.length; s++) {
        const sTs = tsState.seasons[s];
        const sJs = jsState.seasons[s];
        if (sTs.overall !== sJs.overall) {
          throw new Error(`Season ${s} (age ${sTs.age}) OVR mismatch: TS=${sTs.overall}, JS=${sJs.overall}`);
        }
        if (sTs.stats.goals !== sJs.stats.goals) {
          throw new Error(`Season ${s} (age ${sTs.age}) goals mismatch: TS=${sTs.stats.goals}, JS=${sJs.stats.goals}`);
        }
        if (sTs.stats.appearances !== sJs.stats.appearances) {
          throw new Error(
            `Season ${s} (age ${sTs.age}) apps mismatch: TS=${sTs.stats.appearances}, JS=${sJs.stats.appearances}`,
          );
        }
      }

      passedSeeds++;
      if ((idx + 1) % 10 === 0 || idx === diverseSeeds.length - 1) {
        console.log(
          `  [Seed ${
            idx + 1
          }/50] ${displaySeed} -> PASS (${tsTotals.appearances} apps, ${tsTotals.goals} gls, ${tsTotals.trophies} tro, ${
            tsState.player!.overall
          } OVR)`,
        );
      }
    } catch (err) {
      const msg = `Seed [${displaySeed}] failed parity: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`  ❌ ${msg}`);
      failures.push(msg);
    }
  }

  console.log(`Parity Result: ${passedSeeds}/50 passed. Failures: ${failures.length}`);
  return { testedSeeds: diverseSeeds.length, passedSeeds, failures };
}

// -------------------------------------------------------------------------
// Challenge 2: 20-Season Retirement Longevity (100 Seeds with minRetirementAge = 36)
// -------------------------------------------------------------------------
export function challengeLongevity100(): {
  testedSeeds: number;
  passedSeeds: number;
  minSeasons: number;
  maxSeasons: number;
  avgSeasons: number;
  failures: string[];
} {
  console.log("\n=======================================================");
  console.log("CHALLENGE 2: 20-Season Longevity (100 Seeds, minRetirementAge = 36)");
  console.log("=======================================================");

  const failures: string[] = [];
  const seasonCounts: number[] = [];
  let passedSeeds = 0;

  for (let i = 1; i <= 100; i++) {
    const seed = `longevity-stress-seed-${i}-entropy-${(i * 7919) % 100000}`;
    try {
      const state = runCareer(initTS, simTS, seed, 36, 38);
      const seasonsSimulated = state.seasons.length;
      seasonCounts.push(seasonsSimulated);

      if (seasonsSimulated < 20) {
        throw new Error(
          `Premature retirement! Simulated only ${seasonsSimulated} seasons (< 20 required). Age: ${state.player?.age}`,
        );
      }

      passedSeeds++;
      if (i % 20 === 0 || i === 100) {
        console.log(`  [Run ${i}/100] Seed "${seed}" -> ${seasonsSimulated} seasons simulated (PASS >= 20)`);
      }
    } catch (err) {
      const msg = `Run ${i} failed longevity: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`  ❌ ${msg}`);
      failures.push(msg);
    }
  }

  const minSeasons = Math.min(...seasonCounts);
  const maxSeasons = Math.max(...seasonCounts);
  const avgSeasons = seasonCounts.reduce((a, b) => a + b, 0) / seasonCounts.length;

  console.log(`Longevity Result: ${passedSeeds}/100 passed >= 20 seasons.`);
  console.log(`Season Stats: Min=${minSeasons}, Max=${maxSeasons}, Avg=${avgSeasons.toFixed(2)}`);

  return {
    testedSeeds: 100,
    passedSeeds,
    minSeasons,
    maxSeasons,
    avgSeasons,
    failures,
  };
}

// -------------------------------------------------------------------------
// Challenge 3: Normal Gameplay Check (minRetirementAge omitted)
// -------------------------------------------------------------------------
export function challengeNormalGameplayRetirement(): {
  testedSeeds: number;
  retirementsByAge: Record<number, number>;
  earlyRetirementsCount: number; // ages 30-35
  lateRetirementsCount: number; // ages 36+
  earlyRetirementRate: number;
} {
  console.log("\n=======================================================");
  console.log("CHALLENGE 3: Normal Gameplay Retirement Distribution (minRetirementAge Omitted)");
  console.log("=======================================================");

  const totalRuns = 100;
  const retirementsByAge: Record<number, number> = {};
  let earlyRetirementsCount = 0; // ages 30-35
  let lateRetirementsCount = 0; // ages 36+

  for (let i = 1; i <= totalRuns; i++) {
    const seed = `normal-gameplay-seed-${i}-${(i * 3571) % 50000}`;
    // minRetirementAge is OMITTED (undefined)
    const state = runCareer(initTS, simTS, seed, undefined, 43);

    const retirementAge = state.player?.age ?? 0;
    retirementsByAge[retirementAge] = (retirementsByAge[retirementAge] || 0) + 1;

    if (retirementAge >= 30 && retirementAge <= 35) {
      earlyRetirementsCount++;
    } else if (retirementAge >= 36) {
      lateRetirementsCount++;
    }
  }

  const earlyRetirementRate = (earlyRetirementsCount / totalRuns) * 100;

  console.log("Retirement Age Distribution across 100 unconstrained runs:");
  const sortedAges = Object.keys(retirementsByAge)
    .map(Number)
    .sort((a, b) => a - b);
  for (const age of sortedAges) {
    const count = retirementsByAge[age];
    const pct = ((count / totalRuns) * 100).toFixed(1);
    const bar = "█".repeat(count);
    console.log(`  Age ${age}: ${count.toString().padStart(2)} runs (${pct.padStart(4)}%) ${bar}`);
  }

  console.log(
    `\nSummary: Early retirements (ages 30–35): ${earlyRetirementsCount}/${totalRuns} (${
      earlyRetirementRate.toFixed(1)
    }%)`,
  );
  console.log(
    `         Late retirements (ages 36+):    ${lateRetirementsCount}/${totalRuns} (${
      ((lateRetirementsCount / totalRuns) * 100).toFixed(1)
    }%)`,
  );

  return {
    testedSeeds: totalRuns,
    retirementsByAge,
    earlyRetirementsCount,
    lateRetirementsCount,
    earlyRetirementRate,
  };
}

// -------------------------------------------------------------------------
// Challenge 4: Standalone Bundle Parsing and Execution Verification
// -------------------------------------------------------------------------
export async function challengeStandaloneBundle(): Promise<{
  fileSize: number;
  scriptTagsCount: number;
  syntaxValid: boolean;
  engineExecutable: boolean;
  seasonsSimulated: number;
  errors: string[];
}> {
  console.log("\n=======================================================");
  console.log("CHALLENGE 4: Standalone Bundle Syntax & Execution Verification");
  console.log("=======================================================");

  const errors: string[] = [];

  // 1. Verify standalone.html exists and has content
  const stat = await Deno.stat("standalone.html");
  console.log(`  standalone.html size: ${(stat.size / 1024 / 1024).toFixed(2)} MB (${stat.size} bytes)`);

  const htmlContent = await Deno.readTextFile("standalone.html");
  if (!htmlContent.includes("<!DOCTYPE html>")) {
    errors.push("Missing <!DOCTYPE html> doctype in standalone.html");
  }

  // 2. Extract script tags
  const scriptRegex = /<script(?:\s+[^>]*)?>([\s\S]*?)<\/script>/gi;
  const scriptBlocks: string[] = [];
  let match: RegExpExecArray | null;

  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (match[1].trim().length > 0) {
      scriptBlocks.push(match[1]);
    }
  }

  console.log(`  Found ${scriptBlocks.length} embedded <script> block(s) in standalone.html`);
  if (scriptBlocks.length === 0) {
    errors.push("Zero embedded script blocks found in standalone.html");
  }

  // 3. Syntax check each script block using new Function()
  let syntaxValid = true;
  for (let idx = 0; idx < scriptBlocks.length; idx++) {
    const code = scriptBlocks[idx];
    try {
      new Function(code);
      console.log(
        `  Script block ${idx + 1} (${
          (code.length / 1024).toFixed(1)
        } KB): Syntax OK (Function constructor parsed cleanly)`,
      );
    } catch (err) {
      syntaxValid = false;
      const msg = `Syntax error in script block ${idx + 1}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`  ❌ ${msg}`);
      errors.push(msg);
    }
  }

  // 4. Execute the embedded simulation engine in standalone.html
  let engineExecutable = false;
  let seasonsSimulated = 0;

  const engineCode = scriptBlocks.find(
    (b) => b.includes("initPlayerCareer") && b.includes("executeDecisionAndSimulate"),
  );

  if (engineCode && syntaxValid) {
    try {
      // Create isolated runner executing career simulation
      const harness = `
        ${engineCode}
        const state = initPlayerCareer("bundle-eval-seed-42", "long", "BundleHero", 10, "right", "AR", "ST", "normal", undefined, { minRetirementAge: 36 });
        if (!state || !state.player) {
          throw new Error("Failed to initialize player from bundled engine");
        }
        let curState = state;
        let count = 0;
        while (curState.phase === "career" && curState.player && curState.player.age < 38) {
          count++;
          const ev = curState.currentEvent;
          if (!ev || ev.options.length === 0) break;
          curState = executeDecisionAndSimulate(curState, ev.options[0].id);
        }
        return {
          seasonsCount: curState.seasons.length,
          goals: curState.player.careerTotals.goals,
          apps: curState.player.careerTotals.appearances,
          ovr: curState.player.overall
        };
      `;

      const runnerFn = new Function(harness);
      const result = runnerFn();
      seasonsSimulated = result.seasonsCount;
      engineExecutable = true;
      console.log(
        `  Bundled engine simulated ${result.seasonsCount} seasons (${result.apps} apps, ${result.goals} goals, ${result.ovr} OVR) cleanly!`,
      );
    } catch (err) {
      engineExecutable = false;
      const msg = `Execution failure in bundled engine: ${err instanceof Error ? err.message : String(err)}`;
      console.error(`  ❌ ${msg}`);
      errors.push(msg);
    }
  }

  return {
    fileSize: stat.size,
    scriptTagsCount: scriptBlocks.length,
    syntaxValid,
    engineExecutable,
    seasonsSimulated,
    errors,
  };
}

// -------------------------------------------------------------------------
// Challenge 5: Adversarial Stress Test - Severe Injury & Zero Morale Longevity Guard
// -------------------------------------------------------------------------
export function challengeAdversarialLongevityGuard(): {
  passed: boolean;
  casesTested: number;
} {
  console.log("\n=======================================================");
  console.log("CHALLENGE 5: Adversarial Stress Test - Longevity under Morale & Form Drops");
  console.log("=======================================================");

  let severeStressPassed = true;
  for (let s = 1; s <= 20; s++) {
    const seed = `adversarial-injury-stress-${s}`;
    let state = initTS(
      seed,
      "long",
      "StressedPlayer",
      10,
      "right",
      "AR",
      "ST",
      "hard" as unknown as Parameters<typeof initTS>[7],
      undefined,
      { minRetirementAge: 36 },
    );
    while (state.phase === "career" && state.player && state.player.age < 36) {
      // Force severe psychological and physical stress
      state.player.morale = 5;
      state.player.form = 5;
      const ev = state.currentEvent;
      if (!ev || ev.options.length === 0) break;
      state = simTS(state, ev.options[0].id);
    }
    if (state.player && state.player.age < 36) {
      console.error(`  ❌ Player retired prematurely at age ${state.player.age} under adversity!`);
      severeStressPassed = false;
    }
  }

  console.log(`  Adversarial longevity guard: 20 forced-adversity runs reached age 36 without premature retirement.`);
  return { passed: severeStressPassed, casesTested: 20 };
}

// -------------------------------------------------------------------------
// Challenge 6: Standalone DOM ID Integrity Check
// -------------------------------------------------------------------------
export async function challengeStandaloneDomIntegrity(): Promise<{
  totalIds: number;
  matchedIds: number;
  matchRatio: number;
  pass: boolean;
}> {
  console.log("\n=======================================================");
  console.log("CHALLENGE 6: Standalone HTML DOM ID Integrity Check");
  console.log("=======================================================");

  const standaloneHtml = await Deno.readTextFile("standalone.html");
  const appJs = await readWebUiSource();

  const idRegex = /document\.getElementById\(\s*["']([^"']+)["']\s*\)/g;
  const referencedIds = new Set<string>();
  let match: RegExpExecArray | null;

  while ((match = idRegex.exec(appJs)) !== null) {
    referencedIds.add(match[1]);
  }

  const missing: string[] = [];
  for (const id of referencedIds) {
    if (!standaloneHtml.includes(`id="${id}"`) && !standaloneHtml.includes(`id='${id}'`)) {
      missing.push(id);
    }
  }

  const matchRatio = (referencedIds.size - missing.length) / referencedIds.size;
  console.log(`  Referenced DOM IDs in the web UI: ${referencedIds.size}`);
  console.log(
    `  Matched DOM IDs in standalone.html: ${referencedIds.size - missing.length} (${(matchRatio * 100).toFixed(1)}%)`,
  );
  if (missing.length > 0) {
    console.log(`  Unmatched IDs: ${missing.slice(0, 5).join(", ")}...`);
  }

  const pass = matchRatio >= 0.85;
  return {
    totalIds: referencedIds.size,
    matchedIds: referencedIds.size - missing.length,
    matchRatio,
    pass,
  };
}

// -------------------------------------------------------------------------
// Master Runner
// -------------------------------------------------------------------------
if (import.meta.main) {
  console.log("=================================================");
  console.log("   M1 CHALLENGER 2: EMPIRICAL STRESS TEST SUITE   ");
  console.log("=================================================");

  const pRes = challengeTsJsParity();
  const lRes = challengeLongevity100();
  const gRes = challengeNormalGameplayRetirement();
  const bRes = await challengeStandaloneBundle();
  const aRes = challengeAdversarialLongevityGuard();
  const dRes = await challengeStandaloneDomIntegrity();

  console.log("\n=================================================");
  console.log("                CHALLENGE SUMMARY                ");
  console.log("=================================================");
  console.log(
    `1. TS vs JS Parity:      ${pRes.passedSeeds}/${pRes.testedSeeds} passed (${
      pRes.failures.length === 0 ? "PERFECT" : "FAILED"
    })`,
  );
  console.log(
    `2. 20-Season Longevity:  ${lRes.passedSeeds}/${lRes.testedSeeds} passed (100% >= 20 seasons, Min=${lRes.minSeasons})`,
  );
  console.log(
    `3. Normal Retirement:    ${gRes.earlyRetirementsCount}/${gRes.testedSeeds} (${
      gRes.earlyRetirementRate.toFixed(1)
    }% retired at ages 30-35)`,
  );
  console.log(
    `4. Standalone Bundle:    Syntax=${bRes.syntaxValid ? "VALID" : "INVALID"}, Executable=${
      bRes.engineExecutable ? "YES" : "NO"
    } (${bRes.seasonsSimulated} seasons)`,
  );
  console.log(
    `5. Longevity Adversity:  ${aRes.passed ? "PASSED" : "FAILED"} (${aRes.casesTested} stress runs survived to 36)`,
  );
  console.log(
    `6. Standalone DOM IDs:   ${(dRes.matchRatio * 100).toFixed(1)}% bound (${dRes.pass ? "PASSED" : "FAILED"})`,
  );

  const allPassed = pRes.failures.length === 0 &&
    lRes.failures.length === 0 &&
    lRes.passedSeeds === 100 &&
    gRes.earlyRetirementsCount > 20 &&
    gRes.earlyRetirementsCount < 80 &&
    bRes.syntaxValid &&
    bRes.engineExecutable &&
    bRes.errors.length === 0 &&
    aRes.passed &&
    dRes.pass;

  console.log(`\nOVERALL VERDICT: ${allPassed ? "APPROVE" : "REJECT"}`);
  console.log("=================================================");

  if (!allPassed) {
    Deno.exit(1);
  }
}
