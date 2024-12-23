#!/usr/bin/env python3
import sys

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'example.txt'

for arg in sys.argv[1:]:
  if arg == '-i': FILENAME = 'input.txt'
  elif arg == '-e': FILENAME = 'example.txt'
  elif arg.startswith('-e'): FILENAME = f'example{arg[-1]}.txt'
  elif arg == '-d': DEBUG = 1
  elif arg == '-d2': DEBUG = 2
  elif arg == '-d3': DEBUG = 3
  else: raise Exception(f'unknown {arg=}')

with open(FILENAME, 'r') as f:
  connections = [x.split('-') for x in f.read().splitlines()]

triplets: list[set[str]] = []
for i, conn in enumerate(connections):
  node_a, node_b = conn
  conns_a: set[str] = set()
  conns_b: set[str] = set()
  for scan in connections[i + 1:]:
    scan_a, scan_b = scan
    if scan_a == node_a: conns_a.add(scan_b)
    elif scan_b == node_a: conns_a.add(scan_a)
    elif scan_a == node_b: conns_b.add(scan_b)
    elif scan_b == node_b: conns_b.add(scan_a)
    else: continue
    intersection = conns_a.intersection(conns_b)
    if len(intersection):
      triplets.append({node_a, node_b, *intersection})
      conns_a.remove(*intersection)
      conns_b.remove(*intersection)

if DEBUG > 0:
  for triplet in sorted(sorted(x) for x in triplets):
    print(triplet)

count = 0
for triplet in triplets:
  if any(x.startswith('t') for x in triplet): count += 1

print(f'part 1: {count=}')
