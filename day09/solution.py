#!/usr/bin/env python3

file_map = []
with open('input.txt', 'r') as f:
  for ix, length in enumerate(map(int, f.read())):
    for i in range(length):
      file_map.append(-1 if ix % 2 else (ix // 2))

print(f'{file_map=}')


def last_file_ix(the_list: list) -> int:
  for ix, val in enumerate(reversed(the_list)):
    if val != -1:
      return len(the_list) - 1 - ix
  return -1


while (ix_from := last_file_ix(file_map)) > (ix_to := file_map.index(-1)):
  # print(f'{file_map=} {ix_from=} {ix_to=}')
  file_map[ix_to] = file_map[ix_from]
  file_map[ix_from] = -1

print(f'{file_map=}')

checksum = sum(ix * val for ix, val in enumerate(file_map) if val != -1)
print(f'{checksum=}')
