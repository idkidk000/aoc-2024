#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
// const DEBUG = false;

const data = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(data);
const sections = data.split('\n\n');
const rules = sections[0]
  .split('\n')
  .filter((line) => line.trim() != '')
  .map((line) => line.split('|').map((item) => parseInt(item)));
if (DEBUG) console.debug({ rules });
const updates = sections[1]
  .split('\n')
  .filter((line) => line.trim() != '')
  .map((line) => line.split(',').map((item) => parseInt(item)));
if (DEBUG) console.debug({ updates });

let total1 = 0;
const unsortedUpdates: number[][] = [];
updates.forEach((update) => {
  const correctOrder = rules.every(
    (rule) => !(update.includes(rule[0]) && update.includes(rule[1])) || update.indexOf(rule[0]) < update.indexOf(rule[1])
  );
  if (DEBUG && correctOrder) console.debug({ update, correctOrder });
  if (correctOrder) {
    total1 += update[Math.round((update.length - 1) / 2)];
  } else {
    unsortedUpdates.push(update);
  }
});
console.log('part 1', total1);

let total2 = 0;
unsortedUpdates.forEach((update) => {
  const updateRules = rules.filter((rule) => update.includes(rule[0]) && update.includes(rule[1]));
  if (DEBUG) console.debug({ update, updateRules });
  let moved = true;
  while (moved) {
    moved = false;
    updateRules.forEach((rule) => {
      const leftIx = update.indexOf(rule[0]);
      const rightIx = update.indexOf(rule[1]);
      if (leftIx > rightIx) {
        if (DEBUG) console.debug('move', { rule, leftIx, rightIx });
        update.splice(leftIx, 1);
        update.splice(rightIx > 0 ? rightIx - 1 : rightIx, 0, rule[0]);
        moved = true;
      }
    });
  }
  total2 += update[Math.round((update.length - 1) / 2)];
});
console.log('part 2', total2);
