#!/usr/bin/env -S deno run --allow-read --allow-write
// Football Sim E2E Test Suite Runner
// Supports individual tier execution, regex filtering, summary reporting, and exit codes.

import { FeatureUnimplementedError, getRegisteredTests, type TestCase, type TestTier } from "./helpers.ts";

// Import all test suites across all 4 tiers to populate registry
import "./tier1_features/m1_determinism_perf_test.ts";
import "./tier1_features/m2_loans_test.ts";
import "./tier1_features/m2_contracts_hotseat_test.ts";
import "./tier1_features/m2_agents_test.ts";
import "./tier1_features/m3_tactics_roles_test.ts";
import "./tier1_features/m3_manager_cliques_test.ts";
import "./tier1_features/m4_fatigue_congestion_test.ts";
import "./tier1_features/m4_medical_recovery_test.ts";
import "./tier1_features/m5_ui_svg_assets_test.ts";
import "./tier1_features/m5_retirement_museum_test.ts";
import "./tier1_features/m5_bundler_integrity_test.ts";
import "./tier1_features/m6_celebration_slate_test.ts";

import "./tier2_boundaries/loans_boundaries_test.ts";
import "./tier2_boundaries/hotseat_boundaries_test.ts";
import "./tier2_boundaries/tactics_boundaries_test.ts";
import "./tier2_boundaries/medical_boundaries_test.ts";
import "./tier2_boundaries/svg_boundaries_test.ts";
import "./tier2_boundaries/determinism_boundaries_test.ts";
import "./tier2_boundaries/dom_bundler_boundaries_test.ts";

import "./tier3_interactions/tactics_congestion_cortisone_test.ts";
import "./tier3_interactions/loan_trigger_sacking_test.ts";
import "./tier3_interactions/wage_clique_hotseat_test.ts";
import "./tier3_interactions/superagent_disciplinarian_test.ts";
import "./tier3_interactions/mentor_youth_development_test.ts";

import "./tier4_workloads/multi_decade_career_test.ts";
import "./tier4_workloads/trophy_stats_accumulation_test.ts";
import "./tier4_workloads/journeyman_multi_club_test.ts";

// ANSI Color Helpers
const RESET = "\x1b[0m";
const BOLD = "\x1b[1m";
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const CYAN = "\x1b[36m";
const GRAY = "\x1b[90m";

function safeLog(...args: unknown[]): void {
  try {
    console.log(...args);
  } catch {
    try {
      const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ") + "\n";
      Deno.stdout.writeSync(new TextEncoder().encode(line));
    } catch {
      // ignore
    }
  }
}

interface TestResult {
  test: TestCase;
  status: "pass" | "fail" | "unimplemented";
  durationMs: number;
  error?: Error;
}

interface RunnerOptions {
  tier?: TestTier | "all";
  filter?: string;
  bail?: boolean;
  verbose?: boolean;
  strict?: boolean;
  json?: boolean;
}

function parseCliArgs(args: string[]): RunnerOptions {
  const options: RunnerOptions = {
    tier: "all",
    bail: false,
    verbose: false,
    strict: false,
    json: false,
  };

  for (const arg of args) {
    if (arg === "--help" || arg === "-h") {
      printHelp();
      Deno.exit(0);
    }
    if (arg.startsWith("--tier=")) {
      const val = arg.split("=")[1].toLowerCase();
      if (val === "all") options.tier = "all";
      else {
        const num = parseInt(val, 10);
        if ([1, 2, 3, 4].includes(num)) {
          options.tier = num as TestTier;
        } else {
          console.error(`Invalid tier '${val}'. Must be 1, 2, 3, 4, or all.`);
          Deno.exit(2);
        }
      }
    } else if (arg.startsWith("--filter=")) {
      options.filter = arg.slice("--filter=".length);
    } else if (arg === "--bail") {
      options.bail = true;
    } else if (arg === "--verbose") {
      options.verbose = true;
    } else if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--json") {
      options.json = true;
    }
  }

  return options;
}

function printHelp() {
  safeLog(`
${BOLD}Football Sim E2E Test Suite Runner${RESET}

Usage:
  deno run --allow-read --allow-write tests/runner.ts [OPTIONS]

Options:
  --tier=1|2|3|4|all     Run only tests belonging to the specified tier (default: all)
  --filter=<pattern>     Filter test ID or name by substring or regex
  --bail                 Stop execution immediately on first test failure
  --strict               Treat unimplemented feature signals as fatal failures (exit code 1)
  --verbose              Print detailed diagnostic logs during execution
  --json                 Output results as formatted JSON
  --help, -h             Show this help screen
`);
}

