#!/usr/bin/env python3
import sys
# from collections import deque
from typing import Any
from queue import PriorityQueue

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
grid = [[int(y) for y in x] for x in text.splitlines()]
rows = len(grid)
cols = len(grid[0])


def draw_grid(grid: list[list[Any]]):
  if DEBUG:
    for r in range(rows):
      print(f'''{r: 3d}  {''.join(str(x) for x in grid[r])}''')
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
    self.hist = []  #[*hist, (r, c)]

  def move(self, turn: int):
    if turn == 0 and self.turned >= 2: return None
    d = (self.d + turn) % 4
    r, c = self.r + D4[d][0], self.c + D4[d][1]
    if r < 0 or r >= rows or c < 0 or c >= cols: return None
    cost = self.cost + grid[r][c]
    if turn == 0: turned = self.turned + 1
    else: turned = 0
    return Path(r, c, d, cost, turned, self.hist)

  @property
  def rc(self):
    return (self.r, self.c)

  @property
  def rcd(self):
    return (self.r, self.c, self.d)

  @property
  def rcdt(self):
    return (self.r, self.c, self.d, self.turned)

  @property
  def rct(self):
    return (self.r, self.c, self.turned)

  def __lt__(self, other) -> bool:
    return self.cost < other.cost

  def __repr__(self) -> str:
    return f'<Path r={self.r} c={self.c} d={self.d} cost={self.cost} turned={self.turned}>'


def part1():
  start = (0, 0, 1)
  end = (rows - 1, cols - 1)
  #rcdt
  tile_costs: dict[tuple[int, int, int, int], int] = {(0, 0, 1, 0): 0}
  paths: PriorityQueue[Path] = PriorityQueue()
  paths.put(Path(*start))
  best_path = None
  best_cost = None
  prev_cost = None
  while paths.qsize() > 0:
    path = paths.get()
    if best_cost and best_cost < path.cost: continue
    if path.cost > tile_costs[path.rcdt]: continue
    if DEBUG > 1 and path.cost != prev_cost:
      print(f'{path=} {paths.qsize()=}')
      prev_cost = path.cost
    for t in [-1, 0, 1]:
      if not (next_path := path.move(t)): continue
      if best_cost and best_cost < next_path.cost: continue
      if next_path.rcdt in tile_costs and tile_costs[next_path.rcdt] <= next_path.cost: continue
      tile_costs[next_path.rcdt] = next_path.cost
      if next_path.rc == end:
        if best_path is None or best_path.cost > next_path.cost:
          best_path = next_path
          best_cost = next_path.cost
          if DEBUG > 1: print(f'{best_path.cost=} {paths.qsize()=:,}')
        continue
      # push more expensive paths to the front of the queue so we can start pruning sooner
      # if tile_costs[next_path.rc] < next_path.cost: paths.appendleft(next_path)
      # else: paths.append(next_path)
      # if tile_costs[next_path.rc] < next_path.cost: paths.append(next_path)
      # else: paths.appendleft(next_path)
      #trying a priorityqueue
      paths.put(next_path)
  assert best_path
  # if DEBUG > 0:
  #   grid_copy = [[y for y in x] for x in grid]
  #   for r, c in best_path.hist:
  #     item = grid_copy[r][c]
  #     grid_copy[r][c] = f'\x1b[1;31m{item}\x1b[0m'
  #   draw_grid(grid_copy)
  # print(f'part 1: {best_path.cost}')


def part2():
  ...


if PART1: part1()
if PART2: part2()
