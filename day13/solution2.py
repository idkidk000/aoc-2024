#!/usr/bin/env python3

DEBUG = True
EXAMPLE = True

with open('example.txt' if EXAMPLE else 'input.txt', 'r') as f:
  text = f.read()

machines = []
for section in text.lower().replace(' ', '').replace('=', '').split('\n\n'):
  machine = {'buttons': {}}  #type:ignore
  for line in section.splitlines():
    key, vals = line.split(':')
    coords = {val[0]: int(val[1:]) for val in vals.split(',')}
    if key.startswith('button'):
      machine['buttons'][key[-1]] = coords
    else:
      machine['target'] = coords
  machines.append(machine)

offset = 0
for machine in machines[:1]:
  px = machine['target']['x'] + offset
  py = machine['target']['y'] + offset
  ax = machine['buttons']['a']['x']
  ay = machine['buttons']['a']['y']
  bx = machine['buttons']['b']['x']
  by = machine['buttons']['b']['y']

  # swapping the left/right of each subtract gives negatives
  # https://www.bbc.co.uk/bitesize/guides/z9y9jty/revision/1
  # this becomes easier to understand if you remove the bs
  ma = (px * by - py * bx) / (ax * by - ay * bx)
  # remaining distance / lenb
  mb = (px - ma * ax) / bx

  print(f'{px=} {py=} {ax=} {ay=} {bx=} {by=} {ma=} {mb=}')
