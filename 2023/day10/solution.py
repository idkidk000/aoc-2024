#!/usr/bin/env python3
import sys
from collections import deque

DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]
TILE_DIRS = {
  'F': {1, 2},
  '7': {2, 3},
  'J': {3, 0},
  'L': {0, 1},
  '|': {0, 2},
  '-': {1, 3},
  'S': {0, 1, 2, 3},
}
# u/r/d/l
TILE_BETWEEN = {
  'F': (1, 0, 0, 1),
  '7': (1, 1, 0, 0),
  'J': (0, 1, 1, 0),
  'L': (0, 0, 1, 1),
  '|': (0, 1, 0, 1),
  '-': (1, 0, 1, 0),
  'S': (1, 1, 1, 1),
}

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
map_data = [list(x) for x in text.splitlines()]
rows = len(map_data)
cols = len(map_data[0])


def find_map(val: str) -> tuple[int, int]:
  for r in range(rows):
    for c in range(cols):
      if map_data[r][c] == 'S': return (r, c)
  raise RuntimeError(f'cannot find {val=}')


def part1():
  start = find_map('S')
  paths = deque([[start]])
  costs: dict[tuple[int, int], int] = {start: 0}
  # paths should meet in the middle then reject on cost entry exists
  while len(paths):
    path = paths.popleft()
    r, c = path[-1]
    tile = map_data[r][c]
    for tile_dir in TILE_DIRS[tile]:
      d = D4[tile_dir]
      nr, nc = r + d[0], c + d[1]
      # reject on oob, loop, duplicate
      if nr < 0 or nr >= rows or nc < 0 or nc >= cols or (nr, nc) in costs or (nr, nc) in path: continue
      # test next tile for inverse direction
      ntile = map_data[nr][nc]
      if ntile not in TILE_DIRS.keys(): continue
      if (tile_dir + 2) % 4 not in TILE_DIRS[ntile]: continue
      # len npath would be off by one since start tile cost is 0 while path len is 1
      costs[(nr, nc)] = len(path)
      npath = [*path, (nr, nc)]
      paths.append(npath)
  value = max(costs.values())
  if DEBUG > 1: print(f'{costs=}')
  print(f'part 1: {value}')


