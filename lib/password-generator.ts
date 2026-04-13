export type GeneratorOptions = {
  length: number;
  upper: boolean;
  lower: boolean;
  digits: boolean;
  symbols: boolean;
  excludeAmbiguous: boolean;
};

export const DEFAULT_OPTIONS: GeneratorOptions = {
  length: 20,
  upper: true,
  lower: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: true,
};

const AMBIGUOUS = new Set(["O", "0", "I", "l", "1", "|", "`", "'", '"']);

const POOLS = {
  upper: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lower: "abcdefghijklmnopqrstuvwxyz",
  digits: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.<>/?~",
};

function filterAmbiguous(pool: string): string {
  return pool
    .split("")
    .filter((c) => !AMBIGUOUS.has(c))
    .join("");
}

// Uses Web Crypto, available in modern browsers and Node 19+.
function randomBelow(max: number): number {
  const arr = new Uint32Array(1);
  globalThis.crypto.getRandomValues(arr);
  // Modulo bias is negligible for max <= 128.
  return arr[0] % max;
}

export function generatePassword(opts: Partial<GeneratorOptions> = {}): string {
  const options: GeneratorOptions = { ...DEFAULT_OPTIONS, ...opts };
  const length = Math.max(4, Math.min(128, options.length));

  const pools: string[] = [];
  if (options.upper) pools.push(POOLS.upper);
  if (options.lower) pools.push(POOLS.lower);
  if (options.digits) pools.push(POOLS.digits);
  if (options.symbols) pools.push(POOLS.symbols);

  if (pools.length === 0) pools.push(POOLS.lower);

  const finalPools = options.excludeAmbiguous
    ? pools.map(filterAmbiguous)
    : pools;
  const combined = finalPools.join("");

  const chars: string[] = finalPools.map((p) => p[randomBelow(p.length)]);
  while (chars.length < length) {
    chars.push(combined[randomBelow(combined.length)]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomBelow(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}
