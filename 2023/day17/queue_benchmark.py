#!/usr/bin/env python3

from time import monotonic as now
import sys
from collections import deque
from queue import LifoQueue, PriorityQueue, Queue  #also contains deque which appears to be the same as the deque from collections
from heapq import heappush, heappop
from functools import partial

PRELOAD = 1_000
ITERATIONS = int(sys.argv[1]) if len(sys.argv) > 1 else 10_000_000
DATA = (123, 456)


def test(type, put_method, pop_method):
  obj = type()
  # method lookup is a bit grim
  if callable(put_method): put = partial(put_method, obj)
  else: put = getattr(obj, put_method)
  if callable(pop_method): pop = partial(pop_method, obj)
  elif isinstance(pop_method, tuple): pop = partial(getattr(obj, pop_method[0]), *pop_method[1:])
  else: pop = getattr(obj, pop_method)
  for _ in range(PRELOAD):
    put((*DATA,))
  start = now()
  for _ in range(ITERATIONS):
    # make sure the pop isn't optimised out (is python even that smart?)
    left, right = pop()
    assert left + right != 0
    put((*DATA,))
  end = now()
  print(f'{type.__name__} ({put_method}, {pop_method}): {end-start:,.3f}s')


for x in [
  # not threadsafe, lifo
  (list, 'append', 'pop'),
  # not threadsafe, fifo
  (list, 'append', ('pop', 0)),

  # not threadsafe, lifo
  (deque, 'append', 'pop'),
  # not threadsafe, fifo
  (deque, 'append', 'popleft'),
  # not threadsafe, lifo
  (deque, 'appendleft', 'pop'),
  # not threadsafe, fifo
  (deque, 'appendleft', 'popleft'),

  # not threadsafe, sorted
  (list, heappush, heappop),

  # threadsafe, fifo
  (Queue, 'put', 'get'),
  # threadsafe lifo
  (LifoQueue, 'put', 'get'),
  # threadsafe sorted
  (PriorityQueue, 'put', 'get'),
]:
  test(*x)
