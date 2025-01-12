#!/usr/bin/env python3
import sys
import re
import json
from collections import defaultdict

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


def solve(iterations=1000, rx_trap=False):
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
  # # yapf: disable
  # rx_conjunction = [k for k, v in modules.items() if v['type'] == CONJUNCTION and 'rx' in v['targets']][0]  #type: ignore
  # # lol these are also conjunctions. may need to go a level deeper
  # # yep none of them went high after 100k cycles
  # # rx_conjuncion_drivers: dict[str, dict[int, bool]] = {k: {} for k, v in modules.items() if rx_conjunction in v['targets']} #type: ignore
  # rx_l1=[k for k,v in modules.items() if rx_conjunction in v['targets']] #type: ignore
  # rx_l2:dict[str,list[tuple[int,bool]]]={k:[] for k,v in modules.items() if any(x in v['targets'] for x in rx_l1)} #type: ignore
  # rx_l3:dict[str,list[tuple[int,bool]]]={k:[] for k,v in modules.items() if any(x in v['targets'] for x in rx_l2.keys())} #type: ignore
  # yapf: enable
  rx_traces:dict[str,list[tuple[int,bool]]]=defaultdict(list)

  count_low, count_high = 0, 0
  for i in range(iterations):
    # refactored as list because apparently all the modules can process multiple inputs per cycle so using (sender,receiver) as dict key was breaking things
    inputs = [('button', 'broadcaster', LOW)]
    while inputs:
      count_low += len([x for x in inputs if x[2] == LOW])
      count_high += len([x for x in inputs if x[2] == HIGH])
      next_inputs: list[tuple[str, str, bool]] = []
      for sender, receiver, state in inputs:
        # should use an enum but they're pretty annoying
        if DEBUG > 0: print(f'''{i=} {sender} -> {receiver}: {'HIGH' if state else 'LOW'}''')
        # if rx_trap and receiver == 'rx':
        #   print(f'{i=} {receiver=} {state=}')
        #   # presumably this goes low every 10 trillion cycles and i'll need to look at what drives it and find the patterns in their cycles and do lcm. but lets pretend that's not true for now :)
        #   if state == LOW: return i + 1
        if rx_trap:
          #BUG: this also needs to track the cycle num within each button press loop. in fact we might need to track the conjunctions and flip_flops dicts
          rx_traces[sender].append((i, state))
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
  if not rx_trap:
    if DEBUG > 0: print(f'{count_low=} {count_high=} {product=}')
    return product

  cycles:dict[str,dict[str,int]]={}
  for driver, values in rx_traces.items():
    trues = sorted({i for i, s in values if s})
    true_deltas = [y - x for x, y in zip(trues, trues[1:])]
    falses = sorted({i for i, s in values if not s})
    false_deltas = [y - x for x, y in zip(falses, falses[1:])]
    # print(f'{driver=} {len(values)=} {trues[:4]=} {falses[:4]=}')
    print(f'{driver=} {len(values)=} {true_deltas[:4]=} {false_deltas[:4]=}')
    # drivers with irregular deltas will need to be simulated from their own drivers
    # but i think there isn't enough data here yet - we need to know all of the states at each execution cycle for each button press cycle
    if len({*true_deltas})!=1 or len({*false_deltas})!=1: continue
    cycles[driver]={
      'low_start':falses[0],
      'low_interval':false_deltas[0],
      'high_start':trues[0],
      'high_interval':true_deltas[0],
    }

  print(f'{cycles=}')
  return 0


def part1():
  result = solve()
  print(f'part 1: {result}')
  # 883726240


def part2():
  # need to go a bit higher to make sure we have enough values to validate consistent deltas for all the drivers
  result = solve(100_000, True)
  print(f'part 2: {result=}')


if PART1: part1()
if PART2: part2()
