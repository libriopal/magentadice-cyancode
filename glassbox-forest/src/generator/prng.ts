// Deterministic seeded PRNG (mulberry32 over a hashed string seed). NEVER Math.random — every
// generated branch must be reproducible from its seed (governance: seeded PRNG only; branches
// reproducible from seed). This is used ONLY for generating the search structure over the design
// space; it is NOT a fairness RNG (that is the ported CSPRNG in L2, stage 2).

function xmur3(str: string): () => number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return function () {
    h = Math.imul(h ^ (h >>> 16), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  };
}

export class SeededRng {
  private state: number;
  readonly seed: string;

  constructor(seed: string) {
    this.seed = seed;
    this.state = xmur3(seed)();
  }

  /** Next float in [0,1). Deterministic for a given seed + call order. */
  next(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /** Integer in [min, max]. */
  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /** Uniform pick from a non-empty array. */
  pick<T>(arr: readonly T[]): T {
    if (arr.length === 0) throw new Error('SeededRng.pick on empty array');
    return arr[this.int(0, arr.length - 1)]!;
  }
}
