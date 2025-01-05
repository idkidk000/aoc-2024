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

void solve(TextGrid &data, Args args) {
  const std::vector<std::pair<int, int>> starts = data.findAll('0');
  std::deque<std::vector<std::pair<int, int>>> paths;
  for (const auto start : starts) {
    paths.push_back({{start}});
  }
  std::array<std::pair<int, int>, 4> dirs = {{
      {-1, 0},
      {0, 1},
      {1, 0},
      {0, -1},
  }};
  // distinct count of start pos and end pos for part 1
  std::set<std::pair<std::pair<int, int>, std::pair<int, int>>> trails;
  // just a count of completed trails for part 2
  int countNines = 0;
  while (!paths.empty()) {
    // two separate operations in c++
    const auto path = paths.front();
    paths.pop_front();
    const auto [r, c] = path.back();
    const auto thisChar = data.at(r, c);
    const char nextChar = thisChar + 1;
    for (const auto d : dirs) {
      const int nr = r + d.first, nc = c + d.second;
      if (data.at(nr, nc) == nextChar) {
        if (nextChar == '9') {
          // completed
          trails.insert({path.front(), {nr, nc}});
          ++countNines;
        } else {
          // copy constuctor since there could be multiple branches of path
          std::vector<std::pair<int, int>> nextPath = path;
          nextPath.push_back({nr, nc});
          paths.push_back(nextPath);
        }
      }
    }
  }
  if (args.part1)
    std::cout << "part 1: " << trails.size();
  if (args.part2)
    std::cout << "part 2: " << countNines;
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  solve(data, args);
  return 0;
}