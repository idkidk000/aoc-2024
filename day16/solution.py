#!/usr/bin/env python3

DEBUG = True
FILENAME = 'example.txt'
# FILENAME = 'input.txt'


class Path():

  def __init__(self, origin: tuple[int, int], target: tuple[int, int], direction: int, rows: int, cols: int):
    self._origin = origin
    self._target = target
    self._position = origin
    self._start_direction = direction
    self._direction = direction
    self._rows = rows
    self._cols = cols
    self._pos_history = {origin}
    self._pos_dir_history = {(*origin, direction)}
    self._cost = 0
    self._complete = False
    self._moves = 1

  @property
  def origin(self):
    return self._origin

  @property
  def target(self):
    return self._target

  @property
  def start_direction(self):
    return self._start_direction

  @property
  def direction(self):
    return self._direction

  @property
  def cost(self):
    return self._cost

  @property
  def position(self):
    return self._position

  @property
  def complete(self):
    return self._position == self._target

  def rotate(self, clockwise: bool) -> bool:
    new_dir = (self._direction + (1 if clockwise else -1)) % 4
    pos_dir = (
      self._position[0],
      self._position[1],
      new_dir,
    )
    if DEBUG: print(f'{pos_dir=} {self._position=} {self._direction=} {self._pos_dir_history} {self._origin}')
    if pos_dir in self._pos_dir_history:
      return False
    self._direction = new_dir
    self._pos_dir_history.add(pos_dir)
    self._cost += 1000
    return True

  def move(self) -> bool:
    direc = self._direction
    new_row = self._position[0] + (-1 if direc == 0 else 1 if direc == 2 else 0)
    new_col = self._position[1] + (-1 if direc == 3 else 1 if direc == 1 else 0)
    pos = (new_row, new_col)
    if pos in self._pos_history or not (0 <= new_row < self._rows and 0 <= new_col < self._cols):
      return False
    self._position = pos
    self._pos_history.add(pos)
    self._cost += 1
    self._moves += 1
    assert len(self._pos_history) == self._moves

    return True

  def clone(self):
    new_path = Path(self._origin, self._target, self._start_direction, self._rows, self._cols)
    new_path._pos_history = {x for x in self._pos_history}
    new_path._cost = self._cost
    print(f'    clone {id(self)} => {id(new_path)}')
    return new_path

  def __repr__(self):
    return f'<Path complete={self._complete} position={self._position} direction={self._direction} cost={self._cost} pos_hist={self._pos_history} pos_dir_dir={self._pos_dir_history}>'


with open(FILENAME, 'r') as f:
  text = f.read()
# if DEBUG: print(f'{text=}')
map_data = [list(x) for x in text.splitlines()]
rows = len(map_data)
cols = len(map_data[0])
if DEBUG:
  for r in range(rows):
    print(f'''{r: 3d}  {''.join(map_data[r])}''')
  print(f'{rows=} {cols=}')

start_at = end_at = None
for r in range(rows):
  for c in range(cols):
    match map_data[r][c]:
      case 'S':
        start_at = (r, c)
      case 'E':
        end_at = (r, c)

assert start_at is not None and end_at is not None


def walk_maze(map_data: list[list[str]], paths: list[Path]) -> list[Path]:
  if DEBUG: print('walk_maze')
  new_paths: list[Path] = []
  any_moved = False
  for path in paths:
    if DEBUG: print(f'  {path}')
    if path.complete:
      new_paths.append(path)
    else:
      for i in range(3):
        new_path = path.clone()
        match i:
          case 0:
            success = new_path.rotate(False)
          case 1:
            success = new_path.rotate(True)
          case 2:
            success = new_path.move()
        if DEBUG: print(f'    {i=} {success=}')
        if success:
          any_moved = True
          new_paths.append(new_path)
  if not any_moved:
    return paths
  return walk_maze(map_data, new_paths)


paths = walk_maze(
  map_data,
  [Path(start_at, end_at, 1, rows, cols)],
)
for path in paths:
  print(f'{path=}')
