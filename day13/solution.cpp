#include <cassert>
#include <cmath>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <regex>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

struct Args {
  std::string filename = "example.txt";
  int debug = 0;
  bool part1 = true;
  bool part2 = true;
};

struct Coord {
  double x, y;
};

struct Machine {
  Coord a;
  Coord b;
  Coord p;
};

// make std::cout << machine work
std::ostream &operator<<(std::ostream &os, const Machine &machine) {
  os << "a: " << machine.a.x << "," << machine.a.y << " "
     << "b: " << machine.b.x << "," << machine.b.y << " "
     << "p: " << machine.p.x << "," << machine.p.y;
  return os;
}

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

std::vector<Machine> readData(std::string filename, int debug) {
  std::vector<Machine> data;
  std::ifstream file(filename);
  if (file.is_open()) {
    // read the whole file in one go
    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string content = buffer.str();
    // parse with regex
    std::regex expression(
        R"(Button (A): X\+(\d+), Y\+(\d+)\nButton (B): X\+(\d+), Y\+(\d+)\n(P)rize: X=(\d+), Y=(\d+))");
    std::sregex_iterator begin(content.begin(), content.end(), expression);
    std::sregex_iterator end;
    for (auto it = begin; it != end; ++it) {
      std::smatch match = *it;
      // match has 9 capture groups, 3 per row of: [ABP] X Y
      if (debug > 1) {
        std::cout << "capture: ";
        for (const auto i : match) {
          std::cout << "  " << i.str() << "\n";
        }
      }
      // FIXME: why is clangd doing 4 space indents here
      const Machine machine = {
          {
              std::stof(match[2].str()),
              std::stof(match[3].str()),
          },
          {
              std::stof(match[5].str()),
              std::stof(match[6].str()),
          },
          {
              std::stof(match[8].str()),
              std::stof(match[9].str()),
          },
      };
      if (debug > 0) {
        std::cout << machine << "\n";
      }
      data.push_back(machine);
    }

  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "data size: " << data.size() << "\n";
  }
  return data;
}

// offset only makes sense as an integer and will be implicitly converted to a
// double
long solve(std::vector<Machine> &data, long offset, int debug) {
  // total is an integer
  long total = 0;
  for (const auto m : data) {
    /*
      intersect two lines
        a from 0,0 with vector a
        b from p with vector -b
      solve for multiples of vector distance
      succeeds when both are integer
      cost is [a presses]*3+[b presses]
    */
    double pressesA = ((m.p.x + offset) * m.b.y - (m.p.y + offset) * m.b.x) /
                      (m.a.x * m.b.y - m.a.y * m.b.x);
    double pressesB = ((m.p.x + offset) - pressesA * m.a.x) / m.b.x;
    // modf works directly with doubles
    double pressesAInt, pressesBInt;
    double pressesAFrac = std::modf(pressesA, &pressesAInt);
    double pressesBFrac = std::modf(pressesB, &pressesBInt);
    if (debug > 0) {
      std::cout << m << " pressesA: " << pressesA << " pressesB: " << pressesB
                << "\n";
      std::cout << "  pressesAFrac: " << pressesAFrac
                << " pressesBFrac: " << pressesBFrac << "\n";
    }
    if (pressesAFrac == 0 && pressesBFrac == 0) {
      total += pressesAInt * 3 + pressesBInt;
      ;
    }
  }
  return total;
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  if (args.part1)
    std::cout << "part 1: " << solve(data, 0, args.debug) << "\n";
  if (args.part1)
    std::cout << "part 2: " << solve(data, 10000000000000, args.debug) << "\n";
  return 0;
}