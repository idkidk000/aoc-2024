#!/usr/bin/env -S deno --allow-read

// const DEBUG = true;
const DEBUG = false;

const data = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(data);

const total1 = data.matchAll(/mul\(([0-9]+),([0-9]+)\)/g).reduce((acc, item) => {
  if (DEBUG) console.debug(item[1], item[2]);
  acc += parseInt(item[1]) * parseInt(item[2]);
  return acc;
}, 0);
console.log(`part 1 ${total1}`);

const total2 = data.matchAll(/(mul\(([0-9]+),([0-9]+)\)|do\(\)|don't\(\))/g).reduce(
  (acc, item) => {
    if (DEBUG) console.debug({ acc, item1: item[1] });
    switch (item[1].slice(0, 3)) {
      case 'mul':
        if (acc.enable) {
          acc.value += parseInt(item[2]) * parseInt(item[3]);
        }
        break;
      case 'do(':
        acc.enable = true;
        break;
      case 'don':
        acc.enable = false;
        break;
    }
    return acc;
  },
  { value: 0, enable: true }
);
console.log('part 2', total2);
