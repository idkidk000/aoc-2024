#!/usr/bin/env python3

"""
https://github.com/hyperneutrino/advent-of-code/blob/main/2023/day17p2.py
hyperneutrino p2 solve modified to store path history to help figure out why mine gives the wrong answer

differences:
 she assigns no direction to first queue entry. i assign d=1 (right)
 she performs tile seen validation at the top of the loop. i do it before inserting into the queue

setting initial direction to right (-s param) gives the same incorrect path and answer as mine. idk why. second gen entries should all have n=1 and a direction regardless, and d=0 and d=3 are both oob
example.txt initial direction up (0) gives a good failure mode. it *should* go right but does not, so the loop dies immediately

- both caused by loop condition checking for dr,dc==(0,0) for initial. modified. now gives the correct answer for any starting d. but this points to my bug being with initial turn (it was :) )
"""

from queue import PriorityQueue
import sys

class Path():
  hl: int; r: int; c: int; dr: int; dc: int; n:int; hist:set[tuple[int,int,int]]
  def __init__(self,hl:int,r:int,c:int,dr:int,dc:int,n:int,hist:set[tuple[int,int,int]]=set()):
    self.hl,self.r,self.c,self.dr,self.dc,self.n=hl,r,c,dr,dc,n
    self.hist={*hist}
    self.hist.add((r,c,n))
  def __lt__(self,other): return self.hl<other.hl
  @property
  def key(self): return (self.r,self.c,self.dr,self.dc,self.n)
  @property
  def d(self): return (self.dr,self.dc)
  def __repr__(self): return f'<Path hl={self.hl} r={self.r} c={self.c} dr={self.dr} dc={self.dc} n={self.n}>'


FILENAME = 'input.txt'
START_DIR=-1
D4 = [(-1, 0), (0, 1), (1, 0), (0, -1)]

for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-s') and len(arg)>2: START_DIR=int(arg[2:])
  else: raise Exception(f'unknown {arg=}')

start_dir={i:x for i,x in enumerate(D4)}.get(START_DIR,(0,0))
print(f'{FILENAME=} {START_DIR=} {start_dir=}')

with open(FILENAME, 'r') as f:
  text = f.read()
grid = [[int(y) for y in x] for x in text.splitlines()]
rows, cols = len(grid), len(grid[0])

seen = set()
pq: PriorityQueue[Path]=PriorityQueue()
pq.put(Path(
  0,
  0,
  0,
  start_dir[0],
  start_dir[1],
  0,
))

while pq.qsize():
  path = pq.get()
  print(f'{path=}')

  if path.r == rows - 1 and path.c == cols - 1 and path.n >= 4:
    grid_copy=[[str(y) for y in x] for x in grid]
    for r,c,n in path.hist:
      grid_copy[r][c]=f'\x1b[7;31m{n%10}\x1b[0m'
    for r in range(rows):
      print(f'{r:3d}:',''.join(grid_copy[r]))
    print(f'result: {start_dir=} {path.hl=}')
    break

  if path.key in seen:
    continue

  seen.add(path.key)

  if path.n < 10 and path.d != (0, 0):
    nr = path.r + path.dr
    nc = path.c + path.dc
    if 0 <= nr < rows and 0 <= nc < cols:
      pq.put(Path(
        path.hl+grid[nr][nc],
        nr,
        nc,
        path.dr,
        path.dc,
        path.n+1,
        path.hist,
      ))

  # modified to handle initial direction not being 0,0
  # if path.n >= 4 or path.d == (0, 0):
  if path.n >= 4 or path.hl == 0:
    for ndr, ndc in D4:
      if (ndr, ndc) != path.d and (ndr, ndc) != (-path.dr, -path.dc):
        nr = path.r + ndr
        nc = path.c + ndc
        if 0 <= nr < rows and 0 <= nc < cols:
          pq.put(Path(
            path.hl+grid[nr][nc],
            nr,
            nc,
            ndr,
            ndc,
            1,
            path.hist
          ))
