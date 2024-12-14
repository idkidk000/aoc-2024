#!/usr/bin/env python3
import re
from collections import Counter
import logging

DEBUG = True
EXAMPLE = True
logging.basicConfig(format='{funcName}:{lineno} {message}', style='{', level=logging.DEBUG)


def parse(filename: str, size_x: int, size_y: int):
  with open(filename, 'r') as f:
    text = f.read()
  logging.debug(f'{text=}')
  regex = re.compile(r'p=(-?[0-9]+),(-?[0-9]+) v=(-?[0-9]+),(-?[0-9]+)')
  matches = re.findall(regex, text)
  logging.debug(f'{matches=}')
  data = [{
    'pos_x': int(m[0]),
    'pos_y': int(m[1]),
    'vel_x': int(m[2]),
    'vel_y': int(m[3]),
  } for m in matches]
  logging.debug(f'{data=}')
  return (data, size_x, size_y)


def draw_map(data: list[dict[str, int]], size_x: int, size_y: int, label: str):
  map_data = [[0 for x in range(size_x)] for y in range(size_y)]
  for item in data:
    # logging.debug(f'{item=}')
    map_data[item['pos_y']][item['pos_x']] += 1
    # logging.debug(f'''{map_data[item['pos_y']]=}''')
  # logging.debug(f'{map_data=}')
  print(label)
  for i, line in enumerate(map_data):
    print(f'{i:{(len(str(size_x)))}d} {line}')
  print()


def solve(data: list[dict[str, int]], size_x: int, size_y: int, iterations: int):
  counts: Counter[int] = Counter()
  for item in data:
    item['pos_x'] = (item['pos_x'] + item['vel_x'] * iterations) % size_x
    item['pos_y'] = (item['pos_y'] + item['vel_y'] * iterations) % size_y
    quad = None
    #TODO: check compares arent off by one
    if item['pos_x'] < int(size_x / 2):
      if item['pos_y'] < int(size_y / 2): quad = 0
      elif item['pos_y'] > int(size_y / 2): quad = 1
    elif item['pos_x'] > int(size_x / 2):
      if item['pos_y'] < int(size_y / 2): quad = 2
      elif item['pos_y'] > int(size_y / 2): quad = 3

    logging.debug(f'{size_x=} {size_y=} {item=} {quad=}')
    if quad is not None: counts[quad] += 1
  logging.debug(f'{counts=} {len(data)=}')
  product = 1
  for val in counts.values():
    product *= val
  logging.info(f'{product=}')
  return data


# logging.getLogger().setLevel(logging.INFO)
# data, size_x, size_y = parse('example.txt', 11, 7)
# data, size_x, size_y = parse('example2.txt', 11, 7)
data, size_x, size_y = parse('input.txt', 101, 103)
# draw_map(data, size_x, size_y, 'initial')
# solved = data
# for i in range(5):
#   solved = solve(data, size_x, size_y, 1)
#   draw_map(solved, size_x, size_y, f'{i=}')
solved = solve(data, size_x, size_y, 100)
# draw_map(solved, size_x, size_y, 'one')
