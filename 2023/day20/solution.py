#!/usr/bin/env python3
import sys
import re
from collections import deque
from typing import Self
from math import lcm  #actually it's called "maths", sweetie

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

class State(): # ugh. but enums are worse
  LOW = False
  HIGH = True
  def __init__(self, val: bool|Self=False): self._val = bool(val)
  def flip(self): self._val ^= True; return self
  def set(self,val:bool): self._val=bool(val); return self
  def set_low(self): self._val=False; return self
  def set_high(self): self._val=True; return self
  def __bool__(self): return self._val
  def __str__(self): return 'HIGH' if self._val else 'LOW'
  def __repr__(self): return f'{self.__class__.__name__}.{self.__str__()}'
  def __eq__(self,other:Self|bool): return self._val==bool(other) #type: ignore
  def copy(self): return State(self._val)

class Module():
  FLIP_FLOP = '%'
  CONJUNCTION = '&'
  _types = {
    FLIP_FLOP: 'flip flop',
    CONJUNCTION: 'conjunction',
  }
  def __init__(self, name: str, type: str, targets: str):
    self._name = name
    self._type = type
    self._targets = tuple(targets.split(', '))
    self._state = State()
    self._inputs: dict[str, State] = {}
  def set_input(self, input: str, state: State):
    # only valid on conjunctions but i cba writing a base and subclasses
    self._inputs[input] = state
    if all(self._inputs.values()): self.state.set_low()
    else: self.state.set_high()
  @property # should be a frozendict really
  def inputs(self): return self._inputs
  @property
  def typename(self): return self._types.get(self._type, 'module')
  @property
  def name(self): return self._name
  @property
  def type(self): return self._type
  @property
  def targets(self): return self._targets
  @property
  def state(self): return self._state
  def __repr__(self): return f'<Module type={self.typename} targets={self.targets} inputs={self._inputs} state={self.state}>'
#yapf: enable

MODULE_RE = re.compile(r'^([%&])?([a-z]+) -> ([a-z, ]+)$', re.MULTILINE)
with open(FILENAME, 'r') as f:
  modules = {
    match.group(2): Module(
      match.group(2),
      match.group(1),
      match.group(3),
    )
    for match in MODULE_RE.finditer(f.read())
  }


def solve(iterations=1000, rx_trap=False):
  # reset initial states
  for module in modules.values():
    if module.type == Module.FLIP_FLOP: module.state.set_low()
    elif module.type == Module.CONJUNCTION:
      for input in modules.values():
        if module.name in input.targets:
          module.set_input(input.name, State())

  if DEBUG > 2:
    print(f'{modules=}')

  # rx has only one input
  rx_driver = [x.name for x in modules.values() if 'rx' in x.targets][0]
  # l1 didn't go low after 100k button presses
  rx_l1 = {x.name for x in modules.values() if rx_driver in x.targets}
  # so lets try l2. set because there might be many pulses per button press
  rx_traces: dict[str, set[int]] = {x.name: set() for x in modules.values() if any(y in x.targets for y in rx_l1)}
  rx_trace_state = State.LOW

  count_low, count_high = 0, 0
  plsbreak = False
  for i in range(iterations):
    inputs = deque([('button', 'broadcaster', State())])
    while inputs:
      sender_name, receiver_name, state = inputs.popleft()
      if state == State.HIGH: count_high += 1
      elif state == State.LOW: count_low += 1
      else: assert False, f'{state=}'
      receiver = modules.get(receiver_name)
      sender = modules.get(sender_name)
      if DEBUG > 1: print(f'{i=} {sender_name} -> {receiver_name} ({receiver.typename if receiver else None}): {state}')
      if rx_trap and sender_name in rx_traces.keys() and state == rx_trace_state:
        # this is a bit backwards since we're adding the trace when the pulse is received, not when it's sent. but all pulses must be resolved before next i so maybe it's fine
        rx_traces[sender_name].add(i)
        if DEBUG > 0:
          print('traces:')
          for k, v in rx_traces.items():
            print(f'  {k=} {len(v)=} {sorted(v)[:5]=}')
        if all(len(x) >= 5 for x in rx_traces.values()):
          plsbreak = True
          break
      if receiver is None: continue
      # match case treats % as a sql-like glob pattern
      if receiver.type == Module.FLIP_FLOP:
        if state == State.LOW:
          # flip state and pass new state to targets
          prev_state = receiver.state.copy()
          receiver.state.flip()
          if DEBUG > 2:
            print(f'  {receiver.typename} {prev_state} -> {receiver.state}')
          for x in receiver.targets:
            inputs.append((receiver_name, x, receiver.state.copy()))
        elif DEBUG > 2:
          print(f'  ignore {state}')
      elif receiver.type == Module.CONJUNCTION:
        # update inputs. class determines new state. new state to targets
        if DEBUG > 2:
          print('  prev inputs:')
          for k, v in receiver.inputs.items():
            print(f'    {k}: {v}')
          print(f'  update input {sender_name} to {state}')
        prev_state = receiver.state.copy()
        receiver.set_input(sender_name, state)
        if DEBUG > 2: print(f'  {receiver.typename}: {prev_state} -> {receiver.state}')
        for x in receiver.targets:
          inputs.append((receiver_name, x, receiver.state.copy()))
      else:
        # pass the state directly to targets
        for x in receiver.targets:
          inputs.append((receiver_name, x, state.copy()))
    if plsbreak: break

  if not rx_trap:
    product = count_low * count_high
    if DEBUG > 0: print(f'{count_low=} {count_high=} {product=}')
    return product

  deltas: set[int] = set()
  for k, v in rx_traces.items():
    sv = sorted(v)
    if DEBUG > 0: print(f'''{k=} {sv=}''')
    item_deltas = {y - x for x, y in zip(sv, sv[1:])}
    offset = sv[0]
    if DEBUG > 0: print(f'  {item_deltas=} {offset=}')
    assert len(item_deltas) == 1
    delta = item_deltas.pop()
    # thankfully the aoc people have been kind and the offsets are all delta-1. so we can just lcm. the -1 is because we start at ix 0 so can be ignored
    assert delta == offset + 1
    deltas.add(delta)
  cycle = lcm(*deltas)
  if DEBUG > 0: print(f'{deltas=} {cycle=}')
  return cycle


def part1():
  result = solve()
  print(f'part 1: {result}')
  # 883726240


def part2():
  # give it a silly number of iterations. we shouldn't hit that unless something's gone very wrong (foreshadowing)
  result = solve(100_000, True)
  print(f'part 2: {result}')
  # 211712400442661


if PART1 == PART2 == False: solve(5)
if PART1: part1()
if PART2: part2()
