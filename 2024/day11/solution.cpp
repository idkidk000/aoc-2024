#include <cassert>
#include <cmath>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <map>
#include <sstream>
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

std::map<long, long> readData(std::string filename, int debug) {
  std::map<long, long> data;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line, token;
    while (std::getline(file, line)) {
      std::stringstream tokens(line);
      while (std::getline(tokens, token, ' ')) {
        data[std::stol(token)]++;
      }
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    for (const auto [k, v] : data) {
      std::cout << "readData k: " << k << " v: " << v << "\n";
    }
  }
  return data;
}

// byval since we're mutating data
long solve(std::map<long, long> data, int iterations, int debug) {
  for (int i = 0; i < iterations; ++i) {
    // iterate over a copy of data so our iterations counter behaves
    for (const auto &[k, v] : std::map<long, long>(data)) {
      if (debug > 0)
        std::cout << "i: " << i << " k: " << k << " v: " << v << "\n";
      data[k] -= v;
      if (k == 0L) {
        data[1] += v;
      } else {
        const int numDigits = std::log10(k) + 1;
        if (numDigits % 2 == 0) {
          // split k into two values
          const long factor = std::pow(10L, numDigits / 2);
          const long a = k / factor;
          const long b = k - a * factor;
          if (debug > 0)
            std::cout << "  numDigits: " << numDigits << " factor: " << factor
                      << " a: " << a << " b: " << b << "\n";
          data[a] += v;
          data[b] += v;
        } else {
          data[k * 2024L] += v;
        }
      }
    }
  }
  // TODO: is there a cleaner way to do this?
  long count = 0;
  for (const auto [_, v] : data) {
    count += v;
  }
  return count;
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  std::cout << "single iteration: " << solve(data, 1, args.debug) << "\n";
  if (args.part1)
    std::cout << "part 1: " << solve(data, 25, args.debug) << "\n";
  if (args.part2)
    std::cout << "part 2: " << solve(data, 75, args.debug) << "\n";
  return 0;
}