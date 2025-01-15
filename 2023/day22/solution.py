#!/usr/bin/env python3
import sys
from dataclasses import dataclass
from typing import Self
import colorsys as coloursys
from functools import cache
from collections import defaultdict

# yapf: disable
sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
INF = 10 ** 10

@dataclass
class Point():
  x: int; y: int; z: int
  def __mul__(self, val: int): return Point(self.x * val, self.y * val, self.z * val)
  def __add__(self, other: Self): return Point(self.x + other.x, self.y + other.y, self.z + other.z)
  def __sub__(self, other: Self): return Point(self.x - other.x, self.y - other.y, self.z - other.z)
  def __repr__(self): return f'({self.x},{self.y},{self.z})'
  def __getitem__(self, index: int): return (self.x, self.y, self.z)[index]
  def __lt__(self, other: Self): return (self.x, self.y, self.z) < (other.x, other.y, other.z)

@dataclass
class Brick():
  p0: Point; p1: Point; index:int
  def translate(self, val: Point): self.p0+=val; self.p1+=val
  #TODO: most of these properties should be precalculated really
  @property
  def w(self): return abs(self.p0.x-self.p1.x)+1
  @property
  def d(self): return abs(self.p0.y-self.p1.y)+1
  @property
  def h(self): return abs(self.p0.z-self.p1.z)+1
  @property
  def vol(self): return self.w * self.d * self.h
  @property
  def min(self): return Point(min(self.p0.x, self.p1.x), min(self.p0.y, self.p1.y), min(self.p0.z, self.p1.z))
  @property
  def max(self): return Point(max(self.p0.x, self.p1.x), max(self.p0.y, self.p1.y), max(self.p0.z, self.p1.z))
  @property
  def xy(self): return {(x,y) for x in range(self.min.x, self.max.x + 1) for y in range(self.min.y, self.max.y + 1)}
  @property
  def xz(self): return {(x,z) for x in range(self.min.x, self.max.x + 1) for z in range(self.min.z, self.max.z + 1)}
  @property
  def yz(self): return {(y,z) for y in range(self.min.y, self.max.y + 1) for z in range(self.min.z, self.max.z + 1)}
  @property
  def xyz(self): return {(x,y,z) for x in range(self.min.x, self.max.x + 1) for y in range(self.min.y, self.max.y + 1) for z in range(self.min.z, self.max.z + 1)}
  def __repr__(self): return f'<Brick index={self.index} p0={self.p0} p1={self.p1} w={self.w} d={self.d} h={self.h} xy={self.xy}>'
  def __hash__(self): return self.index
  @classmethod
  def from_str(cls, line: str, index:int): return cls(*[Point(*map(int,p.split(','))) for p in line.split('~')], index) #type: ignore

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
def debug(level: int, *args, **kwargs):
  if level < DEBUG: print(*args, **kwargs)


def render(bricks: list[Brick], title: str = ''):
  # official aoc fancy drawing maker 3000
  if title: print(f'\x1b[1m{title}:\x1b[0m')
  min_x = min_y = min_z = INF
  max_x = max_y = max_z = -INF
  volume: dict[tuple[int, int, int], int] = {}
  for brick in bricks:
    min_x, min_y, min_z = min(min_x, brick.min.x), min(min_y, brick.min.y), min(min_z, brick.min.z)
    max_x, max_y, max_z = max(max_x, brick.max.x), max(max_y, brick.max.y), max(max_z, brick.max.z)
    for xyz in brick.xyz:
      volume[xyz] = brick.index
  min_z = 1
  # basic colours: https://www.shellhacks.com/bash-colors/
  # rgb: fg: 38;2;r;g;b; bg: 48;2;r;g;b
  bg_empty = '0;0;0'
  bg_brick = '255;255;255'
  fg_lightness = 0.2
  for y in range(min_y, max_y + 1):
    # zx slice, top to bottom
    for z in range(max_z, min_z - 1, -1):
      row = [f'\x1b[48;2;{bg_empty}m \x1b[0m'] * (max_x - min_x + 1)
      for x in range(min_x, max_x + 1):
        i = volume.get((x, y, z))
        if i is None: continue
        value = f'{i+10:X}'[-1]  #aoc label from A
        hue = 1.0 / len(bricks) * i  # not an off-by one since hue=0 and hue=1 are the same
        r, g, b = [int(x * 255) for x in coloursys.hls_to_rgb(hue, fg_lightness, 1.0)]
        coloured = f'\x1b[38;2;{r};{g};{b};1;48;2;{bg_brick}m{value}\x1b[0m'
        row[x] = coloured
      print(f'''{'  ' if title else ''}{y=:3d} {z=:3d}: {''.join(row)}''')
    print()


