#!/usr/bin/env python3
import sys
from functools import cache
from dataclasses import dataclass
from typing import Self
from collections import deque

# yapf: disable
sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

@dataclass
class Point():
  r: int; c: int
  def __mul__(self, value: int): return Point(self.r * value, self.c * value)
  def __add__(self, other: Self): return Point(self.r + other.r, self.c + other.c)
  def __lt__(self, other: Self): return (self.r, self.c) < (other.r, other.c)
  def __hash__(self): return hash((self.r, self.c))

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

D4 = [Point(*x) for x in [(-1, 0), (0, 1), (1, 0), (0, -1)]]

def debug(level: int, *args, **kwargs):
  if level < DEBUG: print(*args, **kwargs)
#yapf: enable

TILE_ENTRY = {
  'S': [0, 1, 2, 3],
  '|': [0, 2],
  '-': [1, 3],
  'F': [0, 3],
  '7': [0, 1],
  'L': [2, 3],
  'J': [2, 1],
}
TILE_EXIT = {k: [(x + 2) % 4 for x in v] for k, v in TILE_ENTRY.items()}

with open(FILENAME, 'r') as f:
  text = f.read()
grid = text.splitlines()
rows, cols = len(grid), len(grid[0])


def find_grid(find_char: str):
  for r, row in enumerate(grid):
    for c, char in enumerate(row):
      if char == find_char: return Point(r, c)
  assert False


def find_path(start: Point) -> set[Point]:
  walked = set([start])
  dir_walked = set([(start.r, start.c, -1)])  # only for visualisation
  queue = deque([start])
  while queue:
    current = queue.pop()
    current_char = grid[current.r][current.c]
    for d in TILE_EXIT[current_char]:
      offset = D4[d]
      next_tile = current + offset
      if not (0 < next_tile.r < rows and 0 < next_tile.c < cols): continue
      if next_tile in walked: continue
      next_char = grid[next_tile.r][next_tile.c]
      debug(1, f'{current=} {current_char=} {d=} {next_char=}')
      if d not in TILE_ENTRY.get(next_char, []):
        debug(2, '  not in tile entry')
        continue
      queue.append(next_tile)
      walked.add(next_tile)
      dir_walked.add((next_tile.r, next_tile.c, d))
  loop_length = len(walked)
  if DEBUG > 1:
    grid_copy = [list(x) for x in grid]
    for r, c, d in dir_walked:
      content = grid_copy[r][c]
      grid_copy[r][c] = f'\x1b[7;{32+d}m{content}\x1b[0m'
    for r, row in enumerate(grid_copy):
      print(f'''{r:3d}: {''.join(row)}''')
  return walked


def part1():
  # a story about some chud who beleived it was their right to harass animals :|
  tiles = find_path(find_grid('S'))
  print(f'part 1: {len(tiles)//2+1}')
  # 6757


def part2():
  # there's a walk solution to this but it's non-trivial

  start = find_grid('S')
  path = find_path(start)
  # evaluate tiles surrounding S. check if they're in path and S was allowed to enter them
  start_dirs: list[int] = []
  for d, offset in enumerate(D4):
    next_tile = start + offset
    if next_tile in path and d in TILE_ENTRY[grid[next_tile.r][next_tile.c]]:
      start_dirs.append(d)
  # inferred start is a reverse lookup from TILE_EXIT
  inferred_start = {tuple(sorted(v)): k for k, v in TILE_EXIT.items()}.get(tuple(sorted(start_dirs)))
  debug(0, f'{start=} {start_dirs=} {inferred_start=}')
  row_list = list(grid[start.r])
  row_list[start.c] = inferred_start
  # update the grid so S doesn't throw off our enclosed scan
  grid[start.r] = row_list

  enclosed: set[Point] = set()
  for r, row in enumerate(grid):
    is_enclosed = False
    for c, char in enumerate(row):
      # for path tiles, flip is_enclosed when the tile has an up component. down also works as long as we're consistent
      if Point(r, c) in path:
        if 0 in TILE_ENTRY[char]: is_enclosed ^= True
      # add is_enclosed non-path tiles to the enclosed set
      elif is_enclosed:
        enclosed.add(Point(r, c))
  if DEBUG > 1:
    grid_copy = [list(x) for x in grid]
    for tile in enclosed:
      content = grid_copy[tile.r][tile.c]
      grid_copy[tile.r][tile.c] = f'\x1b[7;31m{content}\x1b[0m'
    for r, row_list in enumerate(grid_copy):
      print(f'''{r:3d}: {''.join(row_list)}''')
  print(f'part 2: {len(enclosed)}')
  # 523


if PART1: part1()
if PART2: part2()
