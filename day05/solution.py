#!/usr/bin/env python3

with open('input.txt', 'r') as f:
  data = f.read()

sections = data.split('\n\n')
rules = [list(map(int, x.split('|'))) for x in sections[0].splitlines()]
updates = [list(map(int, x.split(','))) for x in sections[1].splitlines()]

# print(f'{rules=}')
# print(f'{updates=}')

sum_middle = 0
unsorted_updates = []
for update in updates:
  correct_order = True
  for rule in rules:
    if rule[0] in update and rule[1] in update:
      if update.index(rule[0]) > update.index(rule[1]):
        correct_order = False
        break
  if correct_order:
    sum_middle += update[int((len(update) - 1) / 2)]
  else:
    unsorted_updates.append(update)
print(f'part 1 {sum_middle=}')

sum_middle = 0
for update in unsorted_updates:
  orig = [*update]
  moved = True
  while moved:
    moved = False
    for rule in rules:
      if rule[0] in update and rule[1] in update:
        if update.index(rule[0]) > update.index(rule[1]):
          temp = [x for x in update if x != rule[0]]
          temp.insert(temp.index(rule[1]), rule[0])
          print(f'move {rule[0]} before {rule[1]}')
          update = temp
          moved = True
  print(f'{orig=} {update=}')
  sum_middle += update[int((len(update) - 1) / 2)]
print(f'part 2 {sum_middle=}')
