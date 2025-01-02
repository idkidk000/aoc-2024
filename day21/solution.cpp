#include <cassert>
#include <climits>
#include <concepts>
#include <cstddef>
#include <cstdlib>
#include <deque>
#include <fstream>
#include <functional>
#include <iostream>
#include <map>
#include <ostream>
#include <set>
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

struct RowCol {
  int r, c;
  bool operator==(const RowCol &rhs) const { return r == rhs.r && c == rhs.c; }
  bool operator<(const RowCol &rhs) const { return r != rhs.r ? r < rhs.r : c < rhs.c; }
  //return a new instance
  RowCol operator+(const RowCol &rhs) const { return RowCol{r + rhs.r, c + rhs.c}; }
  RowCol operator-(const RowCol &rhs) const { return RowCol{r - rhs.r, c - rhs.c}; }
};

struct RowColHash {
  std::size_t operator()(const RowCol &rhs) const { return std::hash<int>()(rhs.r) ^ (std::hash<int>()(rhs.c) << 1); }
};

struct TextGrid {
  std::string data = "";
  int rows = 0, cols = 0;

  const std::array<RowCol, 8> d8 = {{{-1, 0}, {-1, 1}, {0, 1}, {1, 1}, {1, 0}, {1, -1}, {0, -1}, {-1, -1}}};
  char at(int row, int col) { return oob(row, col) ? ' ' : data.at(row * cols + col); }
  std::vector<RowCol> findAll(char c) {
    std::vector<RowCol> result;
    for (int i = data.find(c); i != std::string::npos; i = data.find(c, i + 1)) result.push_back({i / cols, i % cols});
    return result;
  }
  RowCol findFirst(char c) { return toRowCol(data.find(c)); }
  void load(std::string line) { data += line, cols = line.size(), rows = data.size() / cols; }
  bool oob(int row, int col) { return row < 0 || row >= rows || col < 0 || col >= cols; };
  void put(int row, int col, char c) { data.replace(row * cols + col, 1, std::string(1, c)); }
  size_t size() { return data.size(); }
  RowCol toRowCol(int ix) { return {ix / cols, ix % cols}; }
  std::set<char> unique() { return {data.begin(), data.end()}; };
};

//still waiting to find out that these very normal functions do exist in std but have silly names
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
std::vector<std::string> split(std::string val, std::string sep = " ") {
  std::vector<std::string> result = {};
  int li = 0; //stringstream and getline only work if sep is a char
  for (size_t i = val.find(sep); i != std::string::npos; i = val.find(sep, li))
    result.push_back(val.substr(li, i)), li = i + sep.size();
  result.push_back(val.substr(li));
  return result;
}
template <std::integral T> T pMod(T val, T mod) { //any integer type
  const auto result = val % mod;
  return result < 0 ? result + mod : result;
}
std::string replaceAll(std::string val, std::string find, std::string replace) {
  std::string result = "";
  int li = 0;
  for (size_t i = val.find(find); i != std::string::npos; i = val.find(find, li))
    result += val.substr(li, i), li = i + find.size();
  result += val.substr(li);
  return result;
}

//std::format
template <> struct std::formatter<RowCol> : std::formatter<std::string> {
  auto format(const RowCol &v, auto &ctx) {
    return std::formatter<std::string>::format("{" + std::to_string(v.r) + "," + std::to_string(v.c) + "}", ctx);
  };
};

//std::cout
std::ostream &operator<<(std::ostream &os, const Args &v) {
  return os << v.filename << "; debug=" << v.debug << "; part 1: " << (v.part1 ? "true" : "false")
            << "; part 2: " << (v.part2 ? "true" : "false");
}
std::ostream &operator<<(std::ostream &os, const RowCol &v) { return os << "{" << v.r << "," << v.c << "}"; }
std::ostream &operator<<(std::ostream &os, const TextGrid &v) { return os << "{" << v.rows << "x" << v.cols << "}"; }

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
        sequencePresses[cacheKey] = 2;
        sequencePresses[cacheKey + " 1"] = shortest;
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
  const auto &cacheKey = depth == 0 ? sequence : std::format("{} {}", sequence, depth);
  if (sequencePresses.contains(cacheKey)) {
    const auto &presses = sequencePresses.at(cacheKey);
    if (debug > 2) std::cout << std::format("    top {} depth {} from cache {}\n", sequence, depth, presses);
    return presses;
  };
  const auto &prefixedSequence = "A" + sequence;
  long total = 0;
  for (int i = 1; i < prefixedSequence.size(); ++i) {
    const auto &subsequence = prefixedSequence.substr(i - 1, 2);
    if (depth >= 1) {
      long shortest = LONG_MAX;
      for (const auto &path : sequencePaths.at(subsequence)) {
        shortest =
          std::min(shortest, getDirectionalPresses(subsequence, depth - 1, sequencePaths, sequencePresses, debug));
      }

      if (debug > 2) std::cout << std::format("    sub {} depth {} from recursion {}\n", subsequence, depth, shortest);
      total += shortest;
    } else {
      // all l0 key to key moves are definitely cached
      const auto &presses = sequencePresses.at(subsequence);
      if (debug > 2) std::cout << std::format("    sub {} depth {} from cache {}\n", subsequence, depth, presses);
      total += presses;
    }
  }
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
    const auto &result = solve(sequences, 0, sequencePaths, sequencePresses, args.debug);
    std::cout << "part 0: " << result << "\n";
  }
  return 0;
}