#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <map>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

struct Args {
  unsigned debug;
  std::string filename;
};

Args parseArgs(int argc, char *argv[]) {
  Args args;
  args.debug = 0;
  args.filename = "example.txt";

  std::unordered_map<std::string, std::function<void()>> commandMap = {
      {"-i", [&]() { args.filename = "input.txt"; }},
      {"-d", [&]() { args.debug = 1; }},
      {"-d2", [&]() { args.debug = 2; }},
      {"-d3", [&]() { args.debug = 3; }}};

  for (int i = 1; i < argc; ++i) {
    std::string arg = argv[i];

    if (arg.rfind("-e", 0) == 0 && arg.size() > 2) {
      args.filename = "example" + arg.substr(2) + ".txt";
    } else if (commandMap.find(arg) != commandMap.end()) {
      commandMap[arg](); // Execute the associated action
    } else {
      throw std::runtime_error("unknown arg: " + arg);
    }
  }
  std::cout << "debug = " << args.debug << "\n";
  std::cout << "filename = " << args.filename << "\n";
  return args;
}

std::pair<std::vector<int>, std::vector<int>> readData(std::string filename,
                                                       unsigned debug) {
  std::vector<int> left;
  std::vector<int> right;

  std::ifstream file(filename);
  if (file.is_open()) {
  std:
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

void part1(std::vector<int> left, std::vector<int> right, unsigned debug) {
  std::sort(left.begin(), left.end());
  std::sort(right.begin(), right.end());
  if (debug > 1) {
    std::cout << "sorted left len: " << left.size() << " first: " << left.at(0)
              << "\n";
    std::cout << "sorted right len: " << right.size()
              << " first: " << right.at(0) << "\n";
  }
  assert(left.size() == right.size());
  int sumDistances = 0;
  for (int i = 0; i < left.size(); i++) {
    sumDistances += std::abs(left.at(i) - right.at(i));
  };
  std::cout << "part 1: " << sumDistances << "\n";
}

void part2(std::vector<int> left, std::vector<int> right, unsigned debug) {
  // map of distinct right values and their counts
  std::map<int, int> rightCounts;
  for (const int value : right) {
    if (rightCounts.find(value) == rightCounts.end()) {
      rightCounts.insert_or_assign(value, 1);
    } else {
      rightCounts[value]++;
    }
  }
  if (debug > 0) {
    std::cout << "rightCounts size: " << rightCounts.size() << "\n";
  }
  // sum (left * right count or 0)
  int sumSimilarities = 0;
  for (const int value : left) {
    if (rightCounts.find(value) != rightCounts.end()) {
      sumSimilarities += value * rightCounts[value];
    }
  }
  std::cout << "part 2: " << sumSimilarities << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto [left, right] = readData(args.filename, args.debug);
  part1(left, right, args.debug);
  part2(left, right, args.debug);
  return 0;
}