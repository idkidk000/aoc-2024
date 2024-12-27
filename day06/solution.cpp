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
  int boxRow = -1;
  int boxCol = -1;
  char at(int row, int col) {
    if (oob(row, col))
      return ' ';
    if (row == boxRow && col == boxCol)
      return '#';
    return data.at(row * cols + col);
  }
  std::pair<int, int> find(char c) {
    // for finding start/end pos
    const int ix = data.find(c);
    return {ix / cols, ix % cols};
  }
  bool oob(int row, int col) {
    return row < 0 || row >= rows || col < 0 || col >= cols;
  };
  // lightweight alternative to creating a new instance and copying/replacing
  // string data
  void box(int row = -1, int col = -1) { boxRow = row, boxCol = col; }
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
      continue;
    }
    if (!grid.oob(nr, nc))
      boxLocations.insert({nr, nc});
    r = nr, c = nc;
  };
  int loopCount = 0;
  // boxLocations.clear();
  // // boxLocations.insert({55, 85});
  boxLocations.insert({55, 86});
  for (auto box : boxLocations) {
    // DO NOT THE START
    if (box.first == start.first && box.second == start.second)
      continue;
    debug = (box.first == 55 && box.second == 86) ? 3 : 0;
    // add a pseudo box to grid
    grid.box(box.first, box.second);
    // store a history of r,c,d so we can determine if we're in a loop
    std::set<RowColDir> boxPath;
    // reset to start
    int d = 0, r = start.first, c = start.second;
    boxPath.insert({r, c, d});
    if (debug > 0)
      std::cout << "box=(" << box.first << "," << box.second
                << ") boxGrid.at=" << grid.at(box.first, box.second) << "\n";
    while (!grid.oob(r, c)) {
      int nr = r + dirs[d].first, nc = c + dirs[d].second;
      // turn or advance
      if (grid.at(nr, nc) == '#') {
        d = (d + 1) % 4;
        if (debug > 1)
          std::cout << "  hit box at (" << nr << "," << nc << ") new d=" << d
                    << " r=" << r << " c=" << c << "\n";
      } else {
        r = nr, c = nc;
      }
      // loop check
      const auto rcd = RowColDir{r, c, d};
      if (boxPath.find(rcd) != boxPath.end()) {
        if (debug > 0)
          std::cout << "  loop: box=(" << box.first << "," << box.second
                    << ") nr=" << nr << " nc=" << nc << " d=" << d << "\n";
        ++loopCount;
        break;
      }
      // add new rcd to path
      boxPath.insert(rcd);
    }
    if (debug > 0)
      std::cout << "  end d=" << d << " r=" << r << " c=" << c << "\n";
  }
  /*
    fixed bug:
      start position was correctly ommitted from boxLocations on create but was
    added during initial walk (albeit in a different direction)
      it is invalid to put a box at the start position, but it does result in a
    loop if you don't check for it before the walk
  */
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