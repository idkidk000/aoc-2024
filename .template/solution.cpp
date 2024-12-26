#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
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

std::pair<std::vector<int>, std::vector<int>> readData(std::string filename,
                                                       int debug) {
  std::vector<int> left;
  std::vector<int> right;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    while (std::getline(file, line)) {
      left.push_back(std::stoi(line.substr(0, 5)));
      right.push_back(std::stoi(line.substr(8, 5)));
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "left len: " << left.size() << " first: " << left.at(0)
              << "\n";
    std::cout << "right len: " << right.size() << " first: " << right.at(0)
              << "\n";
  }
  return {left, right};
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto [left, right] = readData(args.filename, args.debug);
  // if (args.part1)
  //   part1(left, right, args.debug);
  // if (args.part2)
  //   part2(left, right, args.debug);
  return 0;
}