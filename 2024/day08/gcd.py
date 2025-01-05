#!/usr/bin/env python3


def simplify(val_a: int, val_b: int):
  large = max(val_a, val_b)
  small = min(val_a, val_b)
  remainder = large % small
  while remainder:
    large = max(small, remainder)
    small = min(small, remainder)
    remainder = large % small
  gcd = small
  print(f'{val_a=} {val_b=} {large=} {small=} {gcd=}')
  print(f'{val_a//gcd=} {val_b//gcd=}')
  return (val_a // gcd, val_b // gcd)


simplify(8, 6)
simplify(6, 8)
simplify(3, 4)
simplify(250, 50)
