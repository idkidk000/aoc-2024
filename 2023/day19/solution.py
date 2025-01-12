#!/usr/bin/env python3
# type: ignore
# FIXME: dump the tuples, reenable mypy

import sys
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

# if DEBUG > 1:
#   print(f'{workflows=}')
#   print(f'{parts=}')


def solve(part: tuple[int, int, int, int], workflow_name: str = 'in') -> bool:
  workflow = workflows[workflow_name]
  for rule in workflow:
    valid = True
    if rule[0]:
      prop = part[rule[0][0]]
      op = rule[0][1]
      val = rule[0][2]
      valid = (op == '>' and prop > val) or (op == '<' and prop < val)
    if valid:
      res = rule[1]
      match res:
        case 'A':
          return True
        case 'R':
          return False
      return solve(part, res)
  # mypy pipe down pls
  assert False


def solve3(subset: list[tuple[int, int]], workflow_name: str = 'in') -> int:
  if DEBUG > 0: print(f'{subset=} {workflow_name=}')
  if workflow_name == 'A':
    # hopefully the count of possible subset entries
    size = 1
    for part in subset:
      # off by one clown strikes again
      size *= part[1] - part[0] + 1
    if DEBUG > 1: print(f'  accept {size=}')
    return size
  if workflow_name == 'R': return 0
  workflow, count = workflows[workflow_name], 0
  for rule in workflow:
    if DEBUG > 1: print(f'  {rule=}')
    dest = rule[1]
    if rule[0]:
      part_ix = rule[0][0]
      part_from = subset[part_ix][0]
      part_to = subset[part_ix][1]
      op = rule[0][1]
      val = rule[0][2]
      #FIXME: might validate that val+-1 is not out of range for partial matches
      if op == '<' and part_from < val:
        # complete match - we can return here
        if part_to < val: return count + solve3(subset, dest)
        else:
          # partial match. pass matched part to dest, remainder to next rule
          match_subset = [*subset]
          match_subset[part_ix] = (part_from, val - 1)
          count += solve3(match_subset, dest)
          subset[part_ix] = (val, part_to)
      elif op == '>' and part_to > val:
        # complete match - we can return here
        if part_from > val: return count + solve3(subset, dest)
        else:
          # partial match. pass matched part to dest, remainder to next rule
          match_subset = [*subset]
          match_subset[part_ix] = (val + 1, part_to)
          count += solve3(match_subset, dest)
          subset[part_ix] = (part_from, val)
      # else next rule
    else:
      # conditionless is the last rule so we can return here
      return count + solve3(subset, dest)
  assert False


def part1():
  total = 0
  for part in parts:
    if solve(part):
      total += part[0] + part[1] + part[2] + part[3]
  print(f'part 1: {total=}')


def part2():
  result = solve3([(1, 4000)] * 4)
  print(f'part 2: {result}')
  # 123331556462603

if PART1: part1()
if PART2: part2()
