#!/usr/bin/env python3
import sys
from collections import defaultdict
from itertools import combinations
from random import choice as randomchoice
from typing import TypedDict

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
  data = {parts[0]: {*parts[1].split()} for line in f.read().splitlines() if (parts := line.split(': '))}


def karger_min_cut(edges: list[tuple[str, str]]):

  class ContractedElem(TypedDict):
    parent: str
    rank: int

  contracted: dict[str, ContractedElem] = {y: {'parent': y, 'rank': 0} for x in edges for y in x}

  def get_parent_id(vertex_id: str) -> str:
    # recursively find the parent of vertex_id
    if contracted[vertex_id]['parent'] != vertex_id:
      contracted[vertex_id]['parent'] = get_parent_id(contracted[vertex_id]['parent'])
    return contracted[vertex_id]['parent']

  remain_count = len(contracted) - 2
  while remain_count:
    # non-deterministic ugh
    edge = randomchoice(edges)

    left = get_parent_id(edge[0])
    right = get_parent_id(edge[1])
    if left == right: continue

    # parent one to the other based on rank
    rank_diff = contracted[left]['rank'] - contracted[right]['rank']
    if rank_diff < 0:
      contracted[left]['parent'] = right
    elif rank_diff > 0:
      contracted[right]['parent'] = left
    else:
      contracted[right]['parent'] = left
      contracted[left]['rank'] += 1

    remain_count -= 1

  cuts = [x for x in edges if get_parent_id(x[0]) != get_parent_id(x[1])]
  debug(1, f'{cuts=}')
  return cuts


def part1_2():
  # i looked up kargers min cut algo
  edges = []
  for left, rights in data.items():
    for right in rights:
      edges.append((left, right))
      # edge A,B == edge B,A
      # # edges.append((right,left))
  cuts: list[tuple[str, str]] = []
  # cuts=[('xzz', 'kgl'), ('xxq', 'hqq'), ('vkd', 'qfb')]
  while len(cuts) != 3:  # annoying
    cuts = karger_min_cut(edges)
  debug(0, f'3 cuts: {cuts}')

  # edges is not the best format for mapping so refactor
  connections: dict[str, set[str]] = defaultdict(set)
  for k, v in data.items():
    connections[k].update(v)
    for n in v:
      connections[n].add(k)
  # remove the cuts
  for cut in cuts:
    connections[cut[0]].remove(cut[1])
    connections[cut[1]].remove(cut[0])

  def map_network(start_node: str):
    found_nodes: set[str] = set()

    def map_nodes(from_node: str):
      if from_node in found_nodes: return
      found_nodes.add(from_node)
      for to_node in connections[from_node]:
        map_nodes(to_node)

    map_nodes(start_node)
    debug(0, f'{start_node=} {len(found_nodes)=}')
    return found_nodes

  all_nodes = {x for x in data.keys()}
  all_nodes.update(y for x in data.values() for y in x)
  debug(0, f'{len(all_nodes)=}')

  network_a = map_network(list(all_nodes)[0])
  network_b = map_network(list(all_nodes.difference(network_a))[0])
  print(f'part 1: {len(network_a)*len(network_b)}')

  # 514794


def part1():
  # connections are bidir so refactor as an l1 node map
  connections: dict[str, set[str]] = defaultdict(set)
  for k, v in data.items():
    connections[k].update(v)
    for n in v:
      connections[n].add(k)
  debug(0, f'{data=}')
  debug(0, f'{connections=}')
  if DEBUG > 0:
    for k, v in connections.items():
      debug(0, f'{k=} {v=}')

  nodes = {*connections.keys()}

  # i think do a full depth walk from each node to each other node. probably quite slow so use memoisation. return all the routes between each pair of nodes
  # split the routes into from<->to (key as sorted tuple to avoid duplication) and put in a counter
  # i think that should give the counts of how many full depth conections depend upon each l1 connection. but each is allowed up to two additional backup routes which complicates things
  # could loop over each combination of 3 connections, sever, and walk. would need manual memoisation since we'd need to discard the cache for each new combination. and it would be incredibly slow.

  #TODO: check there's no scope for duplication here. sorting the tuple would avoid it
  connections_pairs: set[tuple[str, str]] = set()
  for left, rights in data.items():
    for right in rights:
      connections_pairs.add((left, right))

  accessible_count: dict[tuple[tuple[str, str], tuple[str, str], tuple[str, str]], int] = {}

  def find_cut() -> tuple[tuple[str, str], tuple[str, str], tuple[str, str]]:
    for c0, c1, c2 in combinations(connections_pairs, 3):
      # build a connection map, remove c0,1,2
      # pick a node, map how many it can connect to with a recursive function
      # store result in a dict with c0,1,2 as key, count as val
      # this will probably be VERY slow
      debug(0, f'cut {c0}, {c1}, {c2}')
      test_connections = {k: {*v} for k, v in connections.items()}
      for left, right in [c0, c1, c2]:
        test_connections[left].remove(right)
        test_connections[right].remove(left)
      start_node = list(test_connections.keys())[0]
      debug(1, f'{test_connections=}')
      debug(1, f'{start_node=}')
      group: set[str] = set()

      def count_accessible(from_node: str) -> int:
        if from_node in group: return 0
        group.add(from_node)
        count = 1
        for to_node in test_connections[from_node]:
          count += count_accessible(to_node)
        return count

      count = count_accessible(start_node)
      debug(1, f'{c0}, {c1}, {c2} {count=}')
      accessible_count[(c0, c1, c2)] = count
      #BUG: actually this falls over if the first c0,1,2 combo is the best
      # if len(accessible_count) and count<max(accessible_count.values()):
      #   debug(0,f'best {c0}, {c1}, {c2} {count=}')
      #   break
      if len(accessible_count) and any(x != count for x in accessible_count.values()):
        lowest = min(accessible_count.values())
        for k, v in accessible_count.items():
          if v == lowest:
            debug(0, f'best {k} {count=}')
            return k
    assert False

  # this works on the example but it's definitely not efficient
  cuts = find_cut()
  # ok now we can make the cuts and do a network walk to find the two groups
  # the answer is the product of their lens

  test_connections = {k: {*v} for k, v in connections.items()}
  for left, right in cuts:
    test_connections[left].remove(right)
    test_connections[right].remove(left)

  # use the exact same selection logic for the first start_node as the find_cut function. the second start_node can be any node which exists in test_connections.keys() but not in our found nodes
  def map_network(start_node: str):
    found_nodes: set[str] = set()

    def map_nodes(from_node: str):
      if from_node in found_nodes: return
      found_nodes.add(from_node)
      for to_node in test_connections[from_node]:
        map_nodes(to_node)

    map_nodes(start_node)
    return found_nodes

  network_a = map_network(list(test_connections.keys())[0])
  network_b = map_network(list(set(test_connections.keys()).difference(network_a))[0])
  debug(0, f'{len(network_a)=} {network_a=}')
  debug(0, f'{len(network_b)=} {network_b=}')
  print(f'part 1: {len(network_a)*len(network_b)}')

  # yep this is far too inneficient for the actual input
  # maybe i can map all nodes to all nodes and do a dict of each l1 connection and the count of times used

  # thinkier solution:
  # https://en.wikipedia.org/wiki/Karger%27s_algorithm


# if PART1: part1()
if PART1: part1_2()
