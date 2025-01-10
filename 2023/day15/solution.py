#!/usr/bin/env python3
import sys
from functools import cache
import re
from collections import defaultdict

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i':
        FILENAME = 'input.txt'
      case '-p1':
        PART1, PART2 = True, False
      case '-p2':
        PART1, PART2 = False, True
      case '-p0':
        PART1, PART2 = False, False
      case _:
        raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  inputs = ''.join(f.read().splitlines()).split(',')


def hashfn(val: str) -> int:
  res = 0
  for x in val:
    res += ord(x)
    res *= 17
    res %= 256
  return res


def part1():
  total = 0
  for x in inputs:
    total += hashfn(x)
  print(f'part 1: {total}')


def part2():
  # did a high person write this question
  regex = re.compile(r'([a-z]+)([-=])([0-9]?)')
  # python dict preserves insertion order. solves in other languages will be fun
  boxes: defaultdict[int, dict[str, int]] = defaultdict(lambda: dict())
  for x in inputs:
    match = re.match(regex, x)
    assert match
    label = match.group(1)
    op = match.group(2)
    lens = int(match.group(3)) if match.group(3) else None
    box = hashfn(label)
    if DEBUG > 1: print(f'{x=} {label=} {op=} {lens=} {box=}')
    match op:
      case '=':
        assert lens
        boxes[box][label] = lens
      case '-':
        # delete lens. delete box if empty
        if label in boxes.get(box, {}):
          del boxes[box][label]
          if not boxes[box]:
            del boxes[box]
      case _:
        assert False, f'{op=}'
    if DEBUG > 1: print(f'  {dict(boxes)}')

  total = 0
  for box_id, lenses in boxes.items():
    for slot_id, lens in enumerate(lenses.values()):
      value = (box_id + 1) * (slot_id + 1) * lens
      if DEBUG > 0: print(f'{box_id=} {slot_id=} {lens=} {value=}')
      total += value
  print(f'part 2: {total}')


if PART1: part1()
if PART2: part2()
