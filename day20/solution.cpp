#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <map>
#include <set>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

struct Args {
  std::string filename = "example.txt";
  int debug = 0;
  bool part1 = true;
  bool part2 = true;
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
  int rows = 0;
  int cols = 0;
  char at(int row, int col) { return oob(row, col) ? ' ' : data.at(row * cols + col); }
  RowCol findFirst(char c) {
    const int ix = data.find(c);
    return {ix / cols, ix % cols};
  }
  std::vector<RowCol> findAll(char c) {
    std::vector<RowCol> result;
    int ix = -1;
    while ((ix = data.find(c, ix + 1)) != std::string::npos) { result.push_back({ix / cols, ix % cols}); }
    return result;
  }
  std::set<char> unique() {
    std::set<char> result;
    for (char c : data) { result.insert(c); }
    return result;
  }
  bool oob(int row, int col) { return row < 0 || row >= rows || col < 0 || col >= cols; };
  void put(int row, int col, char c) { data.replace(row * cols + col, 1, std::string(1, c)); }
  int size() { return data.size(); }
  RowCol ixToRowCol(int ix) { return {ix / cols, ix % cols}; }
  const std::array<RowCol, 4> d4 = {{{-1, 0}, {0, 1}, {1, 0}, {0, -1}}};
  const std::array<RowCol, 8> d8 = {{{-1, 0}, {-1, 1}, {0, 1}, {1, 1}, {1, 0}, {1, -1}, {0, -1}, {-1, -1}}};
};

Args parseArgs(int argc, char *argv[]) {
  Args args;
  std::unordered_map<std::string, std::function<void()>> argMap = {
    {"-e", [&]() { args.filename = "example.txt"; }},
    {"-i", [&]() { args.filename = "input.txt"; }},
    {"-d", [&]() { args.debug = 1; }},
    {"-d1", [&]() { args.debug = 1; }},
    {"-d2", [&]() { args.debug = 2; }},
    {"-d3", [&]() { args.debug = 3; }},
    {"-p0", [&]() { args.part1 = false, args.part2 = false; }},
    {"-p1", [&]() { args.part1 = true, args.part2 = false; }},
    {"-p2", [&]() { args.part1 = false, args.part2 = true; }},
  };
  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];
    if (arg.find("-e", 0) == 0 && arg.size() > 2) {
      args.filename = "example" + arg.substr(2) + ".txt";
    } else if (argMap.find(arg) != argMap.end()) {
      argMap[arg]();
    } else {
      throw std::runtime_error("unknown arg: " + arg);
    }
  }
  std::cout << std::format("filename: {}; debug: {}; part 1: {}; part 2: {}\n", args.filename, args.debug, args.part1,
                           args.part2);
  return args;
}

TextGrid readData(std::string filename, int debug) {
  TextGrid data;
  std::vector<int> right;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    while (std::getline(file, line)) {
      data.data += line;
      if (data.cols == 0) data.cols = line.size();
    }
    data.rows = data.data.size() / data.cols;
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "rows: " << data.rows << " cols: " << data.cols << " size: " << data.data.size()
              << " at(0,0): " << data.at(0, 0) << "\n";
  }
  return data;
}

std::map<RowCol, int> getCosts(TextGrid &grid, int debug) {
  // return a map of steps taken to reach all possible rowcols
  const auto startAt = grid.findFirst('S');
  const auto endAt = grid.findFirst('E');
  // if (debug > 1) std::cout << std::format("start {},{}; end: {},{}\n", startAt.r, startAt.c, endAt.r, endAt.c);
  // only one route through so it's quite trivial
  auto [r, c] = startAt;
  // sorted version for debugging
  std::map<RowCol, int> result;
  int cost = 0;
  result[startAt] = cost;
  while (r != endAt.r || c != endAt.c) {
    for (const auto &d : grid.d4) {
      const auto nr = r + d.r, nc = c + d.c;
      if (grid.at(nr, nc) == '#') continue;
      if (result.contains({nr, nc})) continue;
      ++cost;
      result[{nr, nc}] = cost;
      r = nr, c = nc;
    }
  }
  if (debug > 2) {
    std::cout << "costs:\n";
    for (const auto &[pos, cost] : result) { std::cout << std::format("  {},{}: {}\n", pos.r, pos.c, cost); }
    std::cout << std::format("start: {},{}: cost {}; end: {},{}: cost {}\n", startAt.r, startAt.c, result.at(startAt),
                             endAt.r, endAt.c, result.at(endAt));
  }
  return result;
}

std::set<RowCol> getOffsets(int steps, int debug) {
  // return a set of offsets which can be reached in the given number of steps
  // use the sorted version for debugging
  std::set<RowCol> result;
  for (int r = -steps; r <= steps; ++r) {
    for (int c = -steps; c <= steps; ++c) {
      if (std::abs(r) + std::abs(c) <= steps) result.insert({r, c});
    }
  }
  if (debug > 2) {
    std::cout << std::format("offsets for steps={}:\n", steps);
    for (const auto &[r, c] : result) { std::cout << std::format("  {},{}", r, c); }
    std::cout << "\n";
  }
  return result;
}

int solve(TextGrid &grid, std::map<RowCol, int> &costs, int steps, int debug) {
  const auto offsets = getOffsets(steps, debug);
  // might as well have the sorted version since this is mostly for debugging
  std::map<int, int> savings;
  for (const auto &[pos, cost] : costs) {
    const auto &[r, c] = pos;
    for (const auto &offset : offsets) {
      const auto nr = r + offset.r, nc = c + offset.c;
      // could be wall or oob. but we can just verify that there's a costs entry
      if (!costs.contains({nr, nc})) continue;
      const auto nextCost = costs.at({nr, nc});
      //could be negatve
      const auto saving = nextCost - cost - std::abs(offset.r) - std::abs(offset.c);
      if (saving <= 0) continue;
      savings[saving]++;
    }
  }
  int result = 0;
  for (const auto &[k, v] : savings) {
    if (debug > 0) std::cout << std ::format("saving: {}; count: {}\n", k, v);
    if (k >= 100) result += v;
  }
  return result;
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto grid = readData(args.filename, args.debug);
  auto costs = getCosts(grid, args.debug);
  if (args.part1) std::cout << "part 1: " << solve(grid, costs, 2, args.debug) << "\n";
  if (args.part2) std::cout << "part 2: " << solve(grid, costs, 20, args.debug) << "\n";
  return 0;
}