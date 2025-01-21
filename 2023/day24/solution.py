#!/usr/bin/env python3
import sys
from dataclasses import dataclass
from typing import Self
from itertools import combinations
from collections import Counter, defaultdict
from sympy import symbols, solve

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
# debug(0, f'{hailstones=}')


def part1():
  min_xy, max_xy = 200_000_000_000_000, 400_000_000_000_000
  # min_xy, max_xy = 7, 27

  # only using x and y
  # the actual question is "do these lines from pos to infinity on velocity intersect". not "will these objects collide"
  # ugh https://en.wikipedia.org/wiki/Line%E2%80%93line_intersection
  # the equation i can read intersects anywhere on the line so we also need to check whether the collision is in the velocity vector for both lines
  counts: Counter[str] = Counter()
  # output=[]
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
      continue  # no intersection

    # intersection point
    px = ((v1.x * v2.y - v1.y * v2.x) * (v3.x - v4.x) - (v1.x - v2.x) * (v3.x * v4.y - v3.y * v4.x)) / denominator
    py = ((v1.x * v2.y - v1.y * v2.x) * (v3.y - v4.y) - (v1.y - v2.y) * (v3.x * v4.y - v3.y * v4.x)) / denominator

    # dot product<0 means intersection is behind
    left_dp = (px - left.position.x) * left.velocity.x + (py - left.position.y) * left.velocity.y
    right_dp = (px - right.position.x) * right.velocity.x + (py - right.position.y) * right.velocity.y

    future = left_dp >= 0 and right_dp >= 0
    inside = min_xy <= px <= max_xy and min_xy <= py <= max_xy
    debug(1, f'  {px=} {py=} {left_dp=} {right_dp=} {future=} {inside=}')
    counts[f'''{'future' if future else 'past'}_{'inside' if inside else 'outside'}'''] += 1
    counts[f'''total_{'future' if future else 'past'}'''] += 1
    counts[f'''total_{'inside' if inside else 'outside'}'''] += 1
    counts['total'] += 1

    # output.append(f'{left.index} {right.index} {denominator} {px} {py}')

  debug(0, f'{counts=}')
  # with open('output.py.txt','w') as f: f.write('\n'.join(output))
  print(f'''part 1: {counts['future_inside']}''')
  #15889


def part2():
  # yeah i have no idea how to begin to solve this one
  # maybe simulate all the particles and get their positions for some number of frames, then we have a reasonable set of points to brute force
  # time_series: dict[int, dict[int, Vector]] = defaultdict(dict)
  # for hailstone in hailstones:
  #   for i in range(100):
  #     position = hailstone.position + hailstone.velocity * i
  #     time_series[i][hailstone.index] = position
  # debug(0, time_series)

  # in the examples, the collisions are at integer coordinates at integer times, though it only says that the position and velocity our our object are integers. hopefully the collision points for the input are also integer at integer times (i.e. simulating will produce those points) so we can calc some points for a small number of particles and brute force an intersection
  # find three particles as far away as possible (sum of squares, no need for sqrt) going as fast as possible (sum of abs velocities) in different directions (normalise dot products, abs sum as close to 1 as poss. or as close to 0.5 idr)
  # time loop and add wxyz for each to some iterable
  # test lines between each objects list of wxyzs with the other object. if a line also intersect a third object's trajectory, keep going until we either fail or produce a match
  # """just""" need to learn how to do a 4d line intersection :|

  fastest = sorted(hailstones, key=lambda x: abs(x.velocity.x) + abs(x.velocity.y) + abs(x.velocity.z), reverse=True)
  # i = 0

  # # is it faster to test for 3d intersections first then do 4d? and if so, would 2d intersections first help to prune bad lines early
  # time_series: dict[int, set[Vector]] = defaultdict(set)

  # left,right=fastest[:2]
  # while True:
  #   for h in [left,right]:
  #     time_series[h.index].add(h.position + h.velocity * i)
  #   #FIXME: this will do a ton of duplication
  #   #FIXME: actually these should be vec4s
  #   for v1 in time_series[left.index]:
  #     for v2 in time_series[right.index]:
  #       for obj in fastest[2:]:
  #         v3=obj.position
  #         v4=obj.position+obj.velocity
  #         # if no intersect, break
  #         # if intersect all, return
  #         # oh also we can't use vectors since we need wxyz
  #   i+=1

  # or actually maybe i need to look for a convergence first
  # positions are stupid numbers, velocities are in the low hundreds
  # find when most objects will be densely grouped
  # work backwards and forwards from there simultaneously?
  # maybe this can be factored as a binary search?

  # watched hyperneutrinos vid because i have no idea what i'm doing
  # we're asserting that each equation == 0, i.e the trajectories intersect
  # we don't consider time at all since we have 300 lines. in fact just 5 lines produces only one solution
  # sympy returns a solution much faster than even my p1 solve :|
  # but now i know it exists
  rock_x, rock_y, rock_z, rock_vx, rock_vy, rock_vz = symbols('rock_x, rock_y, rock_z, rock_vx, rock_vy, rock_vz')
  equations = []
  for h in fastest[:5]:
    equations.append((rock_x - h.position.x) * (h.velocity.y - rock_vy) - (rock_y - h.position.y) * (h.velocity.x - rock_vx))
    equations.append((rock_y - h.position.y) * (h.velocity.z - rock_vz) - (rock_z - h.position.z) * (h.velocity.y - rock_vy))
  (solution,) = solve(equations)
  debug(0, solution)

  total = solution[rock_x] + solution[rock_y] + solution[rock_z]
  print(f'part 2: {total}')
  # 801386475216902

if PART1: part1()
if PART2: part2()
