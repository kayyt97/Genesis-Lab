/** Seeded pseudo-random for reproducible simulation variability */

export function seededRandom(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRange(seed: number, min: number, max: number, index = 0): number {
  const rng = seededRandom(seed + index * 997);
  return min + rng() * (max - min);
}

export function generateSeed(): number {
  // Prefer the browser's cryptographic random source when available.
  // Keep the fallback for older or restricted browser environments.
  try {
    const values = new Uint32Array(1);
    globalThis.crypto.getRandomValues(values);
    return (values[0] % 2147483647) + 1;
  } catch {
    return Math.floor(Math.random() * 2147483647) + 1;
  }
}
