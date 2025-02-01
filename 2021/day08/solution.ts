#!/usr/bin/env -S deno --allow-read
import { args, debug, Counter, IterUtils } from '../../.template/_/utils.ts';

interface Input {
  signals: Array<Array<string>>;
  outputs: Array<Array<string>>;
}

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(' | '))
    .map<Input>((tokens) => ({
      signals: tokens[0].split(' ').map((item) => item.split('')),
      outputs: tokens[1].split(' ').map((item) => item.split('')),
    }));

const part1 = () => {
  const counter = new Counter<number>();
  for (const input of parseInput()) {
    debug(2, input);
    input.outputs
      .map((item) => item.length)
      .filter((item) => [2, 4, 3, 7].includes(item))
      .forEach((item) => counter.add(item));
  }
  debug(1, counter);
  const result = counter.values().reduce((acc, item) => acc + item, 0);
  console.log('part 1:', result);
};

const part2 = () => {
  // for converting mapped outputs back to numbers
  const digitSegmentsMap = new Map<string, number>([
    ['abcefg', 0],
    ['cf', 1],
    ['acdeg', 2],
    ['acdfg', 3],
    ['bcdf', 4],
    ['abdfg', 5],
    ['abdefg', 6],
    ['acf', 7],
    ['abcdefg', 8],
    ['abcdfg', 9],
  ]);
  // for mapped signal comparison
  const digitSegments = new Set<string>(digitSegmentsMap.keys());
  const allSegments: Array<string> = 'abcdefg'.split('');
  // all possible mappings
  const allWiresToSegments = IterUtils.permutations(allSegments).map(
    (permutation) => new Map<string, string>(permutation.map((item, i) => [item, allSegments[i]]))
  );

  let total = 0;
  for (const input of parseInput()) {
    debug(1, input);
    let mapped = false;
    for (const wiresToSegments of allWiresToSegments) {
      debug(2, { wiresToSegments });
      // map input signals through wiresToSegments and build a set of mapped digit segments
      const mappedSignals = new Set<string>(
        input.signals.map((signal) =>
          signal
            .map((item) => wiresToSegments.get(item)!)
            .toSorted((a, b) => a.localeCompare(b))
            .join('')
        )
      );
      if (mappedSignals.isSubsetOf(digitSegments) && mappedSignals.isSupersetOf(digitSegments)) {
        // mapped signals are valid. map outputs in the same way then through digitSegmentsMap to get the values
        const outputValue = input.outputs
          .map((output) =>
            output
              .map((item) => wiresToSegments.get(item)!)
              .toSorted((a, b) => a.localeCompare(b))
              .join('')
          )
          .map((mappedOutput) => digitSegmentsMap.get(mappedOutput)!)
          .reduce((acc, item, i, arr) => acc + item * 10 ** (arr.length - 1 - i), 0);
        debug(1, { mappedSignals, outputValue });
        total += outputValue;
        mapped = true;
        break;
      }
    }
    if (!mapped) throw new Error('🤡');
  }
  console.log('part 2', total);
};

if (args.part1) part1();
if (args.part2) part2();
