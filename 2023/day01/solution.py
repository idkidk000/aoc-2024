#!/usr/bin/env python3
import sys
import re

DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = 1
  elif arg == '-d2': DEBUG = 2
  elif arg == '-d3': DEBUG = 3
  elif arg == '-p1':
    PART1 = True
    PART2 = False
  elif arg == '-p2':
    PART1 = False
    PART2 = True
  elif arg == '-p0':
    PART1 = False
    PART2 = False
  else:
    raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()


def part1():
  total = 0
  for line in text.splitlines():
    digits = [x for x in line if x.isdigit()]
    df, dl = digits[0], digits[-1]
    if DEBUG > 0: print(f'{line=} {digits=} {df=} {dl=}')
    total += int(df + dl)
  print(f'part 1: {total}')


def part2():
  subs = {
    'one': '1',
    'two': '2',
    'three': '3',
    'four': '4',
    'five': '5',
    'six': '6',
    'seven': '7',
    'eight': '8',
    'nine': '9',
  }
  regex = '(' + ('|'.join(subs.keys())) + ')'
  if DEBUG > 0: print(f'{regex=}')
  total = 0
  for line in text.splitlines():
    line_subbed = re.sub(regex, lambda x: subs[x.group(1)], line)
    digits = [x for x in line_subbed if x.isdigit()]
    df, dl = digits[0], digits[-1]
    if DEBUG > 0: print(f'{line=} {line_subbed=} {digits=} {df=} {dl=}')
    total += int(df + dl)
  print(f'part 2: {total}')


if PART1: part1()
if PART2: part2()
