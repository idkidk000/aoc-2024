#!/usr/bin/env python3
import sys
from typing import Any, Self
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
    # yapf: disable
    match arg:
      case '-i': FILENAME = 'input.txt'
      case '-p1': PART1, PART2 = True, False
      case '-p2': PART1, PART2 = False, True
      case '-p0': PART1, PART2 = False, False
      case _: raise Exception(f'unknown {arg=}')
  #yapf: enable

with open(FILENAME, 'r') as f:
  text = f.read()
grid = [[int(y) for y in x] for x in text.splitlines()]
rows, cols = len(grid), len(grid[0])


# yapf: disable
class Path():
  r: int; c: int; d: int; cost: int; turned: int; ultra: bool; hist: set[tuple[int,int]]
  # yapf: enable

  def __init__(
    self,
    r: int,
    c: int,
    d: int,
    cost: int = 0,
    turned: int = 0,  # the initial placement isn't a move
    hist: set[tuple[int, int]] = set(),
    ultra: bool = False
  ):
    self.r, self.c, self.d = r, c, d
    self.cost, self.turned, self.ultra = cost, turned, ultra
    self.hist = {*hist}
    if DEBUG > 0: self.hist.add((r, c))

  def move(self, turn: int) -> Self | None:
    if turn == 0 and self.must_turn: return None
    if turn != 0 and not self.can_turn: return None
    d = (self.d + turn) % 4
    r, c = self.r + D4[d][0], self.c + D4[d][1]
    if r < 0 or r >= rows or c < 0 or c >= cols: return None
    cost = self.cost + grid[r][c]
    # updated turned to be 1-based to maybe avoid off by ones
    if turn == 0: turned = self.turned + 1
    else: turned = 1
    return Path(r, c, d, cost, turned, self.hist, self.ultra)  #type: ignore

  # yapf: disable
  @property
  def can_turn(self) -> bool: return self.turned >= 4 or not self.ultra

  @property
  def must_turn(self) -> bool: return self.turned >= (10 if self.ultra else 3)

  @property
  def rc(self): return (self.r, self.c)

  @property
  def rcdt(self): return (self.r, self.c, self.d, self.turned)

  def __lt__(self, other) -> bool: return self.cost < other.cost

  def __repr__(self) -> str: return f'<Path ultra={self.ultra} r={self.r} c={self.c} d={self.d} cost={self.cost} turned={self.turned}>'
  # yapf: enable


def draw_grid(grid: list[list[Any]]):
  for r in range(rows):
    print(f'{r:3d}:', ''.join(str(x) for x in grid[r]))


def solve(ultra: bool = False):
  start = (0, 0, 1)
  end = (rows - 1, cols - 1)
  path = Path(*start, ultra=ultra)
  # row, col, dir, (moves since) turned. for path pruning
  tile_costs: dict[tuple[int, int, int, int], int] = {path.rcdt: 0}
  # PriorityQueue sorts items on put. so Path has a __lt__ method based on cost, which is way better than trying to pushleft and push to a deque
  paths: PriorityQueue[Path] = PriorityQueue()
  paths.put(path)
  best_path = best_cost = prev_cost = None
  while paths.qsize():
    path = paths.get()
    # logic is in the Path class. this is mostly pruning and debugging
    if best_cost and best_cost < path.cost: continue
    if path.cost > tile_costs[path.rcdt]: continue
    if DEBUG > 1 and path.cost != prev_cost:
      print(f'{path=} {paths.qsize()=}')
      prev_cost = path.cost
    # try all possible turns. invalid will return None
    for t in [-1, 0, 1]:
      if not (next_path := path.move(t)): continue
      if best_cost and best_cost < next_path.cost: continue
      # we can also discard on == tile_cost since we're including direction and (moves since) turn in the costs dict, any earlier higher cost paths will get pruned on paths.get()
      if next_path.rcdt in tile_costs and tile_costs[next_path.rcdt] <= next_path.cost: continue
      tile_costs[next_path.rcdt] = next_path.cost
      if next_path.rc == end and path.can_turn:
        if best_path is None or best_path.cost > next_path.cost:
          best_path, best_cost = next_path, next_path.cost
          if DEBUG > 0: print(f'{best_path.cost=} {paths.qsize()=:,}')
        continue
      paths.put(next_path)
  assert best_path
  if DEBUG > 0:
    grid_copy = [[y for y in x] for x in grid]
    for r, c in best_path.hist:
      item = grid_copy[r][c]
      grid_copy[r][c] = f'\x1b[1;31m{item}\x1b[0m'  #type: ignore
    draw_grid(grid_copy)

  return best_path.cost


def part1():
  result = solve(False)
  print(f'part 1: {result}')
  #859


def part2():
  result = solve(True)
  print(f'part 2: {result}')
  #1029 too high


if PART1: part1()
if PART2: part2()
