#!/usr/bin/env -S deno --allow-read
import { args, debug, Maths } from '../../.template/_/utils.ts';

interface Snailfish {
  left: number | Snailfish;
  right: number | Snailfish;
  parent: Snailfish | undefined;
}

const unparse = (item: Snailfish) => {
  let result = '[';
  const inner = (child: Snailfish): void => {
    if (typeof child.left === 'number') result += `${child.left},`;
    else {
      result += '[';
      inner(child.left);
      result += '],';
    }
    if (typeof child.right === 'number') result += `${child.right},`;
    else {
      result += '[';
      inner(child.right);
      result += '],';
    }
  };
  inner(item);
  result += ']';
  return result.replaceAll(/,\]/g, ']');
};

const tree = (item: Snailfish) => {
  const inner = (child: Snailfish, depth: number): string => {
    return `{
${''.padStart(depth + 2, ' ')}left:${typeof child.left === 'number' ? child.left : inner(child.left, depth + 2)},
${''.padStart(depth + 2, ' ')}right:${typeof child.right === 'number' ? child.right : inner(child.right, depth + 2)},
${''.padStart(depth, ' ')}}`;
  };
  return inner(item, 0);
};

const validateHeirarchy = (items: Array<Snailfish>) => {
  const root = items[0];
  if (root.parent !== undefined) throw new Error(`root has parent ${JSON.stringify(root.parent)}`);
  const inner = (item: Snailfish) => {
    if (typeof item.left !== 'number') {
      if (item.left.parent !== item) {
        console.error(item, item.left);
        throw new Error('parent mismatch');
      }
      inner(item.left);
    }
    if (typeof item.right !== 'number') {
      if (item.right.parent !== item) {
        console.error(item, item.right);
        throw new Error('parent mismatch');
      }
      inner(item.right);
    }
  };
  inner(root);
};

const parseInput = () => {
  const intOrThrow = (value: string): number => {
    const result = parseInt(value);
    if (isNaN(result)) throw new Error(`value=${value} result=${result}`);
    return result;
  };
  // partial doesn't really work without unsafe casting
  interface Builder {
    left?: number | Builder;
    right?: number | Builder;
    parent?: Builder;
  }
  // array per line. per-line 0th is root, elems ordered l->r so we can use Array.find(Last)? with ancestor filtering for neighbours
  const allSnailfishes = new Array<Array<Snailfish>>();
  const factory = (parent?: Builder): Builder => ({ parent });
  for (const line of Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())) {
    const root = factory();
    let current = root;
    const lineSnailfishes = new Array<Builder>(root);
    line
      .matchAll(/(\[|\]|\d+)/gm)
      .toArray()
      .slice(1) // trim the leading [ since we already created the root elem
      .forEach(([_, token]) => {
        if (token === '[') {
          // create new, push to array, parent to prev, assign to prev.left/right
          const prev = current;
          current = factory(prev);
          if (prev.left === undefined) prev.left = current as Snailfish;
          else if (prev.right === undefined) prev.right = current as Snailfish;
          else throw new Error('🤡');
          lineSnailfishes.push(current);
        } else if (token === ']') current = current.parent!;
        else if (current.left === undefined) current.left = intOrThrow(token);
        else if (current.right === undefined) current.right = intOrThrow(token);
        else throw new Error('🤡');
      });
    // debug(1, 'partial', lineSnailfishes[3], unparse(lineSnailfishes[3] as Snailfish));
    validateHeirarchy(lineSnailfishes as Array<Snailfish>);
    allSnailfishes.push(lineSnailfishes as Array<Snailfish>);
  }

  // debug(1, 'cast', allSnailfishes[0][3], unparse(allSnailfishes[0][3]));

  return allSnailfishes;
};

const solve = () => {};

