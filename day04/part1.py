#!/usr/bin/env python3

with open('input.txt', 'r') as f:
  data = [list(x) for x in f.read().splitlines()]

# print(f'{data=}')

count_rows = len(data)
count_cols = len(data[0])
count_words = 0

for ix_row in range(count_rows):
  for ix_col in range(count_cols):
    for ix_dir in range(8):
      chars = []
      for ix_char in range(4):
        row_offset = ix_char * (0 if ix_dir in [2, 6] else 1 if ix_dir in [3, 4, 5] else -1)
        col_offset = ix_char * (0 if ix_dir in [0, 4] else 1 if ix_dir in [1, 2, 3] else -1)
        if 0 <= ix_row + row_offset < count_rows and 0 <= ix_col + col_offset < count_cols:
          chars.append(data[ix_row + row_offset][ix_col + col_offset])
      # only search forward since we're already searching in all directions above
      found = ''.join(chars) == 'XMAS'
      if found:
        # print(f'{ix_row=} {ix_col=} {ix_dir=} {chars=}')
        count_words += 1

print(f'part 1 {count_words=}')

count = 0
for ix_row in range(1, count_rows - 1):
  for ix_col in range(1, count_cols - 1):
    if data[ix_row][ix_col] != 'A': continue
    # 0 1
    # 2 3
    chars = [
      data[ix_row - 1][ix_col - 1],
      data[ix_row - 1][ix_col + 1],
      data[ix_row + 1][ix_col - 1],
      data[ix_row + 1][ix_col + 1],
    ]
    # print(f'{ix_row=} {ix_col=} {chars=}')
    if ((chars[0]=='M' and chars[3]=='S') or (chars[0]=='S' and chars[3]=='M')) and \
       ((chars[1]=='M' and chars[2]=='S') or (chars[1]=='S' and chars[2]=='M')):
      count += 1

print(f'part 2 {count=}')
