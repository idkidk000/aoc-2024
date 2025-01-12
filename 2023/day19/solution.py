#!/usr/bin/env python3
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
    {
      'condition': {
        'prop': r.group(1),
        'comp': r.group(2),
        'value': int(r.group(3)),
      } if r.group(1) else None,
      'dest': r.group(4),
    }
    for r in re.finditer(RULES_RE, w.group(2))
  ]
  for w in re.finditer(WORKFLOWS_RE, sections[0])
}
#yapf: enable
parts = [
  {
    'x': int(p.group(1)),
    'm': int(p.group(2)),
    'a': int(p.group(3)),
    's': int(p.group(4)),
  } for p in re.finditer(PARTS_RE, sections[1])
]

if DEBUG > 2:
  print(f'{workflows=}')
  print(f'{parts=}')


def can_accept(part: dict[str, int], workflow_name: str = 'in') -> bool:
  if workflow_name == 'A': return True
  if workflow_name == 'R': return False
  workflow = workflows[workflow_name]
  for rule in workflow:
    condition = rule['condition']
    dest = rule['dest']
    assert isinstance(dest, str)
    if isinstance(condition, dict):
      prop = part[condition['prop']]
      comp = condition['comp']
      value = condition['value']
      if (comp == '>' and prop > value) or (comp == '<' and prop < value):
        return can_accept(part, dest)
    else:
      return can_accept(part, dest)
  assert False


def count_accepted(subset: dict[str, tuple[int, int]], workflow_name: str = 'in') -> int:
  if DEBUG > 0: print(f'{subset=} {workflow_name=}')
  if workflow_name == 'A':
    # count of possible parts described by subset
    size = 1
    for part in subset.values():
      size *= part[1] - part[0] + 1
    if DEBUG > 1: print(f'  accept {size=}')
    return size
  if workflow_name == 'R': return 0
  workflow, count = workflows[workflow_name], 0
  for rule in workflow:
    if DEBUG > 1: print(f'  {rule=}')
    condition = rule['condition']
    dest = rule['dest']
    assert isinstance(dest, str)
    if isinstance(condition, dict):
      prop = condition['prop']
      prop_from = subset[prop][0]
      prop_to = subset[prop][1]
      comp = condition['comp']
      value = condition['value']
      if comp == '<' and prop_from < value:
        # complete match - we can return here
        if prop_to < value: return count + count_accepted(subset, dest)
        else:
          # partial match. pass matched part to dest, remainder to next rule
          match_subset = subset | {prop: (prop_from, value - 1)}
          count += count_accepted(match_subset, dest)
          subset[prop] = (value, prop_to)
      elif comp == '>' and prop_to > value:
        # complete match - we can return here
        if prop_from > value: return count + count_accepted(subset, dest)
        else:
          # partial match. pass matched part to dest, remainder to next rule
          match_subset = subset | {prop: (value + 1, prop_to)}
          count += count_accepted(match_subset, dest)
          subset[prop] = (prop_from, value)
      # else next rule
    else:
      # conditionless is the last rule so we can return here
      return count + count_accepted(subset, dest)
  assert False


def part1():
  total = 0
  for part in parts:
    if can_accept(part):
      total += part['x'] + part['m'] + part['a'] + part['s']
  print(f'part 1: {total}')
  # 418498


def part2():
  # yapf: disable
  result = count_accepted({x: (1, 4000) for x in ['x', 'm', 'a', 's']})
  print(f'part 2: {result}')
  # 123331556462603

if PART1: part1()
if PART2: part2()
