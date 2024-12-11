#!/usr/bin/env python3
import time
from collections import Counter

DEBUG = True
EXAMPLE = False


def run_int(items: list[int], iterations: int) -> int:
  for iteration in range(iterations):
    new_items: list[int] = []
    for item in items:
      if item == 0:
        new_items.append(1)
      else:
        item_str = str(item)
        item_str_len = len(item_str)
        if item_str_len % 2 == 0:
          new_items.extend([
            int(item_str[:item_str_len // 2]),
            int(item_str[item_str_len // 2:]),
          ])
        else:
          new_items.append(item * 2024)
    if DEBUG: print(f'{iteration}: {len(items)} -> {len(new_items)}')
    items = new_items
  return len(items)


def run_str(items: list[str], iterations: int) -> int:
  prev_i_elapsed = 0.0
  for iteration in range(iterations):
    i_started = time.monotonic()
    new_items: list[str] = []
    for item in items:
      item_int = int(item)
      if item_int == 0:
        new_items.append('1')
      else:
        item_str_len = len(item)
        if item_str_len % 2 == 0:
          new_items.extend([
            item[:item_str_len // 2],
            item[item_str_len // 2:].lstrip('0') or '0',
          ])
        else:
          new_items.append(str(item_int * 2024))
    if DEBUG:
      i_elapsed = time.monotonic() - i_started
      multiplier = (i_elapsed / prev_i_elapsed) if prev_i_elapsed > 0 else 0
      if len(new_items) < 20:
        print(f'{iteration}: {i_elapsed:.3f}s {multiplier:.03f}x {new_items=}')
      else:
        print(f'{iteration}: {i_elapsed:.3f} {multiplier:.03f}x {len(items)} -> {len(new_items)}')
      prev_i_elapsed = i_elapsed
    items = new_items
  return len(items)


def run_str_single(items: list[str], iterations: int) -> int:
  new_items: list[str] = []
  for original_item in items:
    generation = [original_item]
    for iteration in range(iterations):
      new_generation: list[str] = []
      for item in generation:

        item_int = int(item)
        if item_int == 0:
          new_generation.append('1')
        else:
          item_str_len = len(item)
          if item_str_len % 2 == 0:
            new_generation.extend([
              item[:item_str_len // 2],
              item[item_str_len // 2:].lstrip('0') or '0',
            ])
          else:
            new_generation.append(str(item_int * 2024))

      generation = new_generation
      if DEBUG:
        if len(new_generation) < 20:
          print(f'{iteration}: {new_generation=}')
        else:
          print(f'{iteration}: {len(generation)} -> {len(new_generation)}')
    new_items.extend(new_generation)

  return len(new_items)


def run_counter(items: list[int], iterations: int) -> int:
  counts = Counter(items)
  for iteration in range(iterations):
    i_started = time.monotonic()
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
    i_elapsed = time.monotonic() - i_started
    count_total = sum(new_counts.values())
    print(f'{iteration}: {i_elapsed:.3f}s {len(counts.keys())} -> {len(new_counts.keys())} {count_total=}')
    counts = new_counts
  return sum(counts.values())


with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  text = f.read()
if DEBUG: print(f'{text=}')


def run_all(text: str, iterations: int):
  items_int = list(map(int, text.split()))
  if DEBUG: print(f'{items_int=}')
  items_str = text.split()
  if DEBUG: print(f'{items_str=}')

  times: dict[str, float] = {}

  def add_time(label: str, started: float):
    elapsed = time.monotonic() - started
    times[label] = elapsed
    print(f'  {label} in {elapsed:.3f}s')

  # started = time.monotonic()
  # print(f'{iterations=} int: {run_int(items_int,iterations)}')
  # add_time(f'{iterations=} int', started)

  # started = time.monotonic()
  # print(f'{iterations=} str: {run_str(items_str,iterations)}')
  # add_time(f'{iterations=} str', started)

  # started = time.monotonic()
  # print(f'{iterations=} str single: {run_str_single(items_str,iterations)}')
  # add_time(f'{iterations=} str single', started)

  started = time.monotonic()
  print(f'{iterations=} counter: {run_counter(items_int,iterations)}')
  add_time(f'{iterations=} counter', started)

  print(f'{times=}')


# run_all(text, 25)
# run_all(text, 35)
# run_all(text, 50)
run_all(text, 75)
# exit()
# print(f'part 2 {run(items_int,75)}')
