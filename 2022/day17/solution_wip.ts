#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    gcd(left: number, right: number): number;
    lcm(values: number[]): number;
  }
}

Math.gcd = (left: number, right: number) => {
  while (right !== 0) [left, right] = [right, left % right];
  return left;
};
Math.lcm = (values: number[]) => values.reduce((acc, item) => (acc * item) / Math.gcd(acc, item), 1);

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
interface Rock {
  cells: Array<Coord>;
  width: number;
  height: number;
  raw: Array<string>;
}

const parseInput = () => {
  const jets = Deno.readTextFileSync(args.filename);
  const rocks = new Array<Rock>();
  for (const rawRock of Deno.readTextFileSync('rocks.txt')
    .split('\n\n')
    .map((section) =>
      section
        .split('\n')
        .filter((line) => line.trim())
        .map((line) => line.split(''))
    )) {
    const rock: Rock = {
      cells: new Array<Coord>(),
      width: rawRock[0].length,
      height: rawRock.length,
      raw: rawRock.map((row) => row.join('')),
    };
    for (const [y, row] of rawRock.entries()) {
      // flip y so 0 is on the bottom and coords can just be added
      for (const [x, char] of row.entries()) if (char === '#') rock.cells.push({ x, y: rawRock.length - y - 1 });
    }
    rocks.push(rock);
  }
  return { jets, rocks };
};

const simulate = (
  jets: string,
  rocks: Array<Rock>,
  dropCount: number,
  hook?: (data: { dropNum: number; jetIx: number; height: number; rockId: number; maxY: number }) => boolean
) => {
  const cavernWidth = 7;
  const startXOffset = 2;
  const startYOffset = 3;
  let maxY = -1;
  // y=0 bottom
  /*   const occupied = new Set<number>();
  const hashCoord = (coord: Coord) => coord.y + (coord.x << 28);
  const isOccupied = (coord: Coord) => occupied.has(hashCoord(coord));
  const setOccupied = (coord: Coord) => occupied.add(hashCoord(coord)); */
  // denser packing so we can simulate more rows before hitting max map/set size
  const occupied = new Map<number, number>();
  const hashCoord = (coord: Coord) => {
    const dataWidth = 30; //might switch to bigint
    const rowsPerEntry = Maths.floor(dataWidth / cavernWidth);
    return {
      key: Maths.floor(coord.y / rowsPerEntry),
      val: 1 << (coord.x + (coord.y % rowsPerEntry) * cavernWidth),
    };
  };
  const isOccupied = (coord: Coord) => {
    const { key, val } = hashCoord(coord);
    return occupied.has(key) && (occupied.get(key)! & val) === val;
  };
  const setOccupied = (coord: Coord) => {
    const { key, val } = hashCoord(coord);
    if (!occupied.has(key)) occupied.set(key, val);
    else occupied.set(key, occupied.get(key)! | val);
  };
  const addCoord = (left: Coord, right: Coord, xExtra?: number, yExtra?: number) => ({
    x: left.x + right.x + (xExtra ?? 0),
    y: left.y + right.y + (yExtra ?? 0),
  });
  let jetIx = 0;
  for (let dropNum = 0; dropNum < dropCount; ++dropNum) {
    const rock = rocks.at(dropNum % rocks.length)!;
    //rock origin bottom left so position and cell can be added
    const position: Coord = { x: startXOffset, y: maxY + startYOffset + 1 };
    debug(2, { rock, position, maxY });
    // while true is always a sign of quality code
    while (true) {
      // jet
      // check that every new cell position is within x bounds and unoccupied
      const xOffset = jets.at(jetIx % jets.length)! === '<' ? -1 : 1;
      if (
        rock.cells.every((cell) => {
          const newCell = addCoord(position, cell, xOffset);
          return newCell.x >= 0 && newCell.x < cavernWidth && !isOccupied(newCell);
        })
      ) {
        position.x += xOffset;
        debug(3, 'jet', { xOffset, position });
      } else {
        debug(3, 'jet blocked', { xOffset, position });
      }

      ++jetIx;

      // drop
      // as above
      const yOffset = -1;
      if (
        rock.cells.every((cell) => {
          const newCell = addCoord(position, cell, 0, yOffset);
          return newCell.y >= 0 && !isOccupied(newCell);
        })
      ) {
        position.y += yOffset;
        debug(3, 'drop', { yOffset, position });
      } else {
        //reached the end of y travel. set all cells to occupied, update maxY, and break
        for (const cell of rock.cells) setOccupied(addCoord(position, cell));
        maxY = Maths.max(maxY, position.y + rock.height - 1);
        debug(1, 'drop blocked', { yOffset, position, rock, maxY });
        if (args.debug) {
          for (let y = maxY; y >= 0; --y) {
            let row = '';
            for (let x = 0; x < cavernWidth; ++x) row += isOccupied({ x, y }) ? '#' : '.';
            debug(1, `${y.toString().padStart(3, ' ')}: ${row}`);
          }
        }
        break;
      }
    }
    if (
      typeof hook !== 'undefined' &&
      hook({ dropNum, jetIx: jetIx - 1, height: maxY + 1, rockId: rocks.length % dropNum, maxY })
    )
      break;
  }

  return maxY + 1; //grid is 0-based
};

const part1 = () => {
  const { jets, rocks } = parseInput();
  const result = simulate(jets, rocks, 2022);
  console.log('part 1:', result);

  // 3177
};

