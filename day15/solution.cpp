#include <algorithm>
#include <cassert>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <ios>
#include <iostream>
#include <set>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <utility>
#include <vector>

struct Args {
  std::string filename = "example.txt";
  int debug = 0;
  bool part1 = true;
  bool part2 = true;
};

struct TextGrid {
  std::string data = "";
  int rows = 0;
  int cols = 0;
  char at(int row, int col) {
    if (oob(row, col))
      return ' ';
    return data.at(row * cols + col);
  }
  std::pair<int, int> findFirst(char c) {
    // for finding start/end pos
    const int ix = data.find(c);
    return {ix / cols, ix % cols};
  }
  std::vector<std::pair<int, int>> findAll(char c) {
    // for finding all instances
    std::vector<std::pair<int, int>> result;
    int ix = -1;
    while ((ix = data.find(c, ix + 1)) != std::string::npos) {
      result.push_back({ix / cols, ix % cols});
    }
    return result;
  }
  std::set<char> unique() {
    std::set<char> result;
    for (char c : data) {
      result.insert(c);
    }
    return result;
  }
  bool oob(int row, int col) {
    return row < 0 || row >= rows || col < 0 || col >= cols;
  };
  void put(int row, int col, char c) {
    // replace a single char on the grid
    data.replace(row * cols + col, 1, std::string(1, c));
  }
};

struct RowCol {
  int r, c;
  bool operator==(const RowCol &rhs) const { return r == rhs.r && c == rhs.c; }
  bool operator<(const RowCol &rhs) const {
    return r != rhs.r ? r < rhs.r : c < rhs.c;
  }
};

struct RowColHash {
  std::size_t operator()(const RowCol &rhs) const {
    return std::hash<int>()(rhs.r) ^ (std::hash<int>()(rhs.c) << 1);
  }
};

struct Warehouse {
  TextGrid map;
  std::string movements = "";
};

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

Warehouse readData(std::string filename, int debug) {
  Warehouse data;
  std::vector<int> right;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    int section = 0;
    while (std::getline(file, line)) {
      if (line == "") {
        ++section;
        continue;
      }
      switch (section) {
      case 0:
        data.map.data += line;
        if (data.map.cols == 0)
          data.map.cols = line.size();
        break;
      case 1:
        data.movements += line;
        break;
      default:
        std::cout << "oh no\n";
      }
    }
    data.map.rows = data.map.data.size() / data.map.cols;
    file.close();
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "rows: " << data.map.rows << " cols: " << data.map.cols
              << " map size: " << data.map.data.size()
              << " at(0,0): " << data.map.at(0, 0)
              << " movements size: " << data.movements.size() << "\n";
  }
  return data;
}

// byval to keep mutations local
void part1(Warehouse data, int debug) {
  const std::unordered_map<char, RowCol> moves = {
      {'^', {-1, 0}},
      {'>', {0, 1}},
      {'v', {1, 0}},
      {'<', {0, -1}},
  };
  auto [r, c] = data.map.findFirst('@');
  for (const auto &m : data.movements) {
    const auto &move = moves.at(m);
    const auto nr = r + move.r, nc = c + move.c;
    bool movedBox = false;
    // a single move can't put us oob since the map is surrounded by boxes
    switch (data.map.at(nr, nc)) {
    case '#':
      // wall - no advance
      continue;
    case 'O':
      // box
      auto br = nr, bc = nc;
      // advance br,bc until not box
      while (data.map.at(br, bc) == 'O') {
        br += move.r, bc += move.c;
      }
      if (data.map.at(br, bc) == '#' || data.map.oob(br, bc)) {
        // wall or oob - no advance
        continue;
      }
      // move box (nr,nc is updated further down)
      data.map.put(br, bc, 'O');
      movedBox = true;
      // otherwise free space
    };
    // update the map and advance
    data.map.put(r, c, '.');
    data.map.put(nr, nc, '@');
    if (debug > 0) {
      for (size_t i = 0; i < data.map.data.size(); i += data.map.cols) {
        std::cout << data.map.data.substr(i, data.map.cols) << "\n";
      }
      std::cout << "move: " << m << " from: " << r << "," << c << " to: " << nr
                << "," << nc << " movedBox: " << std::boolalpha << movedBox
                << "\n\n";
    }
    r = nr, c = nc;
  }
  int gpsTotal = 0;
  for (const auto &box : data.map.findAll('O')) {
    gpsTotal += box.first * 100 + box.second;
  }
  std::cout << "part 1: " << gpsTotal << "\n";
}

Warehouse doubleWidth(const Warehouse &data) {
  Warehouse wideData = data;
  wideData.map.cols *= 2;
  // grim
  wideData.map.data = "";
  for (const auto &c : data.map.data) {
    switch (c) {
    case 'O':
      wideData.map.data += "[]";
      break;
    case '@':
      wideData.map.data += "@.";
      break;
    default:
      wideData.map.data += std::string(2, c);
    }
  };
  return wideData;
}

