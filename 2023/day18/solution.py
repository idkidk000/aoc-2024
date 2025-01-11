#!/usr/bin/env python3
import sys
from functools import cache
from dataclasses import dataclass
from collections import deque, defaultdict

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

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

@dataclass
class Move():
  dir: int; len: int; lbl: str

with open(FILENAME, 'r') as f:
  moves = [
    Move(
      {'U': 0,'R': 1,'D': 2,'L': 3}[y[0]],
      int(y[1]),
      y[2][2:-1],
    ) for x in f.read().splitlines() if len(y := x.split()) == 3
  ]
# yapf: enable


def draw_grid(grid: list[list[str]]):
  # https://www.shellhacks.com/bash-colors/
  # f'\x1b[7;{31+d}m{s%10}\x1b[0m'
  rows, cols = len(grid), len(grid[0])
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(grid[r])}''')
  print(f'{rows=} {cols=}')


def solve(moves: list[Move]):
  #this is all VERY inneficient for now

  # loop over moves, add coords to a set
  coords: set[tuple[int, int]] = set()
  start = (0, 0)
  coords.add(start)
  r, c = start
  for move in moves:
    for _ in range(move.len):
      if DEBUG > 1: print(f'{move=} {r=} {c=}')
      r += D4[move.dir][0]
      c += D4[move.dir][1]
      coords.add((r, c))
  if DEBUG > 0: print(f'{len(coords)=}')

  # normalise coords and migrate to a grid
  r_min = c_min = r_max = c_max = 0
  for r, c in coords:
    r_min, r_max = min(r_min, r), max(r_max, r)
    c_min, c_max = min(c_min, c), max(c_max, c)
  rows, cols = r_max - r_min + 1, c_max - c_min + 1
  if DEBUG > 1: print(f'{r_min=} {r_max=} {rows=} {c_min=} {c_max=} {cols=} ')
  # *rows copies byref
  grid = [['.'] * cols for _ in range(rows)]
  for r, c in coords:
    if DEBUG > 2: print(f'{r - r_min = }, {c - c_min = }')
    grid[r - r_min][c - c_min] = '#'
  if DEBUG > 0:
    draw_grid(grid)

  # region flood fill
  walked: set[tuple[int, int]] = set()
  regions: dict[tuple[int, int], set[tuple[int, int]]] = {}
  for r in range(rows):
    for c in range(cols):
      if grid[r][c] == '#': continue
      origin = (r, c)
      if origin in walked: continue
      region = set([origin])
      queue: deque[tuple[int, int]] = deque([origin])
      while len(queue):
        r, c = queue.pop()
        for d in D4:
          nr, nc = r + d[0], c + d[1]
          if not (0 <= nr < rows and 0 <= nc < cols): continue
          if grid[nr][nc] == '#': continue
          if (nr, nc) in region: continue
          region.add((nr, nc))
          queue.append((nr, nc))
      regions[origin] = region
      walked.update(region)

  if DEBUG > 1:
    for origin, region in regions.items():
      print(f'{origin=}: len={len(region)}')
  assert len(regions.keys()) > 0

  # determine which is the inner region and update the grid
  for region in regions.values():
    if all(0 < x[0] < rows - 1 and 0 < x[1] < cols - 1 for x in region):
      if DEBUG > 0: print(f'internal region len={len(region)}')
      for r, c in region:
        grid[r][c] = '#'

  # and finally, in the most round-about and convoluted way possible, count the #s.
  # presumably hyperneutrino solved part 1 in 5 lines of code
  total = 0
  for row in grid:
    total += len([x for x in row if x == '#'])
  return total


def solve2(moves: list[Move]):
  # key is r/c, val is set of start/end r/c. still might not be the right structure
  h_edges: defaultdict[int, set[tuple[int, int]]] = defaultdict(lambda: set())
  v_edges: defaultdict[int, set[tuple[int, int]]] = defaultdict(lambda: set())
  rs, cs = 0, 0
  r_min = r_max = c_min = c_max = 0
  for move in moves:
    re, ce = rs + D4[move.dir][0] * move.len, cs + D4[move.dir][1] * move.len
    if DEBUG > 2:
      print(f'{rs=} {cs=} {re=} {ce=} {move.dir=} {move.len=}')
    match move.dir % 2:
      case 0:
        assert cs == ce
        v_edges[cs].add((min(rs, re), max(rs, re)))
      case 1:
        assert rs == re
        h_edges[rs].add((min(cs, ce), max(cs, ce)))
    r_min, r_max = min(r_min, re), max(r_max, re)
    c_min, c_max = min(c_min, ce), max(c_max, ce)
    rs, cs = re, ce

  if DEBUG > 1:
    print(f'{dict(h_edges)=}')
    print(f'{dict(v_edges)=}')
    print(f'{r_min=:,} {r_max=:,} {c_min=:,} {c_max=:,}')

  total = 0
  # can i just sort the edges, intersect them, toogle a bool on each intersection, and add the area between this intersection and the last to total??

  #FIXME: bad var names

  #BUG: this does not give rectangular intersection regions
  # stepping over 2 hedges and vedges at a time might do it
  # or maybe i should make sets of all row and col numbers where an edge terminates, sort,and grid scan them. or maybe stepping two at a time does the same thing
  # also, would  two overlapping edges of the same orientation break things? 0-width would be fine i think but width of 1 would mean double-count
  # could sum interior with 0-width edges and sum the perimeter separately. but perimeter would still be prone to the same double-counting
  # maybe perim could be summed with a double loop and only count the parts which don't overlap to the bottom/right
  for r, hedges in sorted(h_edges.items(), key=lambda x: x[0]):
    for hedge in sorted(hedges):
      internal = False
      prev_intersect = (r_min, c_min)
      for c, vedges in sorted(v_edges.items(), key=lambda x: x[0]):
        for vedge in sorted(vedges):
          # continue on no intersection
          if vedge[0] > r or vedge[1] < r: continue
          if hedge[0] > c or hedge[1] < c: continue

          intersect = (r, c)
          # i think this is right?
          area = (abs(intersect[0] - prev_intersect[0]) + 1) * (abs(intersect[1] - prev_intersect[1]) + 1)

          print(f'{r=} {hedge=}\n{c=} {vedge=}\n  {intersect=}\n  {prev_intersect=}\n  {internal=} {area=}')

          if internal: total += area
          internal ^= True
          prev_intersect = intersect
  if DEBUG > 0: print(f'{total=:,}')
  # if FILENAME == 'example.txt': assert total == 952_408_144_115
  return total


def part1():
  result = solve(moves)
  print(f'part 1: {result}')
  result2 = solve2(moves)
  print(f'part 1  v2: {result2}')
  # 36725


def part2():
  # who could have predicted that part2 would require your solve to be efficient
  ugh = [Move(
    (int(m.lbl[-1]) + 1) % 4,
    int(m.lbl[:5], 16),
    m.lbl,
  ) for m in moves]
  result = solve2(ugh)
  print(f'part 2: {result}')


if PART1: part1()
if PART2: part2()