def get_bricks() -> list[Brick]:
  # do the drop in here since both parts require it
  with open(FILENAME, 'r') as f:
    bricks = [Brick.from_str(x, i) for i, x in enumerate(f.read().splitlines())]
  if DEBUG: render(bricks, 'initial')

  # sort on min.z so we drop in the right order
  bricks.sort(key=lambda x: x.min.z)

  # make a dict of xys and zs
  min_x = min_y = INF
  max_x = max_y = -INF
  for brick in bricks:
    min_x, min_y = min(min_x, brick.min.x), min(min_y, brick.min.y)
    max_x, max_y = max(max_x, brick.max.x), max(max_y, brick.max.y)
  z_belows = {(x, y): 0 for x in range(min_x, max_x + 1) for y in range(min_y, max_y + 1)}

  for above in bricks:
    # lookup the max z below our xys, translate to that+1, update dict
    z_below = max(z_belows[xy] for xy in above.xy)
    debug(1, f'{above=} {z_below=}')
    above.translate(Point(0, 0, z_below - above.min.z + 1))
    debug(2, f'  translated {above=}')
    z_belows |= {xy: above.max.z for xy in above.xy}

  # relative min.zs are now invalid
  if DEBUG: render(bricks, 'dropped')
  return bricks


def part1():
  # the question only wants to know which bricks could be *independently* removed
  # make a set of potential removals. loop over aboves. find their belows. if count belows==1, remove belows from potentials

  bricks = get_bricks()
  potentials = {*bricks}
  bricks.sort(key=lambda x: x.max.z, reverse=True)
  for i, above in enumerate(bricks):
    debug(1, f'{i=} {above=}')
    belows = set()
    for below in bricks[i + 1:]:
      if above.min.z - 1 > below.max.z: break  # max.z reverse sort lets us break out early
      if above.min.z - 1 == below.max.z and above.xy.intersection(below.xy):
        debug(2, f'  {below=}')
        belows.add(below)
    if len(belows) == 1:
      debug(1, f'  cannot remove {belows}')
      potentials.difference_update(belows)

  print(f'part 1: {len(potentials)}')
  # 519


def part2():
  # like a dependency tree, except all belows have to be removed for our item to be removed

  # build dicts of above and below index sets
  bricks = get_bricks()
  above_indices: dict[int, set[int]] = defaultdict(set)
  below_indices: dict[int, set[int]] = defaultdict(set)

  bricks.sort(key=lambda x: x.min.z)
  for i, below in enumerate(bricks):
    debug(1, f'{i=} {below=}')
    for above in bricks[i + 1:]:
      if below.max.z + 1 < above.min.z: break
      if below.max.z + 1 == above.min.z and below.xy.intersection(above.xy):
        debug(2, f'  {above=}')
        above_indices[below.index].add(above.index)

  bricks.sort(key=lambda x: x.max.z, reverse=True)
  for i, above in enumerate(bricks):
    debug(1, f'{i=} {above=}')
    for below in bricks[i + 1:]:
      if above.min.z - 1 > below.max.z: break
      if above.min.z - 1 == below.max.z and above.xy.intersection(below.xy):
        debug(2, f'  {below=}')
        below_indices[above.index].add(below.index)

  # surprisingly not too slow
  total = 0
  for brick in bricks:
    removed = {brick.index}
    found = True
    while found:
      found = False
      for index in removed.copy():
        for above_index in above_indices[index]:
          if above_index in removed: continue  #  this is a little faster than doing a difference
          if len(below_indices[above_index].difference(removed)) == 0:
            removed.add(above_index)
            found = True
    debug(0, f'{brick=} {len(removed)=}')
    total += len(removed) - 1

  print(f'part 2: {total}')
  #109531


if PART1: part1()
if PART2: part2()
