#!/usr/bin/env python3
import os
import re
import subprocess
import sys
import time

DIR_REGEX = re.compile(r'^\./20[\d]{2}/day\d{2}$')
SEARCH = sys.argv[1:] if len(sys.argv) > 1 else []
FILE_PREFIX = 'solution'

times: dict[str, float] = {}

#FIXME: some stuff defaults to example.txt and needs -i arg; some don't handle -i arg

for dir_path, dir_names, file_names in sorted(os.walk('.')):
  if not re.match(DIR_REGEX, dir_path): continue
  for file_name in file_names:
    if not file_name.startswith(FILE_PREFIX): continue
    file_path = os.path.join(dir_path, file_name)
    if not all(x in file_path for x in SEARCH): continue
    cmd = []
    match file_name.split('.')[-1]:
      case 'ts' | 'py':
        cmd = [file_name]
      case 'go':
        cmd = [FILE_PREFIX + '_go']
        subprocess.run(['go', 'build', '-o', cmd[0], file_name], cwd=dir_path)
      case 'cpp':
        cmd = [FILE_PREFIX + '_cpp']
        subprocess.run(['g++', '-std=c++23', file_name, '-o', cmd[0]], cwd=dir_path)
      case _:
        raise RuntimeError(f'unhandled {file_path}')
    started = time.monotonic()
    subprocess.run(cmd, cwd=dir_path)
    duration = time.monotonic() - started
    times[file_path] = duration
    print(f'{file_path} {duration:,.3f}s\n')

for k, v in sorted(times.items(), key=lambda x: x[1]):
  print(f'  {k} {v:,.3f}s')

print(f'\ntotal: {len(times.keys())} files; {sum(times.values()):,.3f}s')
