#include <cassert>
#include <climits>
#include <cstdlib>
#include <deque>
#include <fstream>
#include <functional>
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
  operator std::string() const {
    return std::format("{}; debug: {}; part1: {}; part2: {}", filename, debug, part1, part2);
  }
};

struct RowCol {
  int r, c;
  bool operator==(const RowCol &rhs) const { return r == rhs.r && c == rhs.c; }
  bool operator<(const RowCol &rhs) const { return r != rhs.r ? r < rhs.r : c < rhs.c; }
  RowCol operator+(const RowCol &rhs) const { return RowCol{r + rhs.r, c + rhs.c}; }
  RowCol operator-(const RowCol &rhs) const { return RowCol{r - rhs.r, c - rhs.c}; }
};

template <typename T> bool in(T val, std::vector<T> vec) { return std::find(vec.begin(), vec.end(), val) != vec.end(); }
template <typename T> std::string join(std::vector<T> vec, std::string sep = ",") {
  std::string result = "";
  for (const auto &v : vec) {
    if constexpr (std::is_convertible_v<T, std::string>)
      result += v + sep;
    else
      result += std::to_string(v) + sep;
  }
  return result.size() > sep.size() ? result.substr(0, result.size() - sep.size()) : result;
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
  std::cout << (std::string)args << "\n";
  return args;
}
#pragma endregion

std::vector<std::string> readData(std::string filename, int debug) {
  std::vector<std::string> sequences;
  std::ifstream file(filename);
  if (!file.is_open()) throw std::runtime_error("cannot open: " + filename);
  std::string line;
  while (std::getline(file, line)) sequences.push_back(line);
  file.close();
  if (debug > 1) std::cout << "sequences:\n  " << join(sequences, "\n  ") << "\n";
  return sequences;
}

std::pair<std::unordered_map<std::string, std::vector<std::string>>, std::unordered_map<std::string, long>>
walkKeypads(const int &debug) {
  std::unordered_map<std::string, std::vector<std::string>> sequencePaths;
  std::unordered_map<std::string, long> sequencePresses;
  const std::array<RowCol, 4> d4 = {{{-1, 0}, {0, 1}, {1, 0}, {0, -1}}};
  const std::vector<std::vector<std::vector<char>>> keypads = {
    {
      {'7', '8', '9'},
      {'4', '5', '6'},
      {'1', '2', '3'},
      {'\0', '0', 'A'},
    },
    {
      {'\0', '^', 'A'},
      {'<', 'v', '>'},
    },
  };
  for (const auto &keypad : keypads) {
    const auto &rows = keypad.size();
    const auto &cols = keypad.at(0).size();
    // build a position map
    std::map<char, RowCol> positions;
    for (int r = 0; r < rows; ++r) {
      for (int c = 0; c < cols; ++c)
        if (keypad.at(r).at(c) != '\0') positions[keypad.at(r).at(c)] = {r, c};
    }
    if (debug > 1) {
      std::cout << "positions:\n";
      for (const auto &[k, v] : positions) std::cout << std::format("  {}: {},{}\n", k, v.r, v.c);
      std::cout << std::format("rows: {}; cols: {}\n", rows, cols);
    }
    for (const auto &[keyFrom, rcFrom] : positions) {
      for (const auto &[keyTo, rcTo] : positions) {
        const std::string cacheKey = {keyFrom, keyTo};
        if (keyFrom == keyTo) {
          sequencePaths[cacheKey] = {{"A"}};
          sequencePresses[cacheKey] = 1;
          continue;
        }
        // mutlipath walk
        if (debug > 2)
          std::cout << std::format("walk {} ({},{}) -> {} ({},{})\n", keyFrom, rcFrom.r, rcFrom.c, keyTo, rcTo.r,
                                   rcTo.c);
        int shortest = INT_MAX;
        std::deque<std::vector<RowCol>> paths = {{rcFrom}};
        while (paths.size() > 0) {
          //byref to keep the reduce the yuuuge amount of copying a bit, but we can't pop it off the deque until we're done with it
          const auto &path = paths.front();
          for (const auto &d : d4) {
            const auto &nextRc = path.back() + d;
            if (debug > 2) std::cout << std::format("  test {},{}\n", nextRc.r, nextRc.c);
            //test oob, null, loop
            if (path.size() < shortest && nextRc.r >= 0 && nextRc.r < rows && nextRc.c >= 0 && nextRc.c < cols &&
                keypad.at(nextRc.r).at(nextRc.c) != '\0' && !in(nextRc, path)) {
              if (debug > 2) std::cout << "    success\n";
              std::vector<RowCol> nextPath = path;
              //allocate manually instead of auto which would +0.5x size on each growth
              nextPath.reserve(path.size() + 1);
              nextPath.push_back(nextRc);
              if (nextRc == rcTo) {
                if (nextPath.size() <= shortest) {
                  //ugh
                  std::string directionalMoves = "";
                  for (int i = 1; i < nextPath.size(); ++i) {
                    const auto &delta = nextPath[i] - nextPath[i - 1];
                    if (delta.r == -1)
                      directionalMoves += '^';
                    else if (delta.r == 1)
                      directionalMoves += 'v';
                    else if (delta.c == -1)
                      directionalMoves += '<';
                    else if (delta.c == 1)
                      directionalMoves += '>';
                  }
                  sequencePaths[cacheKey].push_back(directionalMoves + 'A');
                  shortest = nextPath.size();
                }
              } else {
                paths.push_back(nextPath);
              }
            } else {
              if (debug > 2) std::cout << "    failed\n";
            }
          }
          paths.pop_front();
        }
        //BUG: i *think* we're caching the depth 1 press count here, not the depth 0
        sequencePresses[cacheKey] = shortest;
        if (debug > 1)
          std::cout << std::format("{}: length: {}; paths: {}\n", cacheKey, sequencePresses.at(cacheKey),
                                   join(sequencePaths.at(cacheKey)));
      }
    }
  }
  return {sequencePaths, sequencePresses};
}

