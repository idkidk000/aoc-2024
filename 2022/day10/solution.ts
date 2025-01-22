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

type InstructionType = 'noop' | 'addx';

interface Instruction {
  opcode: InstructionType;
  operand: number | undefined;
}

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(/\s+/))
    .map<Instruction>((tokens) => ({
      opcode: tokens[0] as InstructionType,
      operand: typeof tokens[1] === 'undefined' ? undefined : Number(tokens[1]),
    }));

const simulate = (
  instructions: Instruction[],
  hookPre?: (clock: number, x: number, instruction: Instruction | undefined) => void,
  hookPost?: (clock: number, x: number, instruction: Instruction | undefined) => void
) => {
  // refactor instructions into a more useful format
  const addXs = new Map<number, Instruction>();
  let clock = 0;
  for (const instruction of instructions) {
    if (instruction.opcode === 'noop') ++clock;
    else if (instruction.opcode === 'addx') {
      clock += 2;
      addXs.set(clock, instruction);
    }
  }
  const clockEnd = clock;
  let x = 1;
  for (let clock = 0; clock <= clockEnd; ++clock) {
    const instruction = addXs.get(clock);
    if (typeof hookPre !== 'undefined') hookPre(clock, x, instruction);
    if (typeof instruction !== 'undefined') x += instruction.operand!;
    if (typeof hookPost !== 'undefined') hookPost(clock, x, instruction);
  }
};

const part1 = () => {
  let total = 0;
  simulate(parseInput(), (clock: number, x: number, _) => {
    if ((clock - 20) % 40 === 0 && clock < 221) {
      debug(1, { clock, x });
      total += clock * x;
    }
  });
  console.log('part 1:', total);
};

const part2 = () => {
  const output = new Array<string>();
  simulate(parseInput(), undefined, (clock: number, x: number, instruction) => {
    const col = clock % 40;
    const state = x >= col - 1 && x <= col + 1;
    debug(1, { clock, col, x, instruction, state });
    output.push(state ? '#' : ' ');
  });
  const lines = output
    .join('')
    .matchAll(/(.{40})/g)
    .map((match) => match[0])
    .toArray();
  console.log('part 2:', lines);
};

if (args.part1) part1();
if (args.part2) part2();
