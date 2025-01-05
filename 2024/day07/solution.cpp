#include <cassert>
#include <climits>
#include <cmath>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <ios>
#include <iostream>
#include <set>
#include <sstream>
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

std::vector<std::pair<long, std::vector<long>>> readData(std::string filename,
                                                         int debug) {
  std::vector<std::pair<long, std::vector<long>>> data;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line, token;
    while (std::getline(file, line)) {
      int sepIx = line.find(':');
      if (debug > 1)
        std::cout << "line: " << line << " sepIx: " << sepIx << "\n";
      long target = std::stol(line.substr(0, sepIx));
      if (debug > 1)
        std::cout << "target: " << target << " values:";
      std::stringstream tokens(line.substr(sepIx + 2));
      std::vector<long> operands;
      while (std::getline(tokens, token, ' ')) {
        long operand = std::stol(token);
        if (debug > 1)
          std::cout << " " << operand;
        operands.push_back(operand);
      }
      if (debug > 1)
        std::cout << " size: " << operands.size() << "\n";
      data.push_back({target, operands});
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 0) {
    std::cout << "data size: " << data.size() << "\n";
  }
  return data;
}

long solve(std::vector<std::pair<long, std::vector<long>>> &data, bool concat,
           int debug) {
  long total = 0;
  // unordered is way faster
  // std::set<long> values, nextValues;
  std::unordered_set<long> values, nextValues;
  for (auto [target, operands] : data) {
    if (debug > 0) {
      std::cout << "target: " << target << " operands:";
      for (const auto operand : operands) {
        std::cout << " " << operand;
      }
      std::cout << "\n";
    }
    // popleft
    values = {operands[0]};
    operands.erase(operands.begin());
    for (const auto operand : operands) {
      // clear before each run since we're reusing it
      nextValues.clear();
      for (const auto value : values) {
        nextValues.insert(value * operand);
        nextValues.insert(value + operand);
        if (concat) {
          // wow this is SLOW
          // nextValues.insert(
          //     std::stol(std::to_string(value) + std::to_string(operand)));
          // less smoothbrain approach but it's barely faster
          const long operandDigits = std::log10(operand) + 1L;
          const long multiplier = std::pow(10L, operandDigits);
          const long concatValue = value * multiplier + operand;
          if (debug > 1)
            std::cout << "concat " << value << ", " << operand
                      << "; digits: " << operandDigits
                      << "; multiplier: " << multiplier
                      << " result: " << concatValue << "\n";
          nextValues.insert(concatValue);
        };
      }
      values = nextValues;
    }
    // add target to total if matched
    const bool matched = values.find(target) != values.end();
    if (debug > 1) {
      std::cout << "  ";
      for (const auto value : values) {
        std::cout << " " << value;
      }
      std::cout << " matched: " << std::boolalpha << matched << "\n";
    }
    if (matched)
      total += target;
  }
  return total;
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  if (args.part1) {
    std::cout << "part 1: " << solve(data, false, args.debug) << "\n";
  }
  if (args.part2) {
    std::cout << "part 2: " << solve(data, true, args.debug) << "\n";
  }
  return 0;
}