def part2():
  DIR_LABELS = {
    (-1, 0): 'up',
    (0, 1): 'right',
    (1, 0): 'down',
    (0, -1): 'left',
  }
  # testing things which aren't explained in the question until the answer is right
  BETWEEN_REQUIRES_TWO_TILES = False
  BETWEEN_ANY_DIR = False
  # TILE_BETWEEN = {
  #   'F': (1, 1, 1, 1),
  #   '7': (1, 1, 1, 1),
  #   'J': (1, 1, 1, 1),
  #   'L': (1, 1, 1, 1),
  #   '|': (0, 1, 0, 1),
  #   '-': (1, 0, 1, 0),
  #   'S': (1, 1, 1, 1),
  # }

  # refactored path walk
  start = find_map('S')
  # dict of path tile coords and a 4 tuple of the directions they can be "squeezed past" - u/r/d/l
  path_tiles: dict[tuple[int, int], tuple[int, int, int, int]] = {}
  r, c = start
  # only one path with no branches so we can drop the deque
  moved = True
  while moved:
    moved = False
    char = map_data[r][c]
    if DEBUG > 1: print(f'path walk {r},{c} {char}')
    path_tiles[(r, c)] = TILE_BETWEEN[char]
    for direction in TILE_DIRS[char]:
      nr, nc = r + D4[direction][0], c + D4[direction][1]
      # continue on oob,loop (reverse in our case),inverse direction not in next tile
      if nr < 0 or nr >= rows or nc < 0 or nc > cols or (nr, nc) in path_tiles.keys(): continue
      nchar = map_data[nr][nc]
      if nchar not in TILE_DIRS.keys(): continue
      if (direction + 2) % 4 not in TILE_DIRS[nchar]: continue
      # next tile is valid. move and break out of direction loop
      r, c = nr, nc
      moved = True
      break

  #what if i replace S with whatever it's inferred to be
  # "squeeze-past" directions are inverse of pipe directions
  # didn't make any difference
  start_dirs = tuple(
    0 if (start[0] + d[0], start[1] + d[1]) in path_tiles and \
      path_tiles[(start[0] + d[0],start[1] + d[1])][(i + 2) % 4]==0 \
    else 1
    for i, d in enumerate(D4)
  )
  path_tiles[start] = start_dirs  #type: ignore
  start_letter = {v: k for k, v in TILE_BETWEEN.items()}[start_dirs] #type: ignore
  map_data[start[0]][start[1]] = start_letter
  if DEBUG > 1: print(f'{start_dirs=} {start_letter=}')

  if DEBUG > 2: print(f'{path_tiles=}')


  # lifted from https://github.com/savbell/advent-of-code-one-liners/blob/master/2023/day-10.py
  # so i've very much misunderstood the question and the whole tunnelling thing doesn't exist
  # maybe i was meant to ignore the question text and just look for a pattern in the examples?
  enclosed_tiles:set[tuple[int,int]]=set()
  for r in range(rows):
    within=False
    for c in range(cols):
      if (r,c) in path_tiles.keys():
        if map_data[r][c] in ['|','L','J']:
          within=not within
      elif within:
        enclosed_tiles.add((r,c))
  print(f'part 2: {len(enclosed_tiles)}')



  if 0==1:
    # region walk
    walked: set[tuple[int, int]] = set()
    enclosed_area = 0
    # for debugging as i'm stupid
    enclosed_tiles: set[tuple[int, int]] = set()
    # top-left loop. walk loop inside
    for origin_r in range(rows):
      for origin_c in range(cols):
        if (origin_r, origin_c) in walked or (origin_r, origin_c) in path_tiles.keys(): continue

        if DEBUG > 1: print(f'region walk {origin_r},{origin_c}')

        # throw newly discovered tiles on the deque as we find them
        tiles = deque([(origin_r, origin_c)])
        region: set[tuple[int, int]] = {(origin_r, origin_c)}
        enclosed = True
        while len(tiles):
          # tiles should only ever be non-path tiles which have already been added to region
          r, c = tiles.popleft()
          if r in [0, rows - 1] or c in [0, cols - 1]: enclosed = False
          # non-path tile can walk in 4 directions
          for d in D4:
            nr, nc = r + d[0], c + d[1]
            # continue on oob or walked
            if nr < 0 or nr >= rows or nc < 0 or nc >= cols or (nr, nc) in region: continue
            if (nr, nc) in path_tiles.keys():
              if DEBUG > 1:
                print(f'{nr},{nc} is a path tile. tunnelling {DIR_LABELS[d]} from {r},{c}')
              # test for directionality, try tunnelling, etc
              if d[0] != 0:
                # up/down
                # try left and ours, then ours and right
                for c_offset in [0, 1]:
                  c_left = nc - 1 + c_offset
                  c_right = nc + c_offset
                  # only if both are in the region so we only try tunnelling here once
                  if BETWEEN_REQUIRES_TWO_TILES and not ((r, c_left) in region and (r, c_right) in region):
                    if DEBUG > 1: print(f'  {r},{c_left} and {r},{c_right} are not both in walked region')
                    continue
                  tr = nr
                  exited_tunnel = False
                  while not exited_tunnel:
                    # oob
                    if tr < 0 or tr >= rows:
                      enclosed = False
                      if DEBUG > 1: print(f'  oob at {tr=}. {enclosed=}. exiting tunnelling')
                      break

                    # left is in bounds and not a path tile
                    if (tr, c_left) not in path_tiles.keys():
                      if (tr, c_left) not in region:
                        region.add((tr, c_left))
                        tiles.append((tr, c_left))
                        exited_tunnel = True
                        if DEBUG > 1: print(f'  emerged at {tr},{c_left}')

                    # right is in bounds and not a path tile
                    if (tr, c_right) not in path_tiles.keys():
                      if (tr, c_right) not in region:
                        region.add((tr, c_right))
                        tiles.append((tr, c_right))
                        exited_tunnel = True
                        if DEBUG > 1: print(f'  emerged at {tr},{c_right}')

                    # both are in bounds and path tiles
                    if not exited_tunnel:
                      if BETWEEN_ANY_DIR or ( \
                        ((tr,c_left) not in path_tiles.keys() or path_tiles[(tr, c_left)][1]) and \
                        ((tr,c_right) not in path_tiles.keys() or path_tiles[(tr, c_right)][3]) \
                      ):
                        if DEBUG > 1:
                          print(
                            f'  continuing between {tr},{c_left} {map_data[tr][c_left]} and {tr},{c_right} {map_data[tr][c_right]}'
                          )
                      else:
                        if DEBUG > 1:
                          print(
                            f'  blocked at {tr},{c_left} {map_data[tr][c_left]} and {tr},{c_right} {map_data[tr][c_right]}'
                          )
                        break

                    # otherwise continue with the loop
                    tr += d[0]
              else:
                # left/right
                # try above and ours, then ours and below
                for r_offset in [0, 1]:
                  r_above = nr - 1 + r_offset
                  r_below = nr + r_offset
                  # only if both are in the region so we only try tunnelling here once
                  if BETWEEN_REQUIRES_TWO_TILES and not ((r_above, c) in region and (r_below, c) in region):
                    if DEBUG > 1: print(f'  {r_above},{c} and {r_below},{c} are not both in walked region')
                    continue
                  tc = nc
                  exited_tunnel = False
                  while not exited_tunnel:
                    # oob
                    if tc < 0 or tc >= cols:
                      enclosed = False
                      if DEBUG > 1: print(f'  oob at {tc=}. {enclosed=}. exiting tunnelling')
                      break

                    # left is in bounds and not a path tile
                    if (r_above, tc) not in path_tiles.keys():
                      if (r_above, tc) not in region:
                        region.add((r_above, tc))
                        tiles.append((r_above, tc))
                        exited_tunnel = True
                        if DEBUG > 1: print(f'  emerged at {r_above},{tc}')

                    # right is in bounds and not a path tile
                    if (r_below, tc) not in path_tiles.keys():
                      if (r_below, tc) not in region:
                        region.add((r_below, tc))
                        tiles.append((r_below, tc))
                        exited_tunnel = True
                        if DEBUG > 1: print(f'  emerged at {r_below},{tc}')

                    # both are in bounds and path tiles
                    if not exited_tunnel:
                      # not traversible
                      if BETWEEN_ANY_DIR or (\
                        ((r_above,tc) not in path_tiles.keys() or path_tiles[(r_above, tc)][2]) and \
                        ((r_below,tc) not in path_tiles.keys() or path_tiles[(r_below, tc)][0]) \
                      ):
                        if DEBUG > 1:
                          print(
                            f'  continuing between {r_above},{tc} {map_data[r_above][tc]} and {r_below},{tc} {map_data[r_below][tc]}'
                          )
                      else:
                        if DEBUG > 1:
                          print(
                            f'  blocked at {r_above},{tc} {map_data[r_above][tc]} and {r_below},{tc} {map_data[r_below][tc]}'
                          )
                        break

                    # otherwise continue with the loop
                    tc += d[1]

            else:
              # valid. add it to the region and the deque
              region.add((nr, nc))
              tiles.append((nr, nc))

        # deque is empty, push region to walked
        walked.update(region)
        # test if region is enclosed, add to enclosed area
        if enclosed:
          enclosed_area += len(region)
          enclosed_tiles.update(region)
        if DEBUG > 1: print(f'{enclosed=} {region=}')

    if DEBUG > 2:

      debug_map = [[y for y in x] for x in map_data]
      for r in range(rows):
        for c in range(cols):
          if (r, c) not in path_tiles.keys(): debug_map[r][c] = '.'
      for r, c in enclosed_tiles:
        debug_map[r][c] = '\x1b[1;31m#\x1b[0m'
      for r, row in enumerate(debug_map):
        print(f'''{r:03d}: {''.join(row)}''')

    # if DEBUG > 1: print(f'{sorted(walked)=}')
    print(f'part 2: {enclosed_area} {len(enclosed_tiles)}')
    #BUG: works with examples, input answer is incorrect
    # 751 too high
    # fails on example5.txt. expected=8; actual=10. the example shows that you don't need access to both tiles to tunnel between them. added BETWEEN_REQUIRES_TWO_TILES and set to False. now get the expected 8
    # 706 too high
    # ugh. added BETWEEN_ANY_DIR to see if directionality matters but that leaves 0 enclosed on all maps. idk tbh
    # overrode TILE_BETWEEN dict so corner tiles can be traversed on all sides as a test
    # 190 too low


if PART1: part1()
if PART2: part2()
