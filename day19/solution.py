#!/usr/bin/env python3
import sys
from collections import deque
from functools import cache

sys.setrecursionlimit(1_000_000)
DEBUG = False
FILENAME = 'example.txt'

for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = True
  else: raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
sections = text.split('\n\n')
components = sections[0].split(', ')
if DEBUG: print(f'{components=}')
targets = sections[1].splitlines()
if DEBUG: print(f'{targets=}')


@cache
def walk(target: str, start: int, end: int):
  # BUG: this isn't returning all possible solutions when using the @cache decorator
  for i in range(end, start, -1):
    part = target[start:i]
    if DEBUG: print(f'  test {part=} {part in components}')
    if part in components:
      if i == end:
        if DEBUG: print(f'    yield [{part=}]')
        yield (part,)
      else:
        if DEBUG: print(f'  walk {i=} {end=}')
        for x in walk(target, i, end):
          if DEBUG: print(f'    yield {x=}')
          yield (part, *x)


total_possible = 0
for target_ix, target in enumerate(targets):
  print(f'[{target_ix+1}/{len(targets)}] {target}')
  for solution in walk(target, 0, len(target)):
    total_possible += 1
    break
print(f'part 1: {total_possible=}')
