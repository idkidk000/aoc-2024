#!/usr/bin/env python3
import sys
import re
from collections import deque

DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i':
        FILENAME = 'input.txt'
      case '-p1':
        PART1, PART2 = True, False
      case '-p2':
        PART1, PART2 = False, True
      case '-p0':
        PART1, PART2 = False, False
      case _:
        raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  text = f.read()
seeds = [int(x) for x in text.splitlines()[0].split(': ')[1].split()]
mappings = {}
section_regex = re.compile(r'^(\w+)-to-(\w+) map:((?:\n\d+ \d+ \d+)+)', re.MULTILINE)
line_regex = re.compile(r'^(\d+) (\d+) (\d+)$', re.MULTILINE)
for section in re.finditer(section_regex, text):
  if DEBUG > 1: print(f'{section.group(1)} -> {section.group(2)}')
  section_mappings = []
  for line in re.finditer(line_regex, section.group(3)):
    source_start = int(line.group(2))
    dest_start = int(line.group(1))
    length = int(line.group(3))
    section_mapping = {
      'start': source_start,
      'end': source_start + length - 1,
      'offset': dest_start - source_start,
    }
    section_mappings += [section_mapping]
    if DEBUG > 1: print(f'  {line.group(1)} {line.group(2)} {line.group(3)} {section_mapping=}')
  mappings[(section.group(1), section.group(2))] = sorted(section_mappings, key=lambda x: x['start'])
if DEBUG > 1: print(f'{mappings=}')
order = {x[0]: x[1] for x in mappings.keys()}
if DEBUG > 1: print(f'{order=}')


def part1():

  def convert(from_type: str, to_type: str, value: int) -> int:
    for mapping in mappings[(from_type, to_type)]:
      if value >= mapping['start'] and value <= mapping['end']:
        if DEBUG > 2: print(f'    found {mapping=}')
        return value + mapping['offset']
    return value

  min_val = None
  for seed in seeds:
    val = seed
    if DEBUG > 0: print(f'{seed=}')
    for k, v in order.items():
      val = convert(k, v, val)
      if DEBUG > 0: print(f'  {k}->{v} {val=}')
    if min_val is None or min_val > val: min_val = val
  print(f'part 1: {min_val}')


def part2():

  def convert_range(from_type: str, to_type: str, value_ranges: list[tuple[int, int]]) -> list[tuple[int, int]]:
    type_mappings = mappings[(from_type, to_type)]
    result: list[tuple[int, int]] = []
    queue: deque[tuple[int, int]] = deque(value_ranges)
    mapped = bool(len(queue))
    while len(queue):
      mapped = False
      from_value, to_value = queue.popleft()
      for mapping in type_mappings:
        if mapping['start']<=from_value<=mapping['end'] or \
          mapping['start']<=to_value<=mapping['end']:
          if DEBUG > 1: print(f'  {from_value=} {to_value=} {mapping=}')
          # push mapped ranges onto result
          mapped_from = (max(from_value, mapping['start']), min(to_value, mapping['end']))
          mapped_to = tuple(x + mapping['offset'] for x in mapped_from)
          result.append(mapped_to)  #type: ignore
          if DEBUG > 2: print(f'    mapped {mapped_from=} {mapped_to=}')
          # push unmapped ranges back onto queue
          if from_value < mapping['start']:
            requeue = (from_value, mapping['start'] - 1)
            queue.append(requeue)
            if DEBUG > 2: print(f'    requeued start {requeue}')
          if to_value > mapping['end']:
            requeue = (mapping['end'] + 1, to_value)
            queue.append(requeue)
            if DEBUG > 2: print(f'    requeued end {requeue}')
          # don't evaluate any further type mappings and fetch the next queue item
          mapped = True
          break
      # no matching mapping - append to result
      if not mapped:
        if DEBUG > 2: print(f'  unmapped {from_value=} {to_value=}')
        if DEBUG > 3: print(f'    {from_type=} {to_type=} {type_mappings=}')
        result.append((from_value, to_value))

    if DEBUG > 1:
      print(f'  {value_ranges=}')
      print(f'  {result=}')
    assert len(result)
    return result

  min_val = None
  for seed_start, length in zip(seeds[::2], seeds[1::2]):
    seed_end = seed_start + length - 1
    if DEBUG > 0: print(f'{seed_start=} {length=} {seed_end=}')
    vals = [(seed_start, seed_end)]
    for k, v in order.items():
      if DEBUG > 1: print(f'{k}->{v} {vals=}')
      vals = convert_range(k, v, vals)
    if DEBUG > 1: print(f'final {vals=}')
    seed_min = min(x[0] for x in vals)
    if min_val is None or min_val > seed_min: min_val = seed_min
  print(f'part 2: {min_val}')


if PART1: part1()
if PART2: part2()
