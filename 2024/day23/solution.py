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


def part1():
  # how i did it
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

  count = len([x for x in triplets if any(y.startswith('t') for y in x)])
  print(f'part 1: {count=}')


def part1_2():
  # the "correct" way to do it (the dict of sets code is mine from part 2)
  node_conns: dict[str, set[str]] = {}
  for conn in connections:
    node_a, node_b = conn
    if node_a not in node_conns: node_conns[node_a] = set()
    if node_b not in node_conns: node_conns[node_b] = set()
    node_conns[node_a].add(node_b)
    node_conns[node_b].add(node_a)

  triplets: set[tuple[str, str, str]] = set()
  for node_a, conns in node_conns.items():
    for node_b in conns:
      for node_c in node_conns[node_b]:
        if node_c not in conns: continue
        triplets.add(tuple(sorted((node_a, node_b, node_c))))  #type: ignore

  if DEBUG > 0:
    for triplet in sorted(triplets):
      print(triplet)

  count = len([x for x in triplets if any(y.startswith('t') for y in x)])
  print(f'part 1: {count=}')


def part2():
  node_conns: dict[str, set[str]] = {}
  for conn in connections:
    node_a, node_b = conn
    if node_a not in node_conns: node_conns[node_a] = set()
    if node_b not in node_conns: node_conns[node_b] = set()
    node_conns[node_a].add(node_b)
    node_conns[node_b].add(node_a)

  def walk(node: str, network: set[str]):
    # recursively walk the connections of node and add them to the network if they're fully connected
    for conn in node_conns[node]:
      if conn in network: continue
      if node_conns[conn].issuperset(network):
        network.add(conn)
        walk(conn, network)

  networks = []
  for node, conns in node_conns.items():
    # start with an initial network of the node
    network = {node}
    walk(node, network)
    networks.append(network)

  largest_network = sorted(networks, key=lambda x: len(x), reverse=True)[0]
  if DEBUG > 0: print(f'{largest_network}')
  password = ','.join(sorted(largest_network))
  print(f'part 2: {password=}')


part1()
part1_2()
part2()
