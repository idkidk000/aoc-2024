#!/usr/bin/env python3
import sys
# from functools import cache
from itertools import product

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
  print('calc input_deltas')
  input_deltas = []
  for value_prev in inputs:
    deltas = []
    for i in range(2000):
      value = value_prev
      value ^= value << 6  # xor mult 64
      value &= 16777215  # mod 16777216
      value ^= value >> 5  # xor idiv 32
      value &= 16777215  # mod 16777216
      value ^= value << 11  # xor mult 2048
      value &= 16777215  # mod 16777216
      delta = (value % 10) - (value_prev % 10)
      deltas.append(delta)
    input_deltas.append(deltas)
  for x in input_deltas:
    for y in x:
      assert -9 <= y <= 9, f'delta {y=} invalid'

  print('calc sequences')
  sequences = [
    x for x in product(
      range(-9, 10),
      range(-9, 10),
      range(-9, 10),
      range(-9, 10),
    ) if -9 <= x[0] + x[1] <= 9 and -9 <= x[0] + x[1] + x[2] <= 9 and -9 <= sum(x) <= 9
  ]
  print(f'{len(sequences)=}')

  print('calc sequence_totals')
  sequence_totals = []
  for j, sequence in enumerate(sequences):
    if j % 50 == 0: print(f'[{j}/{len(sequences)}] {sequence}')
    sequence_total = 0
    for deltas in input_deltas:
      for i in range(1996):
        if deltas[i] == sequence[0] and deltas[i + 1] == sequence[1] and deltas[i + 2] == sequence[2] and deltas[
          i + 3] == sequence[3]:
          sequence_total += deltas[i + 4]
          break
    sequence_totals.append((sequence, sequence_total))

  print('sort sequence_totals')
  best_sequence = sorted(sequence_totals, key=lambda x: x[1], reverse=True)[0]
  print(f'part 2: {best_sequence=}')


# part1()
part2()
