#!/usr/bin/env -S deno --allow-read

const DEBUG = false;
const EXAMPLE = false;

const text = await Deno.readTextFile(EXAMPLE ? 'example.txt' : 'input.txt');
if (DEBUG) console.debug({ text });

let counts: Record<string, number> = {};
text.split(/\s+/).forEach((value) => {
  const prevCount = counts[value] ?? 0;
  counts[value] = prevCount + 1;
});
if (DEBUG) console.debug({ counts });

for (let iteration = 0; iteration < 75; iteration++) {
  const newCounts: Record<string, number> = {};
  for (const [valueStr, count] of Object.entries(counts)) {
    if (valueStr === '0') {
      const newValueStr = '1';
      const prevCount = newCounts[newValueStr] ?? 0;
      newCounts[newValueStr] = prevCount + count;
      if (DEBUG) console.debug('zero', { valueStr, newValueStr, prevCount, count });
    } else if (valueStr.length % 2 == 0) {
      for (const newValueStr of [valueStr.slice(0, valueStr.length / 2), String(parseInt(valueStr.slice(valueStr.length / 2)))]) {
        const prevCount = newCounts[newValueStr] ?? 0;
        newCounts[newValueStr] = prevCount + count;
        if (DEBUG) console.debug('split', { valueStr, newValueStr, prevCount, count });
      }
    } else {
      const newValueStr = String(parseInt(valueStr) * 2024);
      const prevCount = newCounts[newValueStr] ?? 0;
      newCounts[newValueStr] = prevCount + count;
      if (DEBUG) console.debug('mult', { valueStr, newValueStr, prevCount, count });
    }
  }
  const totalCount = Object.values(newCounts).reduce((acc, count) => acc + count, 0);
  if (DEBUG) {
    console.debug({ iteration, counts, newCounts, totalCount });
  } else {
    console.log({ iteration, totalCount });
  }
  counts = newCounts;
}
