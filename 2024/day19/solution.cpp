#include <cassert>
#include <climits>
#include <cstddef>
#include <cstdlib>
#include <deque>
#include <format>
#include <fstream>
#include <functional>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>

struct Args {
  std::string filename = "example.txt";
  int debug = 0;
  bool part1 = true;
  bool part2 = true;
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

std::pair<std::unordered_set<std::string>, std::unordered_set<std::string>> readData(std::string filename, int debug) {
  std::unordered_set<std::string> components;
  std::unordered_set<std::string> targets;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line, token;
    int section = 0;
    while (std::getline(file, line)) {
      if (debug > 1) std::cout << std::format("section: {}; line: {}\n", section, line);
      if (line == "") {
        ++section;
        continue;
      };
      switch (section) {
      case 0: {
        //extremely grim
        int spaceIx;
        while ((spaceIx = line.find(' ')) != std::string::npos) line.replace(spaceIx, 1, "");
        std::stringstream tokens(line);
        while (std::getline(tokens, token, ',')) components.insert(token);
        break;
      }
      case 1: targets.insert(line);
      }
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  switch (debug) {
  case 1: std::cout << std::format("components: {}; targets: {};\n", components.size(), targets.size()); break;
  case 2:
  case 3: {
    std::cout << "components:\n";
    for (const auto &i : components) std::cout << "  " << i << "\n";
    std::cout << "targets:\n";
    for (const auto &i : targets) std::cout << "  " << i << "\n";
  }
  }
  return {components, targets};
}

void part1(std::unordered_set<std::string> &components, std::unordered_set<std::string> &targets, int debug) {
  int countPossible = 0;
  size_t maxSize = 0;
  for (const auto &i : components) maxSize = std::max(maxSize, i.size());

  for (const std::string target : targets) {
    std::deque<std::string> partials = {""};
    bool possible = false;
    while (partials.size() > 0 && !possible) {

      // TODO: as much byref as possible
      const std::string partial = partials.front();
      partials.pop_front();

      if (debug > 1)
        std::cout << std::format("target: {}; size: {}; partial: {}; size: {}; maxSize: {}\n", target, target.size(),
                                 partial, partial.size(), maxSize);
      for (int i = 1; i <= std::min(maxSize, target.size() - partial.size()); ++i) {
        const auto search = target.substr(partial.size(), i);
        const bool found = components.contains(search);
        const bool matches = found ? partial + search == target : false;
        if (debug > 1 || (debug > 0 && matches))
          std::cout << std::format("target: {}; partial: {}; i: {}; search: {}; found: {}; matches: {}\n", target,
                                   partial, i, search, found, matches);
        if (matches) {
          possible = true;
          break;
        } else if (found) {
          const std::string nextPartial = partial + search;
          // a set might have been better
          if (std::find(partials.begin(), partials.end(), nextPartial) != partials.end()) {
            if (debug > 1) std::cout << "not inserting duplicate: " << nextPartial << "\n";
          } else {
            if (debug > 1) std::cout << "insert: " << nextPartial << "\n";
            partials.push_back(nextPartial);
          }
        }
      }
      if (possible) {
        ++countPossible;
        break;
      }
      if (debug > 1) std::cout << "partials size: " << partials.size() << "\n";
    }
  }
  std::cout << "part 1: " << countPossible << "\n";
}

long countMatches(std::unordered_set<std::string> &components, std::unordered_map<std::string, long> &cache,
                  size_t &maxSize, std::string search, int debug) {
  if (cache.contains(search)) return cache.at(search);
  long count = 0;
  for (size_t i = 1; i <= std::min(maxSize, search.size()); ++i) {
    const std::string first = search.substr(0, i), second = search.substr(i);
    const bool isComponent = components.contains(first);
    if (debug > 2)
      std::cout << std::format("search: {}; i: {}; first: {} ({}); second: {} ({}); isComponent: {}\n", search, i,
                               first, first.size(), second, second.size(), isComponent);
    if (isComponent) count += second.size() == 0 ? 1 : countMatches(components, cache, maxSize, second, debug);
  }
  if (debug > 1) std::cout << std::format("search: {}; count: {}\n", search, count);
  cache[search] = count;
  return count;
}

void part2(std::unordered_set<std::string> &components, std::unordered_set<std::string> &targets, int debug) {
  /*
    this is the hard part
    i think the key was caching and trying to match much longer strings
    define a map<string,int>
    define a recursive function which accepts strings of any length and returns immediately from the map if found
    otherwise, match in style similar to p1 but track the combos so they can be counted and added to the map
  */
  long count = 0;
  std::unordered_map<std::string, long> cache;
  size_t maxSize = 0;
  for (const auto &i : components) maxSize = std::max(maxSize, i.size());
  for (const std::string target : targets) count += countMatches(components, cache, maxSize, target, debug);
  std::cout << "part 2: " << count << "\n";
}

int main(int argc, char *argv[]) {
  const auto &args = parseArgs(argc, argv);
  auto [components, targets] = readData(args.filename, args.debug);
  if (args.part1) part1(components, targets, args.debug);
  if (args.part2) part2(components, targets, args.debug);
  return 0;
}