// Zero-dependency, offline-ready assertion library for Football Sim test suite

export class AssertionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AssertionError";
  }
}

export function fail(msg?: string): never {
  throw new AssertionError(msg || "Failed assertion");
}

export function assert(expr: unknown, msg?: string): asserts expr {
  if (!expr) {
    throw new AssertionError(msg || "Assertion failed: expression is falsy");
  }
}

export function assertExists<T>(actual: T, msg?: string): asserts actual is NonNullable<T> {
  if (actual === null || actual === undefined) {
    throw new AssertionError(msg || `Expected value to exist, but got ${actual}`);
  }
}

export function assertStrictEquals(actual: unknown, expected: unknown, msg?: string): void {
  if (actual !== expected) {
    throw new AssertionError(
      msg || `Expected ${formatValue(actual)} to strictly equal (===) ${formatValue(expected)}`,
    );
  }
}

export function assertNotEquals(actual: unknown, expected: unknown, msg?: string): void {
  if (deepEqual(actual, expected)) {
    throw new AssertionError(
      msg || `Expected values to differ, but both were: ${formatValue(actual)}`,
    );
  }
}

export function assertEquals(actual: unknown, expected: unknown, msg?: string): void {
  if (!deepEqual(actual, expected)) {
    throw new AssertionError(
      msg || `Assertion equality failed:\nActual:   ${formatValue(actual)}\nExpected: ${formatValue(expected)}`,
    );
  }
}

export function assertAlmostEquals(actual: number, expected: number, tolerance = 1e-4, msg?: string): void {
  if (Math.abs(actual - expected) > tolerance) {
    throw new AssertionError(
      msg || `Expected ${actual} to be within ${tolerance} of ${expected} (diff: ${Math.abs(actual - expected)})`,
    );
  }
}

export function assertMatch(actual: string, regexp: RegExp, msg?: string): void {
  if (!regexp.test(actual)) {
    throw new AssertionError(
      msg || `Expected "${actual}" to match pattern ${regexp}`,
    );
  }
}

export function assertThrows<E = Error>(
  fn: () => unknown,
  errorClass?: new (...args: unknown[]) => E,
  msgIncludes?: string,
): unknown {
  let thrown = false;
  let errorCaught: unknown = null;
  try {
    fn();
  } catch (err) {
    thrown = true;
    errorCaught = err;
  }

  if (!thrown) {
    throw new AssertionError("Expected function to throw, but it returned normally");
  }

  if (errorClass && !(errorCaught instanceof errorClass)) {
    throw new AssertionError(
      `Expected error of type ${errorClass.name}, but caught ${
        (errorCaught as Error)?.constructor?.name || typeof errorCaught
      }`,
    );
  }

  if (msgIncludes && typeof (errorCaught as Error)?.message === "string") {
    if (!(errorCaught as Error).message.includes(msgIncludes)) {
      throw new AssertionError(
        `Expected error message to include "${msgIncludes}", but got "${(errorCaught as Error).message}"`,
      );
    }
  }

  return errorCaught;
}

export async function assertRejects(
  fn: () => Promise<unknown>,
  msgIncludes?: string,
): Promise<unknown> {
  let thrown = false;
  let errorCaught: unknown = null;
  try {
    await fn();
  } catch (err) {
    thrown = true;
    errorCaught = err;
  }

  if (!thrown) {
    throw new AssertionError("Expected async function to reject, but it resolved normally");
  }

  if (msgIncludes && errorCaught instanceof Error) {
    if (!errorCaught.message.includes(msgIncludes)) {
      throw new AssertionError(
        `Expected rejected error message to include "${msgIncludes}", but got "${errorCaught.message}"`,
      );
    }
  }

  return errorCaught;
}

function formatValue(v: unknown): string {
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean" || v === null || v === undefined) {
    return String(v);
  }
  try {
    return JSON.stringify(v, null, 2);
  } catch {
    return String(v);
  }
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") {
    return false;
  }
  if (Array.isArray(a) !== Array.isArray(b)) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i])) return false;
    }
    return true;
  }

  const objA = a as Record<string, unknown>;
  const objB = b as Record<string, unknown>;
  const keysA = Object.keys(objA);
  const keysB = Object.keys(objB);

  if (keysA.length !== keysB.length) return false;
  for (const key of keysA) {
    if (!Object.prototype.hasOwnProperty.call(objB, key)) return false;
    if (!deepEqual(objA[key], objB[key])) return false;
  }
  return true;
}
