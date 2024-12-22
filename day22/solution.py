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
  print('calc input_prices')
  input_prices = []
  for value in inputs:
    prices = []
    for i in range(2000):
      value ^= value << 6  # xor mult 64
      value &= 16777215  # mod 16777216
      value ^= value >> 5  # xor idiv 32
      value &= 16777215  # mod 16777216
      value ^= value << 11  # xor mult 2048
      value &= 16777215  # mod 16777216
      prices.append(value % 10)
    input_prices.append(prices)
  print(f'{input_prices[0]=}')

  print('calc input_deltas')
  input_deltas = [ \
    [ \
      price_next - price_prev \
      for price_prev, price_next in zip(prices, prices[1:]) \
    ] \
    for prices in input_prices \
  ]
  print(f'{input_deltas[0]=}')

  print('calc sequences')
  # sequences = [[-2, 1, -1, 3]]
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
  for i, sequence in enumerate(sequences):
    sequence_total = 0
    for j, deltas in enumerate(input_deltas):
      for d0, d1, d2, d3, p in zip(
        deltas,
        deltas[1:],
        deltas[2:],
        deltas[3:],
        input_prices[j][4:],  #TODO: 4??
      ):
        if d0==sequence[0] and \
          d1==sequence[1] and \
          d2==sequence[2] and \
          d3==sequence[3]:
          # print(f'{d0=} {d1=} {d2=} {d3=} {p=} {j=}')
          sequence_total += p
          break
    if i % 50 == 0: print(f'[{i}/{len(sequences)}] {sequence=} {sequence_total=}')
    sequence_totals.append((sequence, sequence_total))

  print('sort sequence_totals')
  best_sequence = sorted(sequence_totals, key=lambda x: x[1], reverse=True)[0]
  print(f'part 2: {best_sequence=}')


# part1()
part2()
