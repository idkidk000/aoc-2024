#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item.startsWith('-d') ? Number(item.slice(2) || '1') : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) => (item == '-i' ? 'input.txt' : item.startsWith('-e') ? `example${item.slice(2)}.txt` : acc),
  'example.txt'
);
const [PART1, PART2] = Deno.args.reduce(
  (acc, item) => (item == '-p0' ? [false, false] : item == '-p1' ? [true, false] : item == '-p2' ? [false, true] : acc),
  [true, true]
);

console.log({ FILENAME, DEBUG, PART1, PART2 });

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (DEBUG >= level) console.debug(...data);
};

const input = await Deno.readTextFile(FILENAME);

const parseInput = () => {
  const cards = input
    .replaceAll(' | ', ': ')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(/:\s+/);
      return {
        id: Number(parts[0].split(/\s+/)[1]),
        win: new Set(parts[1].split(/\s+/).map((token) => Number(token))),
        ours: new Set(parts[2].split(/\s+/).map((token) => Number(token))),
      };
    });
  return cards;
};

const part1 = () => {
  const cards = parseInput();
  const sum = cards.reduce((acc, card) => {
    const count = card.ours.intersection(card.win).size;
    const value = count ? 1 << (count - 1) : 0;
    debug(2, { card, count, value });
    return acc + value;
  }, 0);
  console.log('part 1:', sum);
};

const part2 = () => {
  const cards = parseInput();
  const multipliers: Map<number, number> = new Map(cards.map((card) => [card.id, 1]));
  debug(1, { multipliers });
  for (const card of cards) {
    const count = card.ours.intersection(card.win).size;
    const multiplier = multipliers.get(card.id)!;
    for (let cardId = card.id + 1; cardId < card.id + count + 1; ++cardId) {
      if (multipliers.has(cardId)) multipliers.set(cardId, multipliers.get(cardId)! + multiplier);
    }
  }
  debug(1, { multipliers });
  const sum = multipliers.values().reduce((acc, item) => acc + item, 0);
  console.log('part 2:', sum);
};

if (PART1) part1();
if (PART2) part2();
