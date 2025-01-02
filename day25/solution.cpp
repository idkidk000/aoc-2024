#include <cassert>
#include <cstdlib>
#include <format>
#include <fstream>
#include <iostream>
#include <ostream>
#include <regex>
#include <stdexcept>
#include <string>
#include <sys/types.h>
#include <vector>

#pragma region template
struct Args {
  std::string filename = "input.txt";
  int debug = 0;
  bool part1 = true, part2 = true;
};

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

struct Lockable {
  ushort a = -1, b = -1, c = -1, d = -1, e = -1;
  ushort maxdepth = 6;
  std::string data;
  Lockable(std::string input) {
    for (int i = 0; i < maxdepth + 1; ++i) {
      if (input[i * 6 + 0] == '#') ++a;
      if (input[i * 6 + 1] == '#') ++b;
      if (input[i * 6 + 2] == '#') ++c;
      if (input[i * 6 + 3] == '#') ++d;
      if (input[i * 6 + 4] == '#') ++e;
    };
    data = input;
  };
  operator std::string() const { return std::format("{}{},{},{},{},{}\n", data, a, b, c, d, e); };
};

struct Lock : public Lockable {};

struct Key : public Lockable {
  bool fits(const Lock &lock) const {
    return a + lock.a < maxdepth && b + lock.b < maxdepth && c + lock.c < maxdepth && d + lock.d < maxdepth &&
           e + lock.e < maxdepth;
  }
};

struct Lockables {
  std::vector<Lock> locks;
  std::vector<Key> keys;
};

Lockables readData(std::string filename, int debug) {
  Lockables lockables;
  std::ifstream file(filename);
  if (!file.is_open()) throw std::runtime_error("cannot open: " + filename);
  std::stringstream buffer;
  buffer << file.rdbuf();
  std::string content = buffer.str();
  std::regex expression(R"(([.#]{5}\n){7})");
  std::sregex_iterator begin(content.begin(), content.end(), expression);
  std::sregex_iterator end;
  for (auto it = begin; it != end; ++it) {
    std::smatch match = *it;
    if (match[0].str().starts_with('#')) {
      lockables.locks.push_back(Lock(match[0].str()));
    } else {
      lockables.keys.push_back(Key(match[0].str()));
    }
  }
  file.close();
  if (debug > 1) {
    std::cout << "locks size: " << lockables.locks.size() << "\n";
    for (const auto &i : lockables.locks) std::cout << "lock:\n" << (std::string)i << "\n";
    std::cout << "keys size: " << lockables.keys.size() << "\n";
    for (const auto &i : lockables.keys) std::cout << "key:\n" << (std::string)i << "\n";
  }
  return lockables;
}

void part1(Lockables &lockables, int &debug) {
  int count = 0;
  for (const auto &key : lockables.keys) {
    for (const auto &lock : lockables.locks) {
      if (key.fits(lock)) {
        if (debug > 0) std::cout << "fits:\n" << (std::string)key << "\n" << (std::string)lock << "\n";
        ++count;
      }
    }
  }
  std::cout << "part 1: " << count << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto lockables = readData(args.filename, args.debug);
  if (args.part1) part1(lockables, args.debug);
  return 0;
}