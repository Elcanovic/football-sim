// Test registration, dynamic module resolution, and simulation test fixtures

export type TestTier = 1 | 2 | 3 | 4;

export interface TestCase {
  tier: TestTier;
  id?: string;
  name: string;
  category?: string;
  fn: () => void | Promise<void>;
}

export class FeatureUnimplementedError extends Error {
  public featureId?: string;
  constructor(featureIdOrMsg: string, details?: string) {
    const msg = details
      ? `[UNIMPLEMENTED FEATURE: ${featureIdOrMsg}] ${details}`
      : `[UNIMPLEMENTED FEATURE] ${featureIdOrMsg}`;
    super(msg);
    this.name = "FeatureUnimplementedError";
    this.featureId = details ? featureIdOrMsg : undefined;
  }
}

// Global registry of all test cases
const globalTestRegistry: TestCase[] = [];

export function registerTest(testCase: TestCase): void {
  globalTestRegistry.push(testCase);

  // Register with native Deno.test if running under `deno test`
  if (typeof Deno !== "undefined" && typeof Deno.test === "function") {
    const testTitle = `[Tier ${testCase.tier}] ${testCase.id ? `[${testCase.id}] ` : ""}${testCase.name}`;
    Deno.test({
      name: testTitle,
      fn: async () => {
        try {
          await testCase.fn();
        } catch (err) {
          if (err instanceof FeatureUnimplementedError) {
            console.warn(`\n  ⚠️  Notice: ${err.message}`);
          }
          throw err;
        }
      },
      sanitizeOps: false,
      sanitizeResources: false,
      sanitizeExit: false,
    });
  }
}

export function test(
  tier: TestTier,
  id: string,
  name: string,
  fn: () => void | Promise<void>,
): void {
  registerTest({ tier, id, name, fn });
}

export function getRegisteredTests(): TestCase[] {
  return globalTestRegistry;
}

/**
 * Safely dynamic-imports an engine module. If the file does not exist,
 * throws a FeatureUnimplementedError indicating the missing contract.
 */
