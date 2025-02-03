#!/usr/bin/env -S deno --allow-read
import { args, debug, Maths, MathsUtils, Vec2, Vec2Utils } from '../../.template/_/utils.ts';

const parseInput = (): { min: Vec2; max: Vec2 } =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/x=(-?\d+)..(-?\d+), y=(-?\d+)..(-?\d+)/gm)
    .map(([_, x0, x1, y0, y1]) => [...MathsUtils.minMax(Number(x0), Number(x1)), ...MathsUtils.minMax(Number(y0), Number(y1))])
    .map(([minX, maxX, minY, maxY]) => ({
      min: { x: minX, y: minY },
      max: { x: maxX, y: maxY },
    }))
    .toArray()[0];

const simulate = (target: { min: Vec2; max: Vec2 }, initialVelocity: Vec2) => {
  const velocity = { ...initialVelocity };
  let position: Vec2 = { x: 0, y: 0 };
  let highestY = position.y;
  let hit = false;

  while (!hit && position.x <= target.max.x && position.y >= target.min.y) {
    position = Vec2Utils.add(position, velocity);
    highestY = Maths.max(highestY, position.y);
    hit = target.min.x <= position.x && position.x <= target.max.x && target.min.y <= position.y && position.y <= target.max.y;
    if (velocity.x > 0) --velocity.x;
    else if (velocity.x < 0) ++velocity.x;
    --velocity.y;
  }

  return { hit, highestY };
};

const part1 = () => {
  const target = parseInput();

  const binarySearch = (minInitialY: number, maxInitialY: number, minInitialX: number, maxInitialX: number) => {
    let highestY = -Infinity;

    while (minInitialY < maxInitialY) {
      const midInitialY = Maths.floor((minInitialY + maxInitialY) / 2) + 1;
      let hit = false;

      for (let x = minInitialX; x <= maxInitialX && !hit; ++x) {
        const { hit: simHit, highestY: simHighestY } = simulate(target, { x, y: midInitialY });
        hit = simHit;
        if (hit) highestY = Maths.max(highestY, simHighestY);
      }

      debug(1, { midInitialY, hit, minInitialY, maxInitialY });
      if (hit) minInitialY = midInitialY;
      else maxInitialY = midInitialY - 1;
      if (minInitialY >= maxInitialY && hit) maxInitialY += 100;
    }
    return { minInitialY, highestY };
  };

  const { highestY } = binarySearch(1, 50, 1, target.max.x);
  console.log('part 1:', highestY);
};

const part2 = () => {
  const target = parseInput();
  let result = 0;
  // 107 is the y velocity result of the p1 binary search
  for (let y = target.min.y; y <= 107; ++y) {
    for (let x = 1; x <= target.max.x; ++x) {
      const { hit } = simulate(target, { x, y });
      if (hit) ++result;
    }
  }
  console.log('part 2:', result);
};

if (args.part1) part1();
if (args.part2) part2();
