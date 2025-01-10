#!/usr/bin/env python3
import sys
from collections import deque

DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]
# pipe endpoints u/r/d/l
TILE_DIRS = {
  'F': {1, 2},
  '7': {2, 3},
  'J': {3, 0},
  'L': {0, 1},
  '|': {0, 2},
  '-': {1, 3},
  'S': {0, 1, 2, 3},
}
# "squeeze past" u/r/d/l
TILE_BETWEEN = {
  'F': (1, 0, 0, 1),
  '7': (1, 1, 0, 0),
  'J': (0, 1, 1, 0),
  'L': (0, 0, 1, 1),
  '|': (0, 1, 0, 1),
  '-': (1, 0, 1, 0),
  'S': (1, 1, 1, 1),
}
# D4 labels
DIR_LABELS = {
  (-1, 0): 'up',
  (0, 1): 'right',
  (1, 0): 'down',
  (0, -1): 'left',
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
  # THE MISSING INFO:
  #   * tunneling *does not* require access to both sides of the tunnel entrance/exit
  #   * tunnels *can* turn corners. so it's a path walk, not a line projection
  #   * therefore the edges of each path tile can be directly treated as either enclosed or unenclosed. so you can just scan rows or columns, switch is_enclosed as appropriate path tiles are seen, and count the enclosed tiles

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

  # replace S in map_data and path_tiles with inferred letter and "squeeze past" dirs
  start_dirs = tuple(
    0 if (start[0] + d[0], start[1] + d[1]) in path_tiles and \
      path_tiles[(start[0] + d[0],start[1] + d[1])][(i + 2) % 4]==0 \
    else 1
    for i, d in enumerate(D4)
  )
  path_tiles[start] = start_dirs  #type: ignore
  start_letter = {v: k for k, v in TILE_BETWEEN.items()}[start_dirs]  #type: ignore
  map_data[start[0]][start[1]] = start_letter
  if DEBUG > 1: print(f'{start_dirs=} {start_letter=}')

  if DEBUG > 2: print(f'{path_tiles=}')

  def known_good():
    # lifted from https://github.com/savbell/advent-of-code-one-liners/blob/master/2023/day-10.py
    # this seems like a good optimisation given the missing info
    enclosed_tiles: set[tuple[int, int]] = set()
    for r in range(rows):
      is_enclosed = False
      for c in range(cols):
        if (r, c) in path_tiles.keys():
          if 0 in TILE_DIRS[map_data[r][c]]:  #has an "up" end
            is_enclosed = not is_enclosed
        elif is_enclosed:
          enclosed_tiles.add((r, c))
    print(f'part 2 known good: {len(enclosed_tiles)}')

  #TODO: still trying to get path walk working. so far, unsuccessfully

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
      tile_queue = deque([(origin_r, origin_c)])
      region_tiles: set[tuple[int, int]] = {(origin_r, origin_c)}
      tunnel_tiles: set[tuple[int, int]] = set()
      enclosed = True
      while len(tile_queue):
        # tiles should only ever be non-path tiles which have already been added to region
        r, c = tile_queue.popleft()
        if r in [0, rows - 1] or c in [0, cols - 1]: enclosed = False
        # non-path tile can walk in 4 directions
        for d in D4:
          nr, nc = r + d[0], c + d[1]
          # continue on oob or walked
          if nr < 0 or nr >= rows or nc < 0 or nc >= cols or (nr, nc) in region_tiles: continue
          if (nr, nc) in path_tiles.keys():
            # tunnelling
            for tr, tc in [
              # two possible tunnel entrances - top/left and ours. the "other side" of the tunnel part is below/right
              (r + (d[0] or -1), c + (d[1] or -1)),
              (r + d[0], c + d[1]),
            ]:
              # other tile of tunnel, below/right of tr,tc
              tro, tco = tr + (1 if d[1] else 0), tc + (1 if d[0] else 0)
              if DEBUG > 1:
                print(f'tunnel {DIR_LABELS[d]} from {r},{c} using entrance between {tr},{tc} and {tro},{tco}')
              # only try tunnelling here once
              if (tr, tc) in tunnel_tiles: continue
              tunnel_tiles.add((tc, tc))
              moved = True
              while moved:
                moved = False
                #BUG maybe: does this need changing from a D4 loop to a turn left/none/right loop?
                for tdi, td in enumerate(D4):
                  #BUG maybe: setting nt[rc]o to the tile to the right/below nt[rc] *seems* right but validate that it's not misbehaving on some rotations. and do we need special handling for corner traversal? or does the fact that we're already in an """outside""" (needs more quotes) region override the need for traversal checks?

                  ntr, ntc = tr + td[0], tc + td[1]
                  # ntro,ntco=tro+td[0],tco+td[1]
                  #maybe just below/right will work
                  ntro, ntco = ntr + (1 if td[1] else 0), ntc + (1 if td[0] else 0)

                  # BUG maybe: setting enclosed false before we've tested  that we can access the tunnel here
                  if ntr <= 0 or ntro <= 0 or ntr >= rows - 1 or ntro >= rows - 1 or ntc <= 0 or ntco <= 0 or ntc >= cols - 1 or ntco >= cols - 1:
                    # edge or oob. not enclosed
                    if DEBUG > 2: print(f'  edge between {ntr},{ntc} and {ntro},{ntco}')
                    enclosed = False
                  if ntr < 0 or ntro < 0 or ntr >= rows or ntro >= rows or ntc < 0 or ntco < 0 or ntc >= cols or ntco >= cols:
                    # oob. no move. no further tests. continue to the next direction
                    if DEBUG > 2: print(f'  oob between {ntr},{ntc} and {ntro},{ntco}')
                    continue

                  # only use top/left as key in tunnel_tiles. this can be either nt[rc] or nt[rc]o depending on bearing
                  if (min(ntr, ntro), min(ntc, ntco)) in tunnel_tiles:
                    # already tunnelled here - try next direction
                    # if DEBUG>2: print(f'  loop between {ntr},{ntc} and {ntro},{ntco}')
                    continue

                  exited = False
                  # test if either tile has exited tunnel, add it to tunnel_tiles so we don't try to tunnel again here. already verified that it isn't in region_tiles. add it to tile_queue so we can walk it and region_tiles so it doesn't get added to tile_queue again
                  if (ntr, ntc) not in path_tiles.keys():
                    exited = True
                    tunnel_tiles.add((ntr, ntc))
                    if (ntr, ntc) not in region_tiles:
                      if DEBUG > 2: print(f'  exited at {ntr},{ntc}')
                      region_tiles.add((ntr, ntc))
                      tile_queue.append((ntr, ntc))
                  if (ntro, ntco) not in path_tiles.keys():
                    exited = True
                    tunnel_tiles.add((ntro, ntco))
                    if (ntro, ntco) not in region_tiles:
                      if DEBUG > 2: print(f'  exited at {ntro},{ntco}')
                      region_tiles.add((ntro, ntco))
                      tile_queue.append((ntro, ntco))
                  # one or both have exited tunnel and respective tiles have been added to tile_queue. no move. next direction
                  if exited: continue

                  # both are path tiles
                  if path_tiles[(min(ntr, ntro), min(ntc, ntco))][(tdi + 1) % 4
                                                                  ] and path_tiles[(max(ntr, ntro),
                                                                                    max(ntc, ntco))][(tdi - 1) % 4]:
                    # both are traversible. move, add to tunnel_tiles
                    if DEBUG > 1:
                      print(
                        f'  moved {DIR_LABELS[td]} between {ntr},{ntc} {map_data[ntr][ntc]} and {ntro},{ntco} {map_data[ntro][ntco]}'
                      )
                    moved = True
                    tr, tc = ntr, ntc
                    tro, tco = ntro, ntco
                    tunnel_tiles.add((min(ntr, ntro), min(ntc, ntco)))

          else:
            # valid. add it to the region and the deque
            region_tiles.add((nr, nc))
            tile_queue.append((nr, nc))

      # deque is empty, push region to walked
      walked.update(region_tiles)
      # test if region is enclosed, add to enclosed area
      if enclosed:
        # if these don't have the same value there's a bug
        enclosed_area += len(region_tiles)
        enclosed_tiles.update(region_tiles)
      # if DEBUG > 1: print(f'{enclosed=} {region_tiles=}')

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
  known_good()



if PART1: part1()
if PART2: part2()
