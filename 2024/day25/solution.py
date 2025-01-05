#!/usr/bin/env python3
import sys
from functools import cache

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
locks=[]
keys=[]
cols=5
rows=7
for item in [x.splitlines() for x in text.split('\n\n')]:
  print(f'{item=}')
  if item[0][0]=='#':
    locks.append(tuple(
      max(*[r for r in range(rows) if item[r][c]=='#'],0)
      for c in range(cols)
    ))
  else:
    # lock
    keys.append(tuple(
      rows-min(*[r for r in range(rows) if item[r][c]=='#'],rows)-1
      for c in range(cols)
    ))

if DEBUG>1:
  print(f'{locks=}')
  print(f'{keys=}')
fit_count=0
for lock in locks:
  for key in keys:
    fit=True
    for c in range(cols):
      if lock[c]+key[c]>=rows-1:
        fit=False
        break
    if fit:
      fit_count+=1
      if DEBUG>0: print(f'{lock=} {key=} fit')
    else:
      if DEBUG>0: print(f'{lock=} {key=} no fit')
print(f'part 1: {fit_count=}')
