#include <array>
#include <cassert>
#include <chrono>
#include <climits>
#include <cstddef>
#include <cstdlib>
#include <deque>
#include <fstream>
#include <functional>
#include <iostream>
#include <set>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>
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

std::pair<std::vector<RowCol>, RowCol> readData(std::string filename, int debug) {
  std::vector<RowCol> items;
  const std::unordered_map<std::string, RowCol> gridSizes = {
    {"example.txt", {7, 7}},
    {"input.txt", {71, 71}},
  };
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    while (std::getline(file, line)) {
      const auto split = line.find(',');
      items.push_back({
        std::stoi(line.substr(0, split)),
        std::stoi(line.substr(split + 1)),
      });
    };
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  const auto gridSize = gridSizes.at(filename);
  if (debug > 1) { std::cout << std::format("items: {} grid size: r={},c={}\n", items.size(), gridSize.r, gridSize.c); }
  return {items, gridSize};
}

int getShortestPath(TextGrid &grid, int debug) {
  // performance of this is fine actually. slowness is somewhere else
  const std::array<RowCol, 4> dirs = {{{-1, 0}, {0, 1}, {1, 0}, {0, -1}}};
  std::deque<std::vector<RowCol>> paths = {{{0, 0}}};
  const auto er = grid.rows - 1, ec = grid.cols - 1;
  // early path pruning
  std::unordered_map<RowCol, int, RowColHash> locnCosts;
  // late path pruning
  int shortest = grid.rows * grid.cols;
  // stats
  std::chrono::duration<double> copyTime;
  int loopCount = 0;

  while (paths.size() > 0) {
    // since we're using a ref, don't continue early since we need to pop this off paths when we're done
    const auto &path = paths.front();
    const auto &[r, c] = path.back();
    const auto &pathSize = path.size();
    ++loopCount;
    if (debug > 1)
      std::cout << std::format("shortest: {}; paths.size: {}; path.size: {}; locn: {}.{}\n", shortest, paths.size(),
                               pathSize, r, c);
    if (pathSize < shortest) {
      for (const auto &dir : dirs) {
        const auto nr = r + dir.r, nc = c + dir.c;
        const RowCol nextRc = {nr, nc};
        // this creates if not exists using value 0. but it's only 1 lookup instead of 2 and we don't need to handle exceptions
        const auto locnCost = locnCosts[nextRc];
        // vector find is suprisingly much faster than using a set or unordered_set
        if (grid.at(nr, nc) == '.' && (locnCost == 0 || locnCost < pathSize) &&
            std::find(path.begin(), path.end(), nextRc) == path.end()) {
          locnCosts[nextRc] = pathSize;
          if (nr == er && nc == ec) {
            shortest = pathSize;
          } else {
            // this is surprisingly only about 15% of the time taken
            const auto timeCopyStart = std::chrono::system_clock::now();
            std::vector<RowCol> nextPath = path;
            nextPath.push_back({nr, nc});
            paths.push_back(nextPath);
            const auto timeCopyStop = std::chrono::system_clock::now() - timeCopyStart;
            copyTime += timeCopyStop;
          }
        }
      }
    }
    paths.pop_front();
  }
  if (debug > 0) std::cout << std::format("time copying: {}; loop count: {}\n", copyTime, loopCount);
  return shortest == grid.rows * grid.cols ? -1 : shortest;
};

void part1(std::vector<RowCol> &items, RowCol &gridSize, int debug) {
  TextGrid grid;
  grid.rows = gridSize.r, grid.cols = gridSize.c, grid.data = std::string(gridSize.r * gridSize.c, '.');
  for (int i = 0; i < std::min(size_t(1024), items.size()); ++i) {
    const auto rc = items.at(i);
    grid.put(rc.r, rc.c, '#');
  }
  std::cout << "part 1: " << getShortestPath(grid, debug) << "\n";
}

void part2(std::vector<RowCol> &items, RowCol &gridSize, int debug) {
  // bin search
  int min = 0, max = items.size() - 1, mid;
  // likely riddled with off-by-ones
  while (max > min) {
    mid = (min + max) / 2;
    TextGrid grid;
    grid.rows = gridSize.r, grid.cols = gridSize.c, grid.data = std::string(gridSize.r * gridSize.c, '.');
    for (int i = 0; i < mid; ++i) {
      const auto rc = items.at(i);
      grid.put(rc.r, rc.c, '#');
    }
    const auto pathLength = getShortestPath(grid, 0);
    if (debug > 0) std::cout << std::format("min: {}; max: {}; mid: {}; len: {}\n", min, max, mid, pathLength);
    if (pathLength > -1) {
      // path succeeded, increase min
      min = mid + 1;
    } else {
      // path failed, reduce max
      max = mid - 1;
    }
  }
  // min and max should now both be the index of the first failed path
  std::cout << std::format("part 2: min={} max={} items[min]={},{}\n", min, max, items[min].r, items[min].c);
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  if (args.part1) part1(data.first, data.second, args.debug);
  if (args.part2) part2(data.first, data.second, args.debug);
  return 0;
}