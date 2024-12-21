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


def get_paths():
  paths = deque([[start_coord]])
  completed_paths = []
  while len(paths):
    path = paths.popleft()
    current = path[-1]
    for d in D4:
      test_coord = (
        current[0] + d[0],
        current[1] + d[1],
      )
      if test_coord in path: continue
      if not (0 <= test_coord[0] < rows and 0 <= test_coord[1] < cols): continue
      match map_data[test_coord[0]][test_coord[1]]:
        case '.':
          paths.append([*path, test_coord])
        case 'E':
          completed_paths.append([*path, test_coord])
    if DEBUG > 1: print(f'{len(paths)=} {len(paths[0]) if len(paths) else None}')
  return completed_paths


draw_map(map_data)
regular_paths = get_paths()
print(f'{len(regular_paths)=}')
assert len(regular_paths) == 1
regular_path = regular_paths[0]
regular_length = len(regular_path)
print(f'{regular_length=}')

shortcut_time_counts = {}
shortcut_count = 0
for i, coord in enumerate(regular_path):
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
    test_coord = (
      coord[0] + d[0],
      coord[1] + d[1],
    )
    if not (0 <= test_coord[0] < rows and 0 <= test_coord[1] < cols): continue
    if test_coord not in regular_path: continue
    saving = regular_path.index(test_coord) - i - 2
    if saving <= 0: continue
    if saving not in shortcut_time_counts.keys():
      shortcut_time_counts[saving] = 1
    else:
      shortcut_time_counts[saving] += 1
    if saving < 100: continue
    shortcut_count += 1

for k in sorted(shortcut_time_counts.keys()):
  print(f'shortcut count: {k=} v={shortcut_time_counts[k]}')
print(f'part 1: {shortcut_count=}')