// deno-lint-ignore no-explicit-any
export async function loadEngineModule<T = any>(
  modulePath: string,
  featureId?: string,
): Promise<T> {
  // Test files address engine modules as "../../src/engine/X.ts" (relative to
  // tests/tierN/), but this import() executes from tests/helpers.ts, one level
  // shallower. Normalize so both spellings resolve to the same module.
  const resolved = modulePath.replace(/^\.\.\/\.\.\/src\//, "../src/");
  try {
    const mod = await import(resolved);
    return mod as T;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    // Only a genuinely missing module counts as "unimplemented". A TypeError
    // thrown from inside an existing module is a real bug and must surface.
    if (
      errorMsg.includes("Module not found") ||
      errorMsg.includes("Cannot find module")
    ) {
      throw new FeatureUnimplementedError(
        featureId || modulePath,
        `Module at '${modulePath}' is not yet implemented in codebase.`,
      );
    }
    throw err;
  }
}

/**
 * Measures execution time in milliseconds for synchronous or asynchronous actions
 */
export async function measureExecutionTimeMs(
  fn: () => void | Promise<void>,
): Promise<number> {
  const start = performance.now();
  await fn();
  return performance.now() - start;
}

export interface MockPlayer extends Record<string, unknown> {
  id: string;
  lastName: string;
  preferredNumber: number;
  preferredFoot: string;
  position: string;
  roleCategory: string;
  developmentProfile: string;
  age: number;
  overall: number;
  attributes: Record<string, number>;
  marketValue: number;
  morale: number;
  form: number;
  managerTrust: number;
  careerTotals: Record<string, number>;
}

/**
 * Helper to construct a realistic Mock Player for state evaluations
 */
export function createMockPlayer(overrides: Record<string, unknown> = {}): MockPlayer {
  return {
    id: "test-player-1",
    lastName: "Valente",
    preferredNumber: 10,
    preferredFoot: "right",
    nationality: {
      name_en: "Argentina",
      fifa_code: "ARG",
      iso_alpha2: "AR",
      confederation: "CONMEBOL",
    },
    position: "ST",
    roleCategory: "attacker",
    developmentProfile: "normal",
    age: 20,
    overall: 70,
    attributes: {
      pace: 75,
      shooting: 72,
      passing: 68,
      dribbling: 74,
      defending: 40,
      physical: 65,
      diving: 10,
      handling: 10,
      kicking: 10,
      reflexes: 10,
      positioning: 70,
    },
    marketValue: 2_500_000,
    contract: {
      clubId: "team-arg-boca",
      yearsRemaining: 3,
      weeklyWage: 12_000,
      annualSalary: 624_000,
      releaseClause: 15_000_000,
      squadRole: "crucial",
      goalBonus: 500,
      cleanSheetBonus: 0,
    },
    currentTeamId: "team-arg-boca",
    morale: 80,
    form: 65,
    managerTrust: 75,
    careerTotals: {
      appearances: 45,
      goals: 28,
      assists: 10,
      cleanSheets: 0,
      goalsConceded: 0,
      trophies: 1,
      awards: 1,
      totalWagesEarned: 750_000,
      totalTransferFeesGenerated: 0,
      averageMatchRating: 7.2,
    },
    activeInjury: null,
    injuryHistory: [],
    lifestyleChoices: [],
    socialMedia: {
      instagram: {
        platform: "instagram",
        name: "Instagram",
        icon: "📸",
        color: "#E1306C",
        active: true,
        handle: "@valente.10",
        followers: 15000,
        verified: false,
        totalPosts: 12,
      },
      tiktok: {
        platform: "tiktok",
        name: "TikTok",
        icon: "🎵",
        color: "#000000",
        active: true,
        handle: "@valente.10",
        followers: 5000,
        verified: false,
        totalPosts: 5,
      },
      x: {
        platform: "x",
        name: "X",
        icon: "𝕏",
        color: "#000000",
        active: false,
        handle: "",
        followers: 0,
        verified: false,
        totalPosts: 0,
      },
      totalFollowers: 20000,
    },
    captaincyStatus: "none",
    ...overrides,
  };
}

export interface MockTeam extends Record<string, unknown> {
  id: string;
  name: string;
  short_name: string;
  abbreviation: string;
  city: string;
  stadium: string;
  capacity: number;
  international_reputation: number;
  domestic_prestige: number;
  starting_transfer_budget_eur: number;
  wage_budget_weekly_eur: number;
  primary_color: string;
  secondary_color: string;
}

/**
 * Helper to construct a realistic Mock Team
 */
export function createMockTeam(overrides: Record<string, unknown> = {}): MockTeam {
  return {
    id: "team-arg-boca",
    name: "Boca Juniors",
    short_name: "Boca",
    abbreviation: "BOC",
    city: "Buenos Aires",
    stadium: "La Bombonera",
    capacity: 54000,
    international_reputation: 75,
    domestic_prestige: 90,
    starting_transfer_budget_eur: 15_000_000,
    wage_budget_weekly_eur: 250_000,
    primary_color: "#003399",
    secondary_color: "#FFCC00",
    ...overrides,
  };
}

/**
 * Source of the web UI as one string: the entry point src/web/app.js plus every module in
 * src/web/ui/. Tests that scan the UI for DOM bindings read this instead of app.js alone.
 */
export async function readWebUiSource(): Promise<string> {
  const parts = [await Deno.readTextFile("src/web/app.js")];
  const names: string[] = [];
  for await (const entry of Deno.readDir("src/web/ui")) {
    if (entry.isFile && entry.name.endsWith(".js")) names.push(entry.name);
  }
  for (const name of names.sort()) parts.push(await Deno.readTextFile(`src/web/ui/${name}`));
  return parts.join("\n");
}
