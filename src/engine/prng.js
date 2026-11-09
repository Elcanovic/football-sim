export function hashSeed(seed) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0 || 1;
}

export function createPRNG(seed) {
  return { seed, state: hashSeed(seed) };
}

export function nextRandom(rng) {
  let e = (typeof rng.state === "number" && rng.state !== 0) ? rng.state : hashSeed(String(rng.seed || 1));
  e ^= e << 13;
  e ^= e >>> 17;
  e ^= e << 5;
  const a = e >>> 0 || 1;
  return {
    rng: { seed: rng.seed, state: a },
    value: a / 4294967296,
  };
}

export function randomFloat(rng, min = 0, max = 1) {
  const { rng: nextRng, value } = nextRandom(rng);
  return { rng: nextRng, value: min + value * (max - min) };
}

export function randomInt(rng, min, max) {
  const { rng: nextRng, value } = randomFloat(rng, 0, 1);
  return { rng: nextRng, value: Math.floor(value * (max - min + 1)) + min };
}

export function checkProbability(rng, probability) {
  const clamped = Math.max(0, Math.min(1, probability));
  const { rng: nextRng, value } = randomFloat(rng, 0, 1);
  return { rng: nextRng, success: value < clamped };
}

export function pickRandom(rng, list) {
  if (list.length === 0) throw new Error("Cannot pick from an empty array.");
  const { rng: nextRng, value } = randomInt(rng, 0, list.length - 1);
  return { rng: nextRng, item: list[value] };
}

export function pickWeighted(rng, items) {
  const total = items.reduce((acc, cur) => acc + Math.max(0, cur.weight), 0);
  if (items.length === 0 || total <= 0) {
    throw new Error("Cannot pick from empty or zero-weight options.");
  }
  const { rng: nextRng, value } = randomFloat(rng, 0, total);
  let cumulative = 0;
  for (const entry of items) {
    cumulative += Math.max(0, entry.weight);
    if (value <= cumulative) {
      return { rng: nextRng, item: entry.item };
    }
  }
  return { rng: nextRng, item: items[items.length - 1].item };
}

// Box-Muller transform for normal distributions
export function randomGaussian(rng, mean = 0, stdDev = 1) {
  const r1 = nextRandom(rng);
  const r2 = nextRandom(r1.rng);
  const u1 = Math.max(Number.EPSILON, r1.value);
  const u2 = r2.value;
  const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return { rng: r2.rng, value: mean + z0 * stdDev };
}
