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
  print('calc input_prices')
  input_prices = []
  for value in inputs:
    prices = []
    for sequence_ix in range(2000):
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
    ) if -9 <= sum(x[:2]) <= 9 and -9 <= sum(x[:3]) <= 9 and -9 <= sum(x) <= 9
  ]
  print(f'{len(sequences)=}')

  print('calc sequence_totals')
  best_total = 0
  best_sequence = None
  last_status = 0.0
  for sequence_ix, sequence in enumerate(sequences):
    sequence_total = 0
    for input_delta_ix, deltas in enumerate(input_deltas):
      delta_ix = -1
      try:
        while delta_ix := deltas.index(sequence[0], delta_ix + 1):
          if deltas[delta_ix+1]==sequence[1] and \
            deltas[delta_ix+2]==sequence[2] and \
            deltas[delta_ix+3]==sequence[3]:
            sequence_total += input_prices[input_delta_ix][delta_ix + 4]
            break
      except:
        pass
      # for d0, d1, d2, d3, p in zip(
      #   deltas,
      #   deltas[1:],
      #   deltas[2:],
      #   deltas[3:],
      #   input_prices[input_delta_ix][4:],
      # ):
      #   if d0==sequence[0] and \
      #     d1==sequence[1] and \
      #     d2==sequence[2] and \
      #     d3==sequence[3]:
      #     # print(f'{d0=} {d1=} {d2=} {d3=} {p=} {j=}')
      #     sequence_total += p
      #     break
    if time.monotonic() >= last_status + 10:
      last_status = time.monotonic()
      print(f'{last_status%3600:04.0f} [{sequence_ix}/{len(sequences)}] {sequence=} {best_sequence=} {best_total=}')
    if sequence_total > best_total:
      best_total = sequence_total
      best_sequence = sequence
      print(f'{best_sequence=} {best_total=}')

  print(f'part 2: {best_sequence=} {best_total=}')


# part1()
part2()
