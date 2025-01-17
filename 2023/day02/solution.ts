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
  if (DEBUG <= level) console.debug(...data);
};

const input = await Deno.readTextFile(FILENAME);

interface Dice {
  red: number;
  green: number;
  blue: number;
}

const parseInput = () =>
  input
    .replaceAll(';', ',')
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(': ');
      return {
        id: Number(parts[0].substring(5)),
        dice: parts[1]
          .split(', ')
          .map((token) => token.split(' '))
          .reduce(
            (acc, [count, colour]) => {
              const index = colour as keyof Dice;
              acc[index] = Math.max(acc[index], Number(count));
              return acc;
            },
            { red: 0, green: 0, blue: 0 } as Dice
          ),
      };
    });

const part1 = () => {
  const games = parseInput();
  debug(1, games);
  const minimums = { red: 12, green: 13, blue: 14 } as Dice;
  const possible = games.reduce(
    (acc, game) =>
      game.dice.red <= minimums.red && game.dice.green <= minimums.green && game.dice.blue <= minimums.blue ? acc + game.id : acc,
    0
  );
  console.log('part 1:', possible);
};

const part2 = () => {
  const games = parseInput();
  const power = games.reduce((acc, game) => acc + game.dice.red * game.dice.green * game.dice.blue, 0);
  console.log('part 2', power);
};

if (PART1) part1();
if (PART2) part2();
