#!/usr/bin/env python3
# type: ignore
# FIXME: dump the tuples, reenable mypy

import sys
from functools import cache
import re
from itertools import product

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
VAL_MIN, VAL_MAX = 1, 4000
VAL_LEN = VAL_MAX - VAL_MIN
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


def combos_between(prev: tuple[int, int, int, int], this: tuple[int, int, int, int]) -> int:
  res = (this[3] - prev[3]) + \
    ((this[2] - prev[2]) * VAL_LEN) + \
    ((this[1] - prev[1]) * (VAL_LEN**2)) + \
    ((this[0] - prev[0]) * (VAL_LEN**3))
  return res


def make_part(source: tuple[int, int, int, int], ix: int, val: int) -> tuple[int, int, int, int]:
  #FIXME: i'm doing it wrong
  # refactor into a split_range function. give it pfrom,pto,index,operator,value
  # a generator might be helpful since this is going to be terrible
  lsource = list(source)
  lsource[ix] = val
  return tuple(lsource)


def solve2(pfrom: tuple[int, int, int, int], pto: tuple[int, int, int, int], workflow_name: str = 'in') -> int:
  if workflow_name == 'A': return combos_between(pfrom, pto)
  if workflow_name == 'R': return 0
  #TODO:
  # the p2 solution is not memoisation since the tuples are unique
  # instead, the function should resursively split pfrom-pto and return just the A count
  # oh actually it might also be memoistation since the splitting is going be be quite dramatic and exponential
  count = 0
  workflow = workflows[workflow_name]
  for rule in workflow:
    dest = rule[1]
    if rule[0]:
      part_ix = rule[0][0]
      prop_from = pfrom[rule[0][0]]
      prop_to = pto[rule[0][0]]
      op = rule[0][1]
      val = rule[0][2]
      if op == '<' and prop_from < val:
        #FIXME: var names are terrible
        #FIXME: refactor this a lot
        # entire range matched
        if prop_to < val: return count + solve2(pfrom, pto, dest)
        else:
          # split range
          #BUG: i think i'm doing something dumb with the range splits
          # edit: i am lol
          # 1,1,1,1 -> 4,4,4,4 split at ix=2 val<3 ->
          #       v          v
          #   1,1,1,1 -> 1,1,2,4 true
          #   1,1,3,1 -> 1,1,4,4 false
          #   1,2,1,1 -> 1,2,2,4 true
          #   1,2,3,1 -> 1,2,4,4 false
          #   1,3,1,1 -> 1,3,2,4 true
          #   1,3,3,1 -> 1,3,4,4 false
          # ... etc
          # Ohhhhh i'm still being thick
          #   get rid of pfrom and pto. we need a from and to of each element. which i don't really know how to refer to bc tuple hell
          #   so using the language from the input: x_from,x_to,m_from,m_to,a_from,a_to...
          #   then each rule does only cause one split at most
          count += solve2(pfrom, make_part(pto, part_ix, val - 1), dest)
          pfrom = make_part(pto, part_ix, val)
      elif op == '>' and prop_to > val:
        # entire range matched
        if prop_from > val: return count + solve2(pfrom, pto, dest)
        else:
          # split range
          count += solve2(make_part(pfrom, part_ix, val + 1), pto, dest)
          pto = make_part(pfrom, part_ix, val)
    else:
      count += solve2(pfrom, pto, dest)
  return count


def part1():
  total = 0
  for part in parts:
    if solve(part):
      total += part[0] + part[1] + part[2] + part[3]
  print(f'part 1: {total=}')


def part2():
  # collect all the boundaries for each input. then we'll run all the combos of those and hopefully get an answer in a reasonable amount of time

  values = {x: set([VAL_MIN, VAL_MAX]) for x in range(4)}
  for workflow in workflows.values():
    for rule in workflow:
      if not rule[0]: continue
      values[rule[0][0]].add(rule[0][2])
      if rule[0][1] == '<': values[rule[0][0]].add(rule[0][2] - 1)
      if rule[0][1] == '>': values[rule[0][0]].add(rule[0][2] + 1)

  if DEBUG > 0:
    for k, v in values.items():
      print(f'{k=} {len(v)=}')
  # yike 57,204,677,600 combos. this is still far too many
  #TODO: rework solve

  prev_accept, prev_combo = False, (VAL_MIN, VAL_MIN, VAL_MIN, VAL_MIN)
  total = 0
  for combo in product(sorted(values[0]), sorted(values[1]), sorted(values[2]), sorted(values[3])):
    accept = solve(combo)
    if DEBUG > 0: print(f'{prev_combo=} {prev_accept} -> {combo=} {accept=}')
    #TODO: can we ever get a success between two fails? i think no since we cover both sides of each boundary. but idk maybe
    if accept and prev_accept: total += combos_between(prev_combo, combo)
    prev_accept, prev_combo = accept, combo
  print(f'part 2: {total}')



if PART1: part1()
if PART2: part2()
