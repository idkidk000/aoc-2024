#!/usr/bin/env python3
import sys
from functools import cache

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
      case '-p1':
        PART1, PART2 = True, False
      case '-p2':
        PART1, PART2 = False, True
      case '-p0':
        PART1, PART2 = False, False
      case _:
        raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  lines = [x.split() for x in f.read().splitlines()]
races = [{
  'time': int(x),
  'record': int(y),
} for x, y in zip(lines[0][1:], lines[1][1:])]
if DEBUG > 1: print(f'{races=}')


def part1():
  # i think the question specifically wants a brute forced answer :(
  total = 1
  for race in races:
    race_total = 0
    for i in range(0, race['time'] + 1):
      speed = i
      time = race['time'] - i
      dist = speed * time
      win = dist > race['record']
      if DEBUG > 1: print(f'{race=} {i=} {speed=} {time=} {dist=} {win=}')
      if win: race_total += 1
    total *= race_total

  print(f'part 1: {total=}')


def part2():
  race_time = int(''.join(str(x['time']) for x in races))
  record = int(''.join(str(x['record']) for x in races))
  if DEBUG > 1: print(f'{race_time=} {record=}')
  # binary search the lowest press time to win
  lower = 0
  upper = race_time
  while upper > lower:
    mid = (lower + upper) // 2
    win = mid * (race_time - mid) > record
    if win:
      upper = mid
    else:
      lower = mid + 1
  print(f'{upper=} {lower=} {win=}')
  win_lower = lower

  # and again for the highest
  lower = win_lower + 1
  upper = race_time
  while upper > lower:
    mid = (lower + upper) // 2
    win = mid * (race_time - mid) > record
    if win:
      lower = mid + 1
    else:
      upper = mid
  print(f'{upper=} {lower=} {win=}')
  win_upper = lower

  total = win_upper - win_lower
  print(f'part 2: {total=}')


if PART1: part1()
if PART2: part2()
