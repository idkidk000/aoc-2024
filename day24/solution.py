#!/usr/bin/env python3
import sys
from functools import cache

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
sections = text.split('\n\n')
resolved = {kv[0]: int(kv[1]) for line in sections[0].splitlines() if (kv := line.split(': '))}
if DEBUG > 1: print(f'{resolved=}')
unresolved = {
  vk[1]: parts
  for line in sections[1].splitlines()
  if (vk := line.split(' -> ')) and (parts := tuple(vk[0].split(' ')))
}
if DEBUG > 1: print(f'{unresolved=}')


def join_int_list(val: list[int], rev: bool = True):
  if rev:
    return ''.join(str(x) for x in reversed(val))
  else:
    return ''.join(str(x) for x in val)


def part1():
  local_resolved = {**resolved}

  def resolve(symbol: str) -> int:
    if symbol not in local_resolved:
      x = unresolved[symbol]
      left_operand = resolve(x[0])
      operator = x[1]
      right_operand = resolve(x[2])
      match operator:
        case 'AND':
          local_resolved[symbol] = left_operand & right_operand
        case 'OR':
          local_resolved[symbol] = left_operand | right_operand
        case 'XOR':
          local_resolved[symbol] = left_operand ^ right_operand
        case _:
          raise RuntimeError(f'unknown {operator=} for {symbol=} with {left_operand=} {right_operand=}')
    return local_resolved[symbol]

  bits = [resolve(x) for x in sorted(unresolved.keys()) if x.startswith('z')]
  if DEBUG > 0: print(f'bits: {join_int_list(bits)}')
  total = 0
  for i, bit in enumerate(bits):
    total += bit << i
  print(f'part 1: {total=}')


def part2():

  def test(x_value: int, y_value: int):
    target = x_value + y_value
    # make a resolve cache for our inputs
    x_bits = list(reversed(list(map(int, bin(x_value)[2:]))))
    y_bits = list(reversed(list(map(int, bin(x_value)[2:]))))
    local_resolved = {
      k: x_bits[i] if len(x_bits) > i else 0
      for i, k in enumerate(x for x in resolved.keys() if x.startswith('x'))
    } | {
      k: y_bits[i] if len(y_bits) > i else 0
      for i, k in enumerate(x for x in resolved.keys() if x.startswith('y'))
    }

    #TODO: actually need another recursive function which remaps symbols and discards paths which return invalid results

    def resolve(symbol: str) -> int:
      if symbol not in local_resolved:
        x = unresolved[symbol]
        left_operand = resolve(x[0])
        operator = x[1]
        right_operand = resolve(x[2])
        match operator:
          case 'AND':
            local_resolved[symbol] = left_operand & right_operand
          case 'OR':
            local_resolved[symbol] = left_operand | right_operand
          case 'XOR':
            local_resolved[symbol] = left_operand ^ right_operand
          case _:
            raise RuntimeError(f'unknown {operator=} for {symbol=} with {left_operand=} {right_operand=}')
      return local_resolved[symbol]

    result_bits = [resolve(x) for x in sorted(unresolved.keys()) if x.startswith('z')]
    result = 0
    for i, bit in enumerate(result_bits):
      result += bit << i
    return result == target

  x_bits = [v for k, v in sorted(resolved.items(), key=lambda x: x[0]) if k.startswith('x')]
  x_value = 0
  for i, bit in enumerate(x_bits):
    x_value += bit << i
  y_bits = [v for k, v in sorted(resolved.items(), key=lambda x: x[0]) if k.startswith('y')]
  y_value = 0
  for i, bit in enumerate(y_bits):
    y_value += bit << i
  target = x_value + y_value
  # reversed to it matches x_bits and y_bits, lsb first
  target_bits = list(reversed(list(map(int, bin(target)[2:]))))

  print(f'x_bits     ={join_int_list(x_bits):>10s}')
  print(f'y_bits     ={join_int_list(y_bits):>10s}')
  print(f'target_bits={join_int_list(target_bits):>10s}')
  print(f'x_value    ={x_value: 10d}')
  print(f'y_value    ={y_value: 10d}')
  print(f'target     ={target: 10d}')

  # call local_resolve with multiple local_resolved dicts (i.e. different values for x and y)

  # write a recursive function which works lsb to msb and tries each possible remapping, discarding those which yield an incorrect bit
  # a previous register might have a carry bit, but that should already get handled in a different instance of the recursive func
  # after remapping 4 symbols, any set of inputs on x and y should always yield the correct sum on z
  # i suppose we can try several randomm inputs on x and y?


part1()
part2()
