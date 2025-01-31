#!/usr/bin/env python3
import sys
from dataclasses import dataclass
from typing import Self

# yapf: disable
sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

@dataclass
class Point():
  r: int; c: int
  def __mul__(self, value: int): return Point(self.r * value, self.c * value)
  def __add__(self, other: Self): return Point(self.r + other.r, self.c + other.c)
  def __lt__(self, other: Self): return (self.r, self.c) < (other.r, other.c)
  def __hash__(self: Self): return hash((self.r, self.c))

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

def debug(level: int, *args, **kwargs):
  if level < DEBUG: print(*args, **kwargs)
#yapf: enable

with open(FILENAME, 'r') as f:
  text = f.read()
grid = text.splitlines()
rows, cols = len(grid), len(grid[0])


def part1():
  ...


def part2():
  ...


if PART1: part1()
if PART2: part2()
