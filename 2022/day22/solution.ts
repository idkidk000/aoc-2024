#!/usr/bin/env -S deno --allow-read
// #region base aoc template
declare global {
  interface Math {
    pmod(value: number, mod: number): number;
  }
}

Math.pmod = (value: number, mod: number) => {
  const result = value % mod;
  return result >= 0 ? result : result + mod;
};

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

type Instruction = 'R' | 'L' | number;
enum TileContent {
  Void = ' ',
  Empty = '.',
  Wall = '#',
}
interface Props {
  grid: Array<string>;
  rows: number;
  cols: number;
  rowBounds: Array<{ start: number; end: number }>;
  colBounds: Array<{ start: number; end: number }>;
  edgeLength: number;
  cubeEdges: Array<{ from: { r: number; c: number; d: Direction }; to: { r: number; c: number; d: Direction } }>;
  instructions: Array<Instruction>;
}
interface Coord {
  r: number;
  c: number;
}
enum Direction {
  Up = 0,
  Right = 1,
  Down = 2,
  Left = 3,
}
const D4 = new Array<Coord>({ r: -1, c: 0 }, { r: 0, c: 1 }, { r: 1, c: 0 }, { r: 0, c: -1 });

const parseInput = (): Props => {
  const sections = Deno.readTextFileSync(args.filename).split('\n\n');
  const grid = sections[0].split('\n');
  // oh no codium trimmed trailing whitespace from my textfiles
  const rows = grid.length;
  const cols = grid.reduce((acc, item) => Maths.max(acc, item.length), 0);
  for (const [r, row] of grid.entries()) {
    if (row.length < cols) grid[r] = row.padEnd(cols, ' ');
  }
  // find bounds as a preprocessing step so we don't have to loop until not void in the walk loop
  const rowBounds = grid.map((line) => {
    const row = line.split('');
    return {
      start: row.findIndex((value) => value !== TileContent.Void),
      end: row.findLastIndex((value) => value !== TileContent.Void),
    };
  });
  const colBounds = grid[0].split('').map((_, i) => {
    const column = grid.map((line) => line[i]);
    return {
      start: column.findIndex((value) => value !== TileContent.Void),
      end: column.findLastIndex((value) => value !== TileContent.Void),
    };
  });
  // cube ugh
  const edgeLength =
    rows === (cols / 5) * 2 ? rows / 2 : rows === (cols / 4) * 3 ? rows / 3 : rows === (cols / 3) * 4 ? rows / 4 : rows / 5;
  debug(4, { rows, cols, edgeLength });
  const shape = new Array<Array<1 | 0>>();
  for (let r = 0; r < 5; ++r) {
    if (edgeLength * r >= rows) break;
    const row = new Array<1 | 0>();
    for (let c = 0; c < 5; ++c) {
      if (edgeLength * c >= cols) break;
      row.push(grid[r * edgeLength][c * edgeLength] === TileContent.Void ? 0 : 1);
    }
    shape.push(row);
  }
  debug(4, { shape });
  /*
    https://en.wikipedia.org/wiki/Net_(polyhedron)
    i asked chatgpt to write my cubeNets definition but she couldn't so i made paper cubes instead
    example is net 7 rotated 90 anticlockwise
    input is net 9
    i'm skipping the remaining nine
  */
  const cubeNets = [
    {
      id: 7,
      shape: [
        [0, 0, 1],
        [1, 1, 1],
        [0, 1, 0],
        [0, 1, 0],
      ],
      edges: [
        { from: { r: 0, c: 2, d: 0 }, to: { r: 1, c: 0, d: 0 } },
        { from: { r: 1, c: 0, d: 0 }, to: { r: 0, c: 2, d: 0 } },
        { from: { r: 1, c: 1, d: 0 }, to: { r: 0, c: 2, d: 3 } },
        { from: { r: 0, c: 2, d: 3 }, to: { r: 1, c: 1, d: 0 } },
        { from: { r: 1, c: 0, d: 3 }, to: { r: 3, c: 1, d: 3 } },
        { from: { r: 0, c: 2, d: 1 }, to: { r: 3, c: 1, d: 2 } },
        { from: { r: 1, c: 2, d: 1 }, to: { r: 3, c: 1, d: 1 } },
        { from: { r: 1, c: 0, d: 2 }, to: { r: 2, c: 1, d: 3 } },
        { from: { r: 1, c: 2, d: 2 }, to: { r: 2, c: 1, d: 1 } },
        { from: { r: 2, c: 1, d: 3 }, to: { r: 1, c: 0, d: 2 } },
        { from: { r: 2, c: 1, d: 1 }, to: { r: 1, c: 2, d: 2 } },
        { from: { r: 3, c: 1, d: 3 }, to: { r: 1, c: 0, d: 3 } },
        { from: { r: 3, c: 1, d: 2 }, to: { r: 0, c: 2, d: 1 } },
        { from: { r: 3, c: 1, d: 1 }, to: { r: 1, c: 2, d: 1 } },
      ],
    },
    {
      id: 9,
      shape: [
        [0, 1, 1],
        [0, 1, 0],
        [1, 1, 0],
        [1, 0, 0],
      ],
      edges: [
        { from: { r: 0, c: 1, d: 0 }, to: { r: 3, c: 0, d: 3 } },
        { from: { r: 0, c: 1, d: 3 }, to: { r: 2, c: 0, d: 3 } },
        { from: { r: 0, c: 2, d: 0 }, to: { r: 3, c: 0, d: 2 } },
        { from: { r: 0, c: 2, d: 1 }, to: { r: 2, c: 1, d: 2 } },
        { from: { r: 0, c: 2, d: 2 }, to: { r: 1, c: 1, d: 3 } },
        { from: { r: 1, c: 1, d: 1 }, to: { r: 2, c: 0, d: 0 } },
        { from: { r: 1, c: 1, d: 3 }, to: { r: 0, c: 2, d: 2 } },
        { from: { r: 2, c: 0, d: 0 }, to: { r: 1, c: 1, d: 3 } },
        { from: { r: 2, c: 0, d: 3 }, to: { r: 0, c: 1, d: 3 } },
        { from: { r: 2, c: 1, d: 1 }, to: { r: 0, c: 2, d: 3 } },
        { from: { r: 2, c: 1, d: 2 }, to: { r: 3, c: 0, d: 1 } },
        { from: { r: 3, c: 0, d: 1 }, to: { r: 2, c: 1, d: 2 } },
        { from: { r: 3, c: 0, d: 2 }, to: { r: 0, c: 2, d: 0 } },
        { from: { r: 3, c: 0, d: 3 }, to: { r: 2, c: 1, d: 2 } },
      ],
    },
  ];
  // try each rotation until we have a cubeNet match
  // reflections are also valid too but they're not in the inputs so i'm skipping them
  const findNet = (shape: Array<Array<1 | 0>>) => {
    //FIXME: all the cube stuff in parseInput() is really bad
    let localShape = [...shape];
    for (let rotate = 0; rotate < 4; ++rotate) {
      if (rotate > 0)
        localShape = Array.from({ length: localShape[0].length }, (_, i) => localShape.map((row) => row[i]).toReversed());
      debug(
        4,
        {
          rotate,
        },
        'shape',
        '\n' + shape.map((row) => row.join('')).join('\n') + '\n',
        'localShape',
        '\n' + localShape.map((row) => row.join('')).join('\n') + '\n'
      );
      const shapeStr = localShape.map((row) => row.join('')).join(' ');
      for (const cubeNet of cubeNets) {
        if (cubeNet.shape.map((row) => row.join('')).join(' ') === shapeStr) {
          //yet another very fun part of this is that i need to rotate the edges too
          debug(1, 'found', { rotate, shapeStr }, cubeNet);
          let localEdges = [...cubeNet.edges];
          for (let i = 0; i < rotate; ++i) {
            const maxR = Maths.max(...localEdges.flatMap(({ from, to }) => [from.r, to.r]));
            const maxC = Maths.max(...localEdges.flatMap(({ from, to }) => [from.c, to.c]));
            // detected shape was rotated rotate times clockwise until it matched a cubenet. we need to rotate cubenet's edges *anticlockwise* the same number of times
            localEdges = localEdges.map(({ from, to }) => ({
              from: { r: maxC - from.c, c: from.r, d: Maths.pmod(from.d - 1, 4) },
              to: { r: maxC - to.c, c: to.r, d: Maths.pmod(to.d - 1, 4) },
              // from: { r: from.c, c: maxR - from.r, d: (from.d + 1) % 4 },
              // to: { r: to.c, c: maxR - to.r, d: (to.d + 1) % 4 },
            }));
            debug(4, { edgeRotations: i + 1, localEdges });
          }
          return localEdges;
        }
      }
    }
    throw new Error('shape not found');
  };
  const cubeEdges = findNet(shape);
  for (const edge of cubeEdges) {
    if (cubeEdges.findIndex((value) => value.to.r === edge.from.r && value.to.c === edge.from.c) === -1)
      throw new Error(`unmatched edge ${JSON.stringify(edge)}`);
  }
  debug(4, { shape, cubeEdges });

  const instructions = sections[1]
    .matchAll(/(R|L|\d+)/g)
    .map<Instruction>((token) => (['R', 'L'].includes(token[1]) ? (token[1] as Instruction) : Number(token[1])))
    .toArray();
  return { grid, rows, cols, rowBounds, colBounds, instructions, edgeLength, cubeEdges };
};

