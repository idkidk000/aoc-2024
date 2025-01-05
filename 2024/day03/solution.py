#!/usr/bin/env python3
import re

DEBUG = False

with open('input.txt', 'r') as f:
  data = f.read()

parsed = re.findall(r'mul\(([0-9]+),([0-9]+)\)', data)
# print(f'{parsed=}')
total = 0
for args in parsed:
  total += int(args[0]) * int(args[1])
print(f'part 1 {total=}')

parsed = re.findall(r'''(do\(\)|don't\(\)|mul\(([0-9]+),([0-9]+)\))''', data)
# print(f'{parsed=}')
enable = True
total = 0
for item in parsed:
  if DEBUG: print(f'{item=}')
  match item[0]:
    case 'do()':
      enable = True
    case '''don't()''':
      enable = False
    case _:
      if enable:
        total += int(item[1]) * int(item[2])
print(f'part 2 {total=}')
