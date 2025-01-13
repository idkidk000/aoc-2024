#!/usr/bin/env python3
import sys
from collections import deque

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
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]
#yapf: enable

with open(FILENAME, 'r') as f:
  text = f.read()
grid = text.splitlines()
rows, cols = len(grid), len(grid[0])


def find_grid(search: str) -> tuple[int, int]:
  for r, row in enumerate(grid):
    for c, char in enumerate(row):
      if char == search: return r, c
  assert False


def draw_grid(gid: list[str]):
  for r, row in enumerate(grid):
    print(f'{r:3d}: {row}')
  print(f'rows={len(grid)} cols={len(grid[0])}')


# extended a bit for p2
def solve(start: tuple[int, int], steps: int = 64, grid_multiplier: int = 1) -> int:
  max_rows, max_cols = rows * grid_multiplier, cols * grid_multiplier
  if DEBUG > 0: print(f'{start=} {steps=} {rows=} {cols=} {grid_multiplier=} {max_rows=} {max_cols=}')
  queue: set[tuple[int, int]] = set([start])
  next_queue: set[tuple[int, int]] = set()
  for i in range(steps):
    if DEBUG > 1: print(f'{i=} {len(queue)=}')
    while len(queue):
      r, c = queue.pop()
      for d in D4:
        nr, nc = r + d[0], c + d[1]
        if not (0 <= nr < max_rows and 0 <= nc < max_cols and grid[nr % rows][nc % cols] != '#'): continue
        next_queue.add((nr, nc))
    queue = next_queue.copy()
    next_queue.clear()
  if DEBUG > 0: print(f'{steps=} {len(queue)=}')
  return len(queue)


def part1():
  start = find_grid('S')
  result = solve(start, 64)
  print(f'part 1: {result}')
  # 3639


def part2():
  #26_501_365
  ...
  # for the internal tiles, we know that they'll oscillate on each iteration so we can't just flood fill
  # but even just a flood fill is too much at 26m iterations
  # there's a big brain solve and idk what it is yet

  # steps - grid_width//2 divides by grid_width 202_300 times :|
  # tiles have an oscillation period of 2 steps and we only care about tiles which were occupied where step%2==steps%2. though that doesn't matter if we can fill a few individual tiles and clone them
  # can we fill one tile for 2*max(width,height) + steps%2 and clone it? YES
  # run a few iterations and validate that the edges stay a diamond. hopefully we can clone the edges
  # start row and col are both empty so they'll extend out in steps each way and the diamond thing should hold up

  # after cols (which is also rows) steps, the constrained grid oscillates between 7410 and 7363. so we can flood fill
  # starting at center bottom takes 194 steps before it oscillates between 7410 and 7363
  # same for the other 3 dirs

  # so we know there are 202_300 grids in all 4 directions
  # but if we imagine there wass only 1
  # 65 steps to reach the edge of our grid. 131 to reach the edge of that. and a further 63 to fill it. 259 in total

  # the first and last cols are also empty so presumably the diagonals will be filled from their inner corners
  # which takes 259 steps to fill

  # example2 is a bit more like the input
  # fill result is one of the two oscillating values. determined by start pos or?

  # might be helpful to refactor a bit and multiply an example grid a few times, solve it for cols steps and print the resulting tiles

  start = find_grid('S')
  for x in [
    start,
    (start[0], 0),
    (start[0], cols - 1),
    (0, cols - 1),
    (rows - 1, start[1]),
    (0, 0),
    (0, cols - 1),
    (rows - 1, 0),
    (rows - 1, cols - 1),
  ]:
    print(f'{x=} {solve(x,cols)} {solve(x,cols*2)} {solve(x,cols*3)}')

  # solve(start, cols * 2)
  # solve((start[0], cols - 1), cols * 2)
  # solve((rows - 1, start[0]), cols * 2)
  # solve((0, start[0]), cols * 2)
  # solve((rows - 1, cols - 1), cols * 2)


if PART1: part1()
if PART2: part2()
