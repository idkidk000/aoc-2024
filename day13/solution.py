#!/usr/bin/env python3
import json
import math
from collections import Counter
import time

DEBUG = True
EXAMPLE = False
COSTS = {'a': 3, 'b': 1}

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
      machine['target'] = coords
  machines.append(machine)
if DEBUG: print(json.dumps(machines, indent=2))


def solve(machines: list, offset: int = 0):
  started = time.monotonic()
  total_cost = 0
  problem_count = 0
  solved_count = 0
  for machine in machines:
    problem_count += 1
    target = {
      'x': machine['target']['x'] + offset,
      'y': machine['target']['y'] + offset,
    }
    move_a = machine['buttons']['a']
    move_b = machine['buttons']['b']
    if DEBUG: print(f'''[{problem_count}/{len(machines)}] {offset=} {target=} {move_a=} {move_b=}''')

    # early exit for unsolvable
    gcd_x = math.gcd(move_a['x'], move_b['x'])
    if target['x'] % gcd_x != 0:
      if DEBUG: print(f'  exclude on gcd_x')
      continue
    gcd_y = math.gcd(move_a['y'], move_b['y'])
    if target['y'] % gcd_y != 0:
      if DEBUG: print(f'  exclude on gcd_y')
      continue

    best_cost = None
    # TODO: looping over the range is not it
    loop_top = min(target['x'] // move_a['x'], target['y'] // move_a['y'])
    if DEBUG: print(f'  {loop_top=}')
    for mult_a in range(0, loop_top, 1):
      remainder_x = target['x'] - move_a['x'] * mult_a
      if remainder_x % move_b['x'] == 0:
        mult_b = remainder_x // move_b['x']
        if mult_a * move_a['y'] + mult_b * move_b['y'] == target['y']:
          cost = COSTS['a'] * mult_a + COSTS['b'] * mult_b
          best_cost = min(best_cost, cost) if best_cost else cost
          if DEBUG: print(f'  {mult_a=} {mult_b=} {cost=} {best_cost=}')

    if best_cost:
      assert best_cost != 100**10
      solved_count += 1
      total_cost += best_cost

  elapsed = time.monotonic() - started
  print(f'{offset=} {elapsed=:,.3f} {problem_count=} {solved_count=} {total_cost=}')
  if offset == 0: assert total_cost == 36250
  return total_cost


print(f'part 1: {solve(machines)=}')
# exit()

# print(f'test 1: {solve(machines,10000)=}')
# print(f'test 2: {solve(machines,1000000)=}')
# exit()

print(f'part 2: {solve(machines,10000000000000)=}')
