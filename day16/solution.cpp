#include <algorithm>
#include <cassert>
#include <climits>
#include <cstdlib>
#include <deque>
#include <fstream>
#include <functional>
#include <iostream>
#include <set>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <unordered_set>
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
struct RowColDir {
  int r, c, d;
  bool operator==(const RowColDir &rhs) const { return r == rhs.r && c == rhs.c && d == rhs.d; }
  bool operator<(const RowColDir &rhs) const { return r != rhs.r ? r < rhs.r : c != rhs.c ? c < rhs.c : d < rhs.d; }
};

struct RowColHash {
  std::size_t operator()(const RowCol &rhs) const { return std::hash<int>()(rhs.r) ^ (std::hash<int>()(rhs.c) << 1); }
};
struct RowColDirHash {
  std::size_t operator()(const RowColDir &rhs) const {
    return std::hash<int>()(rhs.r) ^ (std::hash<int>()(rhs.c) << 1) ^ (std::hash<int>()(rhs.d) << 2);
  }
};

struct TextGrid {
  std::string data = "";
  int rows = 0;
  int cols = 0;
  int boxRow = -1;
  int boxCol = -1;
  char at(int row, int col) {
    if (oob(row, col)) return ' ';
    if (row == boxRow && col == boxCol) return '#';
    return data.at(row * cols + col);
  }
  RowCol findFirst(char c) {
    // for finding start/end pos
    const int ix = data.find(c);
    return {ix / cols, ix % cols};
  }
  std::vector<RowCol> findAll(char c) {
    // for finding all instances
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
  // lightweight alternative to creating a new instance and copying/replacing
  // string data
  void box(int row = -1, int col = -1) { boxRow = row, boxCol = col; }
  // the full version for days where we need it
  void put(int row, int col, char c) {
    // replace a single char on the grid
    data.replace(row * cols + col, 1, std::string(1, c));
  }
  TextGrid clone() {
    // pass data byval
    return TextGrid{data, rows, cols};
  }
};

struct Path {
  std::vector<RowColDir> items = {};
  int score = 0;
};

Args parseArgs(int argc, char *argv[]) {
  Args args;
  std::unordered_map<std::string, std::function<void()>> argMap = {
    {"-i", [&]() { args.filename = "input.txt"; }},
    {"-d", [&]() { args.debug = 1; }},
    {"-d1", [&]() { args.debug = 1; }},
    {"-d2", [&]() { args.debug = 2; }},
    {"-d3", [&]() { args.debug = 3; }},
    {"-p1",
     [&]() {
       args.part1 = true;
       args.part2 = false;
     }},
    {"-p2",
     [&]() {
       args.part1 = false;
       args.part2 = true;
     }},
  };
  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];
    if (arg.rfind("-e", 0) == 0 && arg.size() > 2) {
      args.filename = "example" + arg.substr(2) + ".txt";
    } else if (argMap.find(arg) != argMap.end()) {
      argMap[arg](); // Execute the associated action
    } else {
      throw std::runtime_error("unknown arg: " + arg);
    }
  }
  std::cout << "filename: " << args.filename << "; debug: " << args.debug << "; part 1: " << std::boolalpha
            << args.part1 << "; part 2: " << std::boolalpha << args.part2 << "\n";
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

int pMod(int value, int mod) {
  const int result = value % mod;
  return result < 0 ? result + mod : result;
}
void solve(TextGrid &grid, Args args) {
  const auto startTile = grid.findFirst('S');
  std::deque<Path> paths = {{{{{startTile.r, startTile.c, 1}}, 0}}};
  std::vector<Path> completedPaths;
  std::array<RowCol, 4> directions = {RowCol{-1, 0}, RowCol{0, 1}, RowCol{1, 0}, RowCol{0, -1}};
  int bestScore = INT_MAX;
  // for path pruning. can't set a default value so more verbosity is required below
  // needs to contain the direction component if we want to walk *all* best paths, which is considerably slower
  std::unordered_map<RowColDir, int, RowColDirHash> rcdScores;
  if (args.debug > 0)
    std::cout << "startTile: " << startTile.r << "," << startTile.c << " bestScore: " << bestScore << "\n";
  // walk paths
  while (paths.size() > 0) {
    if (args.debug > 0)
      std::cout << "paths: " << paths.size() << " completed: " << completedPaths.size() << " bestScore: " << bestScore
                << "\n";
    // byval not byref since pop_front() invalidates the ref and we get garbage data
    const auto path = paths.front();
    paths.pop_front();
    if (path.score > bestScore) continue;
    const auto &rcd = path.items.back();
    const auto &[r, c, d] = rcd;
    const auto rcdScore = rcdScores.count(rcd) == 1 ? rcdScores.at(rcd) : bestScore;
    if (path.score > rcdScore) {
      continue;
    } else {
      rcdScores[rcd] = path.score;
    }
    if (args.debug > 1)
      std::cout << "walk: " << r << "," << c << "," << d << " score: " << path.score << " size: " << path.items.size()
                << "\n";
    // FIXME: why doesnt this work
    // std::cout << std::format("walk: {},{},{} score: {} size: {}\n", r, c, d, path.score, path.items.size());

    // rotate -90, 0, +90
    for (int t = -1; t < 2; ++t) {
      const auto nd = pMod(d + t, 4);
      const auto nr = r + directions[nd].r, nc = c + directions[nd].c;
      if (grid.oob(nr, nc)) continue;
      // search for nr,nc in path.items() with a lambda, since path.items() items also have a direction component
      if (std::find_if(path.items.begin(), path.items.end(),
                       [&nr, &nc](const RowColDir &rcd) { return rcd.r == nr && rcd.c == nc; }) != path.items.end())
        continue;
      const auto at = grid.at(nr, nc);
      if (at == '#') continue;
      Path nextPath = path;
      nextPath.items.push_back({nr, nc, nd});
      nextPath.score += t == 0 ? 1 : 1001;
      if (nextPath.score > bestScore) continue;
      if (at == 'E') {
        if (args.debug > 0)
          std::cout << "  complete: " << nr << "," << nc << "," << nd << " score: " << nextPath.score << "\n";
        completedPaths.push_back(nextPath);
        bestScore = std::min(bestScore, nextPath.score);
      } else {
        paths.push_back(nextPath);
      }
    }
  }

  // build the bestTiles set
  std::unordered_set<RowCol, RowColHash> bestTiles;
  for (const auto &p : completedPaths) {
    if (p.score == bestScore) {
      for (const auto &i : p.items) bestTiles.insert({i.r, i.c});
    }
  }
  if (args.part1) std::cout << "part 1: " << bestScore << "\n";
  if (args.part2) std::cout << "part 2: " << bestTiles.size() << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  solve(data, args);
  return 0;
}