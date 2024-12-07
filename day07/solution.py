#!/usr/bin/env python3

with open('input.txt', 'r') as f:
  data = [list(map(int, x.replace(':', '').split())) for x in f.read().splitlines()]

print(f'{data=}')
total = 0
for item in data:
  target = item[0]
  results = []
  for value in item[1:]:
    if len(results) == 0:
      results = [value]
    else:
      new_results = []
      for prev_result in results:
        new_results.extend([
          prev_result * value,
          prev_result + value,
        ])
      results = new_results
  success = target in results
  if success: total += target
  # print(f'{success=} {item=} {results=}')
print(f'part 1 {total=}')

total = 0
for item in data:
  target = item[0]
  results = []
  for value in item[1:]:
    if len(results) == 0:
      results = [value]
    else:
      new_results = []
      for prev_result in results:
        new_results.extend([
          prev_result * value,
          prev_result + value,
          int(f'{prev_result}{value}'),
        ])
      results = new_results
  success = target in results
  if success: total += target
  # print(f'{success=} {item=} {results=}')
print(f'part 2 {total=}')
