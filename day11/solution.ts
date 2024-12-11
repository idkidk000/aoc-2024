#!/usr/bin/env -S deno --allow-read

const DEBUG = false;
const EXAMPLE = false;
const ITERATIONS = 75;

const text = await Deno.readTextFile(EXAMPLE ? 'example.txt' : 'input.txt');
if (DEBUG) console.debug({ text });

class NumberCounter {
  constructor() {}
  private counts: Record<string, number> = {};
  add(value: number | string, count: number) {
    const valueString = typeof value === 'string' ? value : String(value);
    if (DEBUG) console.debug({ value, valueString, count });
    this.counts[valueString] = (this.counts[valueString] ?? 0) + count;
  }
  totalCount() {
    return Object.values(this.counts).reduce((acc, count) => acc + count, 0);
  }
  entries() {
    return Object.entries(this.counts);
  }
}

let counts = new NumberCounter();
text.split(/\s+/).forEach((value) => counts.add(value, 1));
if (DEBUG) console.debug({ counts });

for (let iteration = 0; iteration < ITERATIONS; iteration++) {
  const newCounts = new NumberCounter();
  for (const [valueStr, count] of counts.entries()) {
    if (valueStr === '0') {
      newCounts.add('1', count);
    } else if (valueStr.length % 2 == 0) {
      newCounts.add(valueStr.slice(0, valueStr.length / 2), count);
      newCounts.add(parseInt(valueStr.slice(valueStr.length / 2)), count);
    } else {
      newCounts.add(parseInt(valueStr) * 2024, count);
    }
  }
  const totalCount = newCounts.totalCount();
  if (DEBUG) {
    console.debug({ iteration, counts, newCounts, totalCount });
  } else {
    console.log({ iteration, totalCount });
  }
  counts = newCounts;
}
