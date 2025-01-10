#!/usr/bin/env python3
import sys
from functools import cache

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

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
grid_rows = [list(x) for x in text.splitlines()]
grid_cols = [x for x in zip(*grid_rows)]


def part1():
  total = 0
  cols = len(grid_cols[0])
  for col in grid_cols:
    move_to = 0
    new_col = ['.'] * cols
    load = 0
    for i, item in enumerate(col):
      match item:
        case '#':
          move_to = i + 1
          new_col[i] = item
        case 'O':
          new_col[i] = '.'
          new_col[move_to] = 'O'
          load += cols - move_to
          move_to += 1
    if DEBUG > 0:
      print('from: ', ''.join(col), '\n  to:', ''.join(new_col), f'\n  {load=}')
    total += load
  print(f'part 1: {total=}')


def part2():
  # this should fall into a cycle after some iterations
  # in the outer loop, calculate total load and a checksum of O positions (maybe intentionally not necessary but using total load as a key feels quite collision-y).
  # add checksum and load to a dict. add checksum to a list
  # test if checksum already seen, calc loop start ix and len in list

  grid = list(''.join(text.splitlines()))
  rows = len(grid_rows)
  cols = len(grid_rows[0])
  assert len(grid) == rows * cols
  count_o = len([x for x in grid if x == 'O'])
  count_h = len([x for x in grid if x == '#'])
  if DEBUG > 2:
    for r in range(rows):
      print(f'{r: 3}:', ''.join(grid[r * cols:(r + 1) * cols]))
    print()

  checksum_to_load: dict[int, int] = {}
  checksums: list[int] = []

  def rc_to_ix(r: int, c: int) -> int:
    return r * cols + c

  # we'll never get to 1b
  for i in range(1_000_000_000):
    for d in range(4):
      match d:
        case 0 | 2:  # up/down
          r_step = 1 if d == 0 else -1
          r_start = 0 if d == 0 else rows - 1
          r_end = rows if d == 0 else -1
          if DEBUG > 2: print(f'{i=} {d=} {r_start=} {r_end=} {r_step=}')
          for c in range(cols):
            r_to = r_start
            for r in range(r_start, r_end, r_step):
              match grid[rc_to_ix(r, c)]:
                case '#':
                  r_to = r + r_step
                case 'O':
                  grid[rc_to_ix(r, c)] = '.'
                  assert grid[rc_to_ix(r_to, c)] == '.'
                  grid[rc_to_ix(r_to, c)] = 'O'
                  r_to += r_step
        case 1 | 3:  # left/right (note: LEFT FIRST)
          c_step = 1 if d == 1 else -1
          c_start = 0 if d == 1 else cols - 1
          c_end = cols if d == 1 else -1
          if DEBUG > 2: print(f'{i=} {d=} {c_start=} {c_end=} {c_step=}')
          for r in range(rows):
            c_to = c_start
            for c in range(c_start, c_end, c_step):
              match grid[rc_to_ix(r, c)]:
                case '#':
                  c_to = c + c_step
                case 'O':
                  grid[rc_to_ix(r, c)] = '.'
                  assert grid[rc_to_ix(r, c_to)] == '.'
                  grid[rc_to_ix(r, c_to)] = 'O'
                  c_to += c_step
    # calc checksum and load
    load = 0
    checksum = 0
    for r in range(rows):
      for c in range(cols):
        if grid[rc_to_ix(r, c)] == 'O':
          load += rows - r
          checksum += 179 * r + 419 * c
    if DEBUG > 2:
      for r in range(rows):
        print(f'{r: 3}:', ''.join(grid[r * cols:(r + 1) * cols]))
    if DEBUG > 1: print(f'{i=} {load=} {checksum=}')
    if DEBUG > 2: print()

    # im dumb
    assert len([x for x in grid if x == 'O']) == count_o
    assert len([x for x in grid if x == '#']) == count_h

    checksum_to_load[checksum] = load
    if checksum in checksums:
      loop_start = checksums.index(checksum)
      loop_len = len(checksums) - loop_start
      print(f'found loop {loop_start=} {loop_len=}')
      for i, x in enumerate(checksums[loop_start:]):
        print(f'  loop {i=} checksum={x} load={checksum_to_load[x]}')
      # ceo of off by ones
      result_checksum = checksums[loop_start:][(1_000_000_000 - 1 - loop_start) % loop_len]
      result_load = checksum_to_load[result_checksum]
      print(f'part 2: {result_checksum=} {result_load=}')
      return
    else:
      checksums.append(checksum)


if PART1: part1()
if PART2: part2()
