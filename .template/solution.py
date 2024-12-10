#!/usr/bin/env python3

DEBUG = True
EXAMPLE = True

with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  text = f.read()
if DEBUG: print(f'{text=}')
