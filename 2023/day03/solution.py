#!/usr/bin/env python3
import sys
import re
from collections import defaultdict

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i':
        FILENAME = 'input.txt'
      case 'p1':
        PART1, PART2 = True, False
      case 'p2':
        PART1, PART2 = False, True
      case 'p0':
        PART1, PART2 = False, False
      case _:
        raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read().splitlines()


def part1():
  total = 0
  digit_regex = re.compile(r'(\d+)')
  symbol_regex = re.compile(r'([^\d.])')
  rows = len(text)
  cols = len(text[0])
  if DEBUG > 0: print(f'{rows=} {cols=}')
  for row, line in enumerate(text):
    for match in re.finditer(digit_regex, line):
      #m.span is a tuple of start and end char ixs, though end is +1 due to reasons
      col_start = match.span()[0]
      col_end = match.span()[1] - 1
      length = col_end - col_start + 1
      part = match.group(1)
      if DEBUG > 0: print(f'{part=} {row=} {col_start=} {col_end=} {length=}')
      perimeter: list[str] = []
      if row > 0:
        value = text[row - 1][max(0, col_start - 1):min(col_end + 2, cols - 1)]
        if DEBUG > 1: print(f'  above: {value}')
        perimeter += [value]
      if row < rows - 1:
        value = text[row + 1][max(0, col_start - 1):min(col_end + 2, cols - 1)]
        if DEBUG > 1: print(f'  below: {value}')
        perimeter += [value]
      if col_start > 0:
        value = text[row][col_start - 1]
        if DEBUG > 1: print(f'  left: {value}')
        perimeter += [value]
      if col_end < cols - 1:
        value = text[row][col_end + 1]
        if DEBUG > 1: print(f'  right: {value}')
        perimeter += [value]
      found = re.search(symbol_regex, ''.join(perimeter))
      # if DEBUG > 0: print(f'{part=} {row=} {col_start=} {col_end=} {length=} {perimeter=} {found=}')
      if DEBUG > 0: print(f'  {perimeter=} {found=}')
      if found: total += int(part)
      # if row >= 5: exit()
  print(f'part 1: {total=}')


def part2():
  digit_regex = re.compile(r'(\d+)')
  symbol_regex = re.compile(r'(\*)')
  gears: defaultdict[tuple[int, int], list[int]] = defaultdict(list)
  rows = len(text)
  cols = len(text[0])
  if DEBUG > 0: print(f'{rows=} {cols=}')
  for row, line in enumerate(text):
    for match in re.finditer(digit_regex, line):
      #m.span is a tuple of start and end char ixs, though end is +1 due to reasons
      col_start = match.span()[0]
      col_end = match.span()[1] - 1
      length = col_end - col_start + 1
      value = int(match.group(1))
      if DEBUG > 0: print(f'{value=} {row=} {col_start=} {col_end=} {length=}')

      if row > 0:
        string = text[row - 1][max(0, col_start - 1):min(col_end + 2, cols - 1)]
        for gear_match in re.finditer(symbol_regex, string):
          gears[(row - 1, max(0, col_start - 1) + gear_match.span()[0])].append(value)
          if DEBUG > 1: print(f'  gear above at {(row-1,  max(0, col_start - 1)+gear_match.span()[0])}')

      if row < rows - 1:
        string = text[row + 1][max(0, col_start - 1):min(col_end + 2, cols - 1)]
        for gear_match in re.finditer(symbol_regex, string):
          gears[(row + 1, max(0, col_start - 1) + gear_match.span()[0])].append(value)
          if DEBUG > 1: print(f'  gear below at {(row+1,  max(0, col_start - 1)+gear_match.span()[0])}')

      if col_start > 0:
        if text[row][col_start - 1] == '*':
          gears[(row, col_start - 1)].append(value)
          if DEBUG > 1: print(f'  gear left at {(row, col_start - 1)}')

      if col_end < cols - 1:
        if text[row][col_end + 1] == '*':
          gears[(row, col_end + 1)].append(value)
          if DEBUG > 1: print(f'  gear right at {(row, col_end + 1)}')

      # if row >= 5: exit()

  total = sum(v[0] * v[1] for v in gears.values() if len(v) == 2)
  print(f'part 2: {total=}')


if PART1: part1()
if PART2: part2()
