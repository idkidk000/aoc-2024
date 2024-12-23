#!/usr/bin/env python3
import sys
from functools import cache

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'example.txt'
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = 1
  elif arg == '-d2': DEBUG = 2
  elif arg == '-d3': DEBUG = 3
  else: raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  lines = f.read().splitlines()

triplets: list[set[str]] = []
for line_ix, line in enumerate(lines):
  node_a, node_b = line.split('-')
  node_a_connections: set[str] = set()
  node_b_connections: set[str] = set()
  for scan_line in lines[line_ix + 1:]:
    parts = scan_line.split('-')
    if parts[0] == node_a: node_a_connections.add(parts[1])
    elif parts[1] == node_a: node_a_connections.add(parts[0])
    if parts[0] == node_b: node_b_connections.add(parts[1])
    elif parts[1] == node_b: node_b_connections.add(parts[0])
    intersection = node_a_connections.intersection(node_b_connections)
    if len(intersection):
      triplets.append({node_a, node_b, *intersection})
      # break
      node_a_connections.remove(*intersection)
      node_b_connections.remove(*intersection)
  # node_a_connections = {
  #   *[x.split('-')[1] for x in lines if x.startswith(f'{node_a}-')],
  #   *[x.split('-')[0] for x in lines if x.endswith(f'-{node_a}')]
  # }
  # node_b_connections = {
  #   *[x.split('-')[1] for x in lines if x.startswith(f'{node_b}-')],
  #   *[x.split('-')[0] for x in lines if x.endswith(f'-{node_b}')]
  # }
  # intersection = node_a_connections.intersection(node_b_connections)
  # assert len(intersection) <= 1, f'{node_a=} {node_b=} {node_a_connections=} {node_b_connections=} {intersection=}'
  # if len(intersection) == 1:
  #   #BUG: dedupe
  #   triplets.append(set((node_a, node_b, *intersection)))

for triplet in sorted(sorted(x) for x in triplets):
  print(triplet)

count = 0
for triplet in triplets:
  if any(x.startswith('t') for x in triplet): count += 1

print(f'part 1: {count=}')

# networks: list[set[str]] = []
# with open(FILENAME, 'r') as f:
#   for i, line in enumerate(f.read().splitlines()):
#     merged_network = {*line.split('-')}
#     if DEBUG > 1: print(f'{line=} {merged_network=}')
#     merged = True
#     #TODO: not entirely sure that this is necessary?
#     while merged:
#       next_networks = []
#       merged = False
#       if DEBUG > 1: print(f'loop top {merged=} {len(networks)=}')
#       for network in networks:
#         if merged_network.intersection(network):
#           if DEBUG > 1: print(f'{merged_network=} intersects {network=}')
#           merged_network.update(network)
#           if DEBUG > 1: print(f'updated {merged_network=}')
#           merged = True
#           if DEBUG > 1: print(f'{merged=}')
#         else:
#           next_networks.append(network)
#       networks = [*next_networks]
#     networks.append(merged_network)
#     assert 0 < len(networks) <= i + 1, f'{len(networks)=} {i=}'
#     if DEBUG > 0: print(f'{len(networks)=} {networks=}')

# print(f'{networks=}')