const part2 = () => {
  const { jets, rocks } = parseInput();
  const lcm = Maths.lcm([jets.length, rocks.length]);
  /*
  // does jets repeat
  // no it's a prime and any substring matches are false positives
  for (let i = 0; i < Maths.floor(jets.length / 2); ++i) {
    const search = jets.slice(0, i);
    const index = jets.indexOf(search, i);
    if (index > -1) {
      console.log({ i, index, len: jets.length })
    };
  }
 */

  // does the rock maxY delta fall into a predictable pattern on or after lcm (anything before is a false positive)
  // yes 50546 (lcm+1)=2. still could be a false positive though
  // it was :|
  const resultMap = new Map<string, number>(); //slow but idc actually
  let prevMaxY = 0;
  console.log({ lcm });
  simulate(jets, rocks, lcm * 1000, (data) => {
    const key = `${data.rockId} ${data.jetIx} ${data.maxY - prevMaxY}`;
    if (resultMap.has(key)) {
      console.log({ data, prev: resultMap.get(key)! });
      return true; //break
    }
    resultMap.set(key, data.dropNum);

    // const delta=
    // const delta = (maxY - prevMaxY).toString();
    // if (delta.length !== 1) throw new Error(delta);
    // deltas += delta;
    // if (dropNum > lcm) {
    //   const search = deltas.slice(-lcm);
    //   const index = deltas.indexOf(search);
    //   console.log({ dropNum, index });
    //   // dropNum 1915-2014 result matches 175-274 - cycle of 1740
    //   if (index < dropNum - lcm) return true;
    // }
    // prevMaxY = maxY;
    prevMaxY = data.maxY;
    return false;
  });
  /*   console.log({
    height1: simulate(jets, rocks, 1) + 1,
    heightLcm: simulate(jets, rocks, lcm) + 1,
    heightLcm1: simulate(jets, rocks, lcm + 1) + 1,
    heightLcm2: simulate(jets, rocks, lcm * 2) + 1,
    heightLcm21: simulate(jets, rocks, lcm * 2 + 1) + 1,
    heightLcm3: simulate(jets, rocks, lcm * 3) + 1,
    heightLcm31: simulate(jets, rocks, lcm * 3 + 1) + 1,
    heightLc4: simulate(jets, rocks, lcm * 4) + 1,
    heightLc41: simulate(jets, rocks, lcm * 4 + 1) + 1,
  });
  return; */

  /*   const sillyNumber = 1_000_000_000_000;
  const lcm = Maths.lcm([jets.length, rocks.length, 1740]);
  // 17558340 rocks results in FAR too many entries for a set. i'll have to rethink storage
  console.log(lcm);
  console.log('lcmHeight', simulate(jets, rocks, lcm));
  console.log('lcm2Height', simulate(jets, rocks, lcm * 2));
  console.log('lcm3Height', simulate(jets, rocks, lcm * 3));
  console.log('lcm4Height', simulate(jets, rocks, lcm * 4)); */
  /*   const lcmHeight = simulate(jets, rocks, lcm);
  // BUG: these are not multiples of lcmHeight. 2 is +2, 3 is +4, 4 is +10
  // they're also not multiples of lcm2-lcm
  // so there's something i haven't considered. presumably rocks falling through holes. i assumed that would stabilise and fall into some multiple of jets.length*rocks.length
  const lcm2Height = simulate(jets, rocks, lcm * 2);
  const lcm3Height = simulate(jets, rocks, lcm * 3);
  const lcm4Height = simulate(jets, rocks, lcm * 4);
  const lcmPlus1Height = simulate(jets, rocks, lcm + 1);
  const just1Height = simulate(jets, rocks, 1);
  const lcm1Diff = lcmPlus1Height - lcmHeight - just1Height;
  const sillyModLcmHeight = simulate(jets, rocks, sillyNumber % lcm);
  console.log({ lcm, lcmHeight, lcm2Height, lcm3Height, lcm4Height, lcmPlus1Height, just1Height, lcm1Diff, sillyModLcmHeight });
  // const result = Maths.floor(sillyNumber / lcm) * (lcmHeight + lcm1Diff) + sillyModLcmHeight;
  const result = Maths.floor(sillyNumber / lcm) * (lcmHeight + lcm1Diff) + sillyModLcmHeight;

  console.log('part 2:', result); */
  // the gap thing happens frequently. need to determine a cycle length and add that to the lcm calculation. then result should be based on lcm1*1 + (lcm2-lcm1)*a lot + remainder
  // const lcmResults = new Array<number>();
  /*   let deltas = '';
  let prevMaxY = 0;
  const searchLength = 100;
  simulate(jets, rocks, lcm * 1000, (dropNum, maxY) => {
    // if (prevMaxYs.length > 0 && maxY == prevMaxYs.at(-1)!.dropNum) console.log({ dropNum, maxY });
    // prevMaxYs.push({ dropNum, maxY });
    // if ((dropNum + 1) % lcm === 0) {
    //   const lcmMultiple = (dropNum + 1) / lcm;
    //   const height = maxY + 1;
    //   lcmResults.push(height);
    //   console.log(lcmMultiple, height);
    // }
    const delta = (maxY - prevMaxY).toString();
    if (delta.length !== 1) throw new Error(delta);
    deltas += delta;
    if (dropNum > searchLength) {
      const search = deltas.slice(-searchLength);
      const index = deltas.indexOf(search);
      console.log(dropNum, search, index);
      // dropNum 1915-2014 result matches 175-274 - cycle of 1740
      if (index < dropNum - searchLength) return true;
    }
    prevMaxY = maxY;
    return false;
  }); */

  // 5132474466221 too high (i messed up coord hashing)
  // 1565394906358 too low
};

if (args.part1) part1();
if (args.part2) part2();
