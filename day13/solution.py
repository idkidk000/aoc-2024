#!/usr/bin/env python3
import json
import math
from collections import Counter
import time

DEBUG = True
EXAMPLE = False

COSTS = {'a': 3, 'b': 1}


# fast hashable immutable dict
class Solution():

  def __init__(self, data: dict[str, int]):
    self._data = data
    self._cost = sum(COSTS[b] * c for b, c in data.items())
    # do once at init so comparisons are faster
    # self._str = str(data)
    self._repr = repr(data)
    self._hash = hash(self._repr)

  def __hash__(self):
    return self._hash

  def __eq__(self, other):
    return self._hash == other._hash

  def __repr__(self):
    return self._repr

  @property
  def cost(self):
    return self._cost


with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  text = f.read()

machines = []
for section in text.lower().replace(' ', '').replace('=', '').split('\n\n'):
  machine = {'buttons': {}}  #type:ignore
  for line in section.splitlines():
    key, vals = line.split(':')
    coords = {val[0]: int(val[1:]) for val in vals.split(',')}
    if key.startswith('button'):
      machine['buttons'][key[-1]] = coords
    else:
      machine[key] = coords
  machines.append(machine)
if DEBUG: print(json.dumps(machines, indent=2))


def solve(machines: list, offset: int = 1):
  total_cost = 0
  max_solution_count = 0
  for machine in machines:
    if DEBUG: print(f'''{machine['prize']=}''')

    # build sets of solutions for x and y separately
    solutions = {}  #type: ignore
    for dimension in ['x', 'y']:
      target = machine['prize'][dimension] + offset
      solutions[dimension] = set()
      move_a = machine['buttons']['a'][dimension]
      move_b = machine['buttons']['b'][dimension]
      for mult_a in range(target // move_a + 1):
        remainder = target - move_a * mult_a
        if remainder % move_b == 0:
          mult_b = remainder // move_b
          solution = Solution({'a': mult_a, 'b': mult_b})
          if DEBUG:
            print(f'    {dimension}: {target=} {move_a=} {move_b=} {solution=}')
            # print(f'{target},{move_a},{move_b},{mult_a},{mult_b}')
          solutions[dimension].add(solution)

    # game solutions are the intersection of the two sets
    game_solutions = solutions['x'].intersection(solutions['y'])
    if not len(game_solutions):
      # unwinnable
      if DEBUG: print('  unwinnable')
      continue

    max_solution_count = max(max_solution_count, len(game_solutions))
    if DEBUG:
      for solution in game_solutions:
        print(f'  {solution=} {solution.cost=}')

    total_cost += sorted(game_solutions, key=lambda x: x.cost)[0].cost

  print(f'{max_solution_count=}')
  return total_cost


def fast_solve(machines: list, offset: int = 1):
  total_cost = 0
  max_solution_count = 0
  for machine in machines:

    target = {
      'x': machine['prize']['x'] + offset,
      'y': machine['prize']['y'] + offset,
    }
    move_a = machine['buttons']['a']
    move_b = machine['buttons']['b']

    if DEBUG: print(f'''{target=} {move_a=} {move_b=}''')
    gcd_x = math.gcd(move_a['x'], move_b['x'])
    if target['x'] % gcd_x != 0:
      if DEBUG: print(f'  exclude on gcd_x')
      continue
    gcd_y = math.gcd(move_a['y'], move_b['y'])
    if target['y'] % gcd_y != 0:
      if DEBUG: print(f'  exclude on gcd_y')
      continue

    solutions = set()
    for mult_a in range(min(target['x'] // move_a['x'], target['y'] // move_a['y'])):
      remainder_x = target['x'] - move_a['x'] * mult_a
      if remainder_x % move_b['x'] == 0:
        mult_b = remainder_x // move_b['x']
        result_y = (mult_a * move_a['y']) + (mult_b * move_b['y'])
        # if DEBUG: print(f'    x: {target=} {move_a=} {move_b=} {mult_a=} {mult_b=} {result_y=}')
        # test if this also works for y
        if result_y == target['y']:
          solution = Solution({
            'a': mult_a,
            'b': mult_b,
          })
          if DEBUG:
            print(f'    {target=} {move_a=} {move_b=} {solution=}')
          solutions.add(solution)

    if not len(solutions):
      # unwinnable
      if DEBUG: print('  unwinnable')
      continue

    max_solution_count = max(max_solution_count, len(solutions))
    best_solution = sorted(solutions, key=lambda x: x.cost)[0]
    if DEBUG:
      print(f'  {best_solution=} {best_solution.cost=}')

    total_cost += best_solution.cost

  print(f'{max_solution_count=}')
  return total_cost


offset = 0
# started = time.monotonic()
# print(f'part 1: {offset=} {solve(machines,offset)=}')
# print(f'  elapsed: {time.monotonic()-started:,.3f}')

started = time.monotonic()
print(f'part 1: {offset=} {fast_solve(machines,offset)=}')
print(f'  elapsed: {time.monotonic()-started:,.3f}')
# exit()

# offset = 10000000000000
# started = time.monotonic()
# print(f'part 2: {offset=} {fast_solve(machines,offset)=}')
# print(f'  elapsed: {time.monotonic()-started:,.3f}')
