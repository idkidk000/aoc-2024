#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
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
      if (data.cols == 0)
        data.cols = line.size();
    }
    data.rows = data.data.size() / data.cols;
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "rows: " << data.rows << " cols: " << data.cols << " size: " << data.data.size() << " at(0,0): " << data.at(0, 0) << "\n";
  }
  return data;
}

void solve(TextGrid &grid, Args) {}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  solve(data, args);
  return 0;
}