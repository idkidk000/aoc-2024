#!/usr/bin/env python3
import sys
from dataclasses import dataclass
from typing import Self
from heapq import heappush, heappop
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
  # actually return __gt__ since this is for the heapq and we want to prioritise longer paths
  # def __lt__(self, other: Self): return len(self.history) > len(other.history)
  def __lt__(self, other: Self): return self.cost > other.cost
  # def __lt__(self, other: Self): return len(self.history) < len(other.history)

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
  # this was a lot faster before i tried to optimise it. but my v2 solve is WAAAAYYY faster

  # queue = deque([Path(find_start())])
  start, end = find_start(), find_end()
  queue = [Path(start)]
  longest = 0
  # for p2 this needs a pruning mechanism but idk how yet since we're optimising for high cost
  # it's not heapq with a len> sort (i.e. depth first) :(
  # maybe prune paths whose hist contains our tile?
  # cant use a tile->path dict to easily prune lower cost since we create a new path instance for each possible direction
  # i suppose shortest first and a tile costs dict for later pruning is better than nothing

  # should this be a recursive thing where we lookup the max costs between two nodes? how would loop avoidance work?

  tile_costs: dict[Point, int] = {}
  while queue:
    # path = queue.pop()
    path = heappop(queue)
    debug(1, path, f'{len(queue)=} {longest=}')
    position = path.position
    char = grid[position.r][position.c]
    for direction, offset in D4.items():
      if (not walkable_slopes) and char in D4.keys() and char != direction: continue
      next_position = position + offset
      if not (0 <= next_position.r < rows and 0 <= next_position.c < cols): continue
      if grid[next_position.r][next_position.c] == '#': continue
      if next_position in path.history: continue
      if tile_costs.get(next_position, 0) > path.len: continue
      else: tile_costs[next_position] = path.len
      debug(2, f'{position=} {direction=} {offset=} {next_position=} {Point(position.r,position.c) in path.history=}')
      if next_position == end:
        longest = max(longest, path.len)  #first tile doesn't count
        debug(0, f'{longest=}')
      else:
        next_path = Path(next_position, path.history)
        # queue.append(next_path)
        heappush(queue, next_path)
  return longest


def solve2(walkable_slopes: bool = False) -> int:
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
  debug(0, f'{nodes=}')

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

  debug(0, f'{edge_costs=}')

  # edge walk. use path.cost, not len
  longest = 1
  queue = deque([Path(start)])

  while queue:
    path = queue.pop()
    position = path.position
    debug(1, f'edge walk {path=} {len(queue)=} {longest=}')
    for next_position, cost in edge_costs[position].items():
      if next_position in path.history: continue
      next_path = Path(next_position, path.history, path.cost + cost)
      if next_position == end:
        if next_path.cost > longest:
          longest = next_path.cost
          debug(0, f'  longest: {next_path}')
          # debug(0,f'  longest: {next_path} {next_path.history}')
          # for node_from,node_to in zip(next_path.history,next_path.history[1:]):
          #   debug(1,f'    {node_from=} {node_to=} edge_cost={edge_costs[node_from][node_to]}')
      else:
        queue.append(next_path)

  return longest


def part1():
  # result = solve()
  # print(f'part 1: {result}')
  result2 = solve2()
  print(f'part 1 v2: {result2}')


def part2():
  # result = solve(True)
  # print(f'part 2: {result}')
  result2 = solve2(True)
  print(f'part 2 v2: {result2}')


if PART1: part1()
if PART2: part2()
