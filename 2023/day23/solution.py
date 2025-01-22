#!/usr/bin/env python3
import sys
from dataclasses import dataclass
from typing import Self
from collections import deque, defaultdict

# yapf: disable
sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
INF = 10 ** 10

@dataclass
class Point():
  r: int; c: int
  def __mul__(self, value: int): return Point(self.r * value, self.c * value)
  def __add__(self, other: Self): return Point(self.r + other.r, self.c + other.c)
  def __repr__(self): return f'({self.r},{self.c})'
  def __getitem__(self, index: int): return (self.r, self.c)[index]
  def __lt__(self, other: Self): return (self.r, self.c) < (other.r, other.c)
  def __hash__(self): return hash((self.r, self.c))
  def __eq__(self, other: Self): return self.r == other.r and self.c == other.c #type: ignore

class Path():
  def __init__(self, position: Point, history: list[Point] = [], cost: int=0):
    self._position = position
    self._history = {*history}
    self._history.add(position)
    self._cost=cost
  @property
  def position(self): return self._position
  @property
  def history(self): return self._history
  @property
  def len(self): return len(self.history)
  @property
  def cost(self): return self._cost
  def __repr__(self): return f'<Path position={self.position} length={len(self.history)} cost={self.cost}>'

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

D4 = {'^': Point(-1,0), '>': Point(0,1), 'v': Point(1,0), '<': Point(0,-1)}

def debug(level: int, *args, **kwargs):
  if level < DEBUG: print(*args, **kwargs)
#yapf: enable

with open(FILENAME, 'r') as f:
  grid = f.read().splitlines()
rows, cols = len(grid), len(grid[0])


def draw_grid():
  for r, row in enumerate(grid):
    print(f'{r: 3d}  {row}')


def find_start():
  for r, row in enumerate(grid):
    for c, char in enumerate(row):
      if char == '.': return Point(r, c)
  assert False


def find_end():
  for r in range(rows - 1, -1, -1):
    for c in range(cols - 1, -1, -1):
      if grid[r][c] == '.': return Point(r, c)
  assert False


def solve(walkable_slopes: bool = False) -> int:
  # the paths are all 1-wide so we can do some graph stuff

  # build a set of start, end, and junctions
  start, end = find_start(), find_end()
  nodes = {start, end}
  for r in range(rows):
    for c in range(cols):
      if grid[r][c] == '#': continue
      count = 0
      for o in D4.values():
        nr, nc = r + o[0], c + o[1]
        if not (0 <= nr < rows and 0 <= nc < cols): continue
        if grid[nr][nc] != '#': count += 1
      # more than two path tiles, add it to nodes
      if count > 2: nodes.add(Point(r, c))
  debug(2, f'{nodes=}')

  # shortest path walk from each start node, make a dict of accessible nodes and their costs
  edge_costs: dict[Point, dict[Point, int]] = defaultdict(dict)
  for start_node in nodes:
    debug(1, f'walk {start_node=}')
    found_nodes: set[Point] = set()
    queue = deque([Path(start_node)])
    while queue:
      path = queue.pop()
      position = path.position
      char = grid[position.r][position.c]
      for direction, offset in D4.items():
        if (not walkable_slopes) and char in D4.keys() and char != direction: continue
        next_position = position + offset
        if not (0 <= next_position.r < rows and 0 <= next_position.c < cols): continue
        if grid[next_position.r][next_position.c] == '#': continue
        if next_position in edge_costs[start_node].keys() or next_position in path.history: continue
        if next_position in nodes and next_position != start_node:
          # add to edge costs and dont enqueue since we only want to map connections to the l1 nodes
          edge_costs[start_node][next_position] = path.len  #next_path.len-1 is just path.len
        else:
          next_path = Path(next_position, path.history)
          queue.append(next_path)

  debug(2, f'{edge_costs=}')

  # precalc hashes so we're only throwing primitives around
  optimised_edge_costs = {
    (node.r << 8) + node.c: {
    (neighbour.r << 8) + neighbour.c: cost
    for neighbour, cost in neighbours.items()
    }
    for node, neighbours in edge_costs.items()
  }
  optimised_start = (start.r << 8) + start.c
  optimised_end = (end.r << 8) + end.c

  # recursive dfs, which is basically the same as pushing and popping from the same end of a deque without the overhead. ~17s instead of ~120s
  walked: set[int] = set()

  def dfs(from_node: int):
    if from_node == optimised_end: return 0
    walked.add(from_node)
    max_cost = -INF # stop bad paths from propagating
    for next_node, cost in optimised_edge_costs[from_node].items():
      if next_node in walked: continue
      max_cost = max(max_cost, dfs(next_node) + cost)
    walked.remove(from_node)
    return max_cost

  return dfs(optimised_start)


def part1():
  result = solve()
  print(f'part 1: {result}')


def part2():
  result = solve(True)
  print(f'part 2: {result}')


if PART1: part1()
if PART2: part2()
