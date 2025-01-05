#!/usr/bin/env python3
import sys
from functools import cache

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

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
  histories = [[int(y) for y in x.split()] for x in f.read().splitlines()]


def part1():
  total = 0
  for history in histories:
    if DEBUG > 1: print(f'{history=}')
    #this feels horrible but idk yet how to optimise it
    # use history as the lowest level of deltas
    deltas: list[list[int]] = [history]
    # keep adding a layer until they're all zeroes
    #FIXME: the breakout condition is mine in case of bugs
    while any(x != 0 for x in deltas[-1]) or len(deltas) == 1:
      if DEBUG > 1: print(f'  append {deltas[-1]=}')
      deltas.append([y - x for x, y in zip(deltas[-1], deltas[-1][1:])])
    if DEBUG > 1: print(f'  {deltas=}')
    # care to extrapolate?
    for i in range(len(deltas) - 2, -1, -1):
      if DEBUG > 1: print(f'  {i=}')
      deltas[i].append(deltas[i][-1] + deltas[i + 1][-1])
    if DEBUG > 1: print(f'{deltas[0]=}')
    total += deltas[0][-1]
  print(f'part 1: {total}')


def part2():
  total = 0
  for history in histories:
    if DEBUG > 1: print(f'{history=}')
    # we can just reverse history instead of trying to pushleft on a list and having all kinds of perf issues
    deltas: list[list[int]] = [list(reversed(history))]
    while any(x != 0 for x in deltas[-1]) or len(deltas) == 1:
      if DEBUG > 1: print(f'  append {deltas[-1]=}')
      deltas.append([y - x for x, y in zip(deltas[-1], deltas[-1][1:])])
    if DEBUG > 1: print(f'  {deltas=}')
    for i in range(len(deltas) - 2, -1, -1):
      if DEBUG > 1: print(f'  {i=}')
      deltas[i].append(deltas[i][-1] + deltas[i + 1][-1])
    if DEBUG > 1: print(f'{deltas[0]=}')
    total += deltas[0][-1]
  print(f'part 1: {total}')


if PART1: part1()
if PART2: part2()
