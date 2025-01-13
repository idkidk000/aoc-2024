#!/usr/bin/env python3
import sys

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

# yapf: disable
for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i': FILENAME = 'input.txt'
      case '-p1': PART1, PART2 = True, False
      case '-p2': PART1, PART2 = False, True
      case '-p0': PART1, PART2 = False, False
      case _: raise Exception(f'unknown {arg=}')

D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]
#yapf: enable

with open(FILENAME, 'r') as f:
  text = f.read()
grid = [list(x) for x in text.splitlines()]
rows, cols = len(grid), len(grid[0])
print(f'{rows=} {cols=}')


def find_grid(char: str) -> tuple[int, int]:
  for r in range(rows):
    for c in range(cols):
      if grid[r][c] == char: return r, c
  assert False


def draw_grid(grid: list[list[str]]):
  # https://www.shellhacks.com/bash-colors/
  # f'\x1b[7;{31+d}m{s%10}\x1b[0m'
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(grid[r])}''')
  print(f'{rows=} {cols=}')


def solve(steps: int = 64) -> int:
  start = find_grid('S')
  # path walk but wierd
  # duplicate tiles in path are allowed
  # guess i'll just use sets because there's going to be a lot of duplication
  queue: set[tuple[int, int]] = set([start])
  next_queue: set[tuple[int, int]] = set()
  for i in range(steps):
    if DEBUG > 0: print(f'{i=} {len(queue)=}')
    for r, c in queue:
      for d in D4:
        nr, nc = r + d[0], c + d[1]
        if not (0 <= nr < rows and 0 <= nc < cols and grid[nr][nc] != '#'): continue
        next_queue.add((nr, nc))
    assert len(next_queue)
    queue = {*next_queue}
    next_queue.clear()
  return len(queue)


def solve2(steps: int = 26_501_365) -> int:
  #FIXME: this is not it
  # for the internal tiles, we know that they'll oscillate on each iteration so we can't just flood fill
  # but even just a flood fill is too much at 26m iterations
  # there's a big brain solve and idk what it is yet

  # steps - grid_width//2 divides by grid_width 20_2300 times :|
  # tiles have an oscillation period of 2 steps and we only care about tiles which were occupied where step%2==steps%2
  # can we fill one tile for 2*max(width,height) + steps%2 and clone it?
  # run a few iterations and validate that the edges stay a diamond. hopefully we can clone the edges
  # start row and col are both empty so they'll extend out in steps each way and the diamond thing should hold up

  start = find_grid('S')

  queue: set[tuple[int, int]] = set([start])
  next_queue: set[tuple[int, int]] = set()
  walked: set[tuple[int, int]] = set()
  for i in range(steps):
    if DEBUG > 0: print(f'{i=} {len(queue)=:,} {len(walked)=:,}')
    for r, c in queue:
      for d in D4:
        nr, nc = r + d[0], c + d[1]
        if grid[nr % rows][nc % cols] == '#': continue
        next_queue.add((nr, nc))
    assert len(next_queue)
    walked.update(queue)
    queue = next_queue.difference(walked)
    next_queue.clear()
  return len(queue.union(walked))


def part1():
  result = solve()
  print(f'part 1: {result}')
  # 3639


def part2():
  result = solve2()
  print(f'part 2: {result}')
  # 3639


# if PART1 == PART2 == False: solve(6)
if PART1 == PART2 == False: print(solve2(6))
if PART1: part1()
if PART2: part2()
