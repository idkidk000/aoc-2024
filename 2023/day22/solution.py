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
  x: int; y: int; z: int
  def __mul__(self, value: int): return Point(self.x * value, self.y * value, self.z * value)
  def __add__(self, other: Self): return Point(self.x + other.x, self.y + other.y, self.z + other.z)
  def __sub__(self, other: Self): return Point(self.x - other.x, self.y - other.y, self.z - other.z)
  def __repr__(self): return f'({self.x},{self.y},{self.z})'
  def __getitem__(self, index: int): return (self.x, self.y, self.z)[index]
  def __lt__(self, other: Self): return (self.x, self.y, self.z) < (other.x, other.y, other.z)

@dataclass
class Brick():
  p0: Point; p1: Point; removed: bool=False
  def move(self, val: Point): self.p0+=val; self.p1+=val
  @property
  def w(self): return abs(self.p0.x-self.p1.x)+1
  @property
  def d(self): return abs(self.p0.y-self.p1.y)+1
  @property
  def h(self): return abs(self.p0.z-self.p1.z)+1
  @property
  def min(self): return Point(min(self.p0.x, self.p1.x), min(self.p0.y, self.p1.y), min(self.p0.z, self.p1.z))
  @property
  def max(self): return Point(max(self.p0.x, self.p1.x), max(self.p0.y, self.p1.y), max(self.p0.z, self.p1.z))
  @property
  def xy(self): return {(x,y) for x in range(self.min.x, self.max.x + 1) for y in range(self.min.y, self.max.y + 1)}
  def __repr__(self): return f'<Brick p0={self.p0} p1={self.p1} w={self.w} d={self.d} h={self.h} xy={self.xy} removed={self.removed}>'
  @classmethod
  def fromStr(cls, line: str): return cls(*[Point(*map(int,p.split(','))) for p in line.split('~')]) #type: ignore

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
#yapf: enable


def read_data() -> list[Brick]:
  # moved file read directly into the function since we'll acquire a tonne of state which we won't want for p2
  with open(FILENAME, 'r') as f:
    bricks = [Brick.fromStr(x) for x in f.read().splitlines()]
  if DEBUG > 2: print(f'{bricks=}')
  return bricks


def part1():
  bricks = read_data()
  bricks.sort(key=lambda x: x.min.z)
  # loop from from min.z
  for i, brick in enumerate(bricks):
    if DEBUG > 0: print(f'{i=} {brick=}')
    z_below = 0
    xy_remain = {*brick.xy}
    # loop back from i to 0 and find everything which has max.z below our min.z and xy intersects us
    for j in range(i, -1, -1):
      below = bricks[j]
      # valid intersection
      if below.max.z < brick.min.z and below.xy.intersection(xy_remain):
        # remove the xy coords from our set left to match
        xy_remain.difference_update(below.xy)
        if DEBUG > 1: print(f'  {below=}')
        # list is sorted on min.z and heights are varied so we need to keep checking
        z_below = max(z_below, below.max.z)
        # break if we've found all possible xy intersections
        if len(xy_remain) == 0: break
    move_by = Point(0, 0, z_below + 1 - brick.min.z)
    if DEBUG > 1: print(f'  {move_by=}')
    brick.move(move_by)
    if DEBUG > 1: print(f'  result {brick=}')

  # idk yet how to do this part
  # loop over again from the bottom
  # find bricks directly above which xy intersect
  # the the aboves, find their belows which xy intersect
  # if count==1: no remove
  # else: remove us. but we need to set a flag somewhere so that removed can be excluded from subsequent searches

  # loop again from min.z
  count_removed = 0
  for i, brick in enumerate(bricks):
    if DEBUG > 0: print(f'{i=} {brick=}')
    if brick.removed: continue
    can_remove = True
    # loop from i+1 to end and find everything directly above us
    for j in range(i + 1, len(bricks)):
      if not can_remove: break
      above = bricks[j]
      # we're sorted on min.z so we can definitely break
      if above.min.z > brick.max.z + 1: break
      if above.min.z < brick.max.z + 1 or above.removed or not above.xy.intersection(brick.xy): continue
      if DEBUG > 1: print(f'  {above=}')
      # now we need to loop from j to -1 and find its belows which are not removed
      # if count==1 (i.e us), set can_remove=False and break 2
      count_below = 0
      for k in range(j, -1, -1):  #loop hell tbqh
        below = bricks[k]
        # TODO: find an early exit
        if below.max.z != above.min.z - 1 or below.removed or not below.xy.intersection(above.xy): continue
        if DEBUG > 1: print(f'    {below=}')
        count_below += 1
      if count_below == 1:  #us hopefully
        can_remove = False
        break
      assert count_below > 1  #0 would mean a brick directly above us has nothing below it. which would be big think time
    if DEBUG > 1: print(f'  {can_remove=}')
    if can_remove:
      brick.removed = True
      count_removed += 1
  print(f'part 1: {count_removed}')
  # amazing i'm not even close on the example :)


def part2():
  ...


if PART1: part1()
if PART2: part2()
