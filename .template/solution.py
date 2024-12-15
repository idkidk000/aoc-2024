#!/usr/bin/env python3

DEBUG = True
FILENAME = 'example.txt'
# FILENAME = 'input.txt'

with open(FILENAME, 'r') as f:
  text = f.read()
if DEBUG: print(f'{text=}')
