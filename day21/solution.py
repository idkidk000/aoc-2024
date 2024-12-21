#!/usr/bin/env python3
import sys
from functools import cache
from collections import deque

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
  text = f.read()
door_codes = [list(x) for x in text.splitlines()]
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

# def gen_possible_inputs(outputs: list[str], keypad: dict[str, tuple[int, int]]) -> set[tuple[str]]:
#   prefixed_outputs = ['A', *outputs]
#   rev_keypad = {v: k for k, v in keypad.items()}
#   for from_btn, to_btn in zip(prefixed_outputs[:-1], prefixed_outputs[1:]):
#     from_coord = keypad[from_btn]
#     to_coord = keypad[to_btn]
#     paths = deque([(from_coord,)])
#     completed_paths: list[tuple[tuple[int, int]]] = []
#     max_moves = abs(to_coord[0] - from_coord[0]) + to_coord[1] - from_coord[1]
#     while len(paths):
#       path = paths.pop()
#       curr_coord = path[-1]
#       for d in D4:
#         test_coord = (
#           curr_coord[0] + d[0],
#           curr_coord[1] + d[1],
#         )
#         if test_coord in path: continue
#         char_at = rev_keypad.get(to_coord)
#         if char_at is None: continue
#         next_path = (
#           *path,
#           test_coord,
#         )
#         print(f'{path=} {curr_coord=} {d=} {test_coord=} {next_path=}')
#         if char_at == to_btn:
#           completed_paths.append(next_path)
#         else:
#           paths.append(next_path)

#   return False


def gen_robot_inputs_door(outputs: list[str]) -> list[str]:
  # accepts door keypresses, returns robot keypresses
  inputs: list[str] = []
  prefixed_outputs = ['A', *outputs]
  for btn_from, btn_to in zip(prefixed_outputs[:-1], prefixed_outputs[1:]):
    coord_from = door_keypad[btn_from]
    coord_to = door_keypad[btn_to]
    move_row = coord_to[0] - coord_from[0]
    move_col = coord_to[1] - coord_from[1]
    row_moves = ['^' if move_row < 0 else 'v'] * abs(move_row)
    col_moves = ['<' if move_col < 0 else '>'] * abs(move_col)
    if btn_from in ['0', 'A'] or btn_to in ['0', 'A']:
      # avoid gap
      btn_inputs = [*col_moves, *row_moves, 'A']
    else:
      btn_inputs = [*row_moves, *col_moves, 'A']
    if DEBUG > 1:
      print(f'door {btn_from=} {btn_to=} {coord_from=} {coord_to=} {move_row=} {move_col=} {btn_inputs=}')
    inputs.extend(btn_inputs)
  if DEBUG > 0: print(f'{outputs=} {inputs=}')
  return inputs


def gen_robot_inputs_robot(outputs: list[str], label: str) -> list[str]:
  # will need to be called twice i think
  inputs: list[str] = []
  prefixed_outputs = ['A', *outputs]
  for btn_from, btn_to in zip(prefixed_outputs[:-1], prefixed_outputs[1:]):
    coord_from = robot_keypad[btn_from]
    coord_to = robot_keypad[btn_to]
    move_row = coord_to[0] - coord_from[0]
    move_col = coord_to[1] - coord_from[1]
    row_moves = ['^' if move_row < 0 else 'v'] * abs(move_row)
    col_moves = ['<' if move_col < 0 else '>'] * abs(move_col)
    # avoid gap
    if btn_from in ['^', 'A'] or btn_to in ['^', 'A']:
      btn_inputs = [*col_moves, *row_moves, 'A']
    else:
      btn_inputs = [*row_moves, *col_moves, 'A']
    if DEBUG > 1:
      print(f'{label} {btn_from=} {btn_to=} {coord_from=} {coord_to=} {move_row=} {move_col=} {btn_inputs=}')
    inputs.extend(btn_inputs)
  if DEBUG > 0: print(f'{outputs=} {inputs=}')
  return inputs


def part1():
  complexity_total = 0
  for door_code in door_codes:
    door_keypresses = gen_robot_inputs_door(door_code)
    robot_1_keypresses = gen_robot_inputs_robot(door_keypresses, 'robot1')
    robot_2_keypresses = gen_robot_inputs_robot(robot_1_keypresses, 'robot2')

    print(''.join(door_code))
    print(''.join(door_keypresses))
    print(''.join(robot_1_keypresses))
    print(''.join(robot_2_keypresses))
    len_robot_2_keypresses = len(robot_2_keypresses)
    door_code_int = int(''.join(x for x in door_code if x.isdigit()))
    complexity = len_robot_2_keypresses * door_code_int
    complexity_total += complexity
    print(f'{len_robot_2_keypresses=} {door_code_int=} {complexity=}')
    print()
    # exit()
  print(f'part 1: {complexity_total}')
  #133696 too high


part1()
