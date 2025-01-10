#!/usr/bin/env python3
import sys
from functools import cache
sys.setrecursionlimit(1_000_000)
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
  records=[
    (
      parts[0],
      tuple(int(x) for x in parts[1].split(','))
    )
    for line in f.read().splitlines()
    if len(parts:=line.split(' '))==2
  ]

@cache
def gen_checksum(data:str)->tuple[int,...]:
  lchecksum=[]
  for p,v in zip('.'+data,data):
    if v=='#':
      if p=='.': lchecksum+=[1]
      else: lchecksum[-1]+=1
  return tuple(lchecksum)

@cache
def count_combos(data:str,target:tuple[int])->int:
  # i can't imagine that memoising this is helping at all, but i can't think of a way to break it into smaller work items since the whole of data and the whole of target are necessary
  count=0
  unknown_ixs=[i for i,x in enumerate(data) if x=='?']
  ldata=list(data)
  for c in range(2**len(unknown_ixs)):
    #two possible values for each
    for i,ix in enumerate(unknown_ixs):
      ldata[ix]='#' if (c>>i)&1 else '.'
    checksum=gen_checksum(''.join(ldata))
    if DEBUG>1: print(f'''{c=} data={''.join(ldata)} {checksum=} {target=}''')
    if checksum==target: count+=1
  return count

@cache
def count_combos2(data:str,target:tuple[int])->int:
  #hyperneutrino method
  #TODO: need to come back to this and understand it properly
  if data=='': return 1 if target==() else 0
  if target==(): return 0 if '#' in data else 1

  result=0
  if data[0] in ['.','?']:
    result += count_combos2(data[1:], target)
  if data[0] in ['#','?']:
    if target[0] <= len(data) and '.' not in data[:target[0]] and (target[0] == len(data) or data[target[0]] != '#'):
      result += count_combos2(data[target[0] + 1:], target[1:])

  return result


def part1():
  if DEBUG>1: print(f'{records=}')
  total=0
  for data,target in records:
    record_total=count_combos2(data,target)
    if DEBUG>0: print(f'{data=} {target=} {record_total=}')
    total+=record_total
  print(f'part 1: {total}')

def part2():
  if DEBUG>1: print(f'{records=}')
  total=0
  for data,target in records:
    data='?'.join([data]*5)
    target*=5
    record_total=count_combos2(data,target)
    if DEBUG>0: print(f'{data=} {target=} {record_total=}')
    total+=record_total
  print(f'part 2: {total}')


if PART1: part1()
if PART2: part2()
