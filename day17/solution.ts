#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => item == '-d' || acc, false);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });

const text = await Deno.readTextFile(FILENAME);
if (DEBUG) console.debug({ text });

interface Registers {
  a: bigint;
  b: bigint;
  c: bigint;
}

const sections = text.split('\n\n');
const registers = sections[0]
  .replaceAll(/Register| /g, '')
  .split('\n')
  .filter((line) => line.trim())
  .reduce<Registers>((acc, line) => {
    const [k, v] = line.split(':');
    acc[k.toLowerCase() as keyof Registers] = BigInt(v);
    return acc;
  }, {} as Registers);
if (DEBUG) console.debug({ registers });
const program = sections[1]
  .replace('Program: ', '')
  .split(',')
  .map((c) => parseInt(c));
if (DEBUG) console.debug({ program });

const runProgram = (program: number[], registers: Registers) => {
  const DEBUG = false;
  let a = registers.a;
  let b = registers.b;
  let c = registers.c;
  if (DEBUG) console.debug({ registers, a, b, c });

  const combo = (operand: number, a: bigint, b: bigint, c: bigint) => {
    switch (operand) {
      case 4:
        return a;
      case 5:
        return b;
      case 6:
        return c;
      case 7:
        throw new Error(`invalid combo ${operand}`);
      default:
        return BigInt(operand);
    }
  };

  let pointer = 0;
  const output: number[] = [];
  while (pointer < program.length) {
    const opcode = program[pointer];
    const operand = program[pointer + 1];
    if (DEBUG) console.debug({ opcode, operand, pointer, a, b, c });
    pointer += 2;
    switch (opcode) {
      case 0: //adv
        a = a >> combo(operand, a, b, c);
        break;
      case 1: //bxl
        b = b ^ BigInt(operand);
        break;
      case 2: //bst
        b = combo(operand, a, b, c) & 7n;
        break;
      case 3: //jnz
        if (a != 0n) pointer = Number(operand);
        break;
      case 4: //bxc
        b = b ^ c;
        break;
      case 5: //out
        output.push(Number(combo(operand, a, b, c) & 7n));
        break;
      case 6: //bdv
        b = a >> combo(operand, a, b, c);
        break;
      case 7: //cdv
        c = a >> combo(operand, a, b, c);
        break;
      default:
        throw new Error(`invalid opcode ${opcode}`);
    }
    if (output.length > 20) {
      // break;
      throw new Error(
        `output is too long ${output} ${JSON.stringify(
          registers
        )} a=${a} b=${b} c=${c} pointer=${pointer} opcode=${opcode} operand=${operand}`
      );
    }
  }
  if (DEBUG) console.debug({ a, b, c, output });
  return output;
};

const part1Result = runProgram(program, registers);
console.log('part 1:', JSON.stringify(part1Result));

const part2 = (program: number[]) => {
  let inputs = Array.from({ length: 8 }, (_, i) => BigInt(i));
  for (let instruction = program.length - 1; instruction > -1; instruction--) {
    const nextInputs: bigint[] = [];
    const wantedResult = JSON.stringify(program.slice(instruction));
    if (DEBUG) console.debug({ instruction, wantedResult, len: inputs.length });
    for (const prevInput of inputs) {
      for (let byte = 0n; byte < 8n; byte++) {
        const newInput = (prevInput << 3n) + byte;
        if (newInput < 0n) throw new Error(`newInput has overflowed newInput=${newInput} prevInput=${prevInput} byte=${byte}`);
        const registers = {
          a: newInput,
          b: 0n,
          c: 0n,
        } as Registers;
        const result = JSON.stringify(runProgram(program, registers));
        if (result == wantedResult) {
          // if (DEBUG) console.debug({ prevInput, byte, newInput, result });
          nextInputs.push(newInput);
        }
      }
    }
    if (nextInputs.length == 0) {
      throw new Error('no inputs found');
    }
    inputs = nextInputs;
  }
  const lowestInput = inputs.toSorted()[0];
  console.log('part 2:', lowestInput);
};

part2(program);
