#!/usr/bin/env python3
import sys

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
  text = f.read()
games = [
  {
    'id': int(split0[0].split(' ')[1]),
    'reveals':[
      {
        vk1[1]:int(vk1[0])
        for vk0 in reveal.split(', ')
        if (vk1:=vk0.split(' '))
      }
      for reveal in split0[1].split('; ')
    ]
  }
  for x in text.splitlines() \
  if (split0 := x.split(': ')) \
]


def part1():
  total = 0
  for game in games:
    possible = all(x.get('red', 0) <= 12 for x in game['reveals']) and \
               all(x.get('green', 0) <= 13 for x in game['reveals']) and \
               all(x.get('blue', 0) <= 14 for x in game['reveals']) #type: ignore
    if DEBUG > 0: print(f'{game=} {possible=}')
    if possible: total += game['id']  #type: ignore
  print(f'part 1: {total}')


def part2():
  total = 0
  for game in games:
    red = max(x.get('red', 0) for x in game['reveals'])  #type: ignore
    green = max(x.get('green', 0) for x in game['reveals'])  #type: ignore
    blue = max(x.get('blue', 0) for x in game['reveals'])  #type: ignore
    if DEBUG > 0: print(f'{game=} {red=} {green=} {blue=}')
    total += red * green * blue
  print(f'part 2: {total}')


if PART1: part1()
if PART2: part2()
