#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
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

std::vector<std::vector<int>> readData(std::string filename, unsigned debug) {
  std::vector<std::vector<int>> data;

  std::ifstream file(filename);
  if (file.is_open()) {
  std:
    std::string line;
    while (std::getline(file, line)) {
      std::vector<int> report;
      std::stringstream tokens(line);
      std::string token;
      while (getline(tokens, token, ' ')) {
        report.push_back(std::stoi(token));
      }
      data.push_back(report);
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "data len: " << data.size() << " first: " << data.at(0).at(0)
              << "\n";
  }
  return data;
}

void part1(std::vector<std::vector<int>> data, unsigned debug) {
  int countSafe = 0;
  for (const auto report : data) {
    std::vector<int> deltas;
    for (int i = 1; i < report.size(); i++) {
      deltas.push_back(report[i] - report[i - 1]);
    }
    const bool isSafe = std::all_of(deltas.begin(), deltas.end(), [&](int x) {
      return (x >= 0 == deltas[0] >= 0) &&
             ((-3 <= x && x < 0) || (0 < x && x <= 3));
    });
    if (isSafe)
      countSafe++;
    if (debug > 0) {
      std::cout << "delta: ";
      for (const auto delta : deltas) {
        std::cout << delta << " ";
      }
      std::cout << "safe: " << isSafe << "\n";
    }
  }
  std::cout << "part 1: " << countSafe << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  part1(data, args.debug);
  // part2(data, args.debug);
  return 0;
}