const solve = ({ grid, instructions, rowBounds, colBounds, cubeEdges, edgeLength, rows, cols }: Props, cubeTime = false) => {
  const addCoord = (left: Coord, right: Coord): Coord => ({ r: left.r + right.r, c: left.c + right.c });
  let position: Coord = { c: grid[0].indexOf(TileContent.Empty), r: 0 };
  let direction = Direction.Right;
  const history = new Array<{ r: number; c: number; d: number }>({ ...position, d: direction });
  debug(1, 'start', { position, direction });

  const render = () => {
    if (args.debug) {
      const output = new Array<string>();
      for (let r = 0; r < rows; ++r) {
        let line = `${r.toString().padStart(3, ' ')}: `;
        for (let c = 0; c < cols; ++c) {
          const entryIx = history.findLastIndex((value) => value.r === r && value.c === c);
          if (entryIx > -1) {
            const entry = history[entryIx];
            const green = Maths.round((entryIx / history.length) * 255);
            const red = 255 - green;
            const blue = 128;
            const char = entry.d === 0 ? '^' : entry.d === 1 ? '>' : entry.d === 2 ? 'v' : '<';

            line += `\x1b[48;2;${red};${green};${blue}m${char}\x1b[0m`;
            // line +=`\x1b[7;${31 + entry.d}m${char}\x1b[0m`
          } else line += grid[r][c];
        }
        output.push(line);
      }
      console.log(output.join('\n'));
    }
  };

  for (const instruction of instructions) {
    if (typeof instruction === 'number') {
      for (let i = 0; i < instruction; ++i) {
        const offset = D4[direction];
        const nextPosition = addCoord(position, offset);
        let nextDirection: Direction = direction;
        debug(3, { position, offset, i, nextPosition });

        if (cubeTime) {
          /*
           * check if we're at an edge position.r,c%edgeLength
           * map position (not nextPosition) to cube tiles
           * check for corresponding cubeEdges entry
           * if found, transform direction and coords
           */
          if (
            (direction === Direction.Up && position.r % edgeLength === 0) ||
            (direction === Direction.Right && (position.c + 1) % edgeLength === 0) ||
            (direction === Direction.Down && (position.r + 1) % edgeLength === 0) ||
            (direction === Direction.Left && position.c % edgeLength === 0)
          ) {
            const mapPosition = { r: Maths.floor(position.r / edgeLength), c: Maths.floor(position.c / edgeLength) };
            const edge = cubeEdges.find(
              (item) => item.from.r === mapPosition.r && item.from.c === mapPosition.c && item.from.d === direction
            );
            if (typeof edge !== 'undefined') {
              // we're at a cube edge
              render();

              // move to the new cube tile
              nextPosition.r = edge.to.r * edgeLength;
              nextPosition.c = edge.to.c * edgeLength;

              // and transform the local coordinates
              // there's undoubtedly a general solution to this part with way less scope for bugs
              // but i'm tried
              if (edge.from.d === (edge.to.d + 2) % 4) {
                debug(1, 'edge wrap');
                // travel direction is unchanged
                // up,left sets local direction coord to edgeLength-1
                // down,right sets local direction coord to 0
                // local perpendicular coord is carried through
                if (direction === Direction.Up) nextPosition.r += edgeLength - 1;
                else if (direction === Direction.Left) nextPosition.c += edgeLength - 1;
                if ([Direction.Up, Direction.Down].includes(direction)) nextPosition.c += position.c % edgeLength;
                else if ([Direction.Left, Direction.Right].includes(direction)) nextPosition.r += position.r % edgeLength;
              } else if (edge.from.d === edge.to.d) {
                debug(1, 'edge flip');
                // travel direction is reversed
                // local direction coord is carried through
                // local perpendicular coord is reversed
                nextDirection = (direction + 2) % 4;
                if ([Direction.Up, Direction.Down].includes(direction)) {
                  nextPosition.r += position.r % edgeLength;
                  nextPosition.c += edgeLength - (position.c % edgeLength) - 1;
                } else if ([Direction.Left, Direction.Right].includes(direction)) {
                  nextPosition.c += position.c % edgeLength;
                  nextPosition.r += edgeLength - (position.r % edgeLength) - 1;
                }

                //cw / acw refers to the direction change. i.e up->right=cw. the corresponding edges are up->left=acw
              } else if ([3, -1].includes(edge.to.d - edge.from.d)) {
                debug(1, 'edge cw');
                // turn clockwise
                // (0,0) top left
                // direction===Up
                //   direction is Right (+1)
                //   local col is 0
                //   local row is old col
                // direction===Right
                //   direction is Down (+1)
                //   local col is edgeLength-(old row)
                //   local row is 0
                // direction===Down
                //   direction is Left (+1)
                //   local col is edgeLength-1
                //   local row is old col
                // direction===Left
                //   direction is Up (+1)
                //   local col is edgeLength-(old row)
                //   local row is edgeLength -1
                nextDirection = (direction + 1) % 4;
                if (direction === Direction.Up) nextPosition.r += position.c % edgeLength;
                else if (direction === Direction.Right) nextPosition.c += edgeLength - (position.r % edgeLength) - 1;
                else if (direction === Direction.Down) {
                  nextPosition.c += edgeLength - 1;
                  nextPosition.r += position.c % edgeLength;
                } else if (direction === Direction.Left) {
                  nextPosition.c += edgeLength - (position.r % edgeLength) - 1;
                  nextPosition.r += edgeLength - 1;
                }
              } else if ([1, -3].includes(edge.to.d - edge.from.d)) {
                debug(1, 'edge anti');
                // turn anticlockwise
                // (0,0) top left
                // direction===Up
                //   direction is Left (-1)
                //   local col is edgeLength-1
                //   local row is edgeLength-(old local col)
                // direction===Right
                //   direction is Up (-1)
                //   local col is old local row
                //   local row is edgeLength-1
                // direction===Down
                //   direction is Right (-1)
                //   local col is 0
                //   local row is edgeLength-(old local col)
                // direction===Left
                //   direction is Down (-1)
                //   local col is old local row
                //   local row is 0
                nextDirection = Maths.pmod(direction - 1, 4);
                if (direction === Direction.Up) {
                  nextPosition.c += edgeLength - 1;
                  nextPosition.r += edgeLength - (position.c % edgeLength) - 1;
                } else if (direction === Direction.Right) {
                  nextPosition.c += position.r % edgeLength;
                  nextPosition.r += edgeLength - 1;
                } else if (direction === Direction.Down) nextPosition.r += edgeLength - (position.c % edgeLength) - 1;
                else if (direction === Direction.Left) nextPosition.c += position.r % edgeLength;
              } else throw new Error('bruh');
              debug(1, { position, edgeLength, rows, cols, mapPosition, direction, edge, nextPosition, nextDirection });
            } else debug(1, 'no cube edge found', { position, direction });
          } else debug(1, 'not at an edge', { position, direction });
        } else {
          // wrap to bounds
          if ([Direction.Up, Direction.Down].includes(direction)) {
            const bounds = colBounds[nextPosition.c];
            if (nextPosition.r < bounds.start) nextPosition.r = bounds.end;
            else if (nextPosition.r > bounds.end) nextPosition.r = bounds.start;
          } else {
            const bounds = rowBounds[nextPosition.r];
            if (nextPosition.c < bounds.start) nextPosition.c = bounds.end;
            else if (nextPosition.c > bounds.end) nextPosition.c = bounds.start;
          }
        }

        // test charAt and move or break
        const charAt = grid[nextPosition.r][nextPosition.c];
        if (charAt === TileContent.Empty) {
          position = nextPosition;
          direction = nextDirection;
          history.push({ ...position, d: direction });
        } else if (charAt === TileContent.Wall) break;
        else
          throw new Error(
            `no position=${JSON.stringify(position)} nextPosition=${JSON.stringify(
              nextPosition
            )} direction=${direction} nextDirection=${nextDirection} offset=${JSON.stringify(offset)} "${charAt}"`
          );
      }
    } else if (instruction === 'L') direction = Maths.pmod(direction - 1, 4);
    else if (instruction === 'R') direction = (direction + 1) % 4;
    debug(1, { instruction, position, direction });
  }
  render();
  const result = (position.r + 1) * 1000 + (position.c + 1) * 4 + Maths.pmod(direction - 1, 4);
  return result;
};

const part1 = () => {
  const result = solve(parseInput());
  console.log('part 1:', result);

  // 133174
};

const part2 = () => {
  // parseInput();
  const result = solve(parseInput(), true);
  console.log('part 2:', result);

  // 119182 too high - more bugs
  // 73214 too high - still more
};

if (args.part1) part1();
if (args.part2) part2();
