#!/usr/bin/env -S deno --allow-read
import { args, debug, Maths } from '../../.template/_/utils.ts';

const parseInput = () =>
  Deno.readTextFileSync(args.filename)
    .split('\n')[0]
    .split('')
    .map((char) => parseInt(char, 16).toString(2).padStart(4, '0'))
    .join('');

enum PacketType {
  Sum = 0,
  Product = 1,
  Min = 2,
  Max = 3,
  Literal = 4,
  Greater = 5,
  Less = 6,
  Equal = 7,
}

enum LengthType {
  Length = 0,
  Count = 1,
}

const solve = (input: string) => {
  let index = 0;
  let versionSum = 0;

  const parse = () => {
    let packetLength = 0;

    const take = (count: number) => {
      const value = parseInt(input.slice(index, index + count), 2);
      index += count;
      packetLength += count;
      return value;
    };

    const [packetVersion, packetTypeId] = [take(3), take(3)];
    versionSum += packetVersion;
    debug(2, { packetVersion, packetTypeId });

    if (packetTypeId === PacketType.Literal) {
      // Number is 53 bits but only 32 may be used for bitwise ops
      let [value, final] = [0n, false];
      do {
        final = take(1) === 0;
        value <<= 4n;
        value |= BigInt(take(4));
      } while (!final);
      debug(1, 'literal', { packetLength, value });

      return { length: packetLength, value: Number(value) };
    } else {
      // operator
      const lengthTypeId = take(1);
      const subPacketLength = lengthTypeId === LengthType.Length ? take(15) : -Infinity;
      const subPacketCount = lengthTypeId === LengthType.Count ? take(11) : -Infinity;
      debug(2, 'operator', { subPacketLength, subPacketCount });
      const subValues = new Array<number>();
      let totalSubLength = 0;
      while (subValues.length < subPacketCount || totalSubLength < subPacketLength) {
        const { length: subLength, value } = parse();
        totalSubLength += subLength;
        subValues.push(value);
      }
      debug(1, 'operator', { packetLength, totalSubLength, subValues, subPacketLength, subPacketCount });
      const finalValue =
        packetTypeId === PacketType.Sum
          ? subValues.reduce((acc, item) => acc + item)
          : packetTypeId === PacketType.Product
          ? subValues.reduce((acc, item) => acc * item)
          : packetTypeId === PacketType.Min
          ? Maths.min(...subValues)
          : packetTypeId === PacketType.Max
          ? Maths.max(...subValues)
          : packetTypeId === PacketType.Greater
          ? subValues[0] > subValues[1]
            ? 1
            : 0
          : packetTypeId === PacketType.Less
          ? subValues[0] < subValues[1]
            ? 1
            : 0
          : subValues[0] === subValues[1] //PacketType.Equal
          ? 1
          : 0;

      return { length: packetLength + totalSubLength, value: finalValue };
    }
  };

  const { length, value } = parse();
  return { length, value, versionSum };
};

const part1 = () => {
  const { versionSum } = solve(parseInput());
  console.log('part 1:', Number(versionSum));
};

const part2 = () => {
  const { value } = solve(parseInput());
  console.log('part 2:', Number(value));
};

if (args.part1) part1();
if (args.part2) part2();
