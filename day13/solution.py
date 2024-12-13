#!/usr/bin/env python3
import math
import time

DEBUG = True
EXAMPLE = False

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


def solve(offset: int = 0):
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

    best_cost = 0
    # TODO: looping over the range is not it
    # only constrain by floor or a since that's what we're looping for. b_mult is calculated directly
    loop_max = min(target['x'] // move_a['x'], target['y'] // move_a['y'])
    if DEBUG: print(f'  {loop_max=}')
    for mult_a in range(loop_max):
      remainder_x = target['x'] - move_a['x'] * mult_a
      if remainder_x % move_b['x'] == 0:
        mult_b = remainder_x // move_b['x']
        if mult_a * move_a['y'] + mult_b * move_b['y'] == target['y']:
          cost = mult_a * 3 + mult_b
          best_cost = min(best_cost, cost) if best_cost else cost
          if DEBUG: print(f'  {mult_a=} {mult_b=} {cost=} {best_cost=}')

    if best_cost:
      solved_count += 1
      total_cost += best_cost

  elapsed = time.monotonic() - started
  print(f'{offset=} {elapsed=:,.3f} {problem_count=} {solved_count=} {total_cost=}')
  if offset == 0: assert total_cost == 36250
  return total_cost


def fast_solve(offset: int = 0):
  # https://youtube.com/watch?v=-5J-DAsWuJc
  # there's actually only one or zero solutions to each problem so it can be solved as a linear equation
  started = time.monotonic()
  total_cost = 0
  for machine in machines:
    tx = machine['target']['x'] + offset
    ty = machine['target']['y'] + offset
    ax = machine['buttons']['a']['x']
    ay = machine['buttons']['a']['y']
    bx = machine['buttons']['b']['x']
    by = machine['buttons']['b']['y']

    mult_a = (tx * by - ty * bx) / (ax * by - ay * bx)
    mult_b = (tx - ax * mult_a) / bx

    valid = (mult_a > 0 or mult_b > 0) and mult_a % 1 == mult_b % 1 == 0
    cost = mult_a * 3 + mult_b

    if valid:
      if DEBUG: print(f'{tx=} {ty=} {ax=} {ay=} {bx=} {by=} {valid=} {mult_a=:.0f} {mult_b=:.0f} {cost=:.0f}')
      total_cost += cost

  elapsed = time.monotonic() - started
  print(f'{offset=} {elapsed=:,.3f} {total_cost=}')
  if offset == 0: assert total_cost == 36250
  return int(total_cost)


print(f'part 1: {fast_solve()=}')
# for i in range(14):
#   offset = 10**i
#   print(f'test {i}: {fast_solve(offset)=}')

print(f'part 2: {fast_solve(10000000000000)=}')
