#!/usr/bin/env -S deno --allow-read

const DEBUG = Deno.args.reduce((acc, item) => (item == '-d' ? 1 : item == '-d2' ? 2 : item == '-d3' ? 3 : acc), 0);
const FILENAME = Deno.args.reduce(
  (acc, item) =>
    item == '-i' ? 'input.txt' : item == '-e' ? 'example.txt' : item.startsWith('-e') ? `example${item.slice(-1)}.txt` : acc,
  'example.txt'
);
console.log({ FILENAME, DEBUG });

/*
  No part 2 since it's mostly manual inspection
  solved in python by creating some helper functions and examining/reconfiguring gates in the repl
*/

class Gate {
  constructor(public operator: string, public left: string, public right: string) {}
}

const text = await Deno.readTextFile(FILENAME);
if (DEBUG > 1) console.debug({ text });
const sections = text.split('\n\n');
const wires = new Map(
  sections[0]
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(': ');
      return [parts[0], parts[1] == '1'];
    })
);
if (DEBUG > 1) console.debug({ wires });
const gates = new Map(
  sections[1]
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => {
      const parts = line.split(' ');
      return [parts[4], new Gate(parts[1], parts[0], parts[2])];
    })
);
if (DEBUG > 1) console.debug({ gates });

const resolve = (gate: string): boolean => {
  if (wires.has(gate)) return wires.get(gate)!;
  const { operator, left, right } = gates.get(gate)!;
  const resolvedLeft = resolve(left);
  const resolvedRight = resolve(right);
  const result =
    operator == 'OR'
      ? resolvedLeft || resolvedRight
      : operator == 'AND'
      ? resolvedLeft && resolvedRight
      : resolvedLeft != resolvedRight;
  wires.set(gate, result);
  return result;
};

const part1 = () => {
  const result = gates
    .keys()
    .filter((k) => k.startsWith('z'))
    .toArray()
    .toSorted()
    .reduce((acc, gate, i) => (resolve(gate) ? acc + (1n << BigInt(i)) : acc), BigInt(0));
  console.log('part 1', result);
};

part1();
