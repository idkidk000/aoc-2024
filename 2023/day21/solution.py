#!/usr/bin/env python3
import sys
from collections import deque

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

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
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]
#yapf: enable

with open(FILENAME, 'r') as f:
  text = f.read()
grid = text.splitlines()
rows, cols = len(grid), len(grid[0])


def find_grid(search: str) -> tuple[int, int]:
  for r, row in enumerate(grid):
    for c, char in enumerate(row):
      if char == search: return r, c
  assert False


def draw_grid(grid: list[str], multiplier: int = 1, tiles: set[tuple[int, int]] = set()):
  # pretty picture maker
  row_offset = (multiplier - 1) * rows
  col_offset = (multiplier - 1) * cols
  grid_multiplier = 1 + (multiplier - 1) * 2
  # yapf: disable
  grid_copy = [
    [
      f'\x1b[1;{32+((i//cols)%2)+((j//cols)%2)}m{y}\x1b[0m'
      for j,y in enumerate(x * grid_multiplier)
    ]
    for i,x in enumerate(grid * grid_multiplier)
  ]
  # yapf: enable
  for tile in tiles:
    r, c = tile[0] + row_offset, tile[1] + col_offset
    assert r >= 0 and c >= 0
    # content = grid_copy[r][c]
    # assert content != '#'
    grid_copy[r][c] = '\x1b[7;31m.\x1b[0m'
  for r, row in enumerate(grid_copy):
    print(f'''    {r:3d}: {''.join(row)}''')


# extended a bit for p2
def solve(start: tuple[int, int], steps: int = 64, grid_multiplier: int = 1) -> tuple[int, set[tuple[int, int]]]:
  max_rows, max_cols = rows * grid_multiplier, cols * grid_multiplier
  if DEBUG > 1: print(f'{start=} {steps=} {rows=} {cols=} {grid_multiplier=} {max_rows=} {max_cols=}')
  queue: set[tuple[int, int]] = set([start])
  next_queue: set[tuple[int, int]] = set()
  for i in range(steps):
    if DEBUG > 2: print(f'{i=} {len(queue)=}')
    while len(queue):
      r, c = queue.pop()
      for d in D4:
        nr, nc = r + d[0], c + d[1]
        if not (
          0 - rows * (grid_multiplier - 1) <= nr < max_rows and 0 - cols *
          (grid_multiplier - 1) <= nc < max_cols and grid[nr % rows][nc % cols] != '#'
        ):
          continue
        next_queue.add((nr, nc))
    queue = next_queue.copy()
    next_queue.clear()
  if DEBUG > 0: print(f'{start=} {steps=} {len(queue)=}')
  if DEBUG > 0: draw_grid(grid, grid_multiplier, queue)
  return (len(queue), queue)


def part1():
  start = find_grid('S')
  result, _ = solve(start, 64)
  print(f'part 1: {result}')
  # 3639


