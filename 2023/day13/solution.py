#!/usr/bin/env python3
import sys

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
#yapf: enable

with open(FILENAME, 'r') as f:
  sections = f.read().split('\n\n')
grids = [x.splitlines() for x in sections]


def find_reflection(grid: list[str], flip: bool = False, smudge: bool = False) -> int | None:
  if flip: grid = [''.join(x) for x in zip(*grid)]
  size = len(grid)
  if DEBUG > 2:
    for i in range(size):
      print(f'{i:2d}: {grid[i]}')
  if DEBUG > 0: print(f'{flip=} {size=}')
  for outer in range(size - 1):
    matched, smudged = True, False
    for inner in range(size):
      upper = outer - inner
      lower = outer + 1 + inner
      if not (0 <= upper < size and 0 <= lower < size): break
      if DEBUG > 2: print(f'  {upper=:2d} {grid[upper]}\n  {lower=:2d} {grid[lower]}')
      if grid[upper] == grid[lower]:
        if DEBUG > 2: print('    match')
      elif smudge and (not smudged) and len([x for x, y in zip(grid[upper], grid[lower]) if x != y]) == 1:
        smudged = True
        if DEBUG > 2: print('    match with smudge')
      else:
        if DEBUG > 2: print(f'  no match')
        matched = False
        break
    if matched and inner > 0:
      if smudge and not smudged:
        if DEBUG > 0: print('invalid, no smudge found')
      else:
        if DEBUG > 0: print(f'matched {outer+1} {flip=}')
        return outer + 1
  return None


def solve(smudge: bool = False) -> int:
  total = 0
  for i, grid in enumerate(grids):
    if (r := find_reflection(grid, False, smudge)):
      total += 100 * r
    elif (c := find_reflection(grid, True, smudge)):
      total += c
    else:
      raise RuntimeError(f'{i=} found no reflection')
  return total


def part1():
  result = solve()
  print(f'part 1: {result}')
  # 37975


def part2():
  result = solve(True)
  print(f'part 2: {result}')
  # "every mirror has exactly one smudge"
  # 32497


if PART1 == PART2 == False: find_reflection(grids[1], False, True)
if PART1: part1()
if PART2: part2()
