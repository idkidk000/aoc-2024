#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <ios>
#include <iostream>
#include <iterator>
#include <sstream>
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

std::pair<std::vector<std::pair<int, int>>, std::vector<std::vector<int>>>
readData(std::string filename, int debug) {
  std::vector<std::pair<int, int>> rules;
  std::vector<std::vector<int>> updates;
  std::ifstream file(filename);
  int section = 0;
  if (file.is_open()) {
    std::string line, token;
    while (std::getline(file, line)) {
      if (line == "") {
        ++section;
        continue;
      }
      switch (section) {
      case 0: {
        auto split = line.find("|");
        auto left = std::stoi(line.substr(0, split));
        auto right = std::stoi(line.substr(split + 1));
        rules.push_back({left, right});
        if (debug > 1) {
          std::cout << "rule: " << line << " split: " << split
                    << " left: " << left << " right: " << right << "\n";
        }
        break;
      }
      case 1: {
        std::stringstream tokens(line);
        std::vector<int> update;
        while (std::getline(tokens, token, ',')) {
          update.push_back(std::stoi(token));
        }
        if (debug > 1) {
          std::cout << "update:";
          for (auto item : update) {
            std::cout << " " << item;
          }
          std::cout << "\n";
        }
        updates.push_back(update);
      }
      }
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 0) {
    std::cout << "rules size: " << rules.size()
              << "; updates size: " << updates.size() << "\n";
  }
  return {rules, updates};
}

void part1(std::vector<std::pair<int, int>> rules,
           std::vector<std::vector<int>> updates, int debug) {
  int sumMiddle = 0;
  for (const auto &update : updates) {
    bool ok = true;
    for (const auto &rule : rules) {
      auto leftIt = std::find(update.begin(), update.end(), rule.first);
      auto rightIt = std::find(update.begin(), update.end(), rule.second);
      if (leftIt == update.end() || rightIt == update.end()) {
        if (debug > 1)
          std::cout << "rule not matched\n";
        continue;
      }
      auto leftIx = std::distance(update.begin(), leftIt);
      auto rightIx = std::distance(update.begin(), rightIt);
      auto correctOrder = leftIx < rightIx;
      if (debug > 1)
        std::cout << "rule matched leftIx=" << leftIx << " rightIx=" << rightIx
                  << " correct order: " << std::boolalpha << correctOrder
                  << "\n";
      if (!correctOrder) {
        ok = false;
        break;
      }
    }
    if (ok)
      sumMiddle += update[update.size() / 2];
  }
  std::cout << "part 1: " << sumMiddle << "\n";
}

void part2(std::vector<std::pair<int, int>> rules,
           std::vector<std::vector<int>> updates, int debug) {
  // FIXME: this is horrible
  int sumMiddle = 0;
  for (auto &update : updates) {
    bool ok = true;
    for (const auto &rule : rules) {
      auto leftIt = std::find(update.begin(), update.end(), rule.first);
      auto rightIt = std::find(update.begin(), update.end(), rule.second);
      if (leftIt == update.end() || rightIt == update.end()) {
        if (debug > 1)
          std::cout << "rule not matched\n";
        continue;
      }
      auto leftIx = std::distance(update.begin(), leftIt);
      auto rightIx = std::distance(update.begin(), rightIt);
      auto correctOrder = leftIx < rightIx;
      if (debug > 1)
        std::cout << "rule matched leftIx=" << leftIx << " rightIx=" << rightIx
                  << " correct order: " << std::boolalpha << correctOrder
                  << "\n";
      if (!correctOrder) {
        ok = false;
        break;
      }
    }
    if (!ok) {
      bool moved = true;
      while (moved) {
        moved = false;
        // TODO: loop over rules, move elems in update, set moved to true
        for (const auto rule : rules) {
          auto leftIt = std::find(update.begin(), update.end(), rule.first);
          auto rightIt = std::find(update.begin(), update.end(), rule.second);
          if (leftIt == update.end() || rightIt == update.end()) {
            if (debug > 1)
              std::cout << "rule not matched\n";
            continue;
          }
          auto leftIx = std::distance(update.begin(), leftIt);
          auto rightIx = std::distance(update.begin(), rightIt);

          auto correctOrder = leftIx < rightIx;
          if (debug > 1)
            std::cout << "rule matched leftIx=" << leftIx
                      << " rightIx=" << rightIx
                      << " correct order: " << std::boolalpha << correctOrder
                      << "\n";

          if (correctOrder)
            continue;
          if (debug > 0)
            std::cout << "rule: " << rule.first << " before: " << rule.second
                      << "; move " << rule.first << " from ix: " << leftIx
                      << " to before ix: " << rightIx;
          update.erase(leftIt);
          update.insert(rightIt, rule.first);
          moved = true;
        }
      }
      sumMiddle += update[update.size() / 2];
    }
  }
  std::cout << "part 1: " << sumMiddle << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto [rules, updates] = readData(args.filename, args.debug);
  if (args.part1)
    part1(rules, updates, args.debug);
  if (args.part2)
    part2(rules, updates, args.debug);
  return 0;
}