def part2():
  # n=26_501_365
  start = find_grid('S')

  for steps in [26_501_365]:
    # for steps in range(1,101):
    orthagonal_steps = steps - 1 - rows // 2
    diagonal_steps = steps - 1 - rows

    # these fall over with example.txt because there isn't a clear column and row from the origin so we don't fill from the expected position or even take the expected number of steps
    # example2 works though and we have a source of truth to validate against by calling solve with a multiplier

    # steps<rows (low fill)
    top_corner_a, _ = solve((rows - 1, start[1]), orthagonal_steps % rows)
    right_corner_a, _ = solve((start[0], 0), orthagonal_steps % rows)
    bottom_corner_a, _ = solve((0, start[1]), orthagonal_steps % rows)
    left_corner_a, _ = solve((start[0], cols - 1), orthagonal_steps % rows)

    # steps<rows*2 (high fill)
    top_corner_b, _ = solve((rows - 1, start[1]), orthagonal_steps % rows + rows)
    right_corner_b, _ = solve((start[0], 0), orthagonal_steps % rows + rows)
    bottom_corner_b, _ = solve((0, start[1]), orthagonal_steps % rows + rows)
    left_corner_b, _ = solve((start[0], cols - 1), orthagonal_steps % rows + rows)

    # refactored a bit which throws off the earlier manual validation. there were previously filled_a and filled_b
    center, _ = solve(start, min(steps, rows * 2 + steps % 2))
    filled, _ = solve(start, rows * 2 + steps % 2 + 1)

    # steps<rows (low fill)
    top_right_a, _ = solve((rows - 1, 0), diagonal_steps % rows)
    bottom_right_a, _ = solve((0, 0), diagonal_steps % rows)
    bottom_left_a, _ = solve((0, cols - 1), diagonal_steps % rows)
    top_left_a, _ = solve((rows - 1, cols - 1), diagonal_steps % rows)

    # steps<rows*2 (high fill)
    top_right_b, _ = solve((rows - 1, 0), diagonal_steps % rows + rows)
    bottom_right_b, _ = solve((0, 0), diagonal_steps % rows + rows)
    bottom_left_b, _ = solve((0, cols - 1), diagonal_steps % rows + rows)
    top_left_b, _ = solve((rows - 1, cols - 1), diagonal_steps % rows + rows)

    # validation, _ = solve(start, steps, ((steps + rows // 2) // rows) + 1)

    print(f'{steps=} {rows=} {cols=} {orthagonal_steps=} {diagonal_steps=}')
    print(f'{center=} {filled=}')
    print(f'{top_corner_a=} {right_corner_a=} {bottom_corner_a=} {left_corner_a=}')
    print(f'{top_corner_b=} {right_corner_b=} {bottom_corner_b=} {left_corner_b=}')
    print(f'{top_right_a=} {bottom_right_a=} {top_left_a=} {bottom_left_a=}')
    print(f'{top_right_b=} {bottom_right_b=} {top_left_b=} {bottom_left_b=}')

    # example2 steps=10: validation=91  center=47
    #                                   corners_a=44
    #                                   47+44=91
    #          steps=15: validation=194 center=45
    #                                   corners_a=130
    #                                   edges_a=19
    #                                   45+130+19=194
    #          steps=20: validation=342 center=47
    #                                   corners_a=35
    #                                   4xfilled=180
    #                                   edges_a=80
    #                                   47+35+180+80=342
    #          steps=25: validation=519 center=45
    #                                   corners_a=115
    #                                   4xfilled_a=188
    #                                   2*edges a=26
    #                                   edges_b=145
    #                                   45+115+188+26+145=519
    #          steps=35: validation=964 center=45
    #                                   corners_a=89
    #                                   8xfilled=360
    #                                   4xfilled_a=188
    #                                   3xedges_a=24
    #                                   2xedges_b=258
    #                                   45+89+360+188+24+258=964

    # ok just need to figure out how many of each for a given number of steps

    total = center
    print(f'add {center=} {total=}')
    if steps > rows // 2:
      # at 6, add corners
      corners_a = top_corner_a + right_corner_a + bottom_corner_a + left_corner_a
      total += corners_a
      print(f'add {corners_a=} {total=}')
    if steps > rows:
      # at 12, add 1x edges_a
      # at 23, add 2x edges_a
      mult = (steps - 1) // rows
      edges_a = top_right_a + bottom_right_a + bottom_left_a + top_left_a
      total += mult * edges_a
      print(f'add {edges_a=} * {mult=} {total=}')
    if steps > rows + rows // 2:
      corners_b = top_corner_b + right_corner_b + bottom_corner_b + left_corner_b
      total += corners_b
      print(f'add {corners_b=} {total=}')
    if steps > rows * 2:
      # at 23, add edges b
      # at 34: add 2x edges b
      mult = ((steps - 1) // rows) - 1
      edges_b = top_right_b + bottom_right_b + bottom_left_b + top_left_b
      total += edges_b * mult
      print(f'add {edges_b=} * {mult=} {total=}')
    if steps > rows * 2 + rows // 2:
      # at 23 (rows * 2 + 1):           add 0
      # at 28 (rows * 2 + rows//2 + 1): add 4
      # at 45 (rows * 4 + 1):           add 12
      # at 50 (rows * 4 + rows//2 + 1): add 16
      # at 67 (rows * 6 + 1):           add 32
      # at 72 (rows * 6 + rows//2 + 1): add 36
      # at 89 (rows * 8 + 1):           add 60
      # at 94 (rows * 8 + rows//2 + 1): add 64

      # solved in sheets lol
      mult = 4 * ((steps - 1) // (rows * 2))**2 - 4
      if (steps - 1) % (rows * 2) >= rows // 2: mult += 4

      # if steps >= 94: mult = 64
      # elif steps >= 89: mult = 60
      # elif steps >= 72: mult = 36
      # elif steps >= 67: mult = 32
      # elif steps >= 50: mult = 16
      # elif steps >= 45: mult = 12
      # else: mult = 4

      total += filled * mult
      print(f'add {filled=} * {mult=} {total=}')
    if steps > rows * 3:
      # at 34 (rows * 3 + 1 ):          add 4x additional center tiles
      # at 39 (rows * 3 + rows//2 + 1): add 8
      # at 56 (rows * 5 + 1):           add 20
      # at 61 (rows * 5 + rows//2 + 1): add 24
      # at 78 (rows * 7 + 1):           add 44
      # at 83 (rows * 7 + rows//2 + 1): add 48

      # i only have one l2 delta for the non% pattern but it's 8 again so i assume it's similar to the filled pattern

      n = (((steps - 1) // rows) - 1) // 2
      mult = 4 * (n**2 + n) - 4
      if (steps - 1 + rows) % (rows * 2) >= rows // 2: mult += 4

      # if steps >= 83: mult = 48
      # elif steps >= 78: mult = 44
      # elif steps >= 61: mult = 24
      # elif steps >= 56: mult = 20
      # elif steps >= 39: mult = 8
      # else: mult = 4

      total += center * mult
      print(f'add {center=} * {mult=} {n=} {total=}')

    # print(f'{steps=} {total=} {validation=} {total-validation=}')
    print(f'{steps=} {total=}')
    # assert total == validation


if PART1: part1()
if PART2: part2()
