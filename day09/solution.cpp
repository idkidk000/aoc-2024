#include <array>
#include <cassert>
#include <climits>
#include <cstdlib>
#include <fstream>
#include <functional>
#include <iostream>
#include <iterator>
#include <map>
#include <stdexcept>
#include <string>
#include <unordered_map>
#include <utility>
#include <vector>

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

std::vector<int> readData(std::string filename, int debug) {
  std::vector<int> data;
  std::ifstream file(filename);
  if (file.is_open()) {
    std::string line;
    if (std::getline(file, line)) {
      for (int i = 0; i < line.size(); ++i) {
        char c = line[i];
        // DO NOT PASS CHAR POINTERS TO STUFF EXPECTING STRINGS BECAUSE IT
        // BREAKS THINGS YOU IDIOT
        for (int j = 0; j < std::stoi(std::string(1, c)); ++j) {
          data.push_back(i % 2 == 0 ? i / 2 : -1);
        }
      }
      file.close();
    } else {
      throw std::runtime_error("cannot read: " + filename);
    }
  } else {
    throw std::runtime_error("cannot open: " + filename);
  }
  if (debug > 1) {
    std::cout << "data len: " << data.size() << " first 10: ";
    for (int i = 0; i < 10 && i < data.size(); ++i) {
      std::cout << " " << data[i];
    }
    std::cout << "\n";
  }
  return data;
}

// data byval since we're mutating it in both parts
void part1(std::vector<int> data, int debug) {
  // skip over allocated blocks
  int denseIx = -1;
  for (int fromIx = data.size() - 1; fromIx > -1; --fromIx) {
    const int fileId = data.at(fromIx);
    // unallocated
    if (fileId == -1)
      continue;
    for (int toIx = denseIx + 1; toIx < fromIx; ++toIx) {
      // unallocated
      if (data.at(toIx) == -1) {
        // move block
        data[toIx] = fileId;
        data[fromIx] = -1;
        denseIx = toIx;
        break;
      }
    }
  }
  if (debug > 1) {
    for (int i = 0; i < data.size() && i < 1000; ++i) {
      std::cout << " " << data.at(i);
      if (i % 100 == 0) {
        std::cout << "\n";
      }
    }
    std::cout << "\n";
  }
  long checksum = 0;
  for (long i = 0; i < data.size(); ++i) {
    const long fileId = data.at(i);
    if (fileId > 0)
      checksum += fileId * i;
  }
  std::cout << "part 1: " << checksum << "\n";
}

void part2(std::vector<int> data, int debug) {
  std::map<int, std::pair<int, int>> index;
  // disk always starts with a file so we can't encounter fileId -1 first
  int fileId, prevFileId = -1;
  // create an index of file ids and their start/end indices
  for (int i = 0; i < data.size(); ++i) {
    fileId = data.at(i);
    if (fileId != -1) {
      if (fileId != prevFileId) {
        index[fileId] = {i, i};
      } else {
        index[fileId].second = i;
      }
    }
    prevFileId = fileId;
  };
  int denseIx = -1;
  // reverse iterate over the index
  for (auto itIndex = index.rbegin(); itIndex != index.rend(); ++itIndex) {
    const auto [fileId, filePos] = *itIndex;
    const auto fileLen = filePos.second - filePos.first + 1;
    if (debug > 1) {
      std::cout << "fileId: " << fileId << " from: " << filePos.first
                << " to: " << filePos.second << " len: " << fileLen << "\n";
    }
    int spaceLen = 0;
    bool spaceEncountered = false;
    for (int i = denseIx + 1; i < filePos.first; ++i) {
      if (data.at(i) == -1) {
        ++spaceLen;
        spaceEncountered = true;
      } else {
        spaceLen = 0;
        // increment denseIx if we haven't seen a file yet so we can avoid
        // looping over filled space on future iterations
        if (!spaceEncountered)
          denseIx = i;
      }
      if (spaceLen == fileLen) {
        // move the file
        for (int j = 0; j < fileLen; ++j) {
          data[i - fileLen + j + 1] = fileId;
          data[filePos.first + j] = -1;
          if (debug > 1)
            std::cout << "  move to: " << i - fileLen + j
                      << " clear: " << filePos.first + j << "\n";
        }
        // dont need to update index
        // denseIx could potentially be incremented here but it would need more
        // robust checks
        break;
      }
    }
  }
  if (debug > 1) {
    for (int i = 0; i < data.size() && i < 1000; ++i) {
      std::cout << " " << data.at(i);
      if (i % 100 == 0 && i > 0) {
        std::cout << "\n";
      }
    }
    std::cout << "\n";
  }
  long checksum = 0;
  for (long i = 0; i < data.size(); ++i) {
    const long fileId = data.at(i);
    if (fileId > 0)
      checksum += fileId * i;
  }
  std::cout << "part 2: " << checksum << "\n";
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
