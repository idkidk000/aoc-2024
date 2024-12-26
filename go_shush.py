#!/usr/bin/env python3
# remove "C++ source files not allowed when not using cgo or SWIG: solution.cpp" annoyance

PREFIX = '//go:build ignore\n\n'

import os
for dir_path, dirn_names, file_names in os.walk('.'):
  for file_name in file_names:
    if file_name.endswith('.go'):
      file_path = os.path.join(dir_path, file_name)
      with open(file_path, 'r') as f:
        content = f.read()
      if not content.startswith(PREFIX):
        with open(file_path, 'w') as f:
          f.write(PREFIX + content)
