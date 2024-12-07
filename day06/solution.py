#!/usr/bin/env python3

with open('input.txt', 'r') as f:
  data = [list(x) for x in f.read().splitlines()]

# print('\n'.join(''.join(x) for x in data))

count_rows = len(data)
count_cols = len(data[0])
guard_start = None

for row_ix in range(count_rows):
  if '^' in data[row_ix]:
    guard_start = [row_ix, data[row_ix].index('^'), 0, True]
    break

assert isinstance(guard_start, list)

route_positions = set()
guard = [*guard_start]
while guard[3]:
  next_position = (
    guard[0] + (-1 if guard[2] == 0 else 1 if guard[2] == 2 else 0),
    guard[1] + (-1 if guard[2] == 3 else 1 if guard[2] == 1 else 0),
  )
  # off-map
  if not(0<=next_position[0]<count_rows) or \
    not(0<=next_position[1]<count_cols):
    # set invalid
    guard[3] = False
  # clear
  elif data[next_position[0]][next_position[1]] != '#':
    # move
    route_positions.add(next_position)
    guard[0] = next_position[0]
    guard[1] = next_position[1]
  #obstruction
  else:
    # turn right
    guard[2] = (guard[2] + 1) % 4

# print(f'{guards=}')
print(f'part 1 {len(route_positions)=}')

count_loop = 0
for row_ix in range(count_rows):
  for col_ix in range(count_cols):
    if data[row_ix][col_ix] in ['^', '#'] or (row_ix, col_ix) not in route_positions: continue
    test_data = [[*x] for x in data]
    test_data[row_ix][col_ix] = '#'
    guard = [*guard_start]
    history = [(guard[0], guard[1], guard[2])]
    print(f'{row_ix=} {col_ix=} {guard=} {history=}')
    # continue
    turn_count = 0
    while guard[3]:
      next_position = (
        guard[0] + (-1 if guard[2] == 0 else 1 if guard[2] == 2 else 0),
        guard[1] + (-1 if guard[2] == 3 else 1 if guard[2] == 1 else 0),
        guard[2],  #direction
      )
      assert guard[0] != next_position[0] or guard[1] != next_position[1]
      # off-map
      if not(0<=next_position[0]<count_rows) or \
        not(0<=next_position[1]<count_cols):
        # set invalid
        # print(f'off map {row_ix=} {col_ix=}')
        # print(f'off map {history=}')
        guard[3] = False
        history.append(next_position)
      # clear
      elif test_data[next_position[0]][next_position[1]] != '#':
        # move
        if next_position in history:
          history.append(next_position)
          print(f'loop {row_ix=} {col_ix=} {len(history)=} {history=}')
          # exit()
          count_loop += 1
          guard[3] = False
        else:
          history.append(next_position)
          guard[0] = next_position[0]
          guard[1] = next_position[1]
          # print(f'move {next_position} {guard=}')
          turn_count = 0
      #obstruction
      else:
        # turn right
        guard[2] = (guard[2] + 1) % 4
        history.append((guard[0], guard[1], guard[2]))
        # print(f'turn right {next_position=} {guard=}')
        turn_count += 1
        if turn_count > 5:
          print(f'turn loop {row_ix=} {col_ix=}')
          guard[3] = False
          count_loop += 1
print(f'{count_loop=}')
