#!/usr/bin/env python3
import sys
from functools import cache
from dataclasses import dataclass
from typing import Self

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True


# yapf: disable
@dataclass
class Point():
  r: int; c: int
  def __mul__(self, value: int): return Point(self.r * value, self.c * value)
  def __add__(self, other: Self): return Point(self.r + other.r, self.c + other.c)
  def __repr__(self): return f'({self.r},{self.c})'
  def __getitem__(self, index: int): return (self.r, self.c)[index]
  def __lt__(self, other: Self): return (self.r, self.c) < (other.r, other.c)

for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i': FILENAME = 'input.txt'
      case '-p1': PART1, PART2 = True, False
      case '-p2': PART1, PART2 = False, True
      case '-p0': PART1, PART2 = False, False
      case _: raise Exception(f'unknown {arg=}')

D4 = [Point(*x) for x in [(-1, 0), (0, 1), (1, 0), (0, -1)]]
#yapf: enable

with open(FILENAME, 'r') as f:
  text = f.read()
grid = [list(x) for x in text.splitlines()]
rows, cols = len(grid), len(grid[0])


def draw_grid(grid: list[list[str]]):
  # https://www.shellhacks.com/bash-colors/
  # f'\x1b[7;{31+d}m{s%10}\x1b[0m'
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(grid[r])}''')
  print(f'{rows=} {cols=}')


def part1():
  ...


def part2():
  ...


if PART1: part1()
if PART2: part2()
