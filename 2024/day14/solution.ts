#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
const EXAMPLE = false;

const text = await Deno.readTextFile(EXAMPLE ? 'example.txt' : 'input.txt');
if (DEBUG) console.debug('text', text);

interface Robot {
  px: number;
  py: number;
  vx: number;
  vy: number;
}

interface QuadCounter {
  0: number;
  1: number;
  2: number;
  3: number;
}

const robots: Robot[] = text
  .replaceAll(/[pv]=/g, '')
  .replaceAll(/,/g, ' ')
  .split('\n')
  .filter((line) => line.trim())
  .map((line) => {
    const lineNums = line.split(' ');
    return {
      px: parseInt(lineNums[0]),
      py: parseInt(lineNums[1]),
      vx: parseInt(lineNums[2]),
      vy: parseInt(lineNums[3]),
    };
  });
const countX = 101;
const countY = 103;
if (DEBUG) console.debug({ robots, countX, countY });

const part1 = (robots: Robot[], countX: number, countY: number) => {
  const quadCounter: QuadCounter = { 0: 0, 1: 0, 2: 0, 3: 0 };
  const i = 100;
  const splitX = (countX - 1) / 2;
  const splitY = (countY - 1) / 2;
  for (const robot of robots) {
    // mod in ts preserves negative. need to mod it, add operand, mod again
    const x = (((robot.px + robot.vx * i) % countX) + countX) % countX;
    const y = (((robot.py + robot.vy * i) % countY) + countY) % countY;
    if (DEBUG) console.debug({ robot, x, y });
    if (x < splitX && y < splitY) {
      quadCounter[0]++;
    } else if (x < splitX && y > splitY) {
      quadCounter[1]++;
    } else if (x > splitX && y < splitY) {
      quadCounter[2]++;
    } else if (x > splitX && y > splitY) {
      quadCounter[3]++;
    }
  }
  const product = Object.values(quadCounter).reduce((acc, val) => (acc *= val), 1);
  console.log({ quadCounter, product });
};

const part2 = (robots: Robot[], countX: number, countY: number) => {
  const target = robots.length * 0.7;
  for (let i = 1; i < 100000; i++) {
    let connections = 0;
    const positions = Array.from({ length: countY }, () => Array(countX).fill(' '));
    for (const robot of robots) {
      robot.px = (((robot.px + robot.vx) % countX) + countX) % countX;
      robot.py = (((robot.py + robot.vy) % countY) + countY) % countY;
      positions[robot.py][robot.px] = '#';
    }
    for (const robot of robots) {
      for (let dir = 0; dir < 8; dir++) {
        const tx = robot.px + ([1, 2, 3].includes(dir) ? 1 : [5, 6, 7].includes(dir) ? -1 : 0);
        const ty = robot.py + ([3, 4, 5].includes(dir) ? 1 : [7, 0, 1].includes(dir) ? -1 : 0);
        if (tx >= 0 && tx < countX && ty >= 0 && ty < countY && positions[ty][tx] == '#') {
          connections++;
          break;
        }
      }
    }
    if (connections >= target) {
      for (const line of positions) {
        console.log(line.join(''));
      }
      console.log({ i, connections, target });
      break;
    }
  }
};

part1(robots, countX, countY);
part2(robots, countX, countY);