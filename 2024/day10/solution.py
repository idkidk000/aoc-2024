#!/usr/bin/env python3

DEBUG = True
EXAMPLE = False

with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  heights = [list(map(int, x)) for x in f.read().splitlines()]
if DEBUG: print(f'{heights=}')

count_rows = len(heights)
count_cols = len(heights[0])
trailheads: list[tuple[int, int]] = []
for row_ix in range(count_rows):
  for col_ix in range(count_cols):
    if heights[row_ix][col_ix] == 0:
      trailheads.append((row_ix, col_ix))
if DEBUG: print(f'{trailheads=}')
trails = [[x] for x in trailheads]
if DEBUG: print(f'{trails=}')

trails_completed: list[list[tuple[int, int]]] = []
trails_next: list[list[tuple[int, int]]] = []
found = False
while not (found):
  for trail in trails:
    coord = trail[-1]
    value = heights[coord[0]][coord[1]]
    # if DEBUG: print(f'{trail=} {coord=} {value=}')
    value_next = value + 1
    for direction_ix in range(4):
      coord_next = (
        coord[0] + (-1 if direction_ix == 0 else 1 if direction_ix == 2 else 0),
        coord[1] + (-1 if direction_ix == 3 else 1 if direction_ix == 1 else 0),
      )
      if 0 <= coord_next[0] < count_rows and 0 <= coord_next[1] < count_cols and \
        coord_next not in trail and \
        heights[coord_next[0]][coord_next[1]] == value_next:
        trail_next = [*trail, coord_next]
        assert 0 < value_next < 10
        if value_next == 9:
          if DEBUG: print(f'completed {trail_next}')
          trails_completed.append(trail_next)
          found = True
        else:
          assert len(trail_next) < 10
          trails_next.append(trail_next)

  print(f'{len(trails)=} {len(trails_next)=} {len(trails_completed)=}')
  trails = trails_next

# completed_trails could have multiple routes with the same dest and origin
trails_completed_set = {(x[0], x[-1]) for x in trails_completed}
total_scores = len(trails_completed_set)
print(f'part 1 {total_scores}')

total_ratings = len(trails_completed)
print(f'part 2 {total_ratings}')
