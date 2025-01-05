#!/usr/bin/env python3

list0 = []
list1 = []
with open('input.txt', 'r') as f:
  for line in f.read().splitlines():
    items = list(map(int, line.split()))
    list0.append(items[0])
    list1.append(items[1])
# print(f'{len(list0)=} {len(list1)=}')
# exit()

list0.sort()
list1.sort()

total = 0
i = 0
for item0, item1 in zip(list0, list1):
  diff = abs(item0 - item1)
  # print(f'{i=} {item0=} {item1=} {diff=}')
  total += diff
  i += 1
print(f'part1 {total=}')

list1_counts = {x: len([y for y in list1 if y == x]) for x in set(list1)}
# print(f'{list1_counts=}')

sim_total = 0
for item in list0:
  item_total = item * list1_counts.get(item, 0)
  sim_total += item_total

print(f'part2 {sim_total=}')
