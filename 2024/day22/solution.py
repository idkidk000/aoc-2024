#!/usr/bin/env python3
import sys
# from functools import cache
from itertools import product
import time

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
  inputs = list(map(int, f.read().splitlines()))


def evolve(value: int, iterations: int) -> int:
  orig_value = value
  for i in range(iterations):
    value ^= value << 6  # xor mult 64
    value &= 16777215  # mod 16777216
    value ^= value >> 5  # xor idiv 32
    value &= 16777215  # mod 16777216
    value ^= value << 11  # xor mult 2048
    value &= 16777215  # mod 16777216
    if DEBUG > 0: print(f'evolve {orig_value} {i+1} {value}')
  return value


def part1():
  # evolve(inputs[0], 10)
  # for value in inputs:
  #   print(f'{value=} {evolve(value,2000)}')
  total=sum( \
    evolve(value,2000) \
    for value in inputs \
  )
  print(f'part 1: {total=}')


def part2():
  sequence_totals: dict[tuple[int, int, int, int], int] = {}
  for value in inputs:
    # build dict of first price per sequence (cache_key) for each input value
    sequence_total: dict[tuple[int, int, int, int], int] = {}
    prices = []
    for _ in range(2000):
      value ^= value << 6  # xor mult 64
      value &= 16777215  # mod 16777216
      value ^= value >> 5  # xor idiv 32
      value &= 16777215  # mod 16777216
      value ^= value << 11  # xor mult 2048
      value &= 16777215  # mod 16777216
      prices.append(value % 10)
    for i in range(1996):
      cache_key = (
        prices[i + 1] - prices[i],
        prices[i + 2] - prices[i + 1],
        prices[i + 3] - prices[i + 2],
        prices[i + 4] - prices[i + 3],
      )
      if cache_key in sequence_total: continue
      sequence_total[cache_key] = prices[i + 4]
    # sum per-input value sequence prices into sequence_totals
    for k, v in sequence_total.items():
      sequence_totals[k] = sequence_totals.get(k, 0) + v

  # then we can just sort it to get the best sequence and total
  best_sequnce, best_total = sorted(sequence_totals.items(), key=lambda x: x[1], reverse=True)[0]

  print(f'part 2: {best_sequnce=} {best_total=}')


part1()
part2()
