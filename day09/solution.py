#!/usr/bin/env python3

EXAMPLE = False

file_map = []
file_lengths = {}
with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  for ix, file_length in enumerate(map(int, f.read())):
    for i in range(file_length):
      file_map.append(-1 if ix % 2 else (ix // 2))
    if not (ix % 2): file_lengths[ix // 2] = file_length

# print(f'{file_map=}')

file_map1 = [*file_map]
for ix_from in range(len(file_map1) - 1, -1, -1):
  if file_map1[ix_from] == -1: continue
  ix_to = file_map1.index(-1)
  if ix_to > ix_from: break
  if EXAMPLE: print(f'move {ix_from=} {ix_to=}')
  file_map1[ix_to] = file_map1[ix_from]
  file_map1[ix_from] = -1
if EXAMPLE: print(f'{file_map1=}')
checksum1 = sum(ix * val for ix, val in enumerate(file_map1) if val != -1)
print(f'part 1 {checksum1=}')

file_map2 = [*file_map]
ix_dense_end = 0
for file_id in range(max(file_map2), -1, -1):
  ix_file_start = file_map2.index(file_id)
  file_length = file_lengths[file_id]
  if EXAMPLE: print(f'{file_id=} {ix_file_start=} {file_length=}')
  ix_free_start = -1
  found_free = False
  for ix_free_test in range(ix_dense_end, ix_file_start):
    if file_map2[ix_free_test] != -1:
      # occupied
      ix_free_start = -1
    else:
      # free
      if not (found_free):
        ix_dense_end = ix_free_test - 1
        found_free = True
      if ix_free_start == -1:
        ix_free_start = ix_free_test
      if ix_free_test - ix_free_start == file_length - 1:
        if EXAMPLE: print(f'move to {ix_free_start=}')
        for i in range(0, file_length):
          file_map2[ix_free_start + i] = file_id
          file_map2[ix_file_start + i] = -1
        break
if EXAMPLE: print(f'{file_map2=}')
checksum2 = sum(ix * val for ix, val in enumerate(file_map2) if val != -1)
print(f'part 2 {checksum2=}')
