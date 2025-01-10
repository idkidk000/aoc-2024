#!/usr/bin/env python3
import os
import re
import sys

IGNORE_EXTS = ['txt']
DIR_REGEX = re.compile(r'^\./20[\d]{2}/day\d+$')
GAP = '  '
SEARCH = sys.argv[1] if len(sys.argv) > 1 else ''

files = sorted(os.walk('.'))
all_exts = sorted({
  z[-1] \
  for x in files if re.match(DIR_REGEX, x[0]) \
  for y in x[2] if not y.startswith('.') and len(z:=y.split('.'))>1 and z[-1] not in IGNORE_EXTS
})
for dir_path, dir_names, file_names in files:
  if len(file_names) == 0 or not re.match(DIR_REGEX, dir_path): continue
  if SEARCH not in dir_path: continue
  day = dir_path.removeprefix('./')
  exts = [x.split('.')[-1] for x in file_names if x.startswith('solution.')]
  print(f'''{day}{GAP}{GAP.join([x if x in exts else (' ' * len(x)) for x in all_exts])}''')
