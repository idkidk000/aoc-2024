#!/usr/bin/env -S deno --allow-read
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
const input = await Deno.readTextFile(args.filename);
// #endregion

type PartProperty = 'x' | 'm' | 'a' | 's';
type RuleComparator = '<' | '>';
interface Rule {
  property: PartProperty;
  comparator: RuleComparator;
  value: number;
  nextWorkflow: string;
}
interface Workflow {
  rules: Rule[];
  fallback: string;
}
interface Part {
  x: number;
  m: number;
  a: number;
  s: number;
}
interface Range {
  from: number;
  to: number;
}
interface PartRange {
  x: Range;
  m: Range;
  a: Range;
  s: Range;
}

const parseInput = () => {
  const [workflowsSection, partsSection] = input.split('\n\n');

  const workflowRegex = /^([a-z]+)\{(.*),(R|A|[a-z]+)\}$/gm;
  const ruleRegex = /([xmas])([<>])(\d+):(R|A|[a-z]+)(?:,|$)/g;

  const workflows = new Map<string, Workflow>(
    workflowsSection.matchAll(workflowRegex).map((workflowMatch) => [
      workflowMatch[1],
      {
        rules: workflowMatch[2]
          .matchAll(ruleRegex)
          .map((ruleMatch) => ({
            property: ruleMatch[1] as PartProperty,
            comparator: ruleMatch[2] as RuleComparator,
            value: Number(ruleMatch[3]),
            nextWorkflow: ruleMatch[4],
          }))
          .toArray(),
        fallback: workflowMatch[3],
      },
    ])
  );
  debug(3, workflows);

  const partRegex = /^\{x=(\d+),m=(\d+),a=(\d+),s=(\d+)\}$/gm;

  const parts: Part[] = partsSection
    .matchAll(partRegex)
    .map((partMatch) => ({
      x: Number(partMatch[1]),
      m: Number(partMatch[2]),
      a: Number(partMatch[3]),
      s: Number(partMatch[4]),
    }))
    .toArray();
  debug(3, parts);

  return { parts, workflows };
};

const testPart = (part: Part, workflows: Map<string, Workflow>, workflowName: string = 'in') => {
  debug(1, { part, workflowName });
  if (workflowName === 'R') return false;
  if (workflowName === 'A') return true;
  const workflow = workflows.get(workflowName)!;
  for (const rule of workflow.rules) {
    if (
      (rule.comparator === '<' && part[rule.property] < rule.value) ||
      (rule.comparator === '>' && part[rule.property] > rule.value)
    )
      return testPart(part, workflows, rule.nextWorkflow);
  }
  return testPart(part, workflows, workflow.fallback);
};

const testRange = (range: PartRange, workflows: Map<string, Workflow>, workflowName: string = 'in'): number => {
  debug(1, { range, workflowName });
  if (workflowName === 'R') return 0;
  if (workflowName === 'A')
    return (
      (range.x.to - range.x.from + 1) *
      (range.m.to - range.m.from + 1) *
      (range.a.to - range.a.from + 1) *
      (range.s.to - range.s.from + 1)
    );
  const workflow = workflows.get(workflowName)!;
  let count = 0;
  for (const rule of workflow.rules) {
    // count+=testRange(matchedRange), range=unmatchedRange
    if (rule.comparator === '<' && range[rule.property].from < rule.value) {
      if (range[rule.property].to < rule.value) return count + testRange(range, workflows, rule.nextWorkflow);
      count += testRange(
        { ...range, [rule.property]: { ...range[rule.property], to: rule.value - 1 } },
        workflows,
        rule.nextWorkflow
      );
      range = { ...range, [rule.property]: { ...range[rule.property], from: rule.value } };
    }
    if (rule.comparator === '>' && range[rule.property].to > rule.value) {
      if (range[rule.property].from > rule.value) return count + testRange(range, workflows, rule.nextWorkflow);
      count += testRange(
        { ...range, [rule.property]: { ...range[rule.property], from: rule.value + 1 } },
        workflows,
        rule.nextWorkflow
      );
      range = { ...range, [rule.property]: { ...range[rule.property], to: rule.value } };
    }
  }
  return count + testRange(range, workflows, workflow.fallback);
};

const part1 = () => {
  const { parts, workflows } = parseInput();
  const total = parts.reduce((acc, part) => (testPart(part, workflows) ? acc + part.x + part.m + part.a + part.s : acc), 0);
  console.log('part 1:', total);
  // 418498
};

const part2 = () => {
  const { workflows } = parseInput();
  const total = testRange(
    { x: { from: 1, to: 4000 }, m: { from: 1, to: 4000 }, a: { from: 1, to: 4000 }, s: { from: 1, to: 4000 } },
    workflows
  );
  console.log('part 2:', total);
  // 123331556462603
};

if (args.part1) part1();
if (args.part2) part2();
