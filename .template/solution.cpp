#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <ostream>
#include <set>
#include <stdexcept>
#include <string>
#include <vector>

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
    if (arg.find("-d", 0) == 0)
      args.debug = arg.size() > 2 ? std::stoi(arg.substr(2)) : 1;
    else if (arg.find("-e", 0) == 0)
      args.filename = "example" + (arg.size() > 2 ? arg.substr(2) : "") + ".txt";
    else if (arg.find("-p", 0) == 0 && arg.size() == 3)
      args.part1 = arg.substr(2) == "1", args.part2 = arg.substr(2) == "2";
    else
      throw std::runtime_error("unknown arg: " + arg);
  }
  std::cout << args << "\n";
  return args;
}

TextGrid readData(std::string filename, int debug) {
  TextGrid grid;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    while (std::getline(file, line)) grid.load(line);
    file.close();
    if (debug > 1) std::cout << "grid: " << grid << "\n";
    return grid;
  }
  throw std::runtime_error("cannot open: " + filename);
}

void solve(TextGrid &grid, Args) {}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto grid = readData(args.filename, args.debug);
  solve(grid, args);
  return 0;
}