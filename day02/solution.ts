#!/usr/bin/env -S deno --allow-read

// const DEBUG = true;
const DEBUG = false;

const data = await Deno.readTextFile('input.txt');
if (DEBUG) console.debug(data);
const reports = data
  .split('\n')
  .filter((line) => line.trim() != '')
  .map((line) => line.split(/\s+/).map((i) => parseInt(i)));
if (DEBUG) console.debug(reports);

let countSafe = 0;
let countMadeSafe = 0;

reports.forEach((report) => {
  const deltas = report.slice(1).map((item, i) => item - report[i]);
  const inRange = deltas.every((item) => Math.abs(item) >= 1 && Math.abs(item) <= 3);
  const sameSign = deltas.every((item) => item > 0) || deltas.every((item) => item < 0);
  const safe = inRange && sameSign;
  // if (DEBUG) console.debug({ report, deltas, inRange, sameSign, safe });
  if (safe) {
    countSafe++;
  } else {
    for (let i = 0; i <= deltas.length; i++) {
      const dampedReport = [...report];
      dampedReport.splice(i, 1);
      const dampedDeltas = dampedReport.slice(1).map((item, ix) => item - dampedReport[ix]);

      if (DEBUG) console.debug({ report, deltas, dampedReport, dampedDeltas, i });
      const dampedInRange = dampedDeltas.every((item) => Math.abs(item) >= 1 && Math.abs(item) <= 3);
      const dampedSameSign = dampedDeltas.every((item) => item > 0) || dampedDeltas.every((item) => item < 0);
      const dampedSafe = dampedInRange && dampedSameSign;
      if (dampedSafe) {
        countMadeSafe++;
        break;
      }
    }
  }
}, 0);
console.log(`part 1 ${countSafe}`);
console.log(`part 2 ${countSafe + countMadeSafe}`, { countSafe, countMadeSafe });
