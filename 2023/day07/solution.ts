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

class HashedMap<K, V, H> {
  private map = new Map<H, V>();
  private hashFn: (key: K) => H;
  constructor(hashFn: (key: K) => H, iterable?: Iterable<readonly [K, V]>) {
    this.hashFn = hashFn;
    if (iterable) {
      for (const [k, v] of iterable) {
        this.map.set(this.hashFn(k), v);
      }
    }
  }
  set(key: K, value: V): void {
    this.map.set(this.hashFn(key), value);
  }
  get(key: K): V | undefined {
    return this.map.get(this.hashFn(key));
  }
  has(key: K): boolean {
    return this.map.has(this.hashFn(key));
  }
  values(): MapIterator<V> {
    return this.map.values();
  }
  // keys() and entries() are problems i'll deal with another day :)
}

const input = await Deno.readTextFile(FILENAME);

const parseInput = () => {
  const hands = input
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const tokens = line.split(/\s+/);
      return {
        cards: tokens[0].split(''),
        bid: Number(tokens[1]),
      };
    });
  return hands;
};

const part1 = () => {
  const cardStrengths = new Map([
    ['A', 14],
    ['K', 13],
    ['Q', 12],
    ['J', 11],
    ['T', 10],
  ]);
  const handTypes = new HashedMap(
    (key) => key.join(''),
    [
      [[5], 6],
      [[4, 1], 5],
      [[3, 2], 4],
      [[3, 1, 1], 3],
      [[2, 2, 1], 2],
      [[2, 1, 1, 1], 1],
      [[1, 1, 1, 1, 1], 0],
    ]
  );
  const hands = parseInput()
    .map((hand) => {
      const cardCounts = hand.cards.reduce((acc, card) => {
        acc.set(card, (acc.get(card) ?? 0) + 1);
        return acc;
      }, new Map() as Map<string, number>);
      const counts = cardCounts
        .values()
        .toArray()
        .toSorted((a, b) => b - a);
      const handType = handTypes.get(counts)!;
      const cardValues = hand.cards.map((card) => cardStrengths.get(card) ?? Number(card));
      // bitshift card values into a single number to simplify sorting
      const cardValue = cardValues.reduce((acc, val, i) => acc + (val << ((4 - i) * 4)), 0);
      return {
        cards: hand.cards,
        bid: hand.bid,
        cardCounts,
        counts,
        handType,
        cardValues,
        cardValue,
      };
    })
    .toSorted((a, b) => a.handType - b.handType || a.cardValue - b.cardValue);
  debug(1, { hands });
  // this is exactly how gambling works and normalising it is good actually :|
  const winnings = hands.reduce((acc, hand, i) => acc + hand.bid * (i + 1), 0);
  console.log('part 1:', winnings);
};

const part2 = () => {
  const cardStrengths = new Map([
    ['A', 14],
    ['K', 13],
    ['Q', 12],
    ['T', 11],
    ['J', 1],
  ]);
  const handTypes = new HashedMap(
    (key) => key.join(''),
    [
      [[5], 6],
      [[4, 1], 5],
      [[3, 2], 4],
      [[3, 1, 1], 3],
      [[2, 2, 1], 2],
      [[2, 1, 1, 1], 1],
      [[1, 1, 1, 1, 1], 0],
    ]
  );
  const hands = parseInput()
    .map((hand) => {
      const cardCounts = hand.cards.reduce((acc, card) => {
        acc.set(card, (acc.get(card) ?? 0) + 1);
        return acc;
      }, new Map() as Map<string, number>);
      if (cardCounts.has('J')) {
        debug(1, { cardCounts });
        // remap J entries to whatever card has the highest count
        const jCount = cardCounts.get('J')!;
        cardCounts.delete('J');
        const [highestCard, highestCount] = cardCounts
          .entries()
          .toArray()
          .toSorted((a, b) => b[1] - a[1])
          .shift() ?? ['A', 0];
        cardCounts.set(highestCard, highestCount + jCount);
      }
      const counts = cardCounts
        .values()
        .toArray()
        .toSorted((a, b) => b - a);
      const handType = handTypes.get(counts)!;
      const cardValues = hand.cards.map((card) => cardStrengths.get(card) ?? Number(card));
      const cardValue = cardValues.reduce((acc, val, i) => acc + (val << ((4 - i) * 4)), 0);
      return {
        cards: hand.cards,
        bid: hand.bid,
        cardCounts,
        counts,
        handType,
        cardValues,
        cardValue,
      };
    })
    .toSorted((a, b) => a.handType - b.handType || a.cardValue - b.cardValue);
  debug(1, { hands });
  const winnings = hands.reduce((acc, hand, i) => acc + hand.bid * (i + 1), 0);
  console.log('part 2:', winnings);
};

if (PART1) part1();
if (PART2) part2();
