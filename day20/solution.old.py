#!/usr/bin/env python3
import sys
from functools import cache
from collections import deque

sys.setrecursionlimit(1_000_000)
DEBUG = False
FILENAME = 'example.txt'
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = True
  else: raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
map_data = [list(x) for x in text.splitlines()]
rows = len(map_data)
cols = len(map_data[0])
start_pos = end_pos = None
for row_ix in range(rows):
  for col_ix in range(cols):
    match map_data[row_ix][col_ix]:
      case 'S':
        start_pos = (row_ix, col_ix)
      case 'E':
        end_pos = (row_ix, col_ix)
assert start_pos is not None and end_pos is not None


def draw_map(map_data: list[list[str]]):
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(map_data[r])}''')
  print(f'{rows=} {cols=}')


paths = deque([([start_pos], None)])
# print(f'{paths=}')
coord_times: dict[tuple[int, int], int] = {}
completed_paths = []
while len(paths) and (path, cheat := paths.pop()):  #TODO: popleft?
  prev_pos = path[-1]
  # print(f'{path=} {prev_pos=}')
  for d in D4:
    test_pos = (prev_pos[0] + d[0], prev_pos[1] + d[1])
    if test_pos in path: continue
    char_at = map_data[test_pos[0]][test_pos[1]]
    if char_at == '#' and cheat is not None: continue
    next_path = [*path, test_pos]
    match char_at:
      case 'E':
        completed_paths.append((next_path, cheat))
      case '.':
        paths.append((next_path, cheat))
      case '#':
        test2_pos = (prev_pos[0] + d[0] * 2, prev_pos[1] + d[1] * 2)
        if test2_pos not in path and map_data[test2_pos[0]][test2_pos[1]] != '#':
          paths.append((next_path, (test_pos, test2_pos)))
      case _:
        raise RuntimeError(f'{char_at=} at {test_pos=}')

print(f'{len(completed_paths)=}')
assert len(completed_paths) == 1
path = completed_paths[0]

# # acutally this is wrong. a shortcut could come out somewhere which isn't already on the path but still save time. so we need to walk through every wall on the path, test if there is a . on the other side, then walk the map from there to see if it's faster
# shortcuts = []
# for i, pos in enumerate(path):
#   for d in D4:
#     test_wall = (pos[0] + d[0], pos[1] + d[1])
#     test_pos = (pos[0] + d[0] * 2, pos[1] + d[1] * 2)
#     if map_data[test_wall[0]][test_wall[1]] != '#' or test_pos not in path: continue
#     test_ix = path.index(test_pos)
#     if test_ix < i: continue
#     # BUG: these numbers are too high
#     shortcuts.append((test_wall, test_pos, test_ix - 1))

# # print(f'{sorted(shortcuts,key=lambda x:x[2])}')
# for c1, c2, s in sorted(shortcuts, key=lambda x: x[2]):
#   m = [[c for c in r] for r in map_data]
#   m[c1[0]][c1[1]] = '1'
#   m[c2[0]][c1[1]] = '2'
#   draw_map(m)
#   print(f'{c1=} {c2=} {s=}\n\n')
