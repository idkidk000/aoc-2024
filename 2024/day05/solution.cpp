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

struct IteratorAndIndex {
  std::vector<int>::iterator iterator;
  int index;
};

struct OrderingRule {
  int before;
  int after;
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

std::pair<std::vector<OrderingRule>, std::vector<std::vector<int>>>
readData(std::string filename, int debug) {
  std::vector<OrderingRule> rules;
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
        auto before = std::stoi(line.substr(0, split));
        auto after = std::stoi(line.substr(split + 1));
        rules.push_back({before, after});
        if (debug > 1) {
          std::cout << "rule: " << line << " split: " << split
                    << " before: " << before << " after: " << after << "\n";
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

IteratorAndIndex indexOf(std::vector<int> &vec, int val) {
  auto it = std::find(vec.begin(), vec.end(), val);
  if (it == vec.end())
    return {it, -1};
  int ix = std::distance(vec.begin(), it);
  return {it, ix};
}

void part1(std::vector<OrderingRule> &rules,
           std::vector<std::vector<int>> &updates, int debug) {
  int sumMiddle = 0;
  for (auto &update : updates) {
    bool ok = true;
    for (const auto &rule : rules) {
      auto beforeIx = indexOf(update, rule.before).index;
      auto afterIx = indexOf(update, rule.after).index;
      if (!(beforeIx == -1 || afterIx == -1 || beforeIx < afterIx)) {
        if (debug > 1)
          std::cout << "incorrect order beforeIx=" << beforeIx
                    << " afterIx=" << afterIx << "\n";
        ok = false;
        break;
      }
    }
    if (ok)
      sumMiddle += update[update.size() / 2];
  }
  std::cout << "part 1: " << sumMiddle << "\n";
}

void part2(std::vector<OrderingRule> &rules,
           std::vector<std::vector<int>> &updates, int debug) {
  int sumMiddle = 0;
  for (auto &update : updates) {
    bool ok = true;
    std::vector<OrderingRule> applicableRules;
    for (const auto &rule : rules) {
      auto beforeIx = indexOf(update, rule.before).index;
      auto afterIx = indexOf(update, rule.after).index;
      auto matched = beforeIx != -1 && afterIx != -1;
      auto correctOrder = beforeIx == -1 || afterIx == -1 || beforeIx < afterIx;
      if (matched && debug > 1) {
        std::cout << "rule matched: " << std::boolalpha << matched
                  << " correctOrder: " << std::boolalpha << correctOrder
                  << " beforeIx: " << beforeIx << " afterIx: " << afterIx
                  << "\n";
      }
      if (matched)
        applicableRules.push_back(rule);
      if (!correctOrder) {
        ok = false;
        // DO NOT BREAK OUT EARLY - need to finish building applicableRules
      }
    }
    if (!ok) {
      if (debug > 0) {
        std::cout << "applicable rules:\n";
        for (const auto &rule : rules) {
          std::cout << "before: " << rule.before << " after: " << rule.after
                    << "\n";
        }
      }
      bool moved = true;
      int loopCount = 0;
      while (moved) {
        if (debug > 1)
          std::cout << "loopCount" << loopCount << "\n";
        moved = false;
        // loop over only the applicable subset of rules to be a bit less
        // horrible
        // there's almost certainly a better way of doing this
        for (const auto &rule : applicableRules) {
          auto before = indexOf(update, rule.before);
          auto after = indexOf(update, rule.after);
          // don't need -1 check
          if (debug > 0)
            std::cout << "rule: before: " << rule.before
                      << " after: " << rule.after
                      << " correct: " << std::boolalpha
                      << (before.index < after.index) << "\n";
          if (before.index < after.index)
            continue;
          if (debug > 0) {
            std::cout << "before move: ";
            for (const auto i : update) {
              std::cout << " " << i;
            }
            std::cout << "\n";
            std::cout << "move from ix: " << before.index
                      << " to before ix: " << after.index << "\n";
          }

          assert(before.index > -1 && after.index > -1);

          // delete first, since before is incorrectly to the right of after
          update.erase(before.iterator);
          update.insert(after.iterator, rule.before);
          moved = true;
          if (debug > 0) {
            std::cout << "after move: ";
            for (const auto i : update) {
              std::cout << " " << i;
            }
            std::cout << "\n";
          }
        }
        ++loopCount;
      }
      sumMiddle += update[update.size() / 2];
    }
  }
  std::cout << "part 2: " << sumMiddle << "\n";
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