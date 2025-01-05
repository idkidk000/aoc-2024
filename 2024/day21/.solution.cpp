#include <cassert>
#include <climits>
#include <concepts>
#include <cstdint>
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
#include <type_traits>
#include <unordered_map>
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
};

struct RowColHash {
  std::size_t operator()(const RowCol &rhs) const { return std::hash<int>()(rhs.r) ^ (std::hash<int>()(rhs.c) << 1); }
};

struct TextGrid {
  std::string data = "";
  int rows = 0, cols = 0;
  const std::array<RowCol, 4> d4 = {{{-1, 0}, {0, 1}, {1, 0}, {0, -1}}};
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
  return sequences;
}

//idk if best with chars or strings
long getPressCount(std::string sequence, int depth, bool initial,
                   std::unordered_map<std::string, std::vector<std::string>> &translations,
                   std::unordered_map<std::string, long> &distances, int debug) {

  const std::string prefixedSequence = "A" + sequence;

  // if initial, we need to translate numeric to directional.

  // return cached result immediately
  const std::string cacheKey = depth > 0 ? sequence + " " + std::to_string(depth) : sequence;
  if (distances.contains(cacheKey)) return distances.at(cacheKey);
  long result = 0;

  for (size_t i = 0; i < prefixedSequence.size() - 1; ++i) {
    long minCount = LONG_MAX;
    for (const auto &translation : translations.at(prefixedSequence.substr(i, 2)))
      minCount = std::min(minCount, getPressCount(translation, depth - 1, false, translations, distances, debug));
    result += minCount;
  }

  distances[cacheKey] = result;
  return result;
}

std::pair<std::unordered_map<std::string, std::vector<std::string>>, std::unordered_map<std::string, long>>
walkKeypads(int debug) {
  //walk from+to each key on each keypad. store the min distance in result
  //it's fine to share a cache since there's only one common key
  std::unordered_map<std::string, std::vector<std::string>> translations;
  std::unordered_map<std::string, long> distances;
  //FIXME: an absolute atrocity tbh
  // clang-format off
  if (debug>1) std::cout << "walkKeypads\n";
  const std::vector<std::vector<std::vector<std::string>>> keypads = {{{"7", "8", "9",},{"4", "5", "6",},{"1", "2", "3",},{"", "0", "A",},},{{"", "^", "A",},{"<", "V", ">",},}};
  // clang-format on
  const std::array<RowCol, 4> d4 = {{{-1, 0}, {0, 1}, {1, 0}, {0, -1}}};
  for (const auto &keypad : keypads) {
    // generate a map of key coordinates so we can walk them
    std::map<std::string, RowCol> keyCoords;
    const auto &rows = keypad.size(), cols = keypad[0].size();
    if (debug > 1) std::cout << std::format("  rows: {} cols: {}\n", rows, cols);
    for (int r = 0; r < rows; ++r) {
      for (int c = 0; c < cols; ++c) {
        const auto &key = keypad.at(r).at(c);
        if (key.size() == 0) continue;
        keyCoords[key] = {r, c};
      }
    }
    for (const auto &[fromKey, fromRc] : keyCoords) {
      for (const auto &[toKey, toRc] : keyCoords) {
        const auto cacheKey = fromKey + toKey;
        if (fromKey == toKey) {
          translations[cacheKey].push_back("A");
          distances[cacheKey] = 1;
          continue;
        }
        //nice night for a walk eh
        std::deque<std::vector<RowCol>> paths = {{{fromRc}}};
        size_t minLength = SIZE_MAX;
        while (paths.size() > 0) {
          //copy because it's not really performance critical
          const auto path = paths.front();
          paths.pop_front();
          if (path.size() > minLength) continue;
          const auto &[r, c] = path.back();
          for (const auto &d : d4) {
            const auto nr = r + d.r, nc = c + d.c;
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || in(RowCol{nr, nc}, path)) continue;
            const auto atKey = keypad[nr][nc];
            if (atKey == "") continue;
            std::vector<RowCol> nextPath = path;
            nextPath.push_back({nr, nc});
            if (atKey == toKey) {
              minLength = std::min(minLength, nextPath.size());
              //grim. could probably do with adding the arrow key to d4 and making a new struct to hold the row,col, and arrow
              std::string translation = "";
              for (size_t i = 0; i < nextPath.size() - 1; ++i) {
                const auto &p = nextPath.at(i), n = nextPath.at(i + 1);
                if (n.r == p.r - 1)
                  translation += "^";
                else if (n.c == p.c + 1)
                  translation += ">";
                else if (n.r == p.r + 1)
                  translation += "v";
                else if (n.c == p.c - 1)
                  translation += "<";
              }
              translation += "A";
              translations[cacheKey].push_back(translation);
            } else {
              paths.push_back(nextPath);
            }
          }
        }
        distances[cacheKey] = minLength;
      }
    }
  }
  if (debug > 1)
    for (const auto &[k, v] : distances) {
      std::cout << std::format("     {}: {} [{}]\n", k, v, join(translations.at(k), ", "));
    }
  return {translations, distances};
}

long solve(std::vector<std::string> &sequences, std::unordered_map<std::string, std::vector<std::string>> &translations,
           std::unordered_map<std::string, long> &distances, int depth, int debug) {
  long complexity = 0;
  for (const auto &sequence : sequences) {
    long sequenceVal = std::stol(sequence.substr(0, sequence.size() - 1));
    complexity += sequenceVal * getPressCount(sequence, depth, true, translations, distances, debug);
  }
  return complexity;
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto sequences = readData(args.filename, args.debug);
  auto [translations, distances] = walkKeypads(args.debug);
  // execution order is weird. std::cout << "part n" << solve() prints "part n" before solve() has returned
  if (args.part1) {
    const auto &result = solve(sequences, translations, distances, 2, args.debug);
    std::cout << "part 1: " << result;
  }
  if (args.part2) {
    const auto &result = solve(sequences, translations, distances, 25, args.debug);
    std::cout << "part 5: " << result;
  }
  return 0;
}