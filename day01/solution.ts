const DEBUG = false;

const data = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(data);
const lists = data
  .split('\n')
  .filter((line) => line.trim() != '')
  .reduce<{ left: number[]; right: number[] }>(
    (acc, line) => {
      const [leftValue, rightValue] = line.split(/\s+/).map((i) => Number(i));
      if (DEBUG) console.debug({ leftValue, rightValue });
      acc.left.push(leftValue);
      acc.right.push(rightValue);
      return acc;
    },
    { left: [], right: [] }
  );
if (DEBUG) console.debug(lists);

lists.left.sort();
lists.right.sort();

const diffs = Array.from(lists.left, (val, i) => Math.abs(val - lists.right[i]));
if (DEBUG) console.debug(diffs);
const total = diffs.reduce((acc, item) => {
  if (DEBUG) console.debug({ acc, item });
  return acc + item;
}, 0);
console.log(`part 1 ${total}`);

const counts = lists.right.reduce<Record<number, number>>((acc, item) => {
  const prev = acc[item];
  acc[item] = prev ? prev + 1 : 1;
  return acc;
}, {});
if (DEBUG) console.debug(counts);
const similarity_total = lists.left.reduce((acc, item) => {
  acc += item * (counts[item] ?? 0);
  return acc;
}, 0);
console.log(`part 2 ${similarity_total}`);
