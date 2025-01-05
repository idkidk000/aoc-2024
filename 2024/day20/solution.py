#!/usr/bin/env python3
import sys
from functools import cache
from collections import deque

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'example.txt'
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = 1
  elif arg == '-d2': DEBUG = 2
  elif arg == '-d3': DEBUG = 3
  else: raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
map_data = [list(x) for x in text.splitlines()]
rows = len(map_data)
cols = len(map_data[0])
start_coord = end_coord = None
for r in range(rows):
  for c in range(cols):
    match map_data[r][c]:
      case 'S':
        start_coord = (r, c)
      case 'E':
        end_coord = (r, c)
assert start_coord is not None and end_coord is not None


def draw_map(map_data: list[list[str]]):
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(map_data[r])}''')
  print(f'{rows=} {cols=}')


def get_distances():
  distances = [[-1] * cols for _ in range(rows)]
  cr, cc = start_coord
  distances[cr][cc] = 0
  while (cr, cc) != end_coord:
    if DEBUG > 1: print(f'get_distances {cr=} {cc=}')
    for d in D4:
      nr, nc = cr + d[0], cc + d[1]
      if not (0 <= nr < rows and 0 <= nc < cols): continue
      if distances[nr][nc] != -1: continue
      if map_data[nr][nc] == '#': continue
      distances[nr][nc] = distances[cr][cc] + 1
      cr, cc = nr, nc
      break
  return distances


def part1():
  distances = get_distances()
  # for debugging
  shortcut_time_counts: dict[int, int] = {}
  shortcut_count = 0

  for r in range(rows):
    for c in range(cols):
      origin_distance = distances[r][c]
      if origin_distance == -1: continue
      for d in [
        (-2, 0),
        (-1, 1),
        (0, 2),
        (1, 1),
        (2, 0),
        (1, -1),
        (0, -2),
        (-1, -1),
      ]:
        nr, nc = r + d[0], c + d[1]
        if not (0 <= nr < rows and 0 <= nc < cols): continue
        distance = distances[nr][nc]
        if distance == -1: continue
        saving = distance - origin_distance - 2
        if saving <= 0: continue
        if saving not in shortcut_time_counts.keys():
          shortcut_time_counts[saving] = 1
        else:
          shortcut_time_counts[saving] += 1
        if saving < 100: continue
        shortcut_count += 1

  if DEBUG > 1:
    for k in sorted(shortcut_time_counts.keys()):
      print(f'shortcut count: {k=} v={shortcut_time_counts[k]}')
  print(f'part 1: {shortcut_count=}')


def part2():
  distances = get_distances()
  shortcuts: set[tuple[int, int, int, int]] = set()
  savings: dict[int, int] = {}

  for r in range(rows):
    for c in range(cols):
      origin_distance = distances[r][c]
      if origin_distance == -1: continue
      for i in range(2, 21):
        for osr in range(i + 1):
          osc = i - osr
          for d in [
            (-1, 1),
            (1, 1),
            (1, -1),
            (-1, -1),
          ]:
            nr, nc = r + osr * d[0], c + osc * d[1]
            if not (0 <= nr < rows and 0 <= nc < cols): continue
            distance = distances[nr][nc]
            if distance == -1: continue
            saving = distance - origin_distance - i
            if saving < 0: continue
            if saving < 100: continue
            key = (r, c, nr, nc)
            if key not in shortcuts:
              savings[saving] = savings.get(saving, 0) + 1
              shortcuts.add(key)

  if DEBUG > 1: print(f'{shortcuts=}')
  if DEBUG > 0:
    shortcut_r_max = max([abs(x[0] - x[2]) for x in shortcuts])
    shortcut_c_max = max([abs(x[1] - x[3]) for x in shortcuts])
    shortcut_m_max = max([abs(x[0] - x[2]) + abs(x[1] - x[3]) for x in shortcuts])
    print(f'{shortcut_r_max=} {shortcut_c_max=} {shortcut_m_max=}')
    for k in sorted(savings.keys()):
      print(f'savings: {k=} {savings[k]}')

  shortcut_count = len(shortcuts)
  print(f'part 2: {shortcut_count=}')
  #282402 too low
  #1735306 too high


# draw_map(map_data)
part1()
part2()
