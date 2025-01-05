#!/usr/bin/env python3

with open('input.txt', 'r') as f:
  reports = [list(map(int, report.split())) for report in f.read().splitlines()]
# print(f'{reports=}')

count_safe = 0
for report in reports:
  prev_level = None
  in_limits = True
  all_ascending = True
  all_descending = True
  for level in report:
    if prev_level is not None:
      if not (1 <= abs(level - prev_level) <= 3):
        in_limits = False
      if level <= prev_level:
        all_ascending = False
      if level >= prev_level:
        all_descending = False
    prev_level = level
  safe = in_limits and (all_ascending or all_descending)
  # print(f'{report=} {in_limits=} {all_ascending=} {all_descending=} {safe=}')
  if safe: count_safe += 1
print(f'part 1 {count_safe=}')

count_safe = 0
for report in reports:
  for exclude_index in range(-1, len(report)):
    filtered_report = [x for i, x in enumerate(report) if i != exclude_index]
    prev_level = None
    in_limits = True
    all_ascending = True
    all_descending = True
    for level in filtered_report:
      if prev_level is not None:
        if not (1 <= abs(level - prev_level) <= 3):
          in_limits = False
        if level <= prev_level:
          all_ascending = False
        if level >= prev_level:
          all_descending = False
      prev_level = level
    safe = in_limits and (all_ascending or all_descending)
    # print(f'{report=} {in_limits=} {all_ascending=} {all_descending=} {safe=}')
    if safe:
      count_safe += 1
      break
print(f'part 2 {count_safe=}')
