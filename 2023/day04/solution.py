#!/usr/bin/env python3
import sys

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

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
  cards = [
    {
      'win': {int(x)
              for x in parts[0].split()},
      'have': {int(x)
               for x in parts[1].split()},
    }
    for line in f.read().splitlines()
    if len(parts := line.split(': ')[1].split(' | ')) == 2
  ]
if DEBUG > 1: print(f'{cards=}')


def part1():
  total = 0
  for card in cards:
    intersection = card['win'].intersection(card['have'])
    value = (1 << len(intersection) - 1) if intersection else 0
    if DEBUG > 0: print(f'''win={card['win']} have={card['have']} {intersection=} {value=}''')
    total += value
  print(f'part 1: {total=}')


def part2():
  values = [len(x['win'].intersection(x['have'])) for x in cards]
  rows = len(cards)
  counts = [1] * len(values)
  if DEBUG > 1: print(f'{values=}')
  if DEBUG > 1: print(f'{counts=}')
  for i, value in enumerate(values.copy()):
    for j in range(value):
      if i + j + 1 >= rows: continue
      counts[i + j + 1] += counts[i]
      if DEBUG > 0: print(f'{i=} {value=} {j=} {counts[i + j+1]=}')
  total = sum(counts)
  if DEBUG > 1: print(f'{counts=}')
  print(f'part 2: {total=}')


if PART1: part1()
if PART2: part2()
