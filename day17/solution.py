#!/usr/bin/env python3
import sys

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

  def combo_operand(operand: int):
    result = {
      4: registers['a'],
      5: registers['b'],
      6: registers['c'],
      7: None,
    }.get(operand, operand)
    # Combo operand 7 is reserved and will not appear in valid programs.
    assert result is not None
    return result

  pointer = 0
  output = []
  while True:
    try:
      opcode, operand = program[pointer], program[pointer + 1]
    except:
      break
    if DEBUG: print(f'{pointer=} {opcode=} {operand=} {combo_operand(operand)=} {registers=}')
    pointer += 2
    match opcode:
      case 0:  #adv
        registers['a'] = int(registers['a'] / (2**combo_operand(operand)))
      case 1:  #bxl
        registers['b'] = registers['b'] ^ operand
      case 2:  #bst
        registers['b'] = combo_operand(operand) % 8
      case 3:  #jnz
        if registers['a'] != 0:
          #TODO: validate
          pointer = operand
      case 4:  #bxc
        registers['b'] = registers['b'] ^ registers['c']
      case 5:  #out
        output.append(combo_operand(operand) % 8)
      case 6:  #bdv
        registers['b'] = int(registers['a'] / (2**combo_operand(operand)))
      case 7:  #cdv
        registers['c'] = int(registers['a'] / (2**combo_operand(operand)))

  result = ','.join([str(x) for x in output])
  if DEBUG: print(f'{result=}')
  return result


part1 = run_program(program, registers)
print(f'part 1: {part1}')

# part 2 brust force. there's almost certainly a big brain way of doing this
# i think something to do with the output values and which registers affect them and how the initial registers can be changed so those values are still produced. e.g. reg%8 means we can keep adding 8 to that reg and it won't affect the output. each output number adds a new constraint
i = 0
wanted_result = ','.join([str(x) for x in program])
while True:
  result = run_program(program, registers | {'a': i})
  if DEBUG: print(f'{i=} {wanted_result=} {result=}')
  if result == wanted_result:
    print(f'part 2: {i=}')
    break
  i += 1
