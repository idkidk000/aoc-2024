#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>

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

void part1(TextGrid grid, int debug) {
  std::array<std::pair<int, int>, 8> directions = {{
      {-1, 0},
      {-1, 1},
      {0, 1},
      {1, 1},
      {1, 0},
      {1, -1},
      {0, -1},
      {-1, -1},
  }};
  std::array<char, 4> chars = {
      'X',
      'M',
      'A',
      'S',
  };
  int count = 0;
  for (int r = 0; r < grid.rows; ++r) {
    for (int c = 0; c < grid.cols; ++c) {
      if (debug > 1)
        std::cout << "r=" << r << " c=" << c << " at=" << grid.at(r, c) << "\n";
      if (grid.at(r, c) != chars[0])
        continue;
      for (int d = 0; d < 8; ++d) {
        bool match = true;
        for (int i = 1; i < chars.size(); ++i) {
          int nr = r + directions[d].first * i;
          int nc = c + directions[d].second * i;
          char val = grid.at(nr, nc);
          if (debug > 2)
            std::cout << "r=" << r << " c=" << c << " d=" << d << " i=" << i
                      << " nr=" << nr << " nc=" << nc << " val=" << val
                      << " chars[i]=" << chars[i] << "\n";
          if (val != chars[i]) {
            match = false;
            break;
          }
        }
        if (match) {
          ++count;
          if (debug > 0)
            std::cout << "match r=" << r << " c=" << c << " d=" << d << "\n";
        }
      }
    }
  }
  std::cout << "part 1: " << count << "\n";
}

void part2(TextGrid grid, int debug) {
  int count = 0;
  for (int r = 0; r < grid.rows; ++r) {
    for (int c = 0; c < grid.cols; ++c) {
      if (grid.at(r, c) != 'A')
        continue;
      char c00 = grid.at(r - 1, c - 1);
      char c01 = grid.at(r + 1, c + 1);
      char c10 = grid.at(r - 1, c + 1);
      char c11 = grid.at(r + 1, c - 1);
      if (((c00 == 'M' && c01 == 'S') || (c00 == 'S' && c01 == 'M')) &&
          ((c10 == 'M' && c11 == 'S') || (c10 == 'S' && c11 == 'M'))) {
        if (debug > 0)
          std::cout << "match r=" << r << " c=" << c << "\n";
        ++count;
      };
    }
  }
  std::cout << "part 2: " << count << "\n";
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