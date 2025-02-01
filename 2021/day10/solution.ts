#!/usr/bin/env -S deno --allow-read
import { args, Maths } from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim());

const solve = (data: Array<string>) => {
  const tags = new Map<string, { other: string; score: number }>([
    [')', { other: '(', score: 3 }],
    [']', { other: '[', score: 57 }],
    ['}', { other: '{', score: 1197 }],
    ['>', { other: '<', score: 25137 }],
    ['(', { other: ')', score: 1 }],
    ['[', { other: ']', score: 2 }],
    ['{', { other: '}', score: 3 }],
    ['<', { other: '>', score: 4 }],
  ]);

  let corruptedScore = 0;
  const completionScores = new Array<number>();
  for (const line of data) {
    const stack = new Array<string>();
    let corrupted = false;
    for (const char of line) {
      if ('([{<'.includes(char)) stack.push(char);
      else if (stack.pop() !== tags.get(char)!.other) {
        corruptedScore += tags.get(char)!.score;
        corrupted = true;
      }
    }
    if (!corrupted) {
      let completionScore = 0;
      while (stack.length > 0) {
        completionScore *= 5;
        completionScore += tags.get(stack.pop()!)!.score;
      }
      completionScores.push(completionScore);
    }
  }

  const completionScore = completionScores.toSorted((a, b) => a - b).at(Maths.floor(completionScores.length / 2));
  return { corruptedScore, completionScore };
};

const part1 = () => {
  const { corruptedScore } = solve(parseInput());
  console.log('part 1', corruptedScore);
};

const part2 = () => {
  const { completionScore } = solve(parseInput());
  console.log('part 2', completionScore);
};

if (args.part1) part1();
if (args.part2) part2();
