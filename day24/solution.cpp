#include <cassert>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <ostream>
#include <sstream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <vector>

#pragma region template
struct Args {
  std::string filename = "input.txt";
  int debug = 0;
  bool part1 = true, part2 = true;
};

//still waiting to find out that these very normal functions do exist in std but have silly names
template <typename T> bool in(T val, std::vector<T> vec) { return std::find(vec.begin(), vec.end(), val) != vec.end(); }
template <typename T> std::string join(std::vector<T> vec, std::string sep = ",") {
  std::string result = "";
  for (const auto &v : vec) {
    if constexpr (std::is_convertible_v<T, std::string>)
      result += v + sep;
    else
      result += std::to_string(v) + sep;
  }
  return result.size() > sep.size() ? result.substr(0, result.size() - sep.size()) : result;
}
std::vector<std::string> split(std::string val, char sep = ' ') {
  std::vector<std::string> result = {};
  std::stringstream tokens(val);
  std::string token;
  while (std::getline(tokens, token, sep)) result.push_back(token);
  return result;
}
std::string replaceAll(std::string val, std::string find, std::string replace) {
  std::string result = "";
  int li = 0;
  for (size_t i = val.find(find); i != std::string::npos; i = val.find(find, li))
    result += val.substr(li, i), li = i + find.size();
  result += val.substr(li);
  return result;
}

//std::cout
std::ostream &operator<<(std::ostream &os, const Args &v) {
  return os << v.filename << "; debug=" << v.debug << "; part 1: " << (v.part1 ? "true" : "false")
            << "; part 2: " << (v.part2 ? "true" : "false");
}

Args parseArgs(int argc, char *argv[]) {
  Args args;
  for (int i = 1; i < argc; ++i) {
    const std::string arg = argv[i];
    if (arg.find("-d") == 0)
      args.debug = arg.size() > 2 ? std::stoi(arg.substr(2)) : 1;
    else if (arg.find("-e") == 0)
      args.filename = "example" + (arg.size() > 2 ? arg.substr(2) : "") + ".txt";
    else if (arg.find("-p") == 0 && arg.size() == 3)
      args.part1 = arg.substr(2) == "1", args.part2 = arg.substr(2) == "2";
    else
      throw std::runtime_error("unknown arg: " + arg);
  }
  std::cout << args << "\n";
  return args;
}
#pragma endregion

enum GateType {
  AND,
  OR,
  XOR,
};

struct Gate {
  GateType t;
  std::string a, b;
};

struct State {
  std::unordered_map<std::string, bool> inputs;
  std::unordered_map<std::string, Gate> gates;
};

State readData(std::string filename, int debug) {
  State state;
  std::ifstream file(filename);
  if (!file.is_open()) throw std::runtime_error("cannot open: " + filename);
  std::string line;
  int section = 0;
  std::unordered_map<std::string, GateType> gateTypes = {{"AND", AND}, {"OR", OR}, {"XOR", XOR}};
  while (std::getline(file, line)) {
    if (debug > 1) std::cout << "line: " << line << "\n";
    switch (section) {
    case 0: {
      if (line == "") {
        ++section;
        continue;
      }
      line = replaceAll(line, ":", "");
      const auto &parts = split(line, ' ');
      state.inputs[parts[0]] = (bool)std::stoi(parts[1]);
      break;
    }
    case 1: {
      line = replaceAll(line, "-> ", "");
      if (debug > 1) std::cout << "replaced: " << line << "\n";
      const auto &parts = split(line, ' ');
      if (debug > 1) std::cout << "parts: " << join(parts) << "\n";
      state.gates[parts[3]] = {gateTypes.at(parts[1]), parts[0], parts[2]};
      break;
    }
    }
  }
  file.close();
  if (debug > 0) {
    std::cout << "inputs size: " << state.inputs.size() << "\n";
    for (const auto &[k, v] : state.inputs) std::cout << std::format("  {}: {}\n", k, v);
    std::cout << "gates size: " << state.gates.size() << "\n";
    for (const auto &[k, v] : state.gates) std::cout << std::format("  {}: {} {} {}\n", k, (int)v.t, v.a, v.b);
  }
  return state;
}

