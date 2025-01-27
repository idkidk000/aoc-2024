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

interface Vec3 {
  x: number;
  y: number;
  z: number;
}
const D6 = new Array<Vec3>(
  { x: -1, y: 0, z: 0 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: -1 },
  { x: 0, y: 0, z: 1 }
);
enum Occupied {
  Unknown = 0,
  Lava = 1,
  External = 2,
  Internal = 3,
}

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .map((line) => line.split(','))
    .map<Vec3>((tokens) => ({
      x: Number(tokens[0]),
      y: Number(tokens[1]),
      z: Number(tokens[2]),
    }));

const solve = (cubes: Array<Vec3>, pruneInternal = false) => {
  // vec3 packing
  const [minXyz, maxXyz] = cubes.reduce(
    (acc, item) => [Maths.min(acc[0], item.x, item.y, item.z), Maths.max(acc[1], item.x, item.y, item.z)],
    [Infinity, -Infinity]
  );
  const width = Maths.ceil(Maths.log2(maxXyz - minXyz));
  const occupied = new Map<number, Occupied>();
  const packVec3 = (vec3: Vec3) => ((vec3.x - minXyz) << (width * 2)) + ((vec3.y - minXyz) << width) + (vec3.z - minXyz);
  const unpackVec3 = (value: number): Vec3 => ({
    x: (value >> (width * 2)) + minXyz,
    y: ((value >> width) & ((1 << width) - 1)) + minXyz,
    z: (value & ((1 << width) - 1)) + minXyz,
  });
  const setOccupied = (vec3: Vec3, type: Occupied) => occupied.set(packVec3(vec3), type);
  const getOccupied = (vec3: Vec3) => occupied.get(packVec3(vec3)) ?? Occupied.Unknown;
  const addVec3 = (left: Vec3, right: Vec3): Vec3 => ({ x: left.x + right.x, y: left.y + right.y, z: left.z + right.z });
  const oob = (vec3: Vec3) =>
    vec3.x < minXyz || vec3.x > maxXyz || vec3.y < minXyz || vec3.y > maxXyz || vec3.z < minXyz || vec3.z > maxXyz;

  /*
  // test i haven't messed up vec3 unpacking
  for (const cube of cubes) {
    const packed = packVec3(cube);
    const unpacked = unpackVec3(packed);
    debug(1, { cube, packed, unpacked });
    if (cube.x !== unpacked.x || cube.y !== unpacked.y || cube.z !== unpacked.z) throw new Error('bruh');
  }
  */

  // set lava occupied
  for (const cube of cubes) setOccupied(cube, Occupied.Lava);

  // loop over xyz
  // walk Occupied.Unknown regions
  // add region to a set
  // keep testing for external
  // once exhaused, set all walked cells to Occupied.(In|Ex)ternal
  // could factor out unnecessary unpacking and repacking
  const queue = new Array<Vec3>();
  const walked = new Set<number>();
  const addWalked = (vec3: Vec3) => walked.add(packVec3(vec3));
  const isWalked = (vec3: Vec3) => walked.has(packVec3(vec3));
  for (let x = minXyz; x <= maxXyz; ++x) {
    for (let y = minXyz; y <= maxXyz; ++y) {
      for (let z = minXyz; z <= maxXyz; ++z) {
        if (getOccupied({ x, y, z }) !== Occupied.Unknown) continue;
        walked.clear();
        queue.push({ x, y, z });
        addWalked({ x, y, z });
        let external = [x, y, z].some((item) => [minXyz, maxXyz].includes(item));
        while (queue.length > 0) {
          const position = queue.pop()!; // bfs/dfs shouldn't make much difference
          for (const nextPosition of D6.map((offset) => addVec3(position, offset))) {
            if (oob(nextPosition) || isWalked(nextPosition) || getOccupied(nextPosition) !== Occupied.Unknown) continue;
            addWalked(nextPosition);
            queue.push(nextPosition);
            if (!external)
              external = [nextPosition.x, nextPosition.y, nextPosition.z].some((item) => [minXyz, maxXyz].includes(item));
          }
        }
        for (const item of walked.keys().map((item) => unpackVec3(item))) {
          setOccupied(item, external ? Occupied.External : Occupied.Internal);
        }
      }
    }
  }

  // loop over cubes and accumulate surface area
  let surfaceArea = 0;
  for (const cube of cubes) {
    const faceCount = D6.map((item) => addVec3(item, cube)).reduce(
      (acc, item) =>
        acc + ((pruneInternal ? [Occupied.Lava, Occupied.Internal] : [Occupied.Lava]).includes(getOccupied(item)) ? 0 : 1),
      0
    );
    debug(1, { cube, faceCount });
    surfaceArea += faceCount;
  }
  return surfaceArea;
};

const part1 = () => {
  const cubes = parseInput();
  const result = solve(cubes);
  console.log('part 1:', result);
  // 3448
};

const part2 = () => {
  const cubes = parseInput();
  const result = solve(cubes, true);
  console.log('part 2:', result);
  // 2052
};

if (args.part1) part1();
if (args.part2) part2();
