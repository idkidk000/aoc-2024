#!/usr/bin/env python3
import sys
from functools import cache
from collections import deque
from itertools import product

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'example.txt'
D4 = [
  (-1, 0, '^'),
  (0, 1, '>'),
  (1, 0, 'v'),
  (0, -1, '<'),
]

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
door_codes = text.splitlines()
if DEBUG > 0: print(f'{door_codes}')

door_keypad = {
  '7': (0, 0),
  '8': (0, 1),
  '9': (0, 2),
  '4': (1, 0),
  '5': (1, 1),
  '6': (1, 2),
  '1': (2, 0),
  '2': (2, 1),
  '3': (2, 2),
  '0': (3, 1),
  'A': (3, 2),
}

robot_keypad = {
  '^': (0, 1),
  'A': (0, 2),
  '<': (1, 0),
  'v': (1, 1),
  '>': (1, 2),
}

key_paths_cache: dict[tuple[str, str], list[str]] = {}


def get_key_paths(btn_from: str, btn_to: str, keypad: dict[str, tuple[int, int]]):
  cached = key_paths_cache.get((btn_from, btn_to))
  if cached is not None: return cached
  rev_keypad = {v: k for k, v in keypad.items()}
  if btn_from == btn_to:
    key_paths_cache[(btn_from, btn_to)] = ['A']
  else:
    key_paths_cache[(btn_from, btn_to)] = []
    coord_from = keypad[btn_from]
    coord_to = keypad[btn_to]
    coord_delta = (
      coord_to[0] - coord_from[0],
      coord_to[1] - coord_from[1],
    )
    max_moves = abs(coord_delta[0]) + abs(coord_delta[1]) + 1
    # from coordinate and direction button
    paths = deque([([(
      *coord_from,
      '',
    )])])
    while len(paths):
      path = paths.pop()
      coord_curr = path[-1]
      for d in D4:
        coord_next = (
          coord_curr[0] + d[0],
          coord_curr[1] + d[1],
          d[2],
        )
        if coord_next in path: continue
        char_at = rev_keypad.get((coord_next[0], coord_next[1]))
        if char_at is None: continue
        path_next = [
          *path,
          coord_next,
        ]
        if len(path_next) > max_moves: continue
        if char_at == btn_to:
          key_paths_cache[(btn_from, btn_to)].append(f'''{''.join(x[2] for x in path_next[1:])}A''')
        else:
          paths.appendleft(path_next)
  if DEBUG > 2: print(f'{key_paths_cache=}')
  return key_paths_cache[(btn_from, btn_to)]


def get_inputs(output: str, keypad: dict[str, tuple[int, int]]):
  if DEBUG > 1: print(f'get_inputs {output=} {keypad=}')
  prefixed_output = f'A{output}'
  inputs=[''.join(x) for x in product(*[
    get_key_paths(btn_from, btn_to, keypad)
    for btn_from, btn_to in zip(prefixed_output[:-1], prefixed_output[1:])
  ])]
  if DEBUG>0: print(f'{len(inputs)=}')
  return inputs


def part1():
  complexity_total = 0
  for door_code in door_codes:
    print(f'{door_code=}')

    robot_1_inputs = get_inputs(door_code, door_keypad)
    # print(f'{robot_1_inputs=}')

    robot_2_inputs: list[str] = []
    for x in robot_1_inputs:
      robot_2_inputs.extend(get_inputs(x, robot_keypad))
    robot_2_shortest=min(map(len,robot_2_inputs))
    # print(f'{robot_2_inputs=}')

    robot_3_inputs: list[str] = []
    for x in [x for x in robot_2_inputs if len(x)==robot_2_shortest]:
      robot_3_inputs.extend(get_inputs(x, robot_keypad))
    robot_3_shortest=min(map(len,robot_3_inputs))
    # print(f'{robot_3_inputs=}')

    door_code_int = int(''.join(x for x in door_code if x.isdigit()))
    complexity = robot_3_shortest * door_code_int
    complexity_total += complexity

    print(f'{robot_3_shortest=} {door_code_int=} {complexity=}')

    # exit()

  print(f'part 1: {complexity_total}')

def part2():
  complexity_total = 0
  for door_code in door_codes:
    print(f'{door_code=}')

    inputs = get_inputs(door_code, door_keypad)
    # print(f'{robot_1_inputs=}')

    for i in range(25):
      print(f'{door_code=} {i=}')
      inputs_shortest=min(map(len,inputs))
      next_inputs=[
        z
        for y in [x for x in inputs if len(x)==inputs_shortest]
        for z in get_inputs(y, robot_keypad)

      ]
      inputs=next_inputs

    inputs_shortest=min(map(len,inputs))
    door_code_int = int(''.join(x for x in door_code if x.isdigit()))
    complexity = inputs_shortest * door_code_int
    complexity_total += complexity

    print(f'{inputs_shortest=} {door_code_int=} {complexity=}')

    # exit()

  print(f'part 2: {complexity_total}')

# part1()
part2()


