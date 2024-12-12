#!/usr/bin/env python3

DEBUG = True
EXAMPLE = False

with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  grid = [list(x) for x in f.read().splitlines()]
if DEBUG:
  for x in grid:
    print(f'{x}')

row_count = len(grid)
col_count = len(grid[0])

# don't double-count walked coords
walked = [[False] * col_count for _ in range(row_count)]


def walk(row_ix: int, col_ix: int) -> tuple[int, int, set[tuple[int, int, int]]]:
  walked[row_ix][col_ix] = True
  area = 1
  perimeter = 0
  edges: set[tuple[int, int, int]] = set()
  for dir_ix in range(4):
    test_row_ix = row_ix + (-1 if dir_ix == 0 else 1 if dir_ix == 2 else 0)
    test_col_ix = col_ix + (-1 if dir_ix == 1 else 1 if dir_ix == 3 else 0)
    if 0 <= test_row_ix < row_count and 0 <= test_col_ix < col_count:
      # in bounds
      if grid[test_row_ix][test_col_ix] != grid[row_ix][col_ix]:
        # a different area
        perimeter += 1
        edges.add((row_ix, col_ix, dir_ix))
      elif not walked[test_row_ix][test_col_ix]:
        # walk the connected area
        new_area, new_perimeter, new_edges = walk(test_row_ix, test_col_ix)
        perimeter += new_perimeter
        area += new_area
        edges.update(new_edges)
    else:
      # out of bounds
      perimeter += 1
      edges.add((row_ix, col_ix, dir_ix))
  return (area, perimeter, edges)


total_cost_1 = 0
total_cost_2 = 0
for row_ix in range(row_count):
  for col_ix in range(col_count):
    if not walked[row_ix][col_ix]:
      area, perimeter, edges = walk(row_ix, col_ix)
      cost_1 = area * perimeter
      sides = 0
      # convert the edges to distinct sides/faces
      for edge in edges:
        match edge[2]:
          case 0 | 2:
            # for up/down edges, count if there is not an edge to the left
            if (edge[0], edge[1] - 1, edge[2]) not in edges:
              sides += 1
          case 1 | 3:
            # for left/right edges, count if there is not an edge above
            if (edge[0] - 1, edge[1], edge[2]) not in edges:
              sides += 1
      cost_2 = area * sides
      char_at = grid[row_ix][col_ix]
      print(f'{char_at=} {row_ix=} {col_ix=} {area=} {perimeter=} {sides=} {cost_1=} {cost_2=}')
      total_cost_1 += cost_1
      total_cost_2 += cost_2

print(f'part 1 {total_cost_1=}')
print(f'part 2 {total_cost_2=}')
