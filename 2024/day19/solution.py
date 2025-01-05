#!/usr/bin/env python3
import sys
from collections import deque
# from functools import cache

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
components = set(sections[0].split(', '))
if DEBUG: print(f'{components=}')
targets = sections[1].splitlines()
if DEBUG: print(f'{targets=}')

# @cache
# def walk(target: str, start: int, end: int):
#   # BUG: this isn't returning all possible solutions when using the @cache decorator
#   for i in range(end, start, -1):
#     part = target[start:i]
#     if DEBUG: print(f'  test {part=} {part in components}')
#     if part in components:
#       if i == end:
#         if DEBUG: print(f'    yield [{part=}]')
#         yield (part,)
#       else:
#         if DEBUG: print(f'  walk {i=} {end=}')
#         for x in walk(target, i, end):
#           if DEBUG: print(f'    yield {x=}')
#           yield (part, *x)

get_solutions_cache: dict[str, set[tuple[str]]] = {}


# the reason this is so slow is that it's bulding 769 trillion sets
def get_solutions(target: str):
  if target in get_solutions_cache: return get_solutions_cache[target]
  solutions: set[tuple[str]] = set()
  for i in range(1, min(component_max_len, len(target)) + 1):
    if DEBUG: print(f'  {target=} {i=}')
    if target[:i] in components:
      if i == len(target):
        solutions.add((target[:i],))
      else:
        for x in get_solutions(target[i:]):
          solutions.add((target[:i], *x))
  get_solutions_cache[target] = solutions
  return solutions


component_max_len = max([len(x) for x in components])
solution_exists_cache: dict[str, bool] = {}


def solution_exists(target: str):
  if target in solution_exists_cache: return solution_exists_cache[target]
  for i in range(1, min(component_max_len, len(target)) + 1):
    if DEBUG: print(f'  {target=} {i=}')
    if target[:i] in components and (i == len(target) or solution_exists(target[i:])):
      solution_exists_cache[target] = True
      return True
  solution_exists_cache[target] = False
  return False


solution_count_cache: dict[str, int] = {}


def solution_count(target: str):
  if target in solution_count_cache: return solution_count_cache[target]
  count = 0
  for i in range(1, min(component_max_len, len(target)) + 1):
    if DEBUG: print(f'  {target=} {i=}')
    if target[:i] in components:
      if i == len(target):
        count += 1
      else:
        count += solution_count(target[i:])
  solution_count_cache[target] = count
  return count


total_possible = 0
total_solutions = 0
for target_ix, target in enumerate(targets):
  print(f'[{target_ix+1}/{len(targets)}] {target}')
  target_solutions = get_solutions(target)
  target_solutions_len = len(target_solutions)
  print(f'  {target_solutions_len=}')
  if target_solutions_len > 0: total_possible += 1
  total_solutions += target_solutions_len

  # target_solutions = solution_count(target)
  # print(f'  {target_solutions=}')
  # if target_solutions > 0: total_possible += 1
  # total_solutions += target_solutions
print(f'part 1: {total_possible=}')
print(f'part 2: {total_solutions=}')

# print(f'{len(solution_count_cache)}')
