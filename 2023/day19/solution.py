#!/usr/bin/env python3
import sys
from functools import cache
from dataclasses import dataclass
from typing import Self
import re

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

# yapf: disable
for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i': FILENAME = 'input.txt'
      case '-p1': PART1, PART2 = True, False
      case '-p2': PART1, PART2 = False, True
      case '-p0': PART1, PART2 = False, False
      case _: raise Exception(f'unknown {arg=}')

WORKFLOWS_RE = re.compile(r'^([a-z]+)\{(.+)\}$', re.MULTILINE)
RULES_RE = re.compile(r'(?:([xmas])([<>])([0-9+]+):)?(R|A|[a-z]+),?')
PARTS_RE = re.compile(r'^\{x=([0-9]+),m=([0-9]+),a=([0-9]+),s=([0-9]+)\}$', re.MULTILINE)
with open(FILENAME, 'r') as f:
  sections = f.read().split('\n\n')
workflows = {
  w.group(1): [
    (
      (
        {'x': 0, 'm': 1, 'a': 2, 's': 3}[r.group(1)],
        r.group(2),
        int(r.group(3)),
      ) if r.group(1) else (),
      r.group(4),
    )
    for r in re.finditer(RULES_RE, w.group(2))
  ]
  for w in re.finditer(WORKFLOWS_RE, sections[0])
}
#yapf: enable
# tuple so it can be memoised
parts = [
  (
    int(p.group(1)),
    int(p.group(2)),
    int(p.group(3)),
    int(p.group(4)),
  ) for p in re.finditer(PARTS_RE, sections[1])
]

if DEBUG > 1:
  print(f'{workflows=}')
  print(f'{parts=}')


@cache
def evaluate(part: tuple[int, int, int, int], workflow_name: str) -> bool:
  workflow = workflows[workflow_name]
  for rule in workflow:
    valid = True
    if rule[0]:
      prop = part[rule[0][0]]  #type: ignore
      op = rule[0][1]
      val = rule[0][2]
      valid = (op == '>' and prop > val) or (op == '<' and prop < val)  #type: ignore
    if valid:
      res = rule[1]
      match res:
        case 'A':
          return True
        case 'R':
          return False
      return evaluate(part, res)
  # mypy pipe down pls
  assert False


def part1():
  total = 0
  for part in parts:
    if evaluate(part, 'in'):
      total += part[0] + part[1] + part[2] + part[3]
  print(f'part 1: {total=}')


def part2():
  # oh no it's worse than i thought
  ...


if PART1: part1()
if PART2: part2()
