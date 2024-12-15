#!/usr/bin/env python3

import subprocess
import os

NUM_START = 14088
NUM_END = 20000
DIR = 'maps/'

for i in range(NUM_START, NUM_END + 1):
  num_str = f'{i:05d}'
  py_file = os.path.join(DIR, f'py_{num_str}.txt')
  ts_file = os.path.join(DIR, f'ts_{num_str}.txt')
  output = subprocess.run(
    [
      'md5sum',
      py_file,
      ts_file,
    ],
    text=True,
    capture_output=True,
  ).stdout.splitlines()
  # print(f'{output=}')

  hash_py, hash_ts = [x.split()[0] for x in output]
  if hash_py != hash_ts:
    print(f'{num_str=} {hash_py=} {hash_ts=}')
    with open(py_file, 'r') as f:
      py_text = f.read()
    with open(ts_file, 'r') as f:
      ts_text = f.read()
    for i, (py_char, ts_char) in enumerate(zip(py_text, ts_text)):
      if py_char != ts_char:
        print(f'{i=} {py_char=} {ts_char=}')
    exit()

  if i % 100 == 0:
    print(f'{i=}')
print(f'no mismatch found by {NUM_END=}')
