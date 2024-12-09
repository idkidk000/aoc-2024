#!/usr/bin/env python3

# FILENAME = 'example.txt'
FILENAME = 'input.txt'
PART = 2

file_map = []
with open(FILENAME, 'r') as f:
  for ix, file_length in enumerate(map(int, f.read())):
    for i in range(file_length):
      file_map.append(-1 if ix % 2 else (ix // 2))

# print(f'{file_map=}')

if PART == 1:
  for ix_from in range(len(file_map) - 1, -10, -1):
    if file_map[ix_from] == -1: continue
    ix_to = file_map.index(-1)
    if ix_to > ix_from: break
    # print(f'{file_map=} {ix_from=} {ix_to=}')
    file_map[ix_to] = file_map[ix_from]
    file_map[ix_from] = -1

  print(f'{file_map=}')

  checksum = sum(ix * val for ix, val in enumerate(file_map) if val != -1)
  print(f'{checksum=}')

elif PART == 2:
  for file_id in range(max(file_map), -1, -1):
    ix_file_start = file_map.index(file_id)
    ix_file_end = len(file_map) - 1 - list(reversed(file_map)).index(file_id)
    file_length = ix_file_end - ix_file_start + 1
    # print(f'{file_id=} {ix_file_start=} {ix_file_end=} {file_length=}')
    ix_free_start = -1
    for ix_free_test in range(0, ix_file_start):
      # print(f'{ix_free_test=} {file_map[ix_free_test]=}')
      if file_map[ix_free_test] != -1:
        ix_free_start = -1
      else:
        if ix_free_start == -1:
          ix_free_start = ix_free_test
        if ix_free_test - ix_free_start + 1 >= file_length:
          # print(f'move to {ix_free_start=}')
          for i in range(ix_free_start, ix_free_start + file_length):
            file_map[i] = file_id
            file_map[i + ix_file_start - ix_free_start] = -1
          break
  print(f'{file_map=}')
  checksum = sum(ix * val for ix, val in enumerate(file_map) if val != -1)
  print(f'{checksum=}')
