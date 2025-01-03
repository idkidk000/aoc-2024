#include <cassert>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <map>
#include <ostream>
#include <stdexcept>
#include <string>
#include <sys/types.h>
#include <vector>

#pragma region template
struct Args {
  std::string filename = "input.txt";
  int debug = 0;
  bool part1 = true, part2 = true;
};

//std::cout
std::ostream &operator<<(std::ostream &os, const Args &v) {
  return os << v.filename << "; debug=" << v.debug << "; part 1: " << (v.part1 ? "true" : "false")
            << "; part 2: " << (v.part2 ? "true" : "false");
}

Args parseArgs(int argc, char *argv[]) {
  Args args;
  for (int i = 1; i < argc; ++i) {
    const std::string arg = argv[i];
    if (arg.find("-d") == 0)
      args.debug = arg.size() > 2 ? std::stoi(arg.substr(2)) : 1;
    else if (arg.find("-e") == 0)
      args.filename = "example" + (arg.size() > 2 ? arg.substr(2) : "") + ".txt";
    else if (arg.find("-p") == 0 && arg.size() == 3)
      args.part1 = arg.substr(2) == "1", args.part2 = arg.substr(2) == "2";
    else
      throw std::runtime_error("unknown arg: " + arg);
  }
  std::cout << args << "\n";
  return args;
}
#pragma endregion

struct Sequence {
  short a, b, c, d;
  bool operator==(const Sequence &rhs) const { return a == rhs.a && b == rhs.b && c == rhs.c && d == rhs.d; }
  bool operator<(const Sequence &rhs) const {
    return rhs.a != a ? a < rhs.a : rhs.b != b ? b < rhs.b : rhs.c != c ? c < rhs.c : d < rhs.d;
  }
};

std::vector<long> readData(const std::string &filename, const int &debug) {
  std::vector<long> secrets;
  std::ifstream file(filename);
  if (!file.is_open()) throw std::runtime_error("cannot open: " + filename);
  std::string line;
  while (std::getline(file, line)) secrets.push_back(std::stod(line));
  file.close();
  if (debug > 1) {
    for (const auto &secret : secrets) std::cout << secret << "\n";
  }
  return secrets;
}

const long evolve(const long &secret) {
  long result = (secret ^ (secret << 6L)) & 16777215L;
  result = (result ^ (result >> 5L)) & 16777215L;
  return (result ^ (result << 11L)) & 16777215L;
}

void part1(const std::vector<long> &secrets, const int &debug) {
  std::vector<int> printIndices = {0, 9, 10, 11, 99, 100, 101, 1998, 1999};
  long result = 0;
  for (auto secret : secrets) {
    for (int i = 0; i < 2000; ++i) secret = evolve(secret);
    result += secret;
  }
  std::cout << "part 1: " << result << "\n";
}

std::map<Sequence, ushort> genSequencePrices(long secret, const int &debug) {
  /*
    generate values
    declare a map[sequence]price
    step through values with lookback 4
    if sequence in map: continue
    insert sequence:price into map
  */
  const uint count = 2000;
  if (debug > 1) std::cout << std::format("generate values for {}\n", secret);
  ushort value, prevValue;
  std::array<short, count - 1> deltas;
  std::map<Sequence, ushort> result;
  for (uint i = 0; i < count; ++i) {
    secret = evolve(secret);
    value = secret % 10;
    if (i > 1) deltas[i - 1] = value - prevValue;
    if (i > 4) {
      Sequence sequence = {
        deltas[i - 4],
        deltas[i - 3],
        deltas[i - 2],
        deltas[i - 1],
      };
      if (!result.contains(sequence)) result[sequence] = value;
    }
    prevValue = value;
  }
  if (debug > 1) std::cout << std::format("  return size: {}\n", result.size());
  return result;
};

void part2(const std::vector<long> &secrets, const int &debug) {
  /*
    merge per-initial-secret sequence/price map into sequenceTotals
    iterate over and find the key for the highest value
  */
  std::map<Sequence, uint> sequenceTotals;
  for (auto secret : secrets) {
    const auto &prices = genSequencePrices(secret, debug);
    for (const auto &[k, v] : prices) { sequenceTotals[k] += v; }
    if (debug > 1) std::cout << std::format("merged size: {}\n", sequenceTotals.size());
  }
  Sequence sequence;
  uint highest = 0;
  if (debug > 0) std::cout << "find highest\n";
  for (const auto &[k, v] : sequenceTotals) {
    if (v > highest) highest = v, sequence = k;
  }
  std::cout << std::format("part 2: sequence ({},{},{},{}); value: {}\n", sequence.a, sequence.b, sequence.c,
                           sequence.d, highest);
}

int main(int argc, char *argv[]) {
  const auto args = parseArgs(argc, argv);
  const auto secrets = readData(args.filename, 0);
  if (args.part1) part1(secrets, args.debug);
  if (args.part2) part2(secrets, args.debug);
  return 0;
}