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


def part1():
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

if PART1: part1()

