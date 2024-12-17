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
        reg_b = reg_b ^ operand
      case 2:  #bst
        # reg_b = combo_operand(operand) % 8
        reg_b = combo_operand(operand) & 7
      case 3:  #jnz
        if reg_a != 0:
          pointer = operand
      case 4:  #bxc
        reg_b = reg_b ^ reg_c
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

# part 2 brute force. there's almost certainly a big brain way of doing this
# i think something to do with the output values and which registers affect them and how the initial registers can be changed so those values are still produced. e.g. reg%8 means we can keep adding 8 to that reg and it won't affect the output. each output number adds a new constraint
# as a less big-brain improvement, the brute force can be multiprocessed


def run_program_wrapper(program: list[int], registers: dict[str, int], a_start: int, count: int, wanted_result: str):
  started = time.monotonic()
  for i in range(a_start, a_start + count):
    result = run_program(program, registers | {'a': i})
    if result.endswith(wanted_result):
      return {
        'match': result == wanted_result,
        'a': i,
        'a_b': bin(i),
        'wanted': wanted_result,
      }
  return {
    'match': False,
    'a_start': a_start,
    'count': count,
    'duration': round(time.monotonic() - started, 3),
    'wanted': wanted_result
  }


for p in program:
  print(run_program_wrapper(program, registers, 0, 256, str(p)))

# solve for each output individually then concat the 3 digit binary a's where last a is on the left and first is on the right
# print(run_program_wrapper(program, registers, 0, 2048, '3'))

print(f'{program=}')
print(
  run_program(
    program,
    registers | {
      'a':
      int(
        ''.join(
          [
            '011',  #3->0 ok
            '000',  #0->3 ok
            '100',  #4->5 ok
            '100',  #4->5 ok

            # manually went through these one by one to arrive at 108048353364378. which is too high :|

            # 3
            '010',
            # 4
            '011',
            # 6
            '110',
            # 1
            '111',
            # 3
            '101',
            # 0
            '110',
            # 5
            '001',
            # 7
            '000',
            # 5
            '100',
            # 1
            '110',
            # 4
            '011',
            # 2
            '010',



            # '010',  #2->1 ok
            # '000',  #0->3 ok
            # '011',  #3->0 ok
            # '100',  #4->5 ok
            # # 7
            # '100',  #4->5
            # '010',  #2->1
            # # 4
            # '001',  #1->2
          ]
        ),
        2
      )
    }
  )
)

# # print(run_program(program, registers | {'a': 518}))
# for i in range(1, len(program) + 1):
#   print(run_program_wrapper(program, registers, 0, 1000000000, ','.join([str(x) for x in program[-i:]])))

# A_START = 367_200_000
# A_END = 1_000_000_000
# BATCH_SIZE = 100_000
# wanted_result = ','.join([str(x) for x in program])
# executor = concurrent.futures.ProcessPoolExecutor(max_workers=8)
# futures = [
#   executor.submit(
#     run_program_wrapper,
#     program,
#     registers,
#     i,
#     BATCH_SIZE,
#     wanted_result,
#   ) for i in range(A_START, A_END, BATCH_SIZE)
# ]
# print('futures submitted')
# for future in concurrent.futures.as_completed(futures):
#   result = future.result()
#   if result['match']:
#     print('part 2:', result)
#     break
#   else:
#     print('working', result)

# executor.shutdown(wait=False, cancel_futures=True)

run_program(program,registers|{'a':108048353364378})