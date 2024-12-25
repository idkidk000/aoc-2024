#!/usr/bin/env python3
import sys
from functools import cache
from random import randint
from itertools import product,combinations,zip_longest

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


def part2_1():

  def test(output_bits=46, offset=0, swaps: list[tuple[str, str]] = []):
    # generate some random values
    if output_bits > 2:
      target = randint(1 << (output_bits - 2), (1 << output_bits) - 1)
    else:
      target = randint(0, (1 << output_bits) - 1)
    x_value = randint(0, target)
    y_value = target - x_value

    # make a resolve cache for our inputs
    x_bits = list(reversed(list(map(int, bin(x_value)[2:]))))
    y_bits = list(reversed(list(map(int, bin(y_value)[2:]))))
    local_resolved = {
      k: x_bits[i] if len(x_bits) > i else 0
      for i, k in enumerate(x for x in resolved.keys() if x.startswith('x'))
    } | {
      k: y_bits[i] if len(y_bits) > i else 0
      for i, k in enumerate(x for x in resolved.keys() if x.startswith('y'))
    }
    target_bits = list(reversed(list(map(int, bin(target)[2:]))))
    local_unresolved = {**unresolved}
    for a, b in swaps:
      temp = local_unresolved[a]
      local_unresolved[a] = local_unresolved[b]
      local_unresolved[b] = temp

    #TODO: actually need another recursive function which tests each possible symbol remapping and discards paths which return invalid results
    # so our actual return value from the test function should be a set of remapped symbols
    # then test can be repeatedly run with random values and each result intersected with the previous until there is just a single remapping that works consistently

    def resolve(symbol: str) -> int:
      if symbol not in local_resolved:
        x = local_unresolved[symbol]
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

    result_bits = [resolve(f'z{x+offset:02d}') for x in range(output_bits)]
    result = 0
    for i, bit in enumerate(result_bits):
      result += bit << i
    if DEBUG > 1: print(f'target_bits={join_int_list(target_bits):>0{output_bits}}')
    if DEBUG > 1: print(f'result_bits={join_int_list(result_bits):>0{output_bits}}')

    # make the lists the same length so zip doesn't miss items
    while len(target_bits) < output_bits:
      target_bits.append(0)
    while len(result_bits) < output_bits:
      result_bits.append(0)
    bad_symbols = []
    for i, (t, r) in enumerate(zip(target_bits, result_bits),):
      if t != r:
        symbol = f'z{i+offset:02d}'
        if DEBUG > 0: print(f'{symbol=} {t=} {r=} {local_unresolved[symbol]}')
        bad_symbols.append(symbol)

    return bad_symbols

  # # get the z symbols which sometimes have an incorrect value
  # bad_symbols = set()
  # for i in range(100):
  #   bad_symbols.update(test(1, 8))

  # print(f'{bad_symbols=}')

  # #recurse over bad_symbols and add each of their source symbols to bad_symbols
  # def extend_bad_symbols(symbol: str):
  #   if symbol not in resolved:
  #     x, o, y = unresolved[symbol]
  #     if x not in bad_symbols:
  #       bad_symbols.add(x)
  #       extend_bad_symbols(x)
  #     if y not in bad_symbols:
  #       bad_symbols.add(y)
  #       extend_bad_symbols(y)

  # for symbol in [*bad_symbols]:
  #   extend_bad_symbols(symbol)
  # print(f'{bad_symbols=} {len(bad_symbols)=}')
  # # oh it's everything

  for i in range(4):
    result = True
    for j in range(100):
      if len(test(1, i)):
        result = False
        break
    print(f'{i=} {result=}')

  #TODO: create a product of bad registers where each item has 4 tuples of 2

  #TODO: test each swap configuration until we find one which consistently returns no bad symbols

  # if only x and y bits are applicable to be swapped, that means 45**4=4.1m combinations, which is probably quite brute-forceable
  # run all the permutations on an x and y, discard any which give bad results
  # chosoe a new x and y, repeat until there's only one combination of swaps


def part2_2():

  def test(x: int, y: int, swaps: list[tuple[str, str]] = []):
    target = x + y
    # print(f'test {x=} {y=} {swaps=}')

    # make a resolve cache for our inputs
    x_bits = list(reversed(list(map(int, bin(x)[2:]))))
    y_bits = list(reversed(list(map(int, bin(y)[2:]))))
    local_resolved = {
      k: x_bits[i] if len(x_bits) > i else 0
      for i, k in enumerate(x for x in resolved.keys() if x.startswith('x'))
    } | {
      k: y_bits[i] if len(y_bits) > i else 0
      for i, k in enumerate(x for x in resolved.keys() if x.startswith('y'))
    }
    target_bits = list(reversed(list(map(int, bin(target)[2:]))))
    for a, b in swaps:
      temp = local_resolved[a]
      local_resolved[a] = local_resolved[b]
      local_resolved[b] = temp

    # print(f'      {resolved=}')
    # print(f'{local_resolved=}')
    # exit()

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

    result_bits = [resolve(x) for x in sorted(unresolved.keys()) if x[0] == 'z']
    for t, r in zip_longest(target_bits, result_bits,fillvalue=0):
      if t != r: return False
    return True

  possible_symbols = [x for x in sorted(resolved.keys()) if x[0] in 'xy' and int(x[1:])>=3]
  print(f'{possible_symbols=}')

  x = randint(0, 1 << 45)
  y = randint(0, (1 << 45) - x)
  possible_swaps=[]
  count_ok=0
  count_fail=0
  for c in combinations(possible_symbols,8):
    swaps=[(c[0],c[1]),(c[2],c[3]),(c[4],c[5]),(c[6],c[7]),]
    if test(x,y,swaps):
      possible_swaps.append(swaps)
      print(f'*** found {swaps} ***')
      count_ok+=1
    else:
      count_fail+=1
    if (count_ok+count_fail)%10_000==0: print(f'{count_ok=:,.0f} {count_fail=:,.0f} {swaps=}')

  while len(possible_swaps) > 1:
    x = randint(0, 1 << 45)
    y = randint(0, (1 << 45) - x)
    print(f'{x=} {y=} {len(possible_swaps)=}')
    next_possible_swaps = []
    for swaps in possible_swaps:
      if test(x, y, swaps):
        next_possible_swaps.append(swaps)
    possible_swaps = next_possible_swaps

  print(f'final {possible_swaps=}')

  # only 3.1 quadrillion possible combinations of the x and y symbols with index>=3. should finish in no time :|


# part1()
# part2_1()
part2_2()
