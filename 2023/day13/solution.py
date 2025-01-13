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

  # bit grim. return a tuple of result and smudged. smudged can't be accessed directly by compare if declared above in find_reflection

  def compare(v0: str, v1: str, smudged: bool) -> tuple[bool, bool]:
    if (not smudge) or smudged or v0 == v1: return (v0 == v1, smudged)
    # smudge is true, smudged is false, v0!=v1
    diff = 0
    for x, y in zip(v0, v1):
      if x != y: diff += 1
    if diff == 1:
      smudged = True
    if DEBUG > 2: print(f'    {v0=}\n    {v1=} {diff=} {smudged=}')
    return (smudged, smudged)

  size = len(grid)
  if DEBUG > 2:
    for i in range(size):
      print(f'{i:2d}: {grid[i]}')
  if DEBUG > 0: print(f'{flip=} {size=}')
  for outer in range(0, size - 1):
    smudged = False  # reset on every outer
    if DEBUG > 2: print(f'  test {outer=:2d} {grid[outer]}\n     {outer+1=:2d} {grid[outer+1]}')
    result, smudged = compare(grid[outer], grid[outer + 1], smudged)
    if not result: continue
    if DEBUG > 1: print(f'  possible {outer=} {smudged=}')
    matched = True
    for i in range(1, size):
      upper = outer - i
      lower = outer + 1 + i
      if not (0 <= upper < size and 0 <= lower < size): break
      if DEBUG > 2: print(f'    {upper=:2d} {grid[upper]}\n    {lower=:2d} {grid[lower]}')
      result, smudged = compare(grid[upper], grid[lower], smudged)
      if not result:
        if DEBUG > 1: print(f'  no match')
        matched = False
        break
    if matched:
      if DEBUG > 0: print(f'matched {outer+1} {flip=}')
      return outer + 1
  return None


def solve(smudge: bool = False) -> int:
  total = 0
  for i, grid in enumerate(grids):
    if (r := find_reflection(grid, False, smudge)):
      total += r * 100
    # flip to list of cols
    elif (c := find_reflection(grid, True, smudge)):
      total += c
    else:
      print(f'{i=} found no reflection')
  return total


def part1():
  result = solve()
  print(f'part 1: {result}')
  # 37975


def part2():
  result = solve(True)
  print(f'part 2: {result}')
  # 35177 too high


if PART1 == PART2 == False: find_reflection(grids[1], False, True)
if PART1: part1()
if PART2: part2()
