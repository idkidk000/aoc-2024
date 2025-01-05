#include <algorithm>
#include <cassert>
#include <cmath>
#include <cstdio>
#include <cstdlib>
#include <format>
#include <fstream>
#include <functional>
#include <iostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <tuple>
#include <unordered_map>
#include <vector>

const std::unordered_map<int, std::string> INSTRUCTION_NAMES = {
  {0, "adv"}, {1, "bxl"}, {2, "bst"}, {3, "jnz"}, {4, "bxc"}, {5, "out"}, {6, "bdv"}, {7, "cdv"},
};

struct Args {
  std::string filename = "example.txt";
  int debug = 0;
  bool part1 = true;
  bool part2 = true;
};

struct Registers {
  long a, b, c;
};

struct Instruction {
  int ins;
  int par;
};

struct State {
  Registers reg;
  std::vector<Instruction> ins;
};

Args parseArgs(int argc, char *argv[]) {
  Args args;
  // p[n] lambdas are structured like that so clang-format doesn't think they're """complex""" and wrap each map assignment onto 5 lines
  std::unordered_map<std::string, std::function<void()>> argMap = {
    {"-d", [&]() { args.debug = 1; }},
    {"-d1", [&]() { args.debug = 1; }},
    {"-d2", [&]() { args.debug = 2; }},
    {"-d3", [&]() { args.debug = 3; }},
    {"-e", [&]() { args.filename = "example.txt"; }},
    {"-i", [&]() { args.filename = "input.txt"; }},
    {"-p0", [&]() { std::tie(args.part1, args.part2) = std::make_tuple(false, false); }},
    {"-p1", [&]() { std::tie(args.part1, args.part2) = std::make_tuple(true, false); }},
    {"-p2", [&]() { std::tie(args.part1, args.part2) = std::make_tuple(false, true); }},
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

State readData(std::string filename, int debug) {
  State state;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    int section = 0;
    while (std::getline(file, line)) {
      if (line == "") {
        ++section;
        continue;
      };
      switch (section) {
      case 0: {
        const long value = std::stol(line.substr(12));
        switch (line.at(9)) {
        case 'A': state.reg.a = value; break;
        case 'B': state.reg.b = value; break;
        case 'C': state.reg.c = value; break;
        }
        break;
      }
      case 1: {
        std::stringstream tokens(line.substr(9));
        std::string token;
        // yuck
        int i = 0;
        Instruction ins;
        while (std::getline(tokens, token, ',')) {
          if (i % 2 == 0) {
            ins.ins = std::stoi(token);
          } else {
            ins.par = std::stoi(token);
            state.ins.push_back(ins);
            Instruction instruction;
          }
          ++i;
        }
        break;
      }
      }
    }
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << std::format("registers: a: {}; b: {}; c: {}; program:\n", state.reg.a, state.reg.b, state.reg.c);
    for (const auto &i : state.ins)
      std::cout << std::format("  {}: {} ({})\n", i.ins, INSTRUCTION_NAMES.at(i.ins), i.par);
  }
  return state;
}

std::string vIntJoin(std::vector<int> &data, std::string separator = ",") {
  // FIXME: this is atrocious
  std::string result = "";
  for (const auto &i : data) { result += std::to_string(i) + separator; }
  return result.size() > separator.size() ? result.substr(0, result.size() - separator.size()) : result;
}

long combo(int par, Registers &reg) {
  assert(par != 7);
  switch (par) {
  case 4: return reg.a;
  case 5: return reg.b;
  case 6: return reg.c;
  default: return par;
  }
}

std::vector<int> simulate(Registers &reg, std::vector<Instruction> &ins, int debug) {
  std::vector<int> out;
  if (debug > 1)
    std::cout << std::format("execute ins size: {}; registers: a: {}; b: {}; c: {}\n", ins.size(), reg.a, reg.b, reg.c);
  int iptr = 0;
  while (iptr < ins.size() * 2) {
    const auto &in = ins.at(iptr / 2);
    if (debug > 2)
      std::cout << std::format("iptr: {}; ins: {}: {} ({}); a: {}; b: {}; c: {}\n", iptr, in.ins,
                               INSTRUCTION_NAMES.at(in.ins), in.par, reg.a, reg.b, reg.c);
    iptr += 2;
    // a thinkier person might use a map of instruction ints to lamdas to get rid of the switch and reduce loc in a way that clang-format doesn't want to bulldoze
    // clang-format off
    switch (in.ins) {
    case 0: reg.a = reg.a >> combo(in.par, reg); break; // adv
    case 1: reg.b ^= in.par; break; // bxl
    case 2: reg.b = combo(in.par, reg) & 7; break; // bst
    case 3: if (reg.a != 0) iptr = in.par; break; // jnz
    case 4: reg.b = reg.b ^ reg.c; break; // bxc
    case 5: {// out
      const long tmp=combo(in.par, reg) & 7;
      if (debug>1) std::cout << std::format("out: {}\n",tmp);
      out.push_back(tmp);
      break;
    }
    case 6: reg.b = reg.a >> combo(in.par, reg); break; // bdv
    case 7: reg.c = reg.a >> combo(in.par, reg); break; // cdv
    }
    // clang-format on
  }
  return out;
}

void part1(State state, int debug) {
  auto result = simulate(state.reg, state.ins, debug);
  std::cout << "part 1: " << vIntJoin(result) << "\n";
}

void part2(State state, int debug) {
  /*
    each simulation loop
      bst 4: set reg b from rightmost 3 bits of a
      bxl 5: flip bits 0 and 2 on reg b
      cdv 5: set reg c to a>>b (which has a max val of 7)
      adv 3: shift reg a 3 places right
      bxl 6: flip bits 1 and 2 on reg b
      bxc 3: set reg b to b xor c (which could be a large number, though we only care about the last 3 bits so it's kind of a red herring)
      out 5: output rightmost 3 bits of b
      jnz 0: goto 0 if a!=0

    so, the input can be solved a word at a time working right to left
  */

  // full target vec
  std::vector<int> targetFull;
  for (int i = 0; i < state.ins.size(); ++i) {
    targetFull.push_back(state.ins.at(i).ins);
    targetFull.push_back(state.ins.at(i).par);
  }

  // seed inputs
  std::vector<long> inputs, nextInputs;
  for (int i = 0; i < 8; ++i) inputs.push_back(i);

  // loop one word at a time
  // could be refactored to use a deque of a tuple of input and targetIx, but this is easier to read
  for (int targetIx = targetFull.size() - 1; targetIx > -1; --targetIx) {
    std::vector<int> targetPartial;
    for (int i = targetIx; i < targetFull.size(); ++i) targetPartial.push_back(targetFull.at(i));
    if (debug > 0)
      std::cout << std::format("targetIx: {} inputs.size(): {} target: {}\n", targetIx, inputs.size(),
                               vIntJoin(targetPartial));
    for (const auto input : inputs) {
      for (long word = 0; word < 8; ++word) {
        const long newInput = (input << 3) + word;
        Registers reg = {newInput, 0, 0};
        auto result = simulate(reg, state.ins, 0);
        // check result against targetPartial
        bool matches = true;
        for (int i = 0; i < targetPartial.size(); ++i) {
          if (result.size() < i - i || result.at(i) != targetPartial.at(i)) {
            matches = false;
            break;
          };
        };
        if (debug > 1)
          std::cout << std::format("  newInput: {}; result: {}; matches: {}\n", newInput, vIntJoin(result), matches);
        // and push newInput to nextInputs if match
        if (matches) nextInputs.push_back(newInput);
      }
    }
    if (nextInputs.size() == 0) {
      // either unsolvable (example.txt) or bug
      std::cout << "err: next inputs is empty\n";
    }
    inputs = nextInputs;
    nextInputs.clear();
  }
  // result is the smallest input
  std::sort(inputs.begin(), inputs.end());
  std::cout << std::format("part 2: {}\n", inputs.at(0));
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto state = readData(args.filename, args.debug);
  if (args.part1) part1(state, args.debug);
  if (args.part2) part2(state, args.debug);
  return 0;
}