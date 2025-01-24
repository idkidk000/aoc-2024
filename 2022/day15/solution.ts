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

const lineLineIntersect = (a: Line, b: Line, infinite: boolean = false): Coord | undefined => {
  // pain
  // TODO: add to template
  const [x1, y1, x2, y2] = [a.a.x, a.a.y, a.b.x, a.b.y];
  const [x3, y3, x4, y4] = [b.a.x, b.a.y, b.b.x, b.b.y];
  const denominator = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
  if (denominator === 0) return undefined;
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denominator;
  const u = ((x1 - x3) * (y1 - y2) - (y1 - y3) * (x1 - x2)) / denominator;
  debug(4, { a, b, denominator, t, u });
  if (infinite || (t >= 0 && t <= 1 && u >= 0 && u <= 1)) return { x: x1 + t * (x2 - x1), y: y1 + t * (y2 - y1) };
  return undefined;
};

const isInside = (coord: Coord, line: Line) => {
  const result = (line.a.x - line.b.x) * (coord.y - line.b.y) - (line.a.y - line.b.y) * (coord.x - line.b.x) <= 0;
  debug(4, 'isInside', { coord, line, result });
  return result;
};
/*
  https://github.com/mhdadk/sutherland-hodgman/blob/main/SH.py#L172
  disdain for those who don't use type annotations
  p1 = line.b
  p2 = line.a
  q  = coord
    def is_inside(self,p1,p2,q):
        R = (p2[0] - p1[0]) * (q[1] - p1[1]) - (p2[1] - p1[1]) * (q[0] - p1[0])
        if R <= 0:
            return True
        else:
            return False
*/

const clipPolygon = (subject: Array<Coord>, clip: Array<Coord>) => {
  // https://en.wikipedia.org/wiki/Sutherland%E2%80%93Hodgman_algorithm
  const output = [...subject];
  for (let i = 0; i < clip.length; ++i) {
    const clipEdge: Line = { a: clip[i], b: clip[(i + 1) % clip.length] };
    const input = [...output];
    output.splice(0, output.length);
    debug(2, 'top', { i, clipEdge, input, output });
    for (let j = 0; j < input.length; ++j) {
      const currentPoint = input[j];
      const prevPoint = input[(j - 1 + input.length) % input.length];
      const intersectionPoint = lineLineIntersect({ a: prevPoint, b: currentPoint }, clipEdge, true);
      if (isInside(currentPoint, clipEdge)) {
        if (!isInside(prevPoint, clipEdge) && typeof intersectionPoint !== 'undefined') output.push(intersectionPoint);
        output.push(currentPoint);
      } else if (isInside(prevPoint, clipEdge) && typeof intersectionPoint !== 'undefined') output.push(intersectionPoint);
      debug(3, { j, currentPoint, prevPoint, clipEdge, intersectionPoint, output });
    }
    debug(2, 'bottom', { i, input, output });
  }
  return output;
};

const solve = ({ sensors, minX, maxX }: Props, searchY: number) => {
  /*
    perform a line/line intersect with checkLine and each sensors' bounding lines
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
      a.to = Maths.max(a.to, b.to); // b may have a greater from but a lower to
      ranges.splice(i + 1, 1); // modifying an array while iterating over it is good actually
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
  const props = parseInput();
  const [minXy, maxXy] = [0, 4_000_000];
  const candidates = new Array<Coord>();
  const allBoundingLines = props.sensors.flatMap((sensor) =>
    sensor.bounds.map<Line>((a, i, arr) => ({ a, b: arr[(i + 1) % 4] }))
  );
  for (const [i, left] of allBoundingLines.entries()) {
    for (const right of allBoundingLines.slice(i + 1)) {
      const intersection = lineLineIntersect(left, right);
      if (
        typeof intersection === 'undefined' ||
        intersection.x < minXy ||
        intersection.x > maxXy ||
        intersection.y < minXy ||
        intersection.y > maxXy ||
        intersection.x % 1 !== 0 ||
        intersection.y % 1 !== 0
      )
        continue;
      const overlappingSensorCount = props.sensors.filter(
        (item) => Maths.abs(item.position.x - intersection.x) + Maths.abs(item.position.y - intersection.y) <= item.radius
      ).length;
      if (overlappingSensorCount > 2) continue;
      candidates.push(intersection);
    }
  }
  debug(
    1,
    candidates.toSorted((a, b) => a.x - b.x || a.y - b.y)
  ); // i hoped for four entries with our target in the center, this this is fast and trivial to brute force
  for (const y of new Set(candidates.map((item) => item.y))) {
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
if (!args.part1 && !args.part2) {
  /*
   const subject = new Array<Coord>({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 10, y: 10 }, { x: 0, y: 10 });
  // clip goes beyond subject - works
  // const clip = new Array<Coord>({ x: 5, y: -1 }, { x: 11, y: 5 }, { x: 5, y: 11 }, { x: -1, y: 5 });
  // clip coords directly intersect subject lines - works
  // const clip = new Array<Coord>({ x: 5, y: 0 }, { x: 10, y: 5 }, { x: 5, y: 10 }, { x: 0, y: 5 });
  // clip is contained within subject - works
  const clip = new Array<Coord>({ x: 5, y: 1 }, { x: 9, y: 5 }, { x: 5, y: 9 }, { x: 1, y: 5 });
  const clipped = clipPolygon(subject, clip);
  debug(1, { subject, clip, clipped });
   */
  /*
    TODO: make a unionPolygons function based on clipPolygon.
    outer loop over left edges, inner loop over right edges, toogle a bool on intersect
    when true, add the intersection point and keep adding right edges to output
    when false, add intersection point and left edges
    if no intersections, put right back on the queue, since we know that they do all eventually overlap
    idk how to handle holes though. maybe left is an array of polygons which each have an invert boolean?
  */
  /*
    actually in the tradition of writing a load of code and then not using it, it might be easier to find all the sensor bounds line intersections, exclude those which are within radius of any other sensor, and exclude those which are outside of 0-4m.
    there should be four. inside should be our target
  */
}
