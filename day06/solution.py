#!/usr/bin/env python3

DEBUG = False

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
for route_position in route_positions:
  row_ix = route_position[0]
  col_ix = route_position[1]
  if data[row_ix][col_ix] != '.': continue
  test_data = [[*x] for x in data]
  test_data[row_ix][col_ix] = '#'
  guard = [*guard_start]
  history = set((guard[0], guard[1], guard[2]))
  if DEBUG: print(f'{row_ix=} {col_ix=} {guard=} {history=}')
  # continue
  while True:
    next_position = (
      guard[0] + (-1 if guard[2] == 0 else 1 if guard[2] == 2 else 0),
      guard[1] + (-1 if guard[2] == 3 else 1 if guard[2] == 1 else 0),
      guard[2],  #direction
    )
    if not(0<=next_position[0]<count_rows) or \
      not(0<=next_position[1]<count_cols):
      # off-map
      # print(f'off map {history=}')
      history.add(next_position)
      break
    # clear
    elif test_data[next_position[0]][next_position[1]] != '#':
      # move
      if next_position in history:
        if DEBUG: print(f'loop {row_ix=} {col_ix=} {len(history)=} {history=}')
        # exit()
        count_loop += 1
        break
      else:
        history.add(next_position)
        guard[0] = next_position[0]
        guard[1] = next_position[1]
        # print(f'move {next_position} {guard=}')
        turn_count = 0
    #obstruction
    else:
      # turn right
      guard[2] = (guard[2] + 1) % 4
      history.add((guard[0], guard[1], guard[2]))
      # print(f'turn right {next_position=} {guard=}')

print(f'part 2: {count_loop=}')
