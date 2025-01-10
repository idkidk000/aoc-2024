#!/usr/bin/env python3
import sys
from functools import cache
from collections import deque

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
  text = f.read()
grid = [list(x) for x in text.splitlines()]
rows = len(grid)
cols = len(grid[0])


def draw_grid(grid: list[list[str]]):
  if DEBUG:
    for r in range(rows):
      print(f'''{r: 3d}  {''.join(grid[r])}''')
    print(f'{rows=} {cols=}')


def solve(start: tuple[int, int, int] = (0, 0, 1)) -> int:
  beam_queue = deque([start])
  beams: set[tuple[int, int, int]] = set()
  mirrors = {'/': {0: 1, 1: 0, 2: 3, 3: 2}, '\\': {0: 3, 1: 2, 2: 1, 3: 0}}

  while len(beam_queue):
    r, c, d = beam_queue.pop()
    # doing tile validation here makes the code simpler but there can be duplicate queue items
    if r < 0 or r >= rows or c < 0 or c >= cols or (r, c, d) in beams: continue
    beams.add((r, c, d))
    item = grid[r][c]
    if item in ['/', '\\']:
      nd = mirrors[item][d]
    elif (d in [1, 3] and item == '|') or (d in [0, 2] and item == '-'):
      for step in (-1, 1):
        nd = (d + step) % 4
        nr, nc = r + D4[nd][0], c + D4[nd][1]
        beam_queue.append((nr, nc, nd))
      continue
    else:
      nd = d
    nr, nc = r + D4[nd][0], c + D4[nd][1]
    beam_queue.append((nr, nc, nd))

  energised = {(r, c) for r, c, d in beams}
  if DEBUG > 0:
    test_grid = [[y for y in x] for x in grid]
    for r, c in energised:
      item = grid[r][c]
      if item == '.': item = '#'
      test_grid[r][c] = f'\x1b[1;31m{item}\x1b[0m'
    draw_grid(test_grid)
  if DEBUG > 1: print(f'{len(beams)=} {len(energised)=}')
  return len(energised)


def part1():
  result = solve()
  print(f'part 1: {result}')


def part2():
  maxval = 0
  for r in range(rows):
    maxval = max(maxval, solve((r, 0, 1)))
    maxval = max(maxval, solve((r, cols - 1, 3)))
  for c in range(cols):
    maxval = max(maxval, solve((0, c, 2)))
    maxval = max(maxval, solve((rows - 1, c, 0)))
  print(f'part 2: {maxval}')


if PART1: part1()
if PART2: part2()
