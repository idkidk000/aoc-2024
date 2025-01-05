#!/usr/bin/env python3


class Coord():

  def __init__(self, row: int, col: int):
    self._val = (row, col)

  def __add__(self, other):
    if isinstance(other, Coord):
      return Coord(
        self[0] + other[0],
        self[1] + other[1],
      )
    elif isinstance(other, (int, float)):
      return Coord(
        self[0] + other,
        self[1] + other,
      )
    else:
      raise TypeError('operand must be a coord, int, or float')

  def __mul__(self, other):
    if isinstance(other, Coord):
      return Coord(
        self[0] * other[0],
        self[1] * other[1],
      )
    elif isinstance(other, (int, float)):
      return Coord(
        self[0] * other,
        self[1] * other,
      )
    else:
      raise TypeError('operand must be a coord, int, or float')

  def __sub__(self, other):
    if isinstance(other, Coord):
      return Coord(
        self[0] - other[0],
        self[1] - other[1],
      )
    elif isinstance(other, (int, float)):
      return Coord(
        self[0] - other,
        self[1] - other,
      )
    else:
      raise TypeError('operand must be a coord, int, or float')

  def __hash__(self):
    return self._val.__hash__()

  def __eq__(self, other):
    return self._val.__hash__() == other._val.__hash__()

  def __getitem__(self, ix: int):
    return self._val[ix]

  def __repr__(self):
    return self._val.__repr__()

  def simplify(self):
    abs_vals = [abs(self._val[0]), abs(self._val[1])]
    large, small = (max(abs_vals), min(abs_vals))
    while (remainder := large % small):
      large, small = (max(small, remainder), min(small, remainder))
    gcd = small
    return Coord(
      self._val[0] // gcd,
      self._val[1] // gcd,
    )


def draw_map(rows: int, cols: int, freq_map: dict, freq: str, props: list[str]):
  print()
  for ix_row in range(rows):
    line = ''
    for ix_col in range(cols):
      coord = Coord(ix_row, ix_col)
      if coord in freq_map['antennas']:
        line += freq
      elif any(coord in freq_map[x] for x in props):
        line += '#'
      else:
        line += '.'
    print(line)


with open('input.txt', 'r') as f:
  data = [list(x) for x in f.read().splitlines()]

count_rows = len(data)
count_cols = len(data[0])

freq_maps = {
  frequency: {
    'antennas': {
      Coord(ix_row, ix_col)
      for ix_row in range(count_rows)
      for ix_col in range(count_cols)
      if data[ix_row][ix_col] == frequency
    },
    'antinodes': set(),
    'antinodes_2': set(),
  }
  for frequency in {col
                    for row in data
                    for col in row}
  if frequency != '.'
}

# part 1 antinodes
for freq, freq_map in freq_maps.items():
  for antenna_a in freq_map['antennas']:
    for antenna_b in freq_map['antennas']:
      if antenna_a == antenna_b: continue
      antinode_a = antenna_a - (antenna_b - antenna_a)
      antinode_b = antenna_b - (antenna_a - antenna_b)
      for antinode in (antinode_a, antinode_b):
        if 0 <= antinode[0] < count_rows and 0 <= antinode[1] < count_cols:
          # print(f'{freq=} {antinode=}')
          freq_map['antinodes'].add(antinode)

for freq, freq_map in freq_maps.items():
  draw_map(count_rows, count_cols, freq_map, freq, ['antinodes'])

antinodes = {c for m in freq_maps.values() for c in m['antinodes']}

# print(f'{antinodes=}')
print(f'part 1 {len(antinodes)=}')

# part 2 antinodes
for freq, freq_map in freq_maps.items():
  for antenna_a in freq_map['antennas']:
    for antenna_b in freq_map['antennas']:
      if antenna_a == antenna_b: continue
      for antenna, delta in (
        (antenna_a, (antenna_b - antenna_a).simplify()),
        (antenna_b, (antenna_a - antenna_b).simplify()),
      ):
        multiplier = 1
        while True:
          antinode = antenna + (delta * multiplier)
          if 0 <= antinode[0] < count_rows and 0 <= antinode[1] < count_cols:
            # print(f'{freq=} {antinode=}')
            freq_map['antinodes_2'].add(antinode)
            multiplier += 1
          else:
            break

for freq, freq_map in freq_maps.items():
  draw_map(count_rows, count_cols, freq_map, freq, ['antinodes_2'])

antinodes2 = {c for m in freq_maps.values() for c in m['antinodes_2']}
print(f'part 2 {len(antinodes2)=}')
