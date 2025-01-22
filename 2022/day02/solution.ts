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
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
// #endregion

const itemMap = new Map<string, { score: number; wins: string; loses: string }>([
  ['Rock', { score: 1, wins: 'Scissors', loses: 'Paper' }],
  ['Paper', { score: 2, wins: 'Rock', loses: 'Scissors' }],
  ['Scissors', { score: 3, wins: 'Paper', loses: 'Rock' }],
]);
const inputMap = new Map<string, string>([
  ['A', 'Rock'],
  ['B', 'Paper'],
  ['C', 'Scissors'],
  ['X', 'Rock'],
  ['Y', 'Paper'],
  ['Z', 'Scissors'],
]);

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(/\s+/))
    .map((tokens) => ({
      tokens,
      opponent: inputMap.get(tokens[0])!,
      you: inputMap.get(tokens[1])!,
    }));

const part1 = () => {
  const games = parseInput()
    .map((item) => ({
      ...item,
      win: itemMap.get(item.opponent)!.loses === item.you,
      opponentScore: itemMap.get(item.opponent)!.score,
      youScore: itemMap.get(item.you)!.score,
    }))
    .map((item) => ({
      ...item,
      score: item.youScore + (item.win ? 6 : item.opponent === item.you ? 3 : 0),
    }));
  debug(1, games);
  const total = games.reduce((acc, item) => acc + item.score, 0);
  console.log('part 1:', total);
};

const part2 = () => {
  const games = parseInput()
    .map(({ tokens, opponent }) => ({
      tokens,
      opponent,
      you: tokens[1] === 'X' ? itemMap.get(opponent)!.wins : tokens[1] === 'Y' ? opponent : itemMap.get(opponent)!.loses,
    }))
    .map((item) => ({
      ...item,
      win: itemMap.get(item.opponent)!.loses === item.you,
      opponentScore: itemMap.get(item.opponent)!.score,
      youScore: itemMap.get(item.you)!.score,
    }))
    .map((item) => ({
      ...item,
      score: item.youScore + (item.win ? 6 : item.opponent === item.you ? 3 : 0),
    }));
  debug(1, games);
  const total = games.reduce((acc, item) => acc + item.score, 0);
  console.log('part 2:', total);
};

if (args.part1) part1();
if (args.part2) part2();
