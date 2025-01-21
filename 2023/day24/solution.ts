#!/usr/bin/env -S deno --allow-read --allow-write
// #region base aoc template
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

class Vec3 {
  //Number is too innacurate. Bigint produces the correct result for p1 but it's obviously an integer
  constructor(public readonly x: bigint, public readonly y: bigint, public readonly z: bigint) {}
  add = (other: Vec3) => new Vec3(this.x + other.x, this.y + other.y, this.z + other.z);
  toString = () => `Vec3 { x: ${this.x}, y: ${this.y}, z: ${this.z} }`;
  [Symbol.for('Deno.customInspect')]() {
    return this.toString();
  }
}
class Hailstone {
  constructor(public readonly id: number, public readonly position: Vec3, public readonly velocity: Vec3) {}
  toString = () => `Hailstone { id: ${this.id}, position: ${this.position.toString()}, velocitiy: ${this.velocity.toString()} }`;
  [Symbol.for('Deno.customInspect')]() {
    return this.toString();
  }
}

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .matchAll(/^(-?\d+),\s+(-?\d+),\s+(-?\d+)\s+@\s+(-?\d+),\s+(-?\d+),\s+(-?\d+)$/gm)
    .map<Hailstone>(
      (tokens, i) =>
        new Hailstone(
          i,
          new Vec3(BigInt(tokens[1]), BigInt(tokens[2]), BigInt(tokens[3])),
          new Vec3(BigInt(tokens[4]), BigInt(tokens[5]), BigInt(tokens[6]))
        )
    )
    .toArray();

const part1 = () => {
  const hailstones = parseInput();
  const [minXy, maxXy] = [200_000_000_000_000n, 400_000_000_000_000n];
  debug(1, hailstones);
  // copying from my python solve because this wasn't fun the first time around either :)
  const collisionCounts = new Map<string, number>();
  const incrementCounter = (collides: boolean, inside: boolean, future: boolean) => {
    // yes this function is a catastrophe thank u for noticing :)
    const labels = new Array<string>();
    if (!collides) labels.push('none');
    else {
      labels.push('totalCollisions');
      if (future) labels.push('totalFuture');
      else labels.push('totalPast');
      if (inside) labels.push('totalInside');
      else labels.push('totalOutside');
      if (future && inside) labels.push('futureInside');
      else if (future && !inside) labels.push('futureOutside');
      else if (!future && inside) labels.push('pastInside');
      else if (!future && !inside) labels.push('pastOutside');
      else throw new Error('bruh');
    }
    for (const label of labels) collisionCounts.set(label, (collisionCounts.get(label) ?? 0) + 1);
  };
  // const output = new Array<string>();
  for (const [i, left] of hailstones.entries()) {
    for (const right of hailstones.slice(i + 1)) {
      debug(3, { left, right });
      const [v1, v2, v3, v4] = [
        left.position,
        left.position.add(left.velocity),
        right.position,
        right.position.add(right.velocity),
      ];
      const denominator = (v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x);
      if (denominator == 0n) {
        incrementCounter(false, false, false);
        continue;
      }
      const px = ((v1.x * v2.y - v1.y * v2.x) * (v3.x - v4.x) - (v1.x - v2.x) * (v3.x * v4.y - v3.y * v4.x)) / denominator;
      const py = ((v1.x * v2.y - v1.y * v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x * v4.y - v3.y * v4.x)) / denominator;
      const leftDotProduct = (px - left.position.x) * left.velocity.x + (py - left.position.y) * left.velocity.y;
      const rightDotProduct = (px - right.position.x) * right.velocity.x + (py - right.position.y) * right.velocity.y;
      const collisionFuture = leftDotProduct >= 0 && rightDotProduct >= 0;
      const collisionInside = minXy <= px && px <= maxXy && minXy <= py && py <= maxXy;
      debug(2, {
        left: left.toString(),
        right: right.toString(),
        denominator,
        px,
        py,
        leftDotProduct,
        rightDotProduct,
        collisionFuture,
        collisionInside,
      });
      // output.push(`${left.id} ${right.id} ${denominator} ${px} ${py}`);
      incrementCounter(true, collisionInside, collisionFuture);
    }
  }
  // Deno.writeTextFileSync('output.ts.txt', output.join('\n'));
  debug(1, collisionCounts);
  console.log('part 1', collisionCounts.get('futureInside'));
};

const part2 = () => {
  // i couldn't solve this by myself in python with libraries
  // i definitely can't solve it in ts
};

if (args.part1) part1();
if (args.part2) part2();
