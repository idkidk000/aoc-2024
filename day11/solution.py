#!/usr/bin/env python3
import time

DEBUG = False
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
        if not (item_str_len / 2 % 1):
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
  for iteration in range(iterations):
    new_items: list[str] = []
    for item in items:
      item_int = int(item)
      if item_int == 0:
        new_items.append('1')
      else:
        item_str_len = len(item)
        if not (item_str_len / 2 % 1):
          new_items.extend([
            item[:item_str_len // 2],
            item[item_str_len // 2:].lstrip('0') or '0',
          ])
        else:
          new_items.append(str(item_int * 2024))
    if DEBUG:
      if len(new_items) < 20:
        print(f'{iteration}: {new_items=}')
      else:
        print(f'{iteration}: {len(items)} -> {len(new_items)}')
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
          if not (item_str_len / 2 % 1):
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

  started = time.monotonic()
  print(f'{iterations=} str single: {run_str_single(items_str,iterations)}')
  add_time(f'{iterations=} str single', started)

  started = time.monotonic()
  print(f'{iterations=} int: {run_int(items_int,iterations)}')
  add_time(f'{iterations=} int', started)

  started = time.monotonic()
  print(f'{iterations=} str: {run_str(items_str,iterations)}')
  add_time(f'{iterations=} str', started)

  print(f'{times=}')


run_all(text, 25)
run_all(text, 75)
# exit()
# print(f'part 2 {run(items_int,75)}')
