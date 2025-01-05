#!/usr/bin/env python3
import sys

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'example.txt'

for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = 1
  elif arg == '-d2': DEBUG = 2
  elif arg == '-d3': DEBUG = 3
  else: raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()

match FILENAME:
  case 'input.txt':
    len_x, len_y = 71, 71
  case 'example.txt':
    len_x, len_y = 7, 7
  case _:
    raise Exception(f'add max_x and max_y for {FILENAME=}')
blocks = [(y[0], y[1]) for x in text.splitlines() if len(y := tuple(map(int, x.split(',')))) == 2]
if DEBUG > 1: print(f'{blocks=} {len(blocks)=}')


def draw_map(map_data: list[list[str]]):
  if DEBUG:
    for y in range(len_y):
      print(f'{y:03d}:  ', end='')
      for x in range(len_x):
        print(map_data[x][y], end='')
      print()
    print(f'{len_x=} {len_y=}')


def gen_map(blocks: list[tuple[int, int]]):
  result = [['.' for _ in range(len_x)] for _ in range(len_y)]
  for block in blocks:
    if DEBUG > 1: print(f'{block=}')
    result[block[0]][block[1]] = '#'
  return result


def walk_map(map_data: list[list[str]], start: tuple[int, int], end: tuple[int, int]):
  paths = [[start]]
  completed_paths: list[list[tuple[int, int]]] = []
  pos_steps: dict[tuple[int, int], int] = {}
  while len(completed_paths) == 0 and len(paths) > 0:
    next_paths = []
    for path in paths:
      for direc in range(4):
        next_pos = (
          path[-1][0] + (-1 if direc == 3 else 1 if direc == 1 else 0),
          path[-1][1] + (-1 if direc == 0 else 1 if direc == 2 else 0),
        )
        # oob
        if not (0 <= next_pos[0] < len_x and 0 <= next_pos[1] < len_y):
          # if DEBUG > 1: print('end oob')
          continue
        # block
        if map_data[next_pos[0]][next_pos[1]] == '#':
          # if DEBUG > 1: print('end block')
          continue
        # loop
        if next_pos in path:
          # if DEBUG > 1: print('end loop')
          continue
        best_pos_steps = pos_steps.get(next_pos, len_x * len_y)
        # if DEBUG: print(f'{next_pos=} {best_pos_steps=} {len(path)=} {len(path) > best_pos_steps=}')
        if len(path) >= best_pos_steps:
          # if DEBUG: print('end long path')
          continue
        else:
          # if DEBUG: print('same len or shorter')
          pos_steps[next_pos] = len(path)
        next_path = [*path, next_pos]
        if next_pos == end:
          completed_paths.append(next_path)
          #TODO: for part 1 can return here
        else:
          next_paths.append(next_path)
    #TODO: constrain
    paths = next_paths
    if DEBUG > 1: print(f'{len(paths)=} {len(paths[0])=}')
  if DEBUG: print(f'{completed_paths=}')
  return completed_paths


def part1():
  match FILENAME:
    case 'input.txt':
      block_count = 1024
    case 'example.txt':
      block_count = 12
      # block_count = 4
    case _:
      raise RuntimeError(f'add block_count for {FILENAME}')
  map_data = gen_map(blocks[:block_count])
  draw_map(map_data)
  # exit()
  paths = walk_map(map_data, (0, 0), (len_x - 1, len_y - 1))
  positions = {pos for path in paths for pos in path}
  for position in positions:
    map_data[position[0]][position[1]] = 'O'
  draw_map(map_data)
  # don't count start pos
  print(f'part 1: {len(paths[0])-1}')


def part2():
  for block_count in range(len(blocks), 0, -1):
    if DEBUG: print(f'{block_count=}')
    map_data = gen_map(blocks[:block_count])
    # draw_map(map_data)
    # exit()
    paths = walk_map(map_data, (0, 0), (len_x - 1, len_y - 1))
    if len(paths) > 0: break
  print(f'part 2 {blocks[block_count]} {block_count=}')


# draw_map(gen_map(blocks[:12]))
part1()
part2()
