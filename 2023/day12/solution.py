#!/usr/bin/env python3
import sys

# yapf: disable
sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

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

def debug(level: int, *args, **kwargs):
  if level < DEBUG: print(*args, **kwargs)
#yapf: enable

with open(FILENAME, 'r') as f:
  records = [(parts[0], tuple(map(int, parts[1].split(',')))) for x in f.read().splitlines() if (parts := x.split())]

arrangement_cache: dict[tuple[str, tuple[int, ...]], int] = {}
def count_arrangements(data: str, checksum: tuple[int, ...]) -> int:
  cache_key = (data, checksum)
  if cache_key in arrangement_cache.keys(): return arrangement_cache[cache_key]
  debug(1, f'{data=} {checksum=}')
  OPERATIONAL = '.'
  DAMAGED = '#'
  INDETERMINATE = '?'
  # checksum is contiguous damaged counts

  # return immediately on empty data
  if len(data) == 0 and len(checksum) == 0: return 1  # the previous data was consumed by the previous checksum
  if len(data) == 0: return 0  # no data with checksum is impossible

  # return immediately on empty checksum
  if len(checksum) == 0 and DAMAGED in data: return 0  # no checksum and damaged data is impossible
  if len(checksum) == 0: return 1  # data must be all operational

  # otherwise, recursion time
  count = 0

  # indeterminate matches both cases
  if data[0] in [OPERATIONAL, INDETERMINATE]:
    count += count_arrangements(data[1:], checksum)

  if data[0] in [DAMAGED, INDETERMINATE]:
    if checksum[0] > len(data): pass  # data[0] is damaged so we must have checksum[0] damaged chars
    elif OPERATIONAL in data[:checksum[0]]: pass
    elif checksum[0] == len(data) or data[checksum[0]] != DAMAGED:  # fits
      count += count_arrangements(data[checksum[0] + 1:], checksum[1:])

  arrangement_cache[cache_key] = count
  return count


def part1():
  debug(2, records)
  total = sum(count_arrangements(*x) for x in records)
  print(f'part 1: {total}')
  # 7922


def part2():
  total = 0
  for i, (data, checksum) in enumerate(records):
    value = count_arrangements('?'.join([data] * 5), checksum * 5)
    debug(0, f'[{i+1}/{len(records)}] {value}')
    total += value
  print(f'part 2: {total}')
  # 18093821750095


if PART1: part1()
if PART2: part2()
