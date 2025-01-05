#include <cassert>
#include <climits>
#include <cmath>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <regex>
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
  int x, y;
};

struct Particle {
  int x, y, vx, vy;
};

struct System {
  Coord bounds;
  std::vector<Particle> particles;
};

// TODO: think this needs to be inside a std template
std::ostream &operator<<(std::ostream &os, const Particle &particle) {
  os << "pos: " << particle.x << "," << particle.y << " "
     << "vel: " << particle.vx << "," << particle.vy;
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
      {"-p0",
       [&]() {
         args.part1 = false;
         args.part2 = false;
       }},
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

System readData(std::string filename, int debug) {
  System system;
  // bit grim tbh
  std::unordered_map<std::string, Coord> bounds = {
      {"example.txt", {11, 7}},
      {"example2.txt", {11, 7}},
      {"input.txt", {101, 103}},
  };
  system.bounds = bounds[filename];
  std::ifstream file(filename);
  if (file.is_open()) {
    // read the whole file in one go
    std::stringstream buffer;
    buffer << file.rdbuf();
    std::string content = buffer.str();
    // parse with regex
    std::regex expression(R"(p=(\d+),(\d+) v=(-?\d+),(-?\d+))");
    std::sregex_iterator begin(content.begin(), content.end(), expression);
    std::sregex_iterator end;
    for (auto it = begin; it != end; ++it) {
      std::smatch match = *it;
      // match has 4 capture groups - px, py, vx, vy
      if (debug > 1) {
        std::cout << "capture: ";
        for (const auto i : match) {
          std::cout << "  " << i.str() << "\n";
        }
      }
      // clang-format off
      const Particle particle = {
        std::stoi(match[1].str()),
        std::stoi(match[2].str()),
        std::stoi(match[3].str()),
        std::stoi(match[4].str()),
      };
      // clang-format on
      // FIXME
      if (particle.x >= system.bounds.x || particle.y >= system.bounds.y) {
        std::cout << "error particle out of bounds: " << particle
                  << " bounds: " << system.bounds.x << "," << system.bounds.y
                  << "\n";
        assert(false);
      }
      if (debug > 0) {
        std::cout << particle << "\n";
      }
      system.particles.push_back(particle);
    }

  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "data size: " << system.particles.size()
              << " bounds.x: " << system.bounds.x << " bounds.y "
              << system.bounds.y << "\n";
  }
  return system;
}

int pMod(int value, int mod) {
  int result = value % mod;
  return result < 0 ? result + mod : result;
}

void simulate(System &system, int steps, int debug) {
  // byref not const so we mutate the caller's copy
  for (auto &p : system.particles) {
    const int nx = pMod(p.x + p.vx * steps, system.bounds.x),
              ny = pMod(p.y + p.vy * steps, system.bounds.y);
    if (debug > 2) {
      std::cout << p << " new: " << nx << "," << ny << "\n";
    }
    p.x = nx, p.y = ny;
  }
}

std::vector<std::string> render(System &system, int debug) {
  std::vector<std::string> data(system.bounds.y,
                                std::string(system.bounds.x, '.'));
  for (const auto &p : system.particles) {
    data[p.y][p.x] = '#';
  }
  return data;
}

int getSafety(System &system, int debug) {
  // int division
  const int sx = system.bounds.x / 2, sy = system.bounds.y / 2;
  std::unordered_map<int, int> quadrants;
  for (const auto &p : system.particles) {
    if (p.x == sx || p.y == sy)
      continue;
    // map<int,int> values default to 0 and [k] creates if not exist
    quadrants[(p.x > sx ? 2 : 0) + (p.y > sy ? 1 : 0)]++;
  }
  // multiply quadrant counts together
  int safety = 1;
  for (const auto &[_, c] : quadrants) {
    safety *= c;
  }
  return safety;
}

void test(System system, int debug) {
  for (const auto &r : render(system, debug)) {
    std::cout << r << "\n";
  }
  std::cout << "initial" << "\n\n";
  for (int i = 1; i <= 5; ++i) {
    simulate(system, 1, debug);
    for (const auto &r : render(system, debug)) {
      std::cout << r << "\n";
    }
    auto safety = getSafety(system, debug);
    std::cout << "test steps: " << i << " safety: " << safety << "\n\n";
  }
}

// byval so we mutate a copy
void part1(System system, int debug) {
  // byref so we keep the local mutations
  simulate(system, 100, debug);
  auto safety = getSafety(system, debug);
  if (debug > 0) {
    for (const auto &r : render(system, debug)) {
      std::cout << r << "\n";
    }
  }
  std::cout << "part 1: " << safety << "\n";
}

void part2(System system, int debug) {
  int minSafety = INT_MAX, imageSteps = 0;
  // copy constructor so we can mutate testSys without affecting system
  System testSys = system;
  // bit grim really
  for (int steps = 1; steps < 100'000; ++steps) {
    simulate(testSys, 1, debug);
    auto safety = getSafety(testSys, debug);
    if (safety < minSafety) {
      if (debug > 0)
        std::cout << "part 2: steps=" << steps << " safety=" << safety << "\n";
      // lower safety = higher concentration of particles in fewer quadrants
      minSafety = safety;
      imageSteps = steps;
    } else if (imageSteps + 10'000 < steps) {
      // break early when imageSteps hasn't incremented in a while
      break;
    }
  }
  // simulate imageSteps steps on the original non-mutated system
  simulate(system, imageSteps, debug);
  // render and cout
  for (const auto &r : render(system, debug)) {
    std::cout << r << "\n";
  }
  std::cout << "part 2: " << imageSteps;
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  // test(data, args.debug);
  if (args.part1)
    part1(data, args.debug);
  if (args.part2)
    part2(data, args.debug);
  return 0;
}