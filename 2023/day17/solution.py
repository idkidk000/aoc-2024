#!/usr/bin/env python3
import sys
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
# if DEBUG: print(f'{text=}')
grid = [list(x) for x in text.splitlines()]
rows = len(grid)
cols = len(grid[0])


def draw_grid(grid: list[list[str]]):
  if DEBUG:
    for r in range(rows):
      print(f'''{r: 3d}  {''.join(grid[r])}''')
    print(f'{rows=} {cols=}')


class Path():
  r: int
  c: int
  d: int
  cost: int
  turned: int
  #for debugging
  hist: list[tuple[int, int]] = []

  def __init__(self, r: int, c: int, d: int, cost: int = 0, turned: int = 0, hist: list[tuple[int, int]] = []):
    self.r, self.c, self.d = r, c, d
    self.cost, self.turned = cost, turned
    self.hist = [*hist, (r, c)]

  def move(self, turn: int):
    if turn == 0 and self.turned >= 2: return None
    d = (self.d + turn) % 4
    r, c = self.r + D4[d][0], self.c + D4[d][1]
    if r < 0 or r >= rows or c < 0 or c >= cols: return None
    cost = self.cost + int(grid[r][c])
    if turn == 0: turned = self.turned + 1
    else: turned = 0
    return Path(r, c, d, cost, turned, self.hist)

  @property
  def rc(self):
    return (self.r, self.c)

  @property
  def rcd(self):
    return (self.r, self.c, self.d)


def part1():
  start = (0, 0, 1)
  end = (rows - 1, cols - 1)
  # need to account for direction, which slows things down considerably
  tile_costs: dict[tuple[int, int, int], int] = {start: 0}
  paths = deque([Path(*start)])
  best_path = None
  while len(paths):
    path = paths.pop()
    if path.cost > tile_costs[path.rcd]: continue
    for t in [-1, 0, 1]:
      if not (next_path := path.move(t)): continue
      if next_path.rcd in tile_costs and tile_costs[next_path.rcd] < next_path.cost: continue
      tile_costs[next_path.rcd] = next_path.cost
      if next_path.rc == end:
        if best_path is None or best_path.cost > next_path.cost:
          best_path = next_path
        continue
      paths.append(next_path)
  assert best_path
  if DEBUG > 0:
    grid_copy = [[y for y in x] for x in grid]
    for r, c in best_path.hist:
      item = grid_copy[r][c]
      grid_copy[r][c] = f'\x1b[1;31m{item}\x1b[0m'
    draw_grid(grid_copy)
  print(f'part 1: {best_path.cost}')


def part2():
  ...


if PART1: part1()
if PART2: part2()
