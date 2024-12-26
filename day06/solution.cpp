#include <cassert>
#include <cstddef>
#include <cstdlib>
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
  auto at(int row, int col) {
    // save having to do oob checking
    if (row < 0 || row >= rows || col < 0 || col >= cols)
      return ' ';
    return data.at(row * cols + col);
  }
  std::pair<int, int> find(char c) {
    const int ix = data.find(c);
    return {ix / cols, ix % cols};
  }
  bool oob(int row, int col) {
    return !(0 <= row && row < rows && 0 <= col && col <= cols);
  };
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
  bool operator<(const RowColDir &rhs) const {
    return r != rhs.r ? r < rhs.r : c != rhs.c ? c < rhs.c : d < rhs.d;
  }
  bool operator=(const RowColDir &rhs) const {
    return r == rhs.r && c == rhs.c && d == rhs.d;
  }
  // int hash() {
  //   // FIXME: extremely yikes because i have no idea what i'm doing actually
  //   return (r * 7919) + (c * 401) + d;
  // }
};
// for unordered_set
// namespace std {
// template <> struct hash<RowColDir> {
//   size_t operator()(const RowColDir &key) const {
//     return std::hash<int>()(key.r) ^ (std::hash<int>()(key.c) << 1) ^
//            (std::hash<int>()(key.d) << 2);
//   };
// };
// } // namespace std

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
  TextGrid grid;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    int rows = 0;
    while (std::getline(file, line)) {
      grid.data += line;
      ++rows;
      if (grid.cols == 0) {
        grid.cols = line.size();
      }
    }
    grid.rows = rows;
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "grid rows: " << grid.rows << "; cols: " << grid.cols
              << "; data size:" << grid.data.size()
              << "; at(0,0): " << grid.at(0, 0) << "\n";
  }
  return grid;
}

void part1(TextGrid &grid, int debug) {
  auto [r, c] = grid.find('^');
  std::array<std::pair<int, int>, 4> dirs = {{
      {-1, 0},
      {0, 1},
      {1, 0},
      {0, -1},
  }};
  int d = 0;
  if (debug > 0)
    std::cout << "start r: " << r << " c: " << c << " d: " << d << "\n";
  std::set<std::pair<int, int>> locations;
  while (!grid.oob(r, c)) {
    int nr = r + dirs[d].first, nc = c + dirs[d].second;
    if (debug > 0) {
      std::cout << "r: " << r << " c: " << c << " d: " << d << " nr: " << nr
                << " nc: " << nc << " locs: " << locations.size() << "\n";
    }
    // turn right at box
    if (grid.at(nr, nc) == '#') {
      d = (d + 1) % 4;
      continue;
    }
    // add to locations set if not oob
    if (!grid.oob(nr, nc)) {
      locations.insert({nr, nc});
    }
    // walk (oob will break the loop)
    r = nr, c = nc;
  };
  std::cout << "part 1: " << locations.size() << "\n";
}

void part2(TextGrid &grid, int debug) {
  auto start = grid.find('^');
  std::array<std::pair<int, int>, 4> dirs = {{
      {-1, 0},
      {0, 1},
      {1, 0},
      {0, -1},
  }};
  int d = 0, r = start.first, c = start.second;
  std::set<std::pair<int, int>> boxLocations;
  // initial walk to build boxLocations
  while (!grid.oob(r, c)) {
    int nr = r + dirs[d].first, nc = c + dirs[d].second;
    if (grid.at(nr, nc) == '#') {
      d = (d + 1) % 4;
    } else {
      if (!grid.oob(nr, nc)) {
        boxLocations.insert({nr, nc});
      }
      r = nr, c = nc;
    }
  };
  int loopCount = 0;
  for (auto box : boxLocations) {
    // clone the grid and shove a box in it
    TextGrid boxGrid = grid.clone();
    boxGrid.put(box.first, box.second, '#');
    if (debug > 0)
      std::cout << "box=(" << box.first << "," << box.second
                << ") boxGrid.at=" << boxGrid.at(box.first, box.second) << "\n";
    // store a history of r,c,d so we can determine if we're in a loop
    std::set<RowColDir> boxPath;
    // reset to start
    int d = 0, r = start.first, c = start.second;
    if (debug > 0)
      std::cout << "start d=" << d << " r=" << r << " c=" << c << "\n";
    boxPath.insert({r, c, d});
    while (!boxGrid.oob(r, c)) {
      int nr = r + dirs[d].first, nc = c + dirs[d].second;
      if (boxGrid.at(nr, nc) == '#') {
        d = (d + 1) % 4;
        if (debug > 1)
          std::cout << "  hit box at (" << nr << "," << nc << ") new d=" << d
                    << " r=" << r << " c=" << c << "\n";
        continue;
      }
      if (!boxGrid.oob(nr, nc)) {
        const auto rcd = RowColDir{nr, nc, d};
        if (boxPath.find(rcd) != boxPath.end()) {
          ++loopCount;
          if (debug > 0)
            std::cout << "  loop: box=(" << box.first << "," << box.second
                      << ") nr=" << nr << " nc=" << nc << " d=" << d << "\n";
          break;
        } else {
          boxPath.insert(rcd);
        }
      }
      r = nr, c = nc;
    }
    if (debug > 0)
      std::cout << "  end d=" << d << " r=" << r << " c=" << c << "\n";
  }
  // BUG: works on example. returns 1720 for actual but the answer is 1719
  // recheck RowColDir methods and everything about TextGrid
  // create some simple test cases
  std::cout << "part 2: " << loopCount << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto grid = readData(args.filename, args.debug);
  if (args.part1)
    part1(grid, args.debug);
  if (args.part2)
    part2(grid, args.debug);
  return 0;
}