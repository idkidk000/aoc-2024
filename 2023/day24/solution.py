#!/usr/bin/env python3
import sys
from functools import cache
from dataclasses import dataclass
from typing import Self
from itertools import combinations
from collections import Counter

# yapf: disable
sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
INF = 10 ** 20

@dataclass
class Vector():
  x: int; y: int; z: int
  def __mul__(self, value: int): return Vector(self.x * value, self.y * value, self.z * value)
  def __add__(self, other: Self): return Vector(self.x + other.x, self.y + other.y, self.z + other.z)
  def __repr__(self): return f'({self.x},{self.y},{self.z})'
  def __getitem__(self, index: int): return (self.x, self.y, self.z)[index]
  def __lt__(self, other: Self): return (self.x, self.y, self.z) < (other.x, other.y, other.z)

@dataclass
class Collider():
  position: Vector; velocity: Vector; index: int
  def __hash__(self): return self.index
  def __eq__(self, other: Self): return self.index == other.index #type: ignore
  @classmethod
  def from_str(cls, line: str, index: int): return cls(*[ Vector(*map(int,v.split(','))) for v in line.replace(' ','').split('@') ], index) #type: ignore

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

def debug(level: int, *args, **kwargs):
  if level < DEBUG: print(*args, **kwargs)
#yapf: enable

with open(FILENAME, 'r') as f:
  hailstones = [Collider.from_str(x, i) for i, x in enumerate(f.read().splitlines())]
debug(0, f'{hailstones=}')


def part1():
  # why tho
  min_xy, max_xy = 200_000_000_000_000, 400_000_000_000_000
  # min_xy, max_xy = 7, 27

  # only using x and y
  # ugh https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
  # the equation i can read intersects anywhere on the line so we also need to check whether the collision is in the velocity vector for both lines
  # the actual question is "do these lines from pos to infinity on velocity intersect". not "will these colliders be in the same place at the same time"
  counts: Counter[str] = Counter()
  for left, right in combinations(hailstones, 2):
    debug(0, f'{left=} {right=}')
    v1 = left.position
    v2 = left.position + left.velocity
    v3 = right.position
    v4 = right.position + right.velocity
    debug(1, f'  {v1=} {v2=} {v3=} {v4=}')
    denominator = ((v1.x - v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x - v4.x))
    debug(1, f'  {denominator=}')
    if denominator == 0:
      counts['none'] += 1
      continue  #no intersection

    # intersection point
    px = ((v1.x * v2.y - v1.y * v2.x) * (v3.x - v4.x) - (v1.x - v2.x) * (v3.x * v4.y - v3.y * v4.x)) / denominator
    py = ((v1.x * v2.y - v1.y * v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x * v4.y - v3.y * v4.x)) / denominator

    # this feels quite dumb and there's almost certainly a quick and easy test
    # if left.velocity.x < 0 and px > left.position.x: continue
    # if left.velocity.y < 0 and px > left.position.y: continue
    # if right.velocity.x < 0 and px > right.position.x: continue
    # if right.velocity.y < 0 and px > right.position.y: continue
    # if left.velocity.x > 0 and px < left.position.x: continue
    # if left.velocity.y > 0 and px < left.position.y: continue
    # if right.velocity.x > 0 and px < right.position.x: continue
    # if right.velocity.y > 0 and px < right.position.y: continue

    # ah dot product my old nemesis
    # if either of these is <0, the intersection is behind position and can be skipped
    left_dp = (px - left.position.x) * left.velocity.x + (py - left.position.y) * left.velocity.y
    right_dp = (px - right.position.x) * right.velocity.x + (py - right.position.y) * right.velocity.y

    future = left_dp >= 0 and right_dp >= 0
    inside = min_xy <= px <= max_xy and min_xy <= py <= max_xy
    debug(1, f'  {px=} {py=} {left_dp=} {right_dp=} {future=} {inside=}')
    counts[f'''{'future' if future else 'past'}_{'inside' if inside else 'outside'}'''] += 1
  debug(0, f'{counts=}')
  print(f'''part 1: {counts['future_inside']}''')


def part2():
  ...


if PART1: part1()
if PART2: part2()
