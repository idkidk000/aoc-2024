#!/usr/bin/env -S deno --allow-read

// const DEBUG = true;
const DEBUG = false;

const data = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(data);

const part1 = (data: string) => {
  const total = data.matchAll(/mul\(([0-9]+),([0-9]+)\)/g).reduce((acc, item) => {
    if (DEBUG) console.debug(item[1], item[2]);
    acc += parseInt(item[1]) * parseInt(item[2]);
    return acc;
  }, 0);
  console.log('part 1', total);
};

const part2 = (data: string) => {
  const total = data.matchAll(/(mul\(([0-9]+),([0-9]+)\)|do\(\)|don't\(\))/g).reduce(
    (acc, item) => {
      if (DEBUG) console.debug({ acc, item1: item[1] });
      switch (item[1]) {
        case 'do()':
          acc.enable = true;
          break;
        case "don't()":
          acc.enable = false;
          break;
        default:
          if (acc.enable) {
            acc.value += parseInt(item[2]) * parseInt(item[3]);
          }
      }
      return acc;
    },
    { value: 0, enable: true }
  );
  console.log('part 2', total.value);
};

part1(data);
part2(data);