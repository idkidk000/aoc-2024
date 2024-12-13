#!/usr/bin/env python3
import json
import math
from collections import Counter

DEBUG = True
EXAMPLE = False

costs = {'a': 3, 'b': 1}


class Solution():

  def __init__(self, data: dict[str, int]):
    self._data = data
    self._cost = sum(costs[b] * c for b, c in data.items())

  def __hash__(self):
    return hash(repr(self._data))

  def __eq__(self, other):
    return hash(self) == hash(other)

  @property
  def __dict__(self):
    return self._data

  def __str__(self):
    return str(self._data)

  def __repr__(self):
    return repr(self._data)

  @property
  def cost(self):
    return self._cost


with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  text = f.read()

machines = []
for section in text.lower().replace(' ', '').replace('=', '').split('\n\n'):
  machine = {'buttons': []}  #type:ignore
  for line in section.splitlines():
    key, vals = line.split(':')
    coords = {val[0]: int(val[1:]) for val in vals.split(',')}
    if key.startswith('button'):
      distance = math.sqrt((coords['x']**2) + (coords['y']**2))
      cost = costs[key[-1]]
      machine['buttons'].append(
        {
          'name': key[-1],
          'move': coords,
          'distance': distance,
          'cost': cost,
          'dist_cost': distance / cost,
        }
      )
    else:
      machine[key] = coords  #type: ignore
  machines.append(machine)
  #TODO: remove after testing
  # break
if DEBUG: print(json.dumps(machines, indent=2))

total_cost = 0
total_prizes = 0
for machine in machines:
  x, y = 0, 0
  # sort buttons by cost
  # buttons = sorted(machine['buttons'], key=lambda x: x['dist_cost'])
  # if DEBUG: print(json.dumps(buttons, indent=2))
  if DEBUG: print(f'''{machine['prize']=}''')

  # build sets of solutions for x and y as tuples
  solutions = {}
  for dimension in ['x', 'y']:
    solutions[dimension] = set()
    for i in range(machine['prize'][dimension] // machine['buttons'][0]['move'][dimension] + 1):
      remainder = machine['prize'][dimension] - machine['buttons'][0]['move'][dimension] * i
      if remainder % machine['buttons'][1]['move'][dimension] == 0:
        solution = Solution(
          {
            machine['buttons'][0]['name']: i,
            machine['buttons'][1]['name']: remainder // machine['buttons'][1]['move'][dimension]
          }
        )
        solutions[dimension].add(solution)

  xy_solutions = solutions['x'].intersection(solutions['y'])
  if not len(xy_solutions):
    # unwinnable
    if DEBUG: print('  unwinnable')
    continue
  total_prizes += 1

  if DEBUG: print(f'{xy_solutions=}')

  for solution in xy_solutions:
    print(f'{solution=} {solution.cost=}')

  cost = sorted(xy_solutions, key=lambda x: x.cost)[0].cost
  print(f'{cost=}')
  total_cost += cost

...
print(f'part 1: {total_cost=}')
