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


def draw_map(map_data: list[list[str]]):
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(map_data[r])}''')


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
print(f'{rows=} {cols=} {start_pos=} {end_pos=}')
draw_map(map_data)

completed_paths: list[tuple[list[tuple[int, int]], tuple[tuple[int, int], tuple[int, int]]]] = []
paths: deque[tuple[list[tuple[int, int]],
                   tuple[tuple[int, int], tuple[int, int]] | None]] = deque([([start_pos], None)])
# walk all possible paths and all possible cheats
while len(paths):
  path, cheat = paths.popleft()
  current_pos = path[-1]
  if cheat is not None and cheat[0] == current_pos:
    if map_data[cheat[1][0]][cheat[1][1]] == 'E':
      completed_paths.append((
        [*path, cheat[1]],
        cheat,
      ))
    else:
      paths.append((
        [*path, cheat[1]],
        cheat,
      ))
    continue
  for d in D4:
    test_pos = (
      current_pos[0] + d[0],
      current_pos[1] + d[1],
    )
    if test_pos in path: continue
    char_at = map_data[test_pos[0]][test_pos[1]]
    match char_at:
      case '.':
        paths.append((
          [*path, test_pos],
          cheat,
        ))
      case 'E':
        #TODO: remove this if we need ALL completed paths
        if cheat is None: continue
        completed_paths.append((
          [*path, test_pos],
          cheat,
        ))
      case '#':
        if cheat is not None: continue
        test_pos2 = (
          current_pos[0] + d[0] * 2,
          current_pos[1] + d[1] * 2,
        )
        if test_pos2 in path: continue
        if not (0 <= test_pos2[0] < rows and 0 <= test_pos2[1] < cols): continue
        if map_data[test_pos2[0]][test_pos2[1]] == '#': continue
        paths.append((
          [*path, test_pos],
          (
            test_pos,
            test_pos2,
          ),
        ))

print(f'{len(completed_paths)=}')
print(f'{completed_paths[0]}')

# loop over completed paths, start at cheat[0], and walk without cheating
for completed_path, cheat in completed_paths:
  #actually this should be initialised with the completed path up to and including cheat[0]
  paths: deque[list[tuple[int, int]]] = deque([completed_path[:completed_path.index(cheat[0]) + 1]])  #type: ignore
  # print(f'{paths=}')
  non_cheat_paths: list[list[tuple[int, int]]] = []
  while len(paths):
    path = paths.popleft()  #type: ignore
    current_pos = path[-1]
    # print(f'{path=} {current_pos=}')
    for d in D4:
      test_pos = (
        current_pos[0] + d[0],
        current_pos[1] + d[1],
      )
      if test_pos in path: continue
      char_at = map_data[test_pos[0]][test_pos[1]]
      match char_at:
        case '.':
          paths.append([*path, test_pos])
        case 'E':
          non_cheat_paths.append([*path, test_pos])
  shortest_no_cheat_len = min(map(len, non_cheat_paths))
  cheat_len = len(completed_path)
  saving = cheat_len - shortest_no_cheat_len
  print(f'{cheat=} {cheat_len=} {shortest_no_cheat_len=} {saving=}')
  print(f'{path=}')
  print(f'{non_cheat_paths[0]=}')
  exit()
