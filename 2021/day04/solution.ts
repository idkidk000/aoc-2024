#!/usr/bin/env -S deno --allow-read
// #region base aoc template
class Args {
  constructor(public filename = 'input.txt', public debug = 0, public part1 = true, public part2 = true) {
    for (const arg of Deno.args) {
      const [key, value] = [arg.slice(0, 2), (fallback = 0) => Number(arg.slice(2) || fallback)];
      if (key === '-d') debug = value(1);
      else if (key === '-e') filename = `example${arg.slice(2)}.txt`;
      else if (key === '-i') filename = 'input.txt';
      else if (key === '-p') [part1, part2] = [(value(0) & 1) === 1, (value(0) & 2) === 2];
      else throw new Error(`unrecognised arg="${arg}"`);
    }
    [this.filename, this.debug, this.part1, this.part2] = [filename, debug, part1, part2];
    console.log(`args: {filename: "${filename}", debug: ${debug}, part1: ${part1}, part2: ${part2} }`);
  }
}

// deno-lint-ignore no-explicit-any
function debug(level: number, ...data: Array<any>): void {
  if (args.debug >= level)
    console.debug(
      ...data.map((item) =>
        item && typeof item === 'object' && Symbol.iterator in item && !('length' in item || 'size' in item)
          ? Array.from(item)
          : item
      )
    );
}

const args = new Args();
// #endregion

interface BoardItem {
  r: number;
  c: number;
  drawn: boolean;
}
interface Board {
  items: Map<number, BoardItem>;
  won: boolean;
}
interface Input {
  drawnNumbers: Array<number>;
  boards: Array<Board>;
}

const parseInput = (): Input => {
  const sections = Deno.readTextFileSync(args.filename).split('\n\n');
  const drawnNumbers = sections[0]
    .matchAll(/\d+/g)
    .map((token) => Number(token))
    .toArray();
  const boards = new Array<Board>();
  for (const section of sections.slice(1)) {
    const items = new Map<number, BoardItem>();
    for (const [r, row] of section
      .split('\n')
      .filter((line) => line.trim())
      .entries())
      row.matchAll(/\d+/g).forEach((token, c) => items.set(Number(token), { r, c, drawn: false }));
    boards.push({ items, won: false });
  }
  debug(3, { drawnNumbers, boards });
  return { drawnNumbers, boards };
};

const simulate = ({ drawnNumbers, boards }: Input, first: boolean = true) => {
  for (const drawnNumber of drawnNumbers) {
    for (const board of boards.filter((item) => !item.won)) {
      if (board.items.has(drawnNumber)) {
        const entry = board.items.get(drawnNumber)!;
        board.items.set(drawnNumber, { ...entry, drawn: true });
        if (
          board.items
            .values()
            .filter((value) => value.r === entry.r && value.drawn === true)
            .toArray().length === 5 ||
          board.items
            .values()
            .filter((value) => value.c === entry.c && value.drawn === true)
            .toArray().length === 5
        ) {
          if (first || boards.filter((item) => !item.won).length === 1) {
            const score = board.items
              .entries()
              .filter(([_, v]) => v.drawn === false)
              .reduce((acc, [k, _]) => acc + k, 0);
            const finalScore = score * drawnNumber;
            debug(1, 'win', { drawnNumber, score, finalScore });
            return finalScore;
          }
          board.won = true;
        }
      }
    }
  }
  throw new Error('🤡');
};

const part1 = () => {
  const result = simulate(parseInput());
  console.log('part 1:', result);
};

const part2 = () => {
  const result = simulate(parseInput(), false);
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
