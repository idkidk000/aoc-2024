#!/usr/bin/env python3

DEBUG = False
# FILENAME = 'example.txt'
# FILENAME = 'example2.txt'
FILENAME = 'input.txt'

with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
sections = text.split('\n\n')
# if DEBUG: print(f'{sections=}')
map_data = [list(x) for x in sections[0].splitlines()]
moves = [x for x in sections[1] if x.strip()]
# if DEBUG: print(f'{moves=}')
len_rows = len(map_data)
len_cols = len(map_data[0])


def find_start():
  for r in range(len_rows):
    for c in range(len_cols):
      if map_data[r][c] == '@':
        # map_data[r][c] = '.'
        return (r, c)
  assert False, 'start not found'


def print_map():
  for r in map_data:
    print(''.join(r))
  print()


pos_row, pos_col = find_start()
if DEBUG: print(f'{pos_row=} {pos_col=}')

if DEBUG: print_map()

for move_ix, move in enumerate(moves):
  move_row = -1 if move == '^' else 1 if move == 'v' else 0
  move_col = -1 if move == '<' else 1 if move == '>' else 0
  box_row = -1
  box_col = -1
  if DEBUG: print(f'{move_ix=} BEGIN {move=} {move_row=} {move_col=} {pos_row=} {pos_col=}')
  for i in range(1, max(len_rows, len_cols)):
    test_row = pos_row + move_row * i
    test_col = pos_col + move_col * i
    if DEBUG: print(f'{test_row=} {test_col=}')
    match map_data[test_row][test_col]:
      case '.':
        if DEBUG: print(f'empty at {test_row=} {test_col=}')
        # empty
        if box_row != -1:
          # move first encountered box to here
          if DEBUG: print(f'move box from {box_row=} {box_col=} to {test_row=} {test_col=}')
          map_data[test_row][test_col] = 'O'
          map_data[box_row][box_col] = '.'
        # increment pos by move
        map_data[pos_row][pos_col] = '.'
        pos_row += move_row
        pos_col += move_col
        map_data[pos_row][pos_col] = '@'
        break
      case 'O':
        # set box if first encountered
        if DEBUG: print(f'box at {test_row=} {test_col=}')
        if box_row == -1:
          box_row = test_row
          box_col = test_col
      case '#':
        # wall - no move
        if DEBUG: print(f'wall at {test_row=} {test_col=}')
        break
  if DEBUG:
    print(f'{move_ix} END {move=} {pos_row=} {pos_col=}')
    print_map()

gps_sum = 0
for ix_row in range(len_rows):
  for ix_col in range(len_cols):
    if map_data[ix_row][ix_col] == 'O':
      gps = 100 * ix_row + ix_col
      if DEBUG: print(f'{ix_row=} {ix_col=} {gps=}')
      gps_sum += gps
print(f'part 1: {gps_sum}')
