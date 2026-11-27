// A tiny seeded random number generator (mulberry32). The game uses it for
// spawning so a screenshot can be staged with a fixed seed and look the same
// every time, and so a run can be replayed exactly from its seed.

export function makeRandom(seed) {
  let a = seed >>> 0;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one item from a list, weighted by the numbers beside each item. */
export function pickWeighted(random, entries) {
  let total = 0;
  for (const [, weight] of entries) total += weight;
  let roll = random() * total;
  for (const [value, weight] of entries) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return entries[entries.length - 1][0];
}
