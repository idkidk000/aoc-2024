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
if DEBUG:
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(map_data[r])}''')
  print(f'{rows=} {cols=}')

start_at = end_at = None
for r in range(rows):
  for c in range(cols):
    match map_data[r][c]:
      case 'S':
        start_at = (r, c)
      case 'E':
        end_at = (r, c)

assert start_at is not None and end_at is not None

lowest_cost_per_pos: dict[tuple[int, int], int] = {}
lowest_end_cost = None


# maybe this should be refactored as a while True loop where each path is duplicated and incremented on each turn. then the first to finish is probably the cheapest?

def walk_maze(path: dict) -> list:
  # FIXME: this takes 1m on e3 and idk how long on input
  global lowest_end_cost
  ret_paths = []
  if path['done']:
    return [path]
  for i in range(3):

    # turn on i== 1 or 2
    direc = (path['dir'] + (-1 if i == 1 else 1 if i == 2 else 0)) % 4
    cost = path['cost'] + (1 if i == 0 else 1001)

    # try move
    pos = (
      path['pos'][0] + (-1 if direc == 0 else 1 if direc == 2 else 0),
      path['pos'][1] + (-1 if direc == 3 else 1 if direc == 1 else 0),
    )

    map_char = map_data[pos[0]][pos[1]]
    if map_char not in ['.', 'E'] or pos in path['hist']:
      continue

    # optimisation: discard path if we reached the end for cheaper
    if lowest_end_cost is not None and cost >= lowest_end_cost:
      continue
    # optimisation: discard path if we got here cheaper some other way
    if pos in lowest_cost_per_pos:
      if lowest_cost_per_pos[pos] <= cost:
        continue
    else:
      lowest_cost_per_pos[pos] = cost

    # move is valid - clone path and update
    if DEBUG: print(f'''{path=} {i=} {cost=}''')
    new_path = {
      'hist': {*path['hist'], pos},
      'done': False,
      'cost': cost,
      'pos': pos,
      'dir': direc,
    }
    if map_char == 'E':
      # done, add to ret_paths
      new_path['done'] = True
      ret_paths.append(new_path)
      if lowest_end_cost is None:
        lowest_end_cost = cost
      else:
        lowest_end_cost = min(lowest_end_cost, cost)
    else:
      # walk and add results to ret_paths
      for walked_path in walk_maze(new_path):
        # for x in ret_paths:
        #   assert len(walked_path['hist'].intersection(x['hist'])) > 0 or walked_path['dir'] != x['dir']
        ret_paths.append(walked_path)

  # if len(ret_paths) > 0:
  #   path_lens = [len(x['hist']) for x in ret_paths]
  #   print(f'{len(ret_paths)=} {path_lens=}')
  return ret_paths


paths = walk_maze({
  'hist': {start_at},
  'cost': 0,
  'done': False,
  'pos': start_at,
  'dir': 1,
})

if DEBUG:
  for path in sorted(paths, key=lambda x: x['cost']):
    print(f'{path=}')
    assert path['done']
    assert path['pos'] == end_at
    # hist_len = len(path['hist'])
    # prev_dir = 1
    # total_cost = 0
    # for i in range(len(path['hist']) - 1):
    #   v_from = path['hist'][i]
    #   v_to = path['hist'][i + 1]
    #   v_change = (
    #     v_to[0] - v_from[0],
    #     v_to[1] - v_from[1],
    #   )
    #   match v_change:
    #     case (-1, 0):
    #       new_dir = 0
    #     case (0, 1):
    #       new_dir = 1
    #     case (1, 0):
    #       new_dir = 2
    #     case (0, -1):
    #       new_dir = 3
    #   cost = 1 + (abs(prev_dir - new_dir) * 1000)
    #   total_cost += cost

    #   print(f'{i=} {prev_dir=} {new_dir=} {v_from=} {v_to=} {v_change=} {cost=} {total_cost=}')
    #   prev_dir = new_dir

    # _ = input()
  print(f'{len(paths)=}')

print(f'{lowest_cost_per_pos=}')
lowest_cost = min((x['cost'] for x in paths))
print(f'part 1: {lowest_cost=}')
