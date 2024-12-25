#!/usr/bin/env python3
import sys
from functools import cache
from random import randint

sys.setrecursionlimit(10)
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
sections=text.split('\n\n')
default_wires={
  y[0]:int(y[1])
  for x in sections[0].splitlines()
  if (y:=x.split(': '))
}
gates={
  y[1]:(z[1],min(z[0],z[2]),max(z[0],z[2]))
  for x in sections[1].splitlines()
  if (y:=x.split(' -> '))
  and (z:=y[0].split(' '))
}
if DEBUG>1:
  print(f'{default_wires=}')
  print(f'{gates=}')

def trace(gate:str,depth:int=0):
  if gate in gates:
    operator,gate_left,gate_right=gates[gate]
    print((' '*depth*2)+f'{operator} {gate}')
    for component in (gate_left,gate_right):
      trace(component,depth+1)
  else:
    print((' '*depth*2)+f'{gate} (END)')

def find(gate_a:str,gate_b:str|None=None):
  for k,v in gates.items():
    if gate_b is not None:
      if v[1]==min(gate_a,gate_b) and v[2]==max(gate_a,gate_b):
        print(f'{k} {v}')
    else:
      if gate_a in (v[1],v[2]):
        print(f'{k} {v}')

def swap(gate_a:str,gate_b:str):
  print(f'swap {gate_a}: {gates[gate_a]}, {gate_b}: {gates[gate_b]}')
  gates[gate_a],gates[gate_b]=gates[gate_b],gates[gate_a]
  print(f'swapped {gate_a}: {gates[gate_a]}, {gate_b}: {gates[gate_b]}')

def reload():
  # note: need to exit out properly after swapping wires
  exec(open('solution2.py').read())

def format_bin(value:int,length:int=45):
  return f'{bin(value)[2:]:0>{length}}'

def test(x:int|None=None,y:int|None=None,swaps:list[tuple[str,str]]=[]):
  local_gates={**gates}

  for swap_a,swap_b in swaps:
    if DEBUG>0: print(f'swap {swap_a}: {local_gates[swap_a]}, {swap_b}: {local_gates[swap_b]}')
    local_gates[swap_a],local_gates[swap_b]=local_gates[swap_b],local_gates[swap_a]
    if DEBUG>0: print(f'swapped {swap_a}: {local_gates[swap_a]}, {swap_b}: {local_gates[swap_b]}')

  z_length=len([x for x in local_gates.keys() if x[0]=='z'])
  if DEBUG>0: print(f'{z_length=}')
  if x is not None and y is not None:
    target=x+y
  elif x is not None and y is None:
    target=randint(x,1<<(z_length-1))
    y=target-x
  else:
    target=randint(0,1<<(z_length-1))
    x=randint(0,target)
    y=target-x
  gate_values={
    f'x{i:02d}':(x>>i)&1
    for i in range(z_length)
  }|{
    f'y{i:02d}':(y>>i)&1
    for i in range(z_length)
  }


  def resolve(gate: str) -> int:
    if gate not in gate_values:
      operator,*inputs = local_gates[gate]
      gate_a = resolve(inputs[0])
      gate_b = resolve(inputs[1])
      match operator:
        case 'AND':
          gate_values[gate] = gate_a & gate_b
        case 'OR':
          gate_values[gate] = gate_a | gate_b
        case 'XOR':
          gate_values[gate] = gate_a ^ gate_b
        case _:
          raise RuntimeError(f'unknown {operator=} for {gate=} with {gate_a=} {gate_b=}')
    return gate_values[gate]

  result=0
  for i in range(z_length):
    result+=resolve(f'z{i:02d}')<<i

  if DEBUG>0: print(f'x     ={x}')
  if DEBUG>0: print(f'y     ={y}')
  if DEBUG>0: print(f'x     ={format_bin(x)}')
  if DEBUG>0: print(f'y     ={format_bin(y)}')
  if DEBUG>0: print(f'target={format_bin(target)}')
  if DEBUG>0: print(f'result={format_bin(result)}')
  for i in range(z_length):
    target_bit=(target>>i)&1
    result_bit=(result>>i)&1
    if target_bit!=result_bit:
      if DEBUG>0: print(f'bit {i}: {target_bit=} {result_bit=}')
  if DEBUG>0: print(f'{target==result=}')
  return target==result


# swap('z08','ffj')
# swap('z22','gjh')
# swap('z31','jdr')

# # trace('z01')
# for gate in [x for x in sorted(gates.keys()) if x[0]=='z']:
#   # trace(gate)
#   # _=input()
#   print(f'{gate=} {gates[gate]=}')

# test(swaps=[
#   ('z08','ffj'),
#   ('z15','knt'), #this isnt right but it's close
#   ('z22','gjh'),
#   ('z31','jdr'),
# ])


# figured out by looking for xors of x,y[current]
swaps=[
  ('z08','ffj'),
  ('dwp','kfm'),
  ('z22','gjh'),
  ('z31','jdr'),
]
flat_swaps=[
  y
  for x in swaps
  for y in x
]

# likely=[]
# for gate_a in [x for x in sorted(gates.keys()) if x not in flat_swaps]:
#   for gate_b in [x for x in sorted(gates.keys()) if x not in flat_swaps]:
#     # print(f'testing: swap z08 {gate_a}; z15 {gate_b}')
#     try:
#       test_swaps=[*swaps,('z08',gate_a),('z08',gate_b),]
#       success=True
#       for i in range(10):
#         if not test(swaps=test_swaps):
#           success=False
#       if success:
#         likely.append(test_swaps)
#         print(f'likely {test_swaps=}')
#     except:
#       pass
# print(f'{likely=}')
