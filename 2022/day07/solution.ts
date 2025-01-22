#!/usr/bin/env -S deno --allow-read
// #region base aoc template
class Args {
  constructor(public filename = 'input.txt', public debug = 0, public part1 = true, public part2 = true) {
    for (const arg of Deno.args) {
      const [key, value] = [arg.slice(0, 2), (fallback = 0) => Number(arg.slice(2) || fallback)];
      if (key === '-d') debug = value(1);
      else if (key === '-e') filename = `example${arg.slice(2)}.txt`;
      else if (key === '-i') filename = 'input.txt';
      else if (key === '-p') [part1, part2] = [(value(0) & 1) === 1, (value(0) & 2) === 2];
      else throw new Error(`unrecognised arg="${arg}"`);
    }
    [this.filename, this.debug, this.part1, this.part2] = [filename, debug, part1, part2];
    console.log(`args: {filename: "${filename}", debug: ${debug}, part1: ${part1}, part2: ${part2} }`);
  }
}

// deno-lint-ignore no-explicit-any
const debug = (level: number, ...data: any[]) => {
  if (args.debug >= level) console.debug(...data);
};

const args = new Args();
// #endregion

interface CommandRecord {
  command: Array<string>;
  output: Array<Array<string>>;
}

const parseInput = () => {
  const data = new Array<CommandRecord>();
  Deno.readTextFileSync(args.filename)
    .split('\n')
    .filter((line) => line.trim())
    .forEach((line) => {
      if (line.startsWith('$ ')) data.push({ command: line.slice(2).split(/\s+/), output: new Array<Array<string>>() });
      else data.findLast(() => true)!.output.push(line.split(/\s+/));
    });
  return data;
};

enum FSObjectType {
  Directory = 0,
  File = 1,
}
interface FSObject {
  type: FSObjectType;
  size: number;
  depth: number;
}

const mapFilesystem = (commands: CommandRecord[]) => {
  const fileSystem = new Map<string, FSObject>([['', { depth: 0, size: 0, type: FSObjectType.Directory }]]);
  let currentDirectory = new Array<string>();
  const walk = (command: CommandRecord) => {
    if (command.command[0] === 'cd') {
      if (command.command[1] === '..') currentDirectory.pop();
      else if (command.command[1].startsWith('/')) currentDirectory = command.command[1].split('/').filter((item) => item !== '');
      else currentDirectory.push(command.command[1]);
    } else if (command.command[0] === 'ls') {
      for (const item of command.output) {
        const itemPath = '/' + [...currentDirectory, item[1]].join('/');
        const itemSize = item[0] === 'dir' ? 0 : Number(item[0]);
        const itemType = item[0] === 'dir' ? FSObjectType.Directory : FSObjectType.File;
        fileSystem.set(itemPath, { type: itemType, size: itemSize, depth: currentDirectory.length + 1 });
      }
    } else throw new Error('bruh');
    debug(2, { command, currentDirectory, fileSystem });
  };
  for (const command of commands) walk(command);
  return fileSystem;
};

const calcTreeSizes = (fileSystem: Map<string, FSObject>) =>
  new Map<string, number>(
    [...fileSystem.entries()]
      .filter(([_, v]) => v.type === FSObjectType.Directory)
      .map(([path, _]) => {
        const treeSize = fileSystem
          .entries()
          .filter(([k, v]) => k.startsWith(`${path}/`) && v.type === FSObjectType.File)
          .reduce((acc, [_, item]) => acc + item.size, 0);
        return [path, treeSize];
      })
  );

const part1 = () => {
  const commands = parseInput();
  const fileSystem = mapFilesystem(commands);
  const treeSizes = calcTreeSizes(fileSystem);
  const total = treeSizes
    .values()
    .filter((item) => item <= 100000)
    .reduce((acc, item) => acc + item, 0);
  console.log('part 1:', total);
};

const part2 = () => {
  const commands = parseInput();
  const fileSystem = mapFilesystem(commands);
  const treeSizes = calcTreeSizes(fileSystem);
  const spaceRequired = 30000000;
  const spaceTotal = 70000000;
  const spaceUsed = treeSizes.get('')!;
  const spaceDelete = spaceUsed + spaceRequired - spaceTotal;
  const toDelete = treeSizes
    .entries()
    .toArray()
    .toSorted((a, b) => a[1] - b[1])
    .filter(([_, size]) => size >= spaceDelete)[0];
  debug(1, { spaceRequired, spaceTotal, spaceUsed, spaceDelete, toDelete });
  console.log('part 2', toDelete[1]);
};

if (args.part1) part1();
if (args.part2) part2();