const part1 = () => {
  //BUG somewhere. e2 reduces correctly. e3 adds but does not reduce. must be a parenting problem but i don't see it and dumping to console produces very hard to parse output bc of the circular refs
  const snailfishes = parseInput();

  const add = (left: Array<Snailfish>, right: Array<Snailfish>): Array<Snailfish> => {
    debug(1, 'to add', { left: unparse(left[0]), right: unparse(right[0]) });
    if (left[0].parent !== undefined) throw new Error('left[0] has parent');
    if (right[0].parent !== undefined) throw new Error('right[0] has parent');
    const root = {
      parent: undefined,
      left: left[0],
      right: right[0],
    };
    //BUG here was that i was destructuring left/right[0] and creating new objects
    left[0].parent = root;
    right[0].parent = root;
    const result = [root, ...left, ...right];
    // for (const [i, item] of result.entries()) debug(2, { i, item: unparse(item) });
    const unparented = result.filter((item) => item.parent === undefined);
    if (unparented.length !== 1) {
      console.error(unparented);
      throw new Error(`unparented.length=${unparented.length}`);
    }
    debug(1, 'added', unparse(result[0]));
    validateHeirarchy(result);
    return result;
  };

  const reduce = (items: Array<Snailfish>): Array<Snailfish> => {
    debug(1, 'to reduce', unparse(items[0]));

    const explode = (index: number): void => {
      // item.left and .right are both number and their container has >=3 levels of parents
      debug(3, 'to explode', { index }, unparse(items[0]));

      // assertions for debug and to satisfy ts
      const item = items.at(index)!;
      if (typeof item.left !== 'number' || typeof item.right !== 'number') {
        console.error('left and right must both be numbers', item);
        throw new Error('🤡');
      }
      if (item.parent?.parent?.parent?.parent === undefined) {
        console.error('must have 4 levels of parent', item);
        throw new Error('🤡');
      }

      // add values to neighbour numbers

      // .right of leftNeighbour must be excluded if it's an ancestor
      const ancestors = new Array<Snailfish>();
      let ancestor: Snailfish | undefined = item.parent;
      while (ancestor !== undefined) {
        ancestors.push(ancestor);
        ancestor = ancestor.parent;
      }
      const leftNeighbour = items.findLast(
        (value, i) =>
          i < index &&
          (ancestors.includes(value)
            ? typeof value.left === 'number'
            : typeof value.left === 'number' || typeof value.right === 'number')
      );
      //BUG: this also needs to include the right of ancestors
      const rightNeighbour =
        ancestors.find((value) => typeof value.right === 'number') ??
        items.find((value, i) => i > index && (typeof value.left === 'number' || typeof value.right === 'number'));
      if (leftNeighbour === undefined) {
        debug(4, { leftNeighbour });
      } else {
        debug(
          4,
          {
            leftNeighbourStr: unparse(leftNeighbour),
            ix: items.findIndex((value) => value === leftNeighbour),
            obj: leftNeighbour,
          },
          'tree:',
          tree(leftNeighbour)
        );
      }
      debug(4, 'items[3]:', unparse(items[3]), 'same:', items[3] === leftNeighbour);
      if (rightNeighbour === undefined) {
        debug(4, { rightNeighbour });
      } else {
        debug(
          4,
          {
            rightNeighbourStr: unparse(rightNeighbour),
            ix: items.findIndex((value) => value === rightNeighbour),
            obj: rightNeighbour,
          },
          'tree:',
          tree(rightNeighbour)
        );
      }

      if (leftNeighbour !== undefined) {
        if (typeof leftNeighbour.right === 'number' && !ancestors.includes(leftNeighbour)) leftNeighbour.right += item.left;
        else (leftNeighbour.left as number) += item.left;
      }
      if (rightNeighbour !== undefined) {
        if (typeof rightNeighbour.left === 'number' && !ancestors.includes(rightNeighbour)) rightNeighbour.left += item.right;
        else (rightNeighbour.right as number) += item.right;
      }

      // replace with 0
      const parent = item.parent;
      if (parent.left === item) parent.left = 0;
      else if (parent.right === item) parent.right = 0;
      else {
        console.error('item is not parent.left or parent.right', { item, parent });
        throw new Error('🤡');
      }

      // splice out item
      items.splice(index, 1);

      debug(2, 'exploded', unparse(items[0]));
    };

    const split = (index: number): void => {
      // item.left or .right is number>=10
      // replace number with Snailfish. update item. splice in after item
      debug(3, 'to split', { index, root: unparse(items[0]) });
      const item = items.at(index)!;
      if (!((typeof item.left === 'number' && item.left >= 10) || (typeof item.right === 'number' && item.right >= 10)))
        throw new Error('🤡');
      const value = typeof item.left === 'number' && item.left >= 10 ? item.left : (item.right as number);
      const child: Snailfish = { parent: item, left: Maths.floor(value / 2), right: Maths.ceil(value / 2) };
      if (typeof item.left === 'number' && item.left >= 10) item.left = child;
      else item.right = child;
      items.splice(index + 1, 0, child);
      debug(2, 'split', unparse(items[0]));
    };

    // loop until no more items can be exploded or split
    let changed = true;
    let reduced = false;
    while (changed) {
      changed = false;
      if (
        items.find(
          (item) => (typeof item.left === 'number' && item.left >= 50) || (typeof item.right === 'number' && item.right >= 50)
        )
      ) {
        console.error('value too high', items[0]);
        throw new Error('🤡');
      }
      if (items.filter((item) => item.parent === undefined).reduce((acc, _) => acc + 1, 0) > 1) {
        console.error('too many unparented', items[0]);
        throw new Error('🤡');
      }
      const explodableIx = items.findIndex(
        (item) =>
          typeof item.left === 'number' && typeof item.right === 'number' && item.parent?.parent?.parent?.parent !== undefined
      );
      debug(2, { explodableIx });
      if (explodableIx > -1) {
        explode(explodableIx);
        changed = true;
      } else {
        const splittableIx = items.findIndex(
          (item) => (typeof item.left === 'number' && item.left >= 10) || (typeof item.right === 'number' && item.right >= 10)
        );
        debug(2, { splittableIx });
        if (splittableIx > -1) {
          split(splittableIx);
          changed = true;
        }
      }
      if (changed) reduced = true;
    }
    debug(1, { reduced }, unparse(items[0]));
    return items;
  };

  const result = snailfishes.reduce((acc, item) => reduce(add(acc, item)));
  console.log(unparse(result[0]));
};

const part2 = () => {};

if (args.part1) part1();
if (args.part2) part2();
