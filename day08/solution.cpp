#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <ios>
#include <iostream>
#include <map>
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
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    while (std::getline(file, line)) {
      data.data += line;
      if (data.cols == 0) {
        data.cols = line.size();
      }
    }
    file.close();
    data.rows = data.data.size() / data.cols;
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

int solve(TextGrid &data, bool p2, int debug) {
  std::map<char, std::vector<std::pair<int, int>>> frequencies;
  for (const auto frequency : data.unique()) {
    if (frequency == '.')
      continue;
    frequencies[frequency] = data.findAll(frequency);
  };
  std::set<std::pair<int, int>> distinctAntinodes;
  for (const auto [frequency, antennas] : frequencies) {
    if (debug > 0) {
      std::cout << frequency << ":";
      for (const auto ant : antennas) {
        std::cout << " " << ant.first << "," << ant.second;
      }
      std::cout << "\n";
    }
    for (const auto left : antennas) {
      for (const auto right : antennas) {
        // discard on same or left>right to prevent duplicate antenna pairs
        if (left == right || left > right)
          continue;
        if (debug > 0)
          std::cout << "  l: " << left.first << "," << left.second
                    << " r: " << right.first << "," << right.second << "\n";
        int deltaR = right.first - left.first,
            deltaC = right.second - left.second;
        std::set<std::pair<int, int>> antinodes;
        if (p2) {
          int nr = left.first, nc = left.second;
          while (!data.oob(nr, nc)) {
            antinodes.insert({nr, nc});
            nr -= deltaR;
            nc -= deltaC;
          }
          nr = right.first, nc = right.second;
          while (!data.oob(nr, nc)) {
            antinodes.insert({nr, nc});
            nr += deltaR;
            nc += deltaC;
          }
        } else {
          antinodes.insert({left.first - deltaR, left.second - deltaC});
          antinodes.insert({right.first + deltaR, right.second + deltaC});
        };
        for (const auto antinode : antinodes) {
          if (debug > 1) {
            std::cout << "    " << antinode.first << "," << antinode.second
                      << " oob: " << std::boolalpha
                      << data.oob(antinode.first, antinode.second) << "\n";
          }
          if (!data.oob(antinode.first, antinode.second)) {
            distinctAntinodes.insert(antinode);
          }
        }
      }
    }
  }
  return distinctAntinodes.size();
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  if (args.part1)
    std::cout << "part 1: " << solve(data, false, args.debug) << "\n";
  if (args.part2)
    std::cout << "part 2: " << solve(data, true, args.debug) << "\n";
  return 0;
}