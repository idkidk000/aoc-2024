#!/usr/bin/env python3
from collections import Counter
import json

DEBUG = True

with open('input.txt', 'r') as f:
  text = f.read()
if DEBUG: print(f'{text=}')

# plant_types = {x for x in list(text) if x.strip()}
# if DEBUG: print(f'{plant_types=}')
grid = [list(x) for x in text.splitlines()]
if DEBUG: print(f'{grid=}')
row_count = len(grid)
col_count = len(grid[0])
if DEBUG: print(f'{row_count=} {col_count=}')

# dict of coordinates by plot type (letter)
plot_coords: dict[str, set[tuple[int, int]]] = {}
for row_ix in range(row_count):
  for col_ix in range(col_count):
    char_at = grid[row_ix][col_ix]
    if char_at not in plot_coords.keys():
      plot_coords[char_at] = set()
    plot_coords[char_at].add((row_ix, col_ix))
# if DEBUG: print(f'{plot_coords=}')
if DEBUG: print(f'plot_coords={json.dumps({k:sorted(str(x) for x in v) for k,v in plot_coords.items()},indent=2)}')


def map_connections(coord: tuple[int, int], result: set[tuple[int, int]]) -> set[tuple[int, int]]:
  result.add(coord)
  char_at = grid[coord[0]][coord[1]]
  for dir_ix in range(4):
    test_coord = (
      coord[0] + (-1 if dir_ix == 0 else 1 if dir_ix == 2 else 0),
      coord[1] + (-1 if dir_ix == 3 else 1 if dir_ix == 1 else 0),
    )
    if test_coord in plot_coords[char_at] and test_coord not in result:
      result.update(map_connections(test_coord, result))
  return result


# dict of connected coordinates by origin (top-left) coordinate
plot_origins: dict[tuple[int, int], set[tuple[int, int]]] = {}
for plot_type in plot_coords.keys():
  if DEBUG: print(f'{plot_type=} {plot_coords[plot_type]=}')
  for plot_coord in plot_coords[plot_type]:
    # every coord that this coord is connected to
    connections = map_connections(plot_coord, set())
    #top-left coord
    origin = min(connections)
    # we're duplicating a lot of work here so most likely we already have this exact data in plot_origins
    if origin not in plot_origins:
      plot_origins[origin] = connections
    # if DEBUG: print(f'{origin=} {sorted(connections)=}')

if DEBUG: print(f'{len(plot_origins)=} {plot_origins=} {len([y for x in plot_origins.values() for y in x])}')

# area - length of plot_origins value for origin key

plot_perimeters: Counter[tuple[int, int]] = Counter()
for plot_origin, connections in plot_origins.items():
  for connection in connections:
    for dir_ix in range(4):
      test_coord = (
        connection[0] + (-1 if dir_ix == 0 else 1 if dir_ix == 2 else 0),
        connection[1] + (-1 if dir_ix == 3 else 1 if dir_ix == 1 else 0),
      )
      if not (0 <= test_coord[0] < row_count and 0 <= test_coord[1] < row_count and test_coord in connections):
        plot_perimeters[plot_origin] += 1
if DEBUG: print(f'{plot_perimeters=}')

total_price = 0
for plot_origin, connections in plot_origins.items():
  area = len(connections)
  perimeter = plot_perimeters[plot_origin]
  price = area * perimeter
  if DEBUG: print(f'{plot_origin=} {area=} {perimeter=} {price=}')
  total_price += price

print(f'part 1: {total_price=}')
