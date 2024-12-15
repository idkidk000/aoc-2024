#!/usr/bin/env python3

# DEBUG = True
DEBUG = False
# FILENAME = 'example.txt'
# FILENAME = 'example2.txt'
# FILENAME = 'example3.txt'
FILENAME = 'input.txt'

with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
sections = text.split('\n\n')
# if DEBUG: print(f'{sections=}')

# print(f'{FILENAME=}')


def hash_map(map_data: list[list[str]]) -> int:
  MOD_L = (2**31) - 1
  MOD_S = (2**17) - 1
  row_acc = 1
  for row_ix, row in enumerate(map_data):
    char_acc = 1
    for char_ix, char in enumerate(row):
      char_val = (
        (char_ix + 1)**(3 if char == '#' else 5 if char == '.' else 7 if char == '[' else 11 if char == ']' else 13)
      ) % MOD_S
      # print(f'{row_ix=} {char_ix=} {char=} {char_val=}')
      char_acc = (char_acc * char_val) % MOD_S
    # print(f'{row_ix=} {char_acc=}')
    row_acc = (row_acc * char_acc) % MOD_S
  return row_acc


def part2(sections: list[str]):
  map_data = []
  for line in sections[0].splitlines():
    map_line = []
    for char in line:
      match char:
        case 'O':
          map_line.extend(['[', ']'])
        case '@':
          map_line.extend(['@', '.'])
        case _:
          map_line.extend([char, char])
    map_data.append(map_line)

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
    boxes: list[tuple[int, int]] = []
    test_cols = [pos_col]
    wall = False
    if DEBUG: print(f'{move_ix=} BEGIN {move=} {move_row=} {move_col=} {pos_row=} {pos_col=}')
    for i in range(1, max(len_rows, len_cols)):
      test_row = pos_row + move_row * i
      if move_col != 0:
        test_cols = [x + move_col for x in test_cols]

      new_test_cols = []
      for test_col in test_cols.copy():
        if DEBUG: print(f'{test_col=} {test_cols=}')
        test_char = map_data[test_row][test_col]
        match test_char:
          case '.':
            test_cols.remove(test_col)
            if len(test_cols) == 0:
              # move
              for box_row, box_col in reversed(boxes):
                box_row_to = box_row + move_row
                box_col_to = box_col + move_col
                if DEBUG: print(f'move {box_row=} {box_col=} to {box_row_to} {box_col_to=}')
                map_data[box_row_to][box_col_to] = map_data[box_row][box_col]
                map_data[box_row][box_col] = '.'
              map_data[pos_row][pos_col] = '.'
              pos_row += move_row
              pos_col += move_col
              map_data[pos_row][pos_col] = '@'
              break

          case '[' | ']':

            if DEBUG: print(f'box {test_char} at {test_row=} {test_col=}')
            test_box = (test_row, test_col)
            if test_box not in boxes:
              boxes.append(test_box)
            if test_col not in new_test_cols:
              new_test_cols.append(test_col)
            if move_row != 0:
              new_test_col = test_col + (1 if test_char == '[' else -1)
              new_test_box = (test_row, new_test_col)
              if new_test_box not in boxes:
                boxes.append(new_test_box)
              if new_test_col not in new_test_cols:
                new_test_cols.append(new_test_col)
              if DEBUG: print(f'{new_test_col=} {test_cols=}')
            if DEBUG: print(f'{boxes=} {new_test_cols}')
          case '#':
            if DEBUG: print(f'wall at {test_row=} {test_col=}')
            wall = True
            break

      test_cols = new_test_cols
      if wall or len(new_test_cols) == 0: break

      # boxes are going to be difficult
      # test_col now needs to become test_cols
      # test_cols should start as a list of the col above/below us but get extended when we encounter a box
      # free space should should remove that col from test_cols
      # loop until wall or len(test_cols)==0 or move_col==0
      # horizontal
      #   need to move all the array items between pos and free space along by one
      # vertical
      #   space test:
      #     check above/below box parts of each box encountered
      #     store all box part coords in a list
      #   move:
      #     loop over list in reverse, set old position to empty, new to old value

    if DEBUG:
      print(f'{move_ix} END {move=} {pos_row=} {pos_col=}')
      print_map()

    # print(f'{move_ix+1}: {hash_map(map_data)}')
    with open(f'maps/py_{move_ix+1:05d}.txt', 'w') as f:
      f.write(''.join([''.join(r) for r in map_data]))

  gps_sum = 0
  for ix_row in range(len_rows):
    for ix_col in range(len_cols):
      if map_data[ix_row][ix_col] == '[':
        gps = 100 * ix_row + ix_col
        if DEBUG: print(f'{ix_row=} {ix_col=} {gps=}')
        gps_sum += gps
  print(f'part 2: {gps_sum}')


def part1(sections: list[str]):
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


# part1(sections)
part2(sections)
