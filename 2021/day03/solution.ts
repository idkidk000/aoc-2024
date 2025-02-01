#!/usr/bin/env -S deno --allow-read
import { args, debug } from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim());

const part1 = () => {
  const input = parseInput();
  const width = input[0].length;
  let gamma = 0;
  for (let i = 0; i < width; ++i)
    gamma |= input.filter((item) => item[i] === '1').length > input.length / 2 ? 1 << (width - i - 1) : 0;
  const epsilon = ((1 << width) - 1) ^ gamma;
  debug(1, { width, gamma, epsilon });
  console.log('part 1:', gamma * epsilon);
};

const part2 = () => {
  const input = parseInput();
  const width = input[0].length;
  const getReading = (oxygen: boolean): number => {
    let filteredInput = input;
    for (let i = 0; i < width && filteredInput.length > 1; ++i) {
      const ones = filteredInput.filter((value) => value[i] === '1').length;
      const digit = ones < filteredInput.length / 2 ? (oxygen ? '0' : '1') : oxygen ? '1' : '0';
      filteredInput = filteredInput.filter((value) => value[i] === digit);
    }
    return parseInt(filteredInput[0], 2);
  };
  const o2 = getReading(true);
  const co2 = getReading(false);
  debug(1, { o2, co2 });
  console.log('part 2:', o2 * co2);
};

if (args.part1) part1();
if (args.part2) part2();
