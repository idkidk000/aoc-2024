#!/usr/bin/env python3
def main():
  with open('output.py.txt') as f:
    py_data = [[float(y) for y in x.split()] for x in f.read().splitlines()]
  with open('output.ts.txt') as f:
    ts_data = [[float(y) for y in x.split()] for x in f.read().splitlines()]

  for py_line, ts_line in zip(py_data, ts_data):
    matched = all(py_item == ts_item for py_item, ts_item in zip(py_line, ts_line))
    if not matched:
      print(f'{py_line} {ts_line}')


if __name__ == '__main__':
  main()
