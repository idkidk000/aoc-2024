#!/usr/bin/env python3

#type: ignore
import json

# sheets is not great tbh
with open('data.txt') as f:
  data=[
    {
      'input':int(parts[0]),
      'output':int(parts[1]),
      'delta1':int(parts[2]) if len(parts)>2 else None,
      'delta2':int(parts[3]) if len(parts)>3 else None,
    }
    for line in f.read().splitlines()[1:]
    if (parts:=line.split())
  ]

# print(json.dumps(data,indent=2))
# with open('data.json','w') as f:
#   json.dump(data,f)

for item in data:
  a = 4
  b = -4
  n=item['input']
  output = a * n**2 +b
  print(f'{item=} {output=}')
  assert output==item['output']