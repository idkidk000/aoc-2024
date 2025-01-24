#!/usr/bin/env -S deno --allow-read
// #region base aoc template
const Maths = Math;

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

interface Coord {
  x: number;
  y: number;
}
interface Sensor {
  position: Coord;
  beacon: Coord;
  radius: number;
  bounds: Array<Coord>;
}
interface Line {
  a: Coord;
  b: Coord;
}
interface Range {
  from: number;
  to: number;
}
interface Props {
  sensors: Array<Sensor>;
  minX: number;
  maxX: number;
}

const parseInput = (): Props => {
  const sensors = Deno.readTextFileSync(args.filename)
    .matchAll(/^Sensor at x=(-?\d+), y=(-?\d+): closest beacon is at x=(-?\d+), y=(-?\d+)$/gm)
    .map((tokens) => ({
      position: {
        x: Number(tokens[1]),
        y: Number(tokens[2]),
      },
      beacon: {
        x: Number(tokens[3]),
        y: Number(tokens[4]),
      },
    }))
    .map((item) => ({
      ...item,
      radius: Maths.abs(item.position.x - item.beacon.x) + Maths.abs(item.position.y - item.beacon.y),
    }))
    .map<Sensor>((item) => ({
      ...item,
      bounds: [
        { x: item.position.x, y: item.position.y - item.radius },
        { x: item.position.x + item.radius, y: item.position.y },
        { x: item.position.x, y: item.position.y + item.radius },
        { x: item.position.x - item.radius, y: item.position.y },
      ],
    }))
    .toArray();
  const [minX, maxX] = sensors.reduce(
    (acc, item) => [Maths.min(acc[0], ...item.bounds.map((b) => b.x)), Maths.max(acc[1], ...item.bounds.map((b) => b.x))],
    [Infinity, -Infinity]
  );
  return {
    sensors,
    minX,
    maxX,
  };
};

const lineLineIntersect = (a: Line, b: Line): Coord | undefined => {
  // pain
  //TODO: add to template
  const [x1, y1, x2, y2] = [a.a.x, a.a.y, a.b.x, a.b.y];
  const [x3, y3, x4, y4] = [b.a.x, b.a.y, b.b.x, b.b.y];
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denominator === 0) return undefined;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator;
  debug(4, { a, b, denominator, t, u });
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  return undefined;
};

const solve = ({ sensors, minX, maxX }: Props, searchY: number) => {
  /*
    perform a line/line intersect with checkLine and each sensors bounding lines
    add impossible ranges
    merge ranges and subtract known beacons
  */
  debug(3, { sensors });
  //minX,maxX is now the minmax of bounds so we will always get 0, 2, or 4 intersections
  const checkLine: Line = { a: { x: minX, y: searchY }, b: { x: maxX, y: searchY } };
  const ranges = new Array<Range>();
  for (const sensor of sensors) {
    const intersections = sensor.bounds
      .map((item, i, arr) => lineLineIntersect(checkLine, { a: item, b: arr[(i + 1) % 4] }))
      .filter((item) => typeof item !== 'undefined');
    if (intersections.length === 0) continue;
    debug(3, { sensor, intersections });
    if ([2, 4].includes(intersections.length)) {
      ranges.push({
        from: Maths.min(...intersections.map((item) => item.x)),
        to: Maths.max(...intersections.map((item) => item.x)),
      });
    } else throw new Error(`searchY=${searchY}; intersections=${JSON.stringify(intersections)}`);
  }
  ranges.sort((a, b) => a.from - b.from || a.to - b.to);
  debug(3, { ranges });
  for (let i = 0; i < ranges.length - 1; 0) {
    const [a, b] = [ranges[i], ranges[i + 1]];
    if (a.to >= b.from - 1) {
      a.to = Maths.max(a.to, b.to);
      ranges.splice(i + 1, 1); //modifying an array while iterating over it is good actually
    } else ++i;
  }
  debug(3, 'merged', { ranges });
  const knownBeacons = new Set(sensors.filter((item) => item.beacon.y === searchY).map((item) => item.beacon.x))
    .values()
    .toArray();
  const countImpossible = ranges.reduce(
    (acc, range) =>
      acc + range.to - range.from + 1 - knownBeacons.filter((beacon) => beacon >= range.from && beacon <= range.to).length,
    0
  );
  const possible = ranges
    .filter((_, i) => i < ranges.length - 1)
    .reduce((acc, a, i) => {
      const b = ranges[i + 1];
      for (let i = a.to + 1; i < b.from; ++i) acc.push(i);
      return acc;
    }, new Array<number>())
    .filter((item) => item >= 0 && item <= 4_000_000);
  debug(2, { ranges, knownBeacons, countImpossible });
  return {
    countImpossible,
    possible,
  };
};

const part1 = () => {
  const { countImpossible } = solve(parseInput(), args.filename === 'input.txt' ? 2_000_000 : 10);
  console.log('part 1:', countImpossible);

  // 5394423
};

const part2 = () => {
  /*
    FIXME: this is a bad solution. we already have min/max x/y and each sensors bounds. so we can use an algo to determine areas of the min/max x/y box which aren't obscured by any of the sensors
      https://en.wikipedia.org/wiki/Weiler%E2%80%93Atherton_clipping_algorithm
      https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm
  */
  const props = parseInput();
  for (let y = 0; y <= 4_000_000; ++y) {
    if (y % 100_000 === 0) debug(1, Maths.round((1000 / 4_000_000) * y) / 10, '%');
    const { possible } = solve(props, y);
    if (possible.length > 0) {
      debug(1, { y, possible });
      console.log('part 2:', possible[0] * 4_000_000 + y);
      break;
    }
  }

  // 11840879211051
};

if (args.part1) part1();
if (args.part2) part2();
