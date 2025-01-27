#!/usr/bin/env python3

# hyperneutrino p1 solve edited for unremarkables
# https://github.com/hyperneutrino/advent-of-code/blob/main/2022/day19p1.py

import re
import math as maths

GEODE = 3


# recipe-based rather than move-based
def dfs(
  blueprint: list[list[tuple[int, int]]], remaining: int, max_cost: list[int], robots: list[int], resources: list[int],
  cache: dict[tuple, int]
):
  if remaining == 0:
    return resources[GEODE]

  # memoise since duplicate states are produced
  key = tuple([remaining, *robots, *resources])
  if key in cache:
    return cache[key]

  # do nothing
  max_geodes = resources[GEODE] + robots[GEODE] * remaining

  for robot_type, recipe in enumerate(blueprint):
    # prune on non-geode robot count >= max_cost - i.e. producing as much as we can use
    if robot_type != GEODE and robots[robot_type] >= max_cost[robot_type]:
      continue

    delay = 0
    for recipe_qty, recipe_material in recipe:
      # prune when we don't have the required production robots
      if robots[recipe_material] == 0:
        break
      # moves required for robots to produce resources to build recipe
      delay = max(delay, maths.ceil((recipe_qty - resources[recipe_material]) / robots[recipe_material]))
    else:
      # the loop *WASN'T* broken (python why are you like this)
      # delay is accumulated per line 39
      next_remaining = remaining - delay - 1
      # prune on not enough remaining
      if next_remaining <= 0:
        continue
      next_robots = [*robots]
      # clone and increment resources per robot production
      next_resources = [x + y * (delay + 1) for x, y in zip(resources, robots)]
      # decrement resources per recipe
      for recipe_qty, recipe_material in recipe:
        next_resources[recipe_material] -= recipe_qty
      # add newly built robot
      next_robots[robot_type] += 1
      # discard excess resources which cannot be used - helps with cache hits
      for i in range(3):
        next_resources[i] = min(next_resources[i], max_cost[i] * next_remaining)
      # call self with next params
      max_geodes = max(max_geodes, dfs(blueprint, next_remaining, max_cost, next_robots, next_resources, cache))

  cache[key] = max_geodes
  return max_geodes


total = 0

for i, line in enumerate(open(0)):
  blueprint = []
  max_cost = [0, 0, 0]
  for section in line.split(": ")[1].split(". "):
    recipe: list[tuple[int, int]] = []
    for material_qty, material_id in re.findall(r"(\d+) (\w+)", section):
      material_qty = int(material_qty)
      material_id = ["ore", "clay", "obsidian"].index(material_id)
      recipe.append((material_qty, material_id))
      max_cost[material_id] = max(max_cost[material_id], material_qty)
    print(f'{recipe=}')
    blueprint.append(recipe)
  print(f'{blueprint=} {max_cost=}')
  max_geodes = dfs(blueprint, 24, max_cost, [1, 0, 0, 0], [0, 0, 0, 0], {})
  total += (i + 1) * max_geodes

print(f'part 1: {total}')
