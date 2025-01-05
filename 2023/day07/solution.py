#!/usr/bin/env python3
import sys
from collections import Counter

sys.setrecursionlimit(1_000_000)
DEBUG = 0
FILENAME = 'input.txt'
PART1 = PART2 = True

for arg in sys.argv[1:]:
  if arg.startswith('-e'): FILENAME = f'''example{arg[2:] if len(arg)>2 else ''}.txt'''
  elif arg.startswith('-d'): DEBUG = int(arg[2:]) if len(arg) > 2 else 1
  else:
    match arg:
      case '-i':
        FILENAME = 'input.txt'
      case '-p1':
        PART1, PART2 = True, False
      case '-p2':
        PART1, PART2 = False, True
      case '-p0':
        PART1, PART2 = False, False
      case _:
        raise Exception(f'unknown {arg=}')

CARD_VALUES = {
  'A': 13,
  'K': 12,
  'Q': 11,
  'J': 10,
  'T': 9,
  '9': 8,
  '8': 7,
  '7': 6,
  '6': 5,
  '5': 4,
  '4': 3,
  '3': 2,
  '2': 1,
}

with open(FILENAME, 'r') as f:
  text = f.read()
# woo lets normalise gambling and also completely misrepresent the chances of winning for some reason
hands = [{'cards': y[0], 'bet': int(y[1])} for x in text.splitlines() if (y := x.split())]


def part1():

  def hand_sort(hand: dict) -> int:
    cards = hand['cards']
    # coarse hand sort
    counter = Counter(cards)
    counts = tuple(sorted(counter.values(), reverse=True))
    match counts:
      case (5,):
        hand_value = 7  # 5 of a kind
      case (4, 1):
        hand_value = 6  # 4 of a kind
      case (3, 2):
        hand_value = 5  # full house
      case (3, 1, 1):
        hand_value = 4  # 3 of a kind
      case (2, 2, 1):
        hand_value = 3  # 2 pair
      case (2, 1, 1, 1):
        hand_value = 2  # 1 pair
      case (1, 1, 1, 1, 1):
        hand_value = 1  #high_card
      case _:
        raise RuntimeError(f'{counts=}')

    # fine card value sort
    # treat each card value as 4 bits for simplicity. so max val here is a 20 bit int, i.e. 1048576
    card_value = 0
    for i, x in enumerate(reversed([CARD_VALUES[x] for x in cards])):
      card_value += x << (i * 4)

    result = (hand_value << 20) + card_value
    bet = hand['bet']
    if DEBUG > 1: print(f'{cards=} {bet=} {hand_value=} card_values={[CARD_VALUES[x] for x in cards]} {result=:,}')

    return result

  hands_sorted = sorted(hands, key=hand_sort, reverse=False)
  if DEBUG > 1: print(f'{hands_sorted=}')
  total = sum((i + 1) * hand['bet'] for i, hand in enumerate(hands_sorted))  #type: ignore
  print(f'part 1: {total=:,}')


def part2():
  REVISED_CARD_VALUES = CARD_VALUES | {'J': 0}
  MAX_VALUE_CARD = sorted(REVISED_CARD_VALUES.items(), key=lambda x: x[1], reverse=True)[0][0]

  def hand_sort(hand: dict) -> int:
    cards = hand['cards']
    # coarse hand sort
    counter = Counter(cards)
    if 'J' in counter.keys():
      joker_count = counter['J']
      del (counter['J'])  #setting to 0 will mess up our tuple matching
      best_cards = sorted(counter.items(), key=lambda x: (x[1], REVISED_CARD_VALUES[x[0]]), reverse=True)
      if best_cards:
        counter[best_cards[0][0]] += joker_count
        if DEBUG > 0: print(f'moved {joker_count=} to {best_cards[0]=}')
      else:
        # 5 jokers
        counter[MAX_VALUE_CARD] += joker_count
        if DEBUG > 0: print(f'moved {joker_count=} to {MAX_VALUE_CARD=}')

    counts = tuple(sorted(counter.values(), reverse=True))
    match counts:
      case (5,):
        hand_value = 7  # 5 of a kind
      case (4, 1):
        hand_value = 6  # 4 of a kind
      case (3, 2):
        hand_value = 5  # full house
      case (3, 1, 1):
        hand_value = 4  # 3 of a kind
      case (2, 2, 1):
        hand_value = 3  # 2 pair
      case (2, 1, 1, 1):
        hand_value = 2  # 1 pair
      case (1, 1, 1, 1, 1):
        hand_value = 1  #high_card
      case _:
        raise RuntimeError(f'{counts=}')

    # fine card value sort
    # treat each card value as 4 bits for simplicity. so max val here is a 20 bit int, i.e. 1048576
    card_value = 0
    for i, x in enumerate(reversed([REVISED_CARD_VALUES[x] for x in cards])):
      card_value += x << (i * 4)

    result = (hand_value << 20) + card_value
    bet = hand['bet']
    if DEBUG > 1:
      print(f'{cards=} {bet=} {hand_value=} card_values={[REVISED_CARD_VALUES[x] for x in cards]} {result=:,}')

    return result

  hands_sorted = sorted(hands, key=hand_sort, reverse=False)
  if DEBUG > 1: print(f'{hands_sorted=}')
  total = sum((i + 1) * hand['bet'] for i, hand in enumerate(hands_sorted))  #type: ignore
  print(f'part 1: {total=:,}')


if PART1: part1()
if PART2: part2()
