#!/usr/bin/env python3
import sys
from itertools import combinations

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i':
        FILENAME = 'input.txt'
      case '-p1':
        PART1, PART2 = True, False
      case '-p2':
        PART1, PART2 = False, True
      case '-p0':
        PART1, PART2 = False, False
      case _:
        raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
map_data = [list(x) for x in text.splitlines()]
rows = len(map_data)
cols = len(map_data[0])


def draw_map(map_data: list[list[str]]):
  rows=len(map_data)
  cols=len(map_data[0])
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(map_data[r])}''')
  print(f'{rows=} {cols=}')


def part1():
  # grim
  expand_cols={
    i
    for i,x in enumerate(zip(*map_data))
    if not any(y=='#' for y in x)
  }
  expanded=[]
  for row in map_data:
    expanded_row=[]
    for c,char in enumerate(row):
      if c in expand_cols:
        expanded_row+=[char,char]
      else:
        expanded_row+=[char]
    if not any(x=='#' for x in row):
      expanded+=[expanded_row,expanded_row]
    else:
      expanded+=[expanded_row]

  if DEBUG>0:
    print('map_data:')
    draw_map(map_data)

    print('\nexpanded:')
    draw_map(expanded)

  galaxies={
    (r,c)
    for r in range(len(expanded))
    for c in range(len(expanded[0]))
    if expanded[r][c]=='#'
  }

  if DEBUG>0:
    print(f'{len(galaxies)=}')
    print(f'{sorted(galaxies)=}')

  combos=combinations(galaxies,2)
  total=0
  for ga,gb in combos:
    dist=abs(ga[0]-gb[0])+abs(ga[1]-gb[1])
    if DEBUG>0: print(f'{ga=} {gb=} {dist=}')
    total+=dist

  print(f'part 1: {total}')

def part2():
  # leave map_data intact and make a set of rows and cols for expansion
  # loop over combos, calc distance, add 1_000_000 for each crossed expand row and col
  expand_cols={
    i
    for i,x in enumerate(zip(*map_data))
    if not any(y=='#' for y in x)
  }
  expand_rows={
    i
    for i,x in enumerate(map_data)
    if not any(y=='#' for y in x)
  }
  if DEBUG>0:
    print(f'{expand_cols=}')
    print(f'{expand_rows=}')
  galaxies={
    (r,c)
    for r in range(len(map_data))
    for c in range(len(map_data[0]))
    if map_data[r][c]=='#'
  }
  if DEBUG>0: print(f'{galaxies=}')
  combos=combinations(galaxies,2)
  # multiplier=2
  # multiplier=10
  multiplier=1_000_000
  total=0
  for ga,gb in combos:
    dist=abs(ga[0]-gb[0])+abs(ga[1]-gb[1])
    for r in range(min(ga[0],gb[0]),max(ga[0],gb[0])):
      if r in expand_rows: dist+=multiplier-1
    for c in range(min(ga[1],gb[1]),max(ga[1],gb[1])):
      if c in expand_cols: dist+=multiplier-1
    total+=dist
  print(f'part 2: {total}')
  # 678729486878 too high


if PART1: part1()
if PART2: part2()
