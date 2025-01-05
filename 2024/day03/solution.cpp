#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <regex>
#include <stdexcept>
#include <string>
#include <unordered_map>

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

std::string readData(std::string filename, int debug) {
  std::string data;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    while (std::getline(file, line)) {
      data += line;
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "data size: " << data.size()
              << " first 20 chars: " << data.substr(0, 20) << "\n";
  }
  return data;
}

void part1(std::string data, int debug) {
  std::regex expression(R"(mul\((\d+),(\d+)\))");
  std::sregex_iterator begin(data.begin(), data.end(), expression);
  std::sregex_iterator end;
  int total = 0;
  for (auto it = begin; it != end; ++it) {
    std::smatch match = *it;
    if (debug > 0)
      std::cout << "match: " << match[0].str() << "\n";
    total += std::stoi(match[1].str()) * std::stoi(match[2].str());
  }
  if (debug > 0)
    std::cout << "iterator end\n";
  std::cout << "part 1: " << total << "\n";
}

void part2(std::string data, int debug) {
  std::regex expression(R"(do\(\)|don't\(\)|mul\((\d+),(\d+)\))");
  std::sregex_iterator begin(data.begin(), data.end(), expression);
  std::sregex_iterator end;
  int total = 0;
  bool enable = true;
  for (auto it = begin; it != end; ++it) {
    std::smatch match = *it;
    if (debug > 0)
      std::cout << "match: " << match[0].str() << "\n";
    if (match[0].str() == "do()") {
      enable = true;
    } else if (match[0].str() == "don't()") {
      enable = false;
    } else if (enable) {
      total += std::stoi(match[1].str()) * std::stoi(match[2].str());
    }
  }
  if (debug > 0)
    std::cout << "iterator end\n";
  std::cout << "part 2: " << total << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  if (args.part1)
    part1(data, args.debug);
  if (args.part2)
    part2(data, args.debug);
  return 0;
}