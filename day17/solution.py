#!/usr/bin/env python3
import sys
import concurrent.futures
import time

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
blocks = text.split('\n\n')
if DEBUG: print(f'{blocks=}')
registers = {
  kv[0]: int(kv[1])
  for x in blocks[0].splitlines()
  if (kv := x.removeprefix('Register ').lower().split(': '))
}
if DEBUG: print(f'{registers=}')
program = [int(x) for x in blocks[1].removeprefix('Program: ').split(',')]
if DEBUG: print(f'{program=}')


def run_program(program: list[int], registers: dict[str, int]):

  reg_a = registers['a']
  reg_b = registers['b']
  reg_c = registers['c']

  def combo_operand(operand: int):
    result = {
      4: reg_a,
      5: reg_b,
      6: reg_c,
      7: None,
    }.get(operand, operand)
    # Combo operand 7 is reserved and will not appear in valid programs.
    assert result is not None
    return result

  pointer = 0
  output = []
  while pointer < len(program):
    opcode, operand = program[pointer], program[pointer + 1]
    if DEBUG: print(f'{pointer=} {opcode=} {operand=} {combo_operand(operand)=} {registers=}')
    pointer += 2
    match opcode:
      case 0:  #adv
        # reg_a = reg_a // (2**combo_operand(operand))
        reg_a = reg_a >> combo_operand(operand)
      case 1:  #bxl
        reg_b ^= operand
      case 2:  #bst
        # reg_b = combo_operand(operand) % 8
        reg_b = combo_operand(operand) & 7
      case 3:  #jnz
        if reg_a != 0:
          pointer = operand
      case 4:  #bxc
        reg_b ^= reg_c
      case 5:  #out
        # output.append(combo_operand(operand) % 8)
        output.append(combo_operand(operand) & 7)
      case 6:  #bdv
        # reg_b = reg_a // (2**combo_operand(operand))
        reg_b = reg_a >> combo_operand(operand)
      case 7:  #cdv
        # reg_c = reg_a // (2**combo_operand(operand))
        reg_c = reg_a >> combo_operand(operand)

  result = ','.join([str(x) for x in output])
  if DEBUG: print(f'{result=}')
  return result


part1 = run_program(program, registers)
print(f'part 1: {part1}')




wanted_final=','.join([str(x) for x in program])

a_bins:set[str]={f'{x:03b}' for x in range(8)}
final_a_bins:set[str]=set()
for p in range(len(program)-1,-1,-1):
  wanted=','.join([str(x) for x in program[p:]])
  if DEBUG: print(f'{p=} {wanted=} {a_bins=}')
  for a_bin in a_bins.copy():
    for i in range(8):
      i_bin=f'{a_bin}{i:03b}'
      i_int=int(i_bin,2)
      result=run_program(program,registers|{'a':i_int})
      if result==wanted:
        if DEBUG: print(f'{a_bin=} {i_bin=} {i_int=} {result=}')
        a_bins.add(i_bin)
      if result==wanted_final:
        final_a_bins.add(i_bin)
    a_bins.remove(a_bin)


if DEBUG: print(f'{final_a_bins=}')
int_as=sorted([int(x,2) for x in final_a_bins])
for x in int_as:
  if DEBUG: print(f'{x:,.0f}   {x}')

print(f'part 2: {int_as[0]}')