bool solve(const std::string wire, std::unordered_map<std::string, bool> &wires,
           const std::unordered_map<std::string, Gate> &gates, int &debug) {
  // return from cache
  if (wires.contains(wire)) return wires.at(wire);
  bool result;
  const auto &[type, left, right] = gates.at(wire);
  const auto &leftVal = solve(left, wires, gates, debug);
  const auto &rightVal = solve(right, wires, gates, debug);
  switch (type) {
  case AND: result = leftVal & rightVal; break;
  case OR: result = leftVal || rightVal; break;
  case XOR: result = leftVal ^ rightVal; break;
  }
  //store to cache
  wires[wire] = result;
  if (debug > 1) std::cout << std::format("solve {}: {}\n", wire, result);
  return result;
}

void part1(State &state, int &debug) {
  /*
    get a list of z registers
    loop over them
      write a recursive function to solve their gates
    loop over z vals and shift int(value)<<i (might be in reverse)
  */
  std::unordered_map<std::string, bool> wires = state.inputs;
  std::vector<std::string> zWires;
  for (const auto &[wire, _] : state.gates) {
    if (debug > 1) std::cout << "testing wire " << wire << "\n";
    if (wire.starts_with('z')) zWires.push_back(wire);
  };
  std::sort(zWires.begin(), zWires.end());
  if (debug > 1) std::cout << "zWires: " << join(zWires) << "\n";
  long result = 0;
  for (uint i = 0; i < zWires.size(); ++i) {
    const auto &wire = zWires.at(i);
    result += (long)solve(wire, wires, state.gates, debug) << i;
  }
  std::cout << "part 1: " << result << "\n";
};

void part2(State &state, int &debug) {
  // all z wires should be driven by an xor of (x and y) and the carry bit
  // find the xy xors
  // find the carry bit (x-1&y-1 xor a massive heirarchy)
  // this isn't going to be a full solution because it requires interaction
  // solved previously in the python repl with some helper functions to find gates/wires

  int zWires = 0;
  for (const auto &[wire, _] : state.gates) {
    if (wire.starts_with('z')) ++zWires;
  };
  // cba with operator overloading
  std::unordered_map<GateType, std::string> gateTypes = {{AND, "AND"}, {OR, "OR"}, {XOR, "XOR"}};
  for (int i = 0; i < zWires; ++i) {
    const auto &zWire = std::format("z{:02d}", i);
    const auto &xWire = std::format("x{:02d}", i);
    const auto &yWire = std::format("y{:02d}", i);
    const auto &prevXWire = std::format("x{:02d}", i - 1);
    const auto &prevYWire = std::format("y{:02d}", i - 1);
    std::cout << std::format("{} {} {}\n", zWire, xWire, yWire);
    const auto &gate = state.gates.at(zWire);
    std::cout << std::format("  gate: {} {} {}\n", gateTypes.at(gate.t), gate.a, gate.b);
    // find the xy xor
    std::string xyXorWire;
    std::string prevXyAndWire; //feeds into the carry bit
    std::string carryWire;
    for (const auto &[wire, gate] : state.gates) {
      if (gate.t == XOR && ((gate.a == xWire && gate.b == yWire) || gate.b == xWire && gate.a == yWire)) {
        xyXorWire = wire;
      };
      if (gate.t == AND &&
          ((gate.a == prevXWire && gate.b == prevYWire) || gate.b == prevXWire && gate.a == prevYWire)) {
        prevXyAndWire = wire;
      };
    }
    std::cout << std::format("  xyXorWire: {}\n", xyXorWire);
    std::cout << std::format("  prevXyAndWire: {}\n", prevXyAndWire);
    for (const auto &[wire, gate] : state.gates) {
      if (gate.t == OR && (gate.a == prevXyAndWire || gate.b == prevXyAndWire)) { carryWire = wire; }
    }
    std::cout << std::format("  carryWire: {}\n", carryWire);
  }
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto state = readData(args.filename, 0);
  if (args.part1) part1(state, args.debug);
  if (args.part2) part2(state, args.debug);
  return 0;
}