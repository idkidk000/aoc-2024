#!/usr/bin/env python3
import sys
from functools import cache
import re
from math import lcm

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
  lines = f.read().splitlines()
directions = lines[0]
regex = re.compile(r'([A-Z]{3}) = \(([A-Z]{3}), ([A-Z]{3})\)', re.MULTILINE)
nodes = {match.group(1): (match.group(2), match.group(3)) for match in re.finditer(regex, ''.join(lines[2:]))}


def part1():
  node = 'AAA'
  steps = 0
  while node != 'ZZZ':
    direction = directions[steps % len(directions)]
    node = nodes[node][0 if direction == 'L' else 1]
    steps += 1
    if DEBUG > 1: print(f'{node=} {direction=} {steps=}')

  print(f'part 1: {steps}')


def part2():
  # current_nodes = [x for x in nodes.keys() if x.endswith('A')]
  # steps = 0
  # while any(not x.endswith('Z') for x in current_nodes):
  #   direction = directions[steps % len(directions)]
  #   current_nodes = [nodes[x][0 if direction == 'L' else 1] for x in current_nodes]
  #   steps += 1
  #   if DEBUG > 1: print(f'{current_nodes=} {direction=} {steps=}')

  # find the length of each loop. steps is lowest common multiple
  loop_lengths = []
  for node in [x for x in nodes if x.endswith('A')]:
    steps = 0
    while not node.endswith('Z'):
      direction = directions[steps % len(directions)]
      node = nodes[node][0 if direction == 'L' else 1]
      steps += 1
      if DEBUG > 1: print(f'{node=} {direction=} {steps=}')
    loop_lengths.append(steps)
  if DEBUG > 0: print(f'{loop_lengths=}')
  steps = lcm(*loop_lengths)
  print(f'part 2: {steps}')


if PART1: part1()
if PART2: part2()
