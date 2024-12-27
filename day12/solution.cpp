#include <cassert>
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
#include <utility>
#include <vector>

struct Args {
  std::string filename = "example.txt";
  int debug = 0;
  bool part1 = true;
  bool part2 = true;
};

struct TextGrid {
  std::string data = "";
  int rows = 0;
  int cols = 0;
  int boxRow = -1;
  int boxCol = -1;
  char at(int row, int col) {
    if (oob(row, col))
      return ' ';
    if (row == boxRow && col == boxCol)
      return '#';
    return data.at(row * cols + col);
  }
  int size() { return data.size(); }
  std::pair<int, int> ixToRc(int i) { return {i / cols, i % cols}; }
  std::pair<int, int> findFirst(char c) {
    // for finding start/end pos
    const int ix = data.find(c);
    return {ix / cols, ix % cols};
  }
  std::vector<std::pair<int, int>> findAll(char c) {
    // for finding all instances
    std::vector<std::pair<int, int>> result;
    int ix = -1;
    while ((ix = data.find(c, ix + 1)) != std::string::npos) {
      result.push_back({ix / cols, ix % cols});
    }
    return result;
  }
  std::set<char> unique() {
    std::set<char> result;
    for (char c : data) {
      result.insert(c);
    }
    return result;
  }
  bool oob(int row, int col) {
    return row < 0 || row >= rows || col < 0 || col >= cols;
  };
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

struct RowColDir {
  int r, c, d;
  // so the struct can be added to a set
  bool operator<(const RowColDir &rhs) const {
    return r != rhs.r ? r < rhs.r : c != rhs.c ? c < rhs.c : d < rhs.d;
  }
  bool operator=(const RowColDir &rhs) const {
    return r == rhs.r && c == rhs.c && d == rhs.d;
  }
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
  std::cout << "filename: " << args.filename << "; debug: " << args.debug
            << "; part 1: " << std::boolalpha << args.part1
            << "; part 2: " << std::boolalpha << args.part2 << "\n";
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
      if (data.cols == 0)
        data.cols = line.size();
    }
    data.rows = data.data.size() / data.cols;
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "rows: " << data.rows << " cols: " << data.cols
              << " size: " << data.data.size() << " at(0,0): " << data.at(0, 0)
              << "\n";
  }
  return data;
}

// so i can use unordered maps and sets which are way faster
struct PairHash {
  template <typename T1, typename T2>
  std::size_t operator()(const std::pair<T1, T2> &p) const {
    return std::hash<T1>()(p.first) ^ (std::hash<T2>()(p.second) << 1);
  }
};
struct RowColDirHash {
  std::size_t operator()(const RowColDir &rcd) const {
    return std::hash<int>()(rcd.r) ^ (std::hash<int>()(rcd.c) << 1) ^
           (std::hash<int>()(rcd.d) << 2);
  }
};

void solve(TextGrid &data, Args args) {
  /*
    this one was tricky
    the letters are not unique identifiers, they only mark the boundaries of a
    region
  */
  std::array<std::pair<int, int>, 4> dirs = {{
      {-1, 0},
      {0, 1},
      {1, 0},
      {0, -1},
  }};
  //  to determine which cells are already walked
  std::unordered_set<std::pair<int, int>, PairHash> walked;
  // region areas
  std::unordered_map<std::pair<int, int>,
                     std::unordered_set<std::pair<int, int>, PairHash>,
                     PairHash>
      areas;
  // perimeter is a count of edges, which are directional
  // distinct sides is incremented by looping over edges, and succeeding when no
  // edge of same directionality is immediately above or to the left
  std::unordered_map<std::pair<int, int>, std::set<RowColDir>, PairHash> edges;
  // loop over all cells
  for (int i = 0; i < data.size(); ++i) {
    const auto start = data.ixToRc(i);
    // abort on already walked
    if (walked.find(start) != walked.end())
      continue;
    if (args.debug > 0)
      std::cout << "walk " << start.first << "," << start.second << "\n";
    const auto [sr, sc] = start;
    const auto startChar = data.at(sr, sc);
    std::deque<std::pair<int, int>> walkers = {start};
    walked.insert(start);
    while (!walkers.empty()) {
      const auto current = walkers.front();
      walkers.pop_front();
      areas[start].insert(current);
      if (args.debug > 1)
        std::cout << "  current: " << current.first << "," << current.second
                  << "\n";
      for (int d = 0; d < dirs.size(); d++) {
        const auto dir = dirs[d];
        const std::pair<int, int> next = {current.first + dir.first,
                                          current.second + dir.second};

        if (data.at(next.first, next.second) == startChar) {
          // only push to walkers if not already walked
          if (walked.find(next) == walked.end()) {
            // add to walked now so that we don't add duplicates to the deque
            walked.insert(next);
            walkers.push_back(next);
            if (args.debug > 1)
              std::cout << "    next: " << next.first << "," << next.second
                        << " d: " << d << "\n";
          };
        } else {
          // add an edge if the new coord is not our region
          edges[start].insert({current.first, current.second, d});
        }
      }
    }
  }
  int total1, total2 = 0;
  for (const auto &[region, rEdges] : edges) {
    const auto area = areas[region].size();
    const auto perimeter = rEdges.size();
    int sides = 0;
    for (const auto edge : rEdges) {
      switch (edge.d) {
      case 0:
      case 2:
        if (rEdges.find({edge.r, edge.c - 1, edge.d}) == rEdges.end()) {
          ++sides;
        }
        break;
      case 1:
      case 3:
        if (rEdges.find({edge.r - 1, edge.c, edge.d}) == rEdges.end()) {
          ++sides;
        }
        break;
      default:
        std::cout << "how did u do that\n";
      }
    }
    const int part1 = area * perimeter, part2 = area * sides;
    if (args.debug > 0) {
      const auto [r, c] = region;
      std::cout << "region: " << data.at(r, c) << " " << region.first << ","
                << region.second << " area: " << area
                << " perimeter: " << perimeter << " sides: " << sides
                << " part1: " << part1 << " part2: " << part2 << "\n";
    }
    total1 += part1;
    total2 += part2;
  }
  if (args.part1)
    std::cout << "part 1: " << total1 << "\n";
  if (args.part2)
    std::cout << "part 2: " << total2 << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  solve(data, args);
  return 0;
}