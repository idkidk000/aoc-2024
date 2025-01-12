#!/usr/bin/env python3
import sys
import re
import json

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

# yapf: disable
for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i': FILENAME = 'input.txt'
      case '-p1': PART1, PART2 = True, False
      case '-p2': PART1, PART2 = False, True
      case '-p0': PART1, PART2 = False, False
      case _: raise Exception(f'unknown {arg=}')
#yapf: enable

FLIP_FLOP = '%'
CONJUNCTION = '&'
LOW, HIGH = False, True
MODULE_RE = re.compile(rf'^([{FLIP_FLOP}{CONJUNCTION}])?([a-z]+) -> ([a-z, ]+)$', re.MULTILINE)
with open(FILENAME, 'r') as f:
  modules = {
    match.group(2): {
      'type': match.group(1) or None,
      'targets': match.group(3).replace(',', ' ').split()
    }
    for match in MODULE_RE.finditer(f.read())
  }
if DEBUG > 2:
  if DEBUG > 3: print(json.dumps(modules, indent=2))
  else: print(f'{modules=}')


def part1():
  # initial states
  flip_flops = {k: LOW for k, v in modules.items() if v['type'] == FLIP_FLOP}
  conjunctions = {
    k: {
      kk: LOW
      for kk, vv in modules.items()
      if k in vv['targets']  #type: ignore
    }
    for k, v in modules.items()
    if v['type'] == CONJUNCTION
  }
  if DEBUG > 2:
    if DEBUG > 3:
      print(json.dumps(flip_flops, indent=2))
      print(json.dumps(conjunctions, indent=2))
      exit()
    else:
      print(f'{flip_flops=}')
      print(f'{conjunctions=}')
  count_low, count_high = 0, 0
  for i in range(1000):
    # refactored as list because apparently you can have multiple inputs with the same sender and receiver?
    inputs = [('button', 'broadcaster', LOW)]
    while inputs:
      count_low += len([x for x in inputs if x[2] == LOW])
      count_high += len([x for x in inputs if x[2] == HIGH])
      next_inputs: list[tuple[str, str, bool]] = []
      for sender, receiver, state in inputs:
        # should use an enum but they're pretty annoying
        if DEBUG > 0: print(f'''{i=} {sender} -> {receiver}: {'HIGH' if state else 'LOW'}''')
        if receiver not in modules.keys(): continue
        module = modules[receiver]
        assert isinstance(module['targets'], list)  #should probably migrate to classes
        # match case treats % as a sql-like glob pattern
        if module['type'] == FLIP_FLOP:
          if state == LOW:
            prev_state = flip_flops[receiver]
            next_state = prev_state ^ True
            flip_flops[receiver] = next_state  # flip state and pass new state to targets
            if DEBUG > 1:
              print(f'''  flipflop {'HIGH' if prev_state else 'LOW'} -> {'HIGH' if next_state else 'LOW'}''')
            next_inputs.extend([(receiver, x, flip_flops[receiver]) for x in module['targets']])
          elif DEBUG > 1:
            print('  ignore HIGH')
        elif module['type'] == CONJUNCTION:
          # update r/s state and determine state to pass to targets
          if DEBUG > 1:
            print('  prev inputs:')
            for k, v in conjunctions[receiver].items():
              print(f'''    {k}: {'HIGH' if v else 'LOW'}''')
            print(f'''  update input {sender} to {'HIGH' if state else 'LOW'}''')
          conjunctions[receiver][sender] = state
          next_state = LOW if all(x == HIGH for x in conjunctions[receiver].values()) else HIGH
          if DEBUG > 1: print(f'''  conjunction: {'HIGH' if next_state else 'LOW'}''')
          next_inputs.extend([(receiver, x, next_state) for x in module['targets']])
        else:
          # pass the state directly to targets
          next_inputs.extend([(receiver, x, state) for x in module['targets']])
      inputs = next_inputs
  product = count_low * count_high
  print(f'part 1: {count_low=} {count_high=} {product=}')
  # 883726240


def part2():
  ...


if PART1: part1()
if PART2: part2()
