#!/usr/bin/env deno

const Maths = Math;

interface Coord {
  r: number;
  c: number;
}

const coords = new Array<Coord>({ r: 0, c: 0 }, { r: 1, c: 1 }, { r: 0, c: 2 }, { r: 1, c: 2 }, { r: 2, c: 2 }, { r: 2, c: 3 });

const getBounds = (data: Array<Coord>) => {
  const maxR = Maths.max(...data.map((item) => item.r));
  const maxC = Maths.max(...data.map((item) => item.c));
  return { maxR, maxC };
};

const render = (data: Array<Coord>, label: string) => {
  const { maxR, maxC } = getBounds(data);
  const output = new Array<string>(label);
  for (let r = 0; r <= maxR; ++r) {
    let line = `${r.toString().padStart(2, ' ')}: `;
    for (let c = 0; c <= maxC; ++c) {
      line += data.find((value) => value.r === r && value.c === c) ? '#' : '.';
    }
    output.push(line);
  }
  console.log(output.join('\n') + '\n');
};

const rotate = (data: Array<Coord>, clockwise: boolean) => {
  const { maxR, maxC } = getBounds(data);
  return clockwise
    ? data.map((item) => ({ r: item.c, c: maxR - item.r }))
    : data.map((item) => ({ r: maxC - item.c, c: item.r }));
};

render(coords, 'base');
render(rotate(coords, false), 'anti');
render(rotate(coords, true), 'clock');

let test = coords;
for (let i = 0; i < 4; ++i) {
  test = rotate(test, true);
  render(test, `cw ${i}`);
}
