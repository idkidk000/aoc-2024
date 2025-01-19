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
const input = await Deno.readTextFile(args.filename);
// #endregion

const parseInput = () =>
  input
    .replaceAll(/\s+/g, '')
    .split(',')
    .filter((token) => token.trim());

const hash = (data: string) =>
  data.split('').reduce((acc, char) => {
    acc += char.charCodeAt(0);
    acc *= 17;
    acc &= 255;
    return acc;
  }, 0);

const part1 = () =>
  console.log(
    'part 1:',
    parseInput().reduce((acc, item) => acc + hash(item), 0)
  );

const part2 = () => {
  interface lens {
    label: string;
    focal: number;
  }
  const boxes = new Map<number, lens[]>();
  const regex = /([a-z]+)([-=])([0-9])?/;
  for (const code of parseInput()) {
    const [_, label, operation, focalStr] = regex.exec(code)!;
    const box = hash(label);
    debug(2, { label, operation, focalStr, box });
    if (operation === '=') {
      const focal = Number(focalStr);
      if (!boxes.has(box)) {
        // create
        boxes.set(box, [{ label, focal }]);
      } else if ((boxes.get(box) ?? []).filter((item) => item.label === label).length > 0) {
        // replace
        boxes.set(
          box,
          boxes.get(box)!.map((item) => (item.label === label ? { label, focal } : item))
        );
      } else {
        // push back
        boxes.get(box)!.push({ label, focal });
      }
    } else if (operation === '-') {
      // why wont ?. work :@
      if ((boxes.get(box) ?? []).filter((item) => item.label === label).length > 0)
        boxes.set(
          box,
          boxes.get(box)!.filter((item) => item.label !== label)
        );
    }
    debug(3, { boxes });
  }
  debug(1, { boxes });
  const power = boxes
    .entries()
    .reduce((acc, [box, lenses]) => acc + lenses.reduce((acc, lens, i) => acc + (box + 1) * (i + 1) * lens.focal, 0), 0);
  console.log('part 2:', power);
};

if (args.part1) part1();
if (args.part2) part2();
