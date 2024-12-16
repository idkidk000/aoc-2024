#!/usr/bin/env python3
import sys

sys.setrecursionlimit(1_000_000)
DEBUG = False
FILENAME = 'example.txt'

for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = True
  else: raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
map_data = [list(x) for x in text.splitlines()]
rows = len(map_data)
cols = len(map_data[0])


def draw_map(map_data: list[list[str]]):
  if DEBUG:
    for r in range(rows):
      print(f'''{r: 3d}  {''.join(map_data[r])}''')
    print(f'{rows=} {cols=}')


draw_map(map_data)
start_at = end_at = None
for r in range(rows):
  for c in range(cols):
    match map_data[r][c]:
      case 'S':
        start_at = (r, c)
      case 'E':
        end_at = (r, c)

assert start_at is not None and end_at is not None

paths = [{
  'hist': {start_at},
  'cost': 0,
  'done': False,
  'pos': start_at,
  'dir': 1,
}]
pos_costs = {}
finished_paths = []
for i in range(rows * cols):
  new_paths = []
  for path in paths:
    for j in range(3):
      # turn on 0 and 2
      direc = (path['dir'] + (-1 if j == 0 else 1 if j == 2 else 0)) % 4
      cost = path['cost'] + (1 if j == 1 else 1001)
      # move
      pos = (
        path['pos'][0] + (-1 if direc == 0 else 1 if direc == 2 else 0),
        path['pos'][1] + (-1 if direc == 3 else 1 if direc == 1 else 0),
      )
      # discard on loop
      if pos in path['hist']:
        continue
      char_at = map_data[pos[0]][pos[1]]
      # discard on wall
      if char_at == '#':
        continue
      if pos in pos_costs:
        # discard on cheaper route to pos exists
        # allow some extra turns for part 2. it slows things down by a couple of seconds
        if pos_costs[pos] <= cost - 2001:
          continue
        else:
          pos_costs[pos] = min(pos_costs[pos], cost)
      else:
        pos_costs[pos] = cost
      new_path = {
        'hist': {*path['hist'], pos},
        'cost': cost,
        'done': char_at == 'E',
        'pos': pos,
        'dir': direc,
      }
      new_paths.append(new_path)
  paths = new_paths
  finished_paths.extend([x for x in paths if x['done']])

cheapest = sorted(finished_paths, key=lambda x: x['cost'])[0]
if DEBUG: print(f'{cheapest=}')
print(f'''part 1: {cheapest['cost']}''')

# break

best_paths = [x for x in finished_paths if x['cost'] == cheapest['cost']]
if DEBUG: print(f'{best_paths=}')
best_path_tiles = set()
for best_path in best_paths:
  best_path_tiles.update(best_path['hist'])
if DEBUG: print(f'{best_path_tiles=}')

map_data_2 = [list(x) for x in map_data]
for best_path_tile in best_path_tiles:
  map_data_2[best_path_tile[0]][best_path_tile[1]] = 'O'
draw_map(map_data_2)
print(f'part 2: {len(best_path_tiles)=}')
