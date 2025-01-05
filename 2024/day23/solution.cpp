#include <algorithm>
#include <cassert>
#include <concepts>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <ostream>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

#pragma region template
struct Args {
  std::string filename = "input.txt";
  int debug = 0;
  bool part1 = true, part2 = true;
};

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
std::vector<std::string> split(std::string val, std::string sep = " ") {
  std::vector<std::string> result = {};
  int li = 0; //stringstream and getline only work if sep is a char
  for (size_t i = val.find(sep); i != std::string::npos; i = val.find(sep, li))
    result.push_back(val.substr(li, i)), li = i + sep.size();
  result.push_back(val.substr(li));
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

struct Triplet {
  std::string a, b, c;
  // constructor
  Triplet(std::string ia, std::string ib, std::string ic) {
    //FIXME: grim
    std::array<std::string, 3> items = {ia, ib, ic};
    std::sort(items.begin(), items.end());
    a = items[0];
    b = items[1];
    c = items[2];
  };
  bool operator==(const Triplet &rhs) const { return a == rhs.a && b == rhs.b && c == rhs.c; }
};
struct TripletHash {
  std::size_t operator()(const Triplet &rhs) const {
    return std::hash<std::string>()(rhs.a) ^ (std::hash<std::string>()(rhs.b) << 1) ^
           (std::hash<std::string>()(rhs.c) << 2);
  }
};

std::unordered_map<std::string, std::vector<std::string>> readData(std::string filename, int debug) {
  std::unordered_map<std::string, std::vector<std::string>> connections;
  std::ifstream file(filename);
  if (!file.is_open()) throw std::runtime_error("cannot open: " + filename);
  std::string line;
  while (std::getline(file, line)) {
    const auto &items = split(line, "-");
    // may as well build a map here
    connections[items[0]].push_back(items[1]);
    connections[items[1]].push_back(items[0]);
    if (debug > 1) std::cout << std::format("pair {},{}\n", items[0], items[1]);
  }
  file.close();
  if (debug > 1)
    for (const auto &[k, v] : connections) std::cout << std::format("k: {}; v: {}\n", k, join(v));
  return connections;
}

void part1(const std::unordered_map<std::string, std::vector<std::string>> &connections, const int &debug) {
  std::unordered_set<Triplet, TripletHash> triplets;
  for (const auto &[primary, secondaries] : connections) {
    for (const auto &secondary : secondaries) {
      for (const auto &tertiary : secondaries) {
        if (secondary == tertiary) continue;
        if (in(tertiary, connections.at(secondary))) {
          // all three are connected. constructor might sort these if we're lucky. add to set
          triplets.insert(Triplet(primary, secondary, tertiary));
        }
      }
    }
  }
  int count = 0;
  for (const auto &triplet : triplets) {
    if (triplet.a.starts_with('t') || triplet.b.starts_with('t') || triplet.c.starts_with('t')) ++count;
    if (debug > 0) std::cout << std::format("triplet {},{},{}; count_t: {}\n", triplet.a, triplet.b, triplet.c, count);
  }
  std::cout << "part 1: " << count << "\n";
}

void walk(std::unordered_set<std::string> &network, const std::string &testNode,
          const std::unordered_map<std::string, std::vector<std::string>> &connections, const int &debug) {
  // extend network set if testNode is connected to every node within it
  if (network.contains(testNode)) return;
  const auto &testNodeConns = connections.at(testNode);
  for (const auto &existingNode : network) {
    if (!in(existingNode, testNodeConns)) { return; }
  }
  network.insert(testNode);
  // then do the same for each of testNodes' connections
  for (const auto &nextNode : connections.at(testNode)) walk(network, nextNode, connections, debug);
};

void part2(const std::unordered_map<std::string, std::vector<std::string>> &connections, const int &debug) {
  /*
    for each k,v of connections
    create a set{k}
    call a recursive function with the set and v
      loop over v:
        if item connected to all of set
          add to set
          recurse item's connections

  */
  // can't use an array so preallocate a vector
  std::vector<std::unordered_set<std::string>> networks;
  networks.reserve(connections.size());
  for (const auto &[k, v] : connections) {
    std::unordered_set<std::string> network = {k};
    for (const auto &node : v) walk(network, node, connections, debug);
    if (debug > 0) {
      std::cout << "walked " << k << ":";
      for (const auto &i : network) std::cout << " " << i;
      std::cout << "\n";
    }
    networks.push_back(network);
  };
  if (debug > 0) std::cout << "finding largest\n";
  // could use a pointer here if i could figure out how do do it without segfaulting :)
  std::unordered_set<std::string> largestNetwork;
  int largest = 0;
  for (const auto &network : networks) {
    if (network.size() > largest) {
      largest = network.size();
      largestNetwork = network;
      if (debug > 0) std::cout << "  " << largest << "\n";
    };
  };
  if (debug > 0) std::cout << "sorting and joining\n";
  // horrible things because we need to sort the network nodes
  std::vector<std::string> largestNetworkVec;
  largestNetworkVec.reserve(largestNetwork.size());
  for (const auto &node : largestNetwork) largestNetworkVec.push_back(node);
  std::sort(largestNetworkVec.begin(), largestNetworkVec.end());
  std::cout << "part 2: " << join(largestNetworkVec) << "\n";
}

int main(int argc, char *argv[]) {
  const auto args = parseArgs(argc, argv);
  const auto connections = readData(args.filename, args.debug);
  if (args.part1) part1(connections, args.debug);
  if (args.part2) part2(connections, args.debug);
  return 0;
}