async function run() {
  const options = parseCliArgs(Deno.args);
  const allTests = getRegisteredTests();

  // Filter tests
  const filteredTests = allTests.filter((t) => {
    if (options.tier && options.tier !== "all" && t.tier !== options.tier) {
      return false;
    }
    if (options.filter) {
      const reg = new RegExp(options.filter, "i");
      const matchId = t.id ? reg.test(t.id) : false;
      const matchName = reg.test(t.name);
      if (!matchId && !matchName) return false;
    }
    return true;
  });

  if (!options.json) {
    safeLog(`\n${BOLD}${CYAN}=================================================================${RESET}`);
    safeLog(`${BOLD}${CYAN}          FOOTBALL SIM E2E TEST SUITE RUNNER                     ${RESET}`);
    safeLog(`${BOLD}${CYAN}=================================================================${RESET}`);
    safeLog(
      `${GRAY}Target Scope: Tier=${options.tier} | Filter=${
        options.filter || "none"
      } | Total Discovered=${filteredTests.length}${RESET}\n`,
    );
  }

  const results: TestResult[] = [];
  const overallStart = performance.now();

  for (let i = 0; i < filteredTests.length; i++) {
    const testCase = filteredTests[i];
    const testLabel = `[Tier ${testCase.tier}] ${testCase.id ? `[${testCase.id}] ` : ""}${testCase.name}`;

    const start = performance.now();
    let status: "pass" | "fail" | "unimplemented" = "pass";
    let error: Error | undefined = undefined;

    try {
      await testCase.fn();
    } catch (err: unknown) {
      const errObj = err instanceof Error ? err : new Error(String(err));
      if (
        err instanceof FeatureUnimplementedError ||
        errObj.name === "FeatureUnimplementedError" ||
        errObj.message.includes("[UNIMPLEMENTED FEATURE")
      ) {
        status = "unimplemented";
        error = errObj;
      } else {
        status = "fail";
        error = errObj;
      }
    }
    const durationMs = performance.now() - start;

    results.push({ test: testCase, status, durationMs, error });

    if (!options.json) {
      if (status === "pass") {
        safeLog(`  ${GREEN}✓ PASS${RESET}  ${testLabel} ${GRAY}(${durationMs.toFixed(1)}ms)${RESET}`);
      } else if (status === "unimplemented") {
        safeLog(`  ${YELLOW}○ PEND${RESET}  ${testLabel} ${GRAY}→ ${error?.message}${RESET}`);
      } else {
        safeLog(`  ${RED}✗ FAIL${RESET}  ${testLabel} ${GRAY}(${durationMs.toFixed(1)}ms)${RESET}`);
        safeLog(`        ${RED}${error?.message}${RESET}`);
        if (options.verbose && error?.stack) {
          safeLog(`        ${GRAY}${error.stack.split("\n").slice(1, 4).join("\n        ")}${RESET}`);
        }
      }
    }

    if (options.bail && status === "fail") {
      if (!options.json) {
        safeLog(`\n${RED}${BOLD}[BAIL] Execution halted due to test failure.${RESET}`);
      }
      break;
    }
  }

  const overallDurationMs = performance.now() - overallStart;

  // Aggregate stats
  const passedCount = results.filter((r) => r.status === "pass").length;
  const failedCount = results.filter((r) => r.status === "fail").length;
  const unimplementedCount = results.filter((r) => r.status === "unimplemented").length;
  const totalCount = results.length;

  if (options.json) {
    const jsonOutput = {
      summary: {
        total: totalCount,
        passed: passedCount,
        failed: failedCount,
        unimplemented: unimplementedCount,
        durationMs: overallDurationMs,
      },
      results: results.map((r) => ({
        tier: r.test.tier,
        id: r.test.id,
        name: r.test.name,
        status: r.status,
        durationMs: r.durationMs,
        error: r.error ? r.error.message : null,
      })),
    };
    safeLog(JSON.stringify(jsonOutput, null, 2));
  } else {
    // Print summary report
    safeLog(`\n${BOLD}-----------------------------------------------------------------${RESET}`);
    safeLog(`${BOLD}TEST RUN SUMMARY REPORT${RESET}`);
    safeLog(`${BOLD}-----------------------------------------------------------------${RESET}`);

    // Tier Breakdown Table
    safeLog(`${BOLD}Tier Breakdown:${RESET}`);
    for (const t of [1, 2, 3, 4] as TestTier[]) {
      const tierResults = results.filter((r) => r.test.tier === t);
      if (tierResults.length === 0) continue;
      const tPass = tierResults.filter((r) => r.status === "pass").length;
      const tFail = tierResults.filter((r) => r.status === "fail").length;
      const tUnimp = tierResults.filter((r) => r.status === "unimplemented").length;
      safeLog(
        `  ${BOLD}Tier ${t}:${RESET} ${GREEN}${tPass} Passed${RESET} | ${RED}${tFail} Failed${RESET} | ${YELLOW}${tUnimp} Pending / Unimplemented${RESET} (Total: ${tierResults.length})`,
      );
    }

    safeLog(`\n${BOLD}Total Results:${RESET}`);
    safeLog(`  Tests Executed: ${BOLD}${totalCount}${RESET}`);
    safeLog(`  Passing:        ${GREEN}${BOLD}${passedCount}${RESET}`);
    safeLog(`  Pending Unimpl: ${YELLOW}${BOLD}${unimplementedCount}${RESET}`);
    safeLog(`  Hard Failures:  ${failedCount > 0 ? RED : GRAY}${BOLD}${failedCount}${RESET}`);
    safeLog(`  Total Time:     ${CYAN}${overallDurationMs.toFixed(2)} ms${RESET}`);
    safeLog(`${BOLD}=================================================================${RESET}\n`);
  }

  // Determine exit code
  // Hard failures always exit 1
  if (failedCount > 0) {
    Deno.exit(1);
  }

  // In strict mode, unimplemented features also exit 1
  if (options.strict && unimplementedCount > 0) {
    Deno.exit(1);
  }

  // Otherwise clean exit
  Deno.exit(0);
}

if (import.meta.main) {
  await run();
}