void part2(Warehouse data, int debug) {
  const std::unordered_map<char, RowCol> moves = {
      {'^', {-1, 0}},
      {'>', {0, 1}},
      {'v', {1, 0}},
      {'<', {0, -1}},
  };
  auto [r, c] = data.map.findFirst('@');
  for (const auto &m : data.movements) {
    const auto &move = moves.at(m);
    const auto nr = r + move.r, nc = c + move.c;
    bool movedBox = false;
    switch (data.map.at(nr, nc)) {
    case '#':
      continue;
    case '[':
    case ']':
      switch (m) {
      case '<':
      case '>': {
        // similar to pt1, but need to rewrite each box in the path
        int bc = nc;
        char bat;
        // walk until end of boxes
        while ((bat = data.map.at(r, bc)) == '[' || bat == ']')
          bc += move.c;
        // abort on wall
        if (bat == '#')
          continue;
        // rewrite boxes in path
        if (debug > 1) {
          std::cout << "walked horizontal boxes: c=" << c << " nc=" << nc
                    << " bc=" << bc << "\n";
        }
        if (m == '<') {
          for (int pc = bc; pc < c; ++pc) {
            if (debug > 1)
              std::cout << "  write pc=" << pc << " mod=" << (c - pc) % 2
                        << "\n";
            data.map.put(r, pc, (c - pc) % 2 != 0 ? '[' : ']');
          }
        } else {
          for (int pc = nc; pc <= bc; ++pc) {
            if (debug > 1)
              std::cout << "  write pc=" << pc << " mod=" << (c - pc) % 2
                        << "\n";
            data.map.put(r, pc, (c - pc) % 2 == 0 ? '[' : ']');
          }
        }

        movedBox = true;
        break;
      }
      case '^':
      case 'v': {
        // just track left side of box to make rewriting simple
        // both need to be sets since there is scope for duplication
        std::unordered_set<RowCol, RowColHash> boxes;
        std::unordered_set<int> boxCols = {c}, nextBoxCols;
        // FIXME: this is all very verbose
        switch (data.map.at(nr, c)) {
        case '[':
          boxes.insert({nr, c});
          boxCols.insert(c + 1);
          break;
        case ']':
          boxes.insert({nr, c - 1});
          boxCols.insert(c - 1);
        }
        int br = nr;
        // walk in move direction until found the end of all box columns or wall
        bool foundWall = false;
        while (boxCols.size() > 0 && !foundWall) {
          // FIXME: swapping between two sets isn't great
          br += move.r;
          nextBoxCols.clear();
          for (const auto bc : boxCols) {
            const auto bat = data.map.at(br, bc);
            switch (bat) {
            case '[':
              nextBoxCols.insert(bc);
              nextBoxCols.insert(bc + 1);
              boxes.insert({br, bc});
              break;
            case ']':
              nextBoxCols.insert(bc);
              nextBoxCols.insert(bc - 1);
              boxes.insert({br, bc - 1});
              break;
            case '#':
              // any wall renders the entire move impossible
              foundWall = true;
            }
          }
          boxCols = nextBoxCols;
        }
        if (debug > 1) {
          std::cout << "walked vertical boxes: r=" << r << " nr=" << nr
                    << " br=" << br << "\n";
          std::cout << "  foundWall: " << std::boolalpha << foundWall << "\n";
          std::cout << "  boxCols:";
          for (const auto i : boxCols) {
            std::cout << " " << i;
          };
          std::cout << "\n";
          std::cout << "  boxes:";
          for (const auto i : boxes) {
            std::cout << " " << i.r << "," << i.c;
          }
          std::cout << "\n";
        }
        if (boxCols.size() > 0 || foundWall)
          continue;
        // write spaces over all found boxes
        for (const auto &box : boxes) {
          data.map.put(box.r, box.c, '.');
          data.map.put(box.r, box.c + 1, '.');
        }
        // write new boxes offset by direction
        for (const auto &box : boxes) {
          data.map.put(box.r + move.r, box.c, '[');
          data.map.put(box.r + move.r, box.c + 1, ']');
        }
        movedBox = true;
      }
      }
    }
    // update the map and advance
    data.map.put(r, c, '.');
    data.map.put(nr, nc, '@');
    if (debug > 0) {
      for (size_t i = 0; i < data.map.data.size(); i += data.map.cols) {
        std::cout << data.map.data.substr(i, data.map.cols) << "\n";
      }
      std::cout << "move: " << m << " from: " << r << "," << c << " to: " << nr
                << "," << nc << " movedBox: " << std::boolalpha << movedBox
                << "\n\n";
    }
    r = nr, c = nc;
  }
  int gpsTotal = 0;
  for (const auto &box : data.map.findAll('[')) {
    gpsTotal += box.first * 100 + box.second;
  }
  std::cout << "part 2: " << gpsTotal << "\n";
}

int main(int argc, char *argv[]) {
  auto args = parseArgs(argc, argv);
  auto data = readData(args.filename, args.debug);
  if (args.part1)
    part1(data, args.debug);
  if (args.part2)
    part2(doubleWidth(data), args.debug);
  return 0;
}