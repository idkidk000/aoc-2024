#!/usr/bin/env python3
import time
from collections import Counter

DEBUG = True
EXAMPLE = False


def run(items: list[int], iterations: int) -> int:
  counts = Counter(items)
  for iteration in range(iterations):
    if DEBUG: i_started = time.monotonic()
    new_counts: Counter[int] = Counter()
    for value, count in counts.items():
      if value == 0:
        new_counts[1] += count
      else:
        value_str = str(value)
        value_str_len = len(value_str)
        if value_str_len % 2 == 0:
          new_counts[int(value_str[:value_str_len // 2])] += count
          new_counts[int(value_str[value_str_len // 2:])] += count
        else:
          new_counts[value * 2024] += count
    if DEBUG:
      i_elapsed = time.monotonic() - i_started
      count_total = sum(new_counts.values())
      print(f'{iteration}: {i_elapsed:.3f}s {len(counts.keys())} -> {len(new_counts.keys())} {count_total=}')
    counts = new_counts
  return sum(counts.values())


with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  text = f.read()
if DEBUG: print(f'{text=}')
items = list(map(int, text.split()))
if DEBUG: print(f'{items=}')
print(f'part 1 {run(items, 25)}')
print(f'part 2 {run(items, 75)}')