long getDirectionalPresses(const std::string &sequence, const int &depth,
                           const std::unordered_map<std::string, std::vector<std::string>> &sequencePaths,
                           std::unordered_map<std::string, long> &sequencePresses, const int &debug) {
  //BUG: (maybe) cacheKey and subsequence loop behaviour might need to treat 1 as the lowest level rather than 0 since we're doing the initial translation from numeric to directional in the getPresses function
  const auto &cacheKey = depth == 1 ? sequence : std::format("{} {}", sequence, depth);
  if (sequencePresses.contains(cacheKey)) {
    const auto &presses = sequencePresses.at(cacheKey);
    if (debug > 2) std::cout << std::format("    top {} depth {} from cache {}\n", sequence, depth, presses);
    return presses;
  };

  const auto &prefixedSequence = "A" + sequence;
  long total = 0;
  for (int i = 1; i < prefixedSequence.size(); ++i) {
    const auto &subsequence = prefixedSequence.substr(i - 1, 2);
    if (depth > 1) {
      long shortest = LONG_MAX;
      for (const auto &path : sequencePaths.at(subsequence)) {
        shortest =
          std::min(shortest, getDirectionalPresses(subsequence, depth - 1, sequencePaths, sequencePresses, debug));
      }

      if (debug > 2)
        std::cout << std::format("    sub {} depth {} from recursion {}\n", subsequence, depth - 1, shortest);
      total += shortest;
    } else {
      //BUG: here. the output numbers are too high because the paths in sequencePresses are another level of abstraction
      // all l0 key to key moves are definitely cached
      const auto &presses = sequencePresses.at(subsequence);
      // const auto presses = 1;
      if (debug > 2) std::cout << std::format("    sub {} depth {} from cache {}\n", subsequence, depth - 1, presses);
      total += presses;
    }
  }
  if (debug > 2) std::cout << std::format("  {} depth {} return {}\n", sequence, depth, total);
  sequencePresses[cacheKey] = total;
  return total;
}

long getPresses(const std::string &sequence, const int &depth,
                const std::unordered_map<std::string, std::vector<std::string>> &sequencePaths,
                std::unordered_map<std::string, long> &sequencePresses, const int &debug) {
  //convert nuumeric to dpad. run the recursive dpad function on each possible path, returning the sum of the shortest
  const auto &prefixedSequence = "A" + sequence;
  long total = 0;
  for (int i = 1; i < prefixedSequence.size(); ++i) {
    const auto &subsequence = prefixedSequence.substr(i - 1, 2);
    long shortest = LONG_MAX;
    if (debug > 0) std::cout << std::format("{}[{}:2] {} depth {}\n", prefixedSequence, i, subsequence, depth);
    for (const auto &path : sequencePaths.at(subsequence)) {
      const auto &presses = getDirectionalPresses(path, depth, sequencePaths, sequencePresses, debug);
      if (debug > 1) std::cout << std::format("  path {}; presses: {}\n", path, presses);
      shortest = std::min(shortest, presses);
    }
    if (debug > 0)
      std::cout << std::format("{}[{}:2] {} depth {} shortest {}\n", prefixedSequence, i, subsequence, depth, shortest);
    total += shortest;
  }
  return total;
}

long solve(const std::vector<std::string> &sequences, int depth,
           const std::unordered_map<std::string, std::vector<std::string>> &sequencePaths,
           std::unordered_map<std::string, long> sequencePresses, const int &debug) {
  long total = 0;
  for (const auto &sequence : sequences) {
    const long &sequenceInt = std::stoi(sequence.substr(0, sequence.size() - 1));
    const auto &presses = getPresses(sequence, depth, sequencePaths, sequencePresses, debug);
    const auto &complexity = sequenceInt * presses;
    if (debug > 0)
      std::cout << std::format("sequence: {}; int: {}; presses: {}; complexity: {}\n", sequence, sequenceInt, presses,
                               complexity);
    total += complexity;
  }
  return total;
}

int main(int argc, char *argv[]) {
  const auto &args = parseArgs(argc, argv);
  const auto &sequences = readData(args.filename, 0);
  const auto &[sequencePaths, sequencePresses] = walkKeypads(args.debug - 1);
  if (args.part1) {
    const auto &result = solve(sequences, 3, sequencePaths, sequencePresses, args.debug);
    std::cout << "part 1: " << result << "\n";
  }
  if (args.part2) {
    const auto &result = solve(sequences, 25, sequencePaths, sequencePresses, args.debug);
    std::cout << "part 2: " << result << "\n";
  }
  if (!(args.part1 || args.part2)) {
    const auto &result = solve(sequences, 1, sequencePaths, sequencePresses, args.debug);
    std::cout << "part 0: " << result << "\n";
  }
  return 0;
}