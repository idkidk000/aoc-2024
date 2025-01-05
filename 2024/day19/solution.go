//go:build ignore

package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	components, targets := readData(filename)
	if debug > 0 {
		fmt.Println("components:", components)
		fmt.Println("targets:", targets)
	}
	solve(components, targets, debug)
}

func countSolutions(components []string, target string, maxComponentLength int, solutionCache map[string]uint64, debug uint8) uint64 {
	if cache, ok := solutionCache[target]; ok {
		return cache
	}
	count := uint64(0)
	for i := 1; i <= min(maxComponentLength, len(target)); i++ {
		first := target[0:i]
		second := target[i:]
		firstIsComponent := isStringInSlice(components, first)
		if debug > 2 {
			fmt.Println("target:", target, "i:", i, "first:", first, "second:", second, "firstIsComponent:", firstIsComponent)
		}
		if firstIsComponent {
			if second == "" {
				count++
			} else {
				count += countSolutions(components, second, maxComponentLength, solutionCache, debug)
			}
		}
	}
	if debug > 1 {
		fmt.Println("target:", target, "count:", count)
	}
	solutionCache[target] = count
	return count
}

func isStringInSlice(whichSlice []string, search string) bool {
	for _, x := range whichSlice {
		if x == search {
			return true
		}
	}
	return false
}

func solve(components []string, targets []string, debug uint8) {
	totalPossible := 0
	totalSolutions := uint64(0)
	solutionCache := map[string]uint64{}
	maxComponentLength := 0
	for _, x := range components {
		maxComponentLength = max(maxComponentLength, len(x))
	}
	for i, target := range targets {
		if debug > 0 {
			fmt.Printf("[%d/%d] %s\n", i, len(targets)-1, target)
		}
		targetSolutions := countSolutions(components, target, maxComponentLength, solutionCache, debug)
		if targetSolutions > 0 {
			totalPossible++
		}
		totalSolutions += targetSolutions
	}
	fmt.Println("part 1:", totalPossible)
	fmt.Println("part 2:", totalSolutions)
}

func parseArgs() (filename string, debug uint8) {
	filename = "example.txt"
	debug = 0
	for _, arg := range os.Args[1:] {
		switch arg {
		case "-i":
			filename = "input.txt"
		case "-e":
			filename = "example.txt"
		case "-e2":
			filename = "example2.txt"
		case "-e3":
			filename = "example3.txt"
		case "-e4":
			filename = "example4.txt"
		case "-d":
			debug = 1
		case "-d2":
			debug = 2
		case "-d3":
			debug = 3
		default:
			fmt.Printf("unknown arg: %s\n", arg)
		}
	}
	return
}

func readData(filename string) (components []string, targets []string) {
	f, _ := os.Open(filename)
	defer f.Close()
	scanner := bufio.NewScanner(f)
	scanner.Split(bufio.ScanLines)
	section := 0
	for scanner.Scan() {
		line := scanner.Text()
		switch section {
		case 0:
			if line == "" {
				section = 1
				continue
			}
			components = strings.Split(line, ", ")
		case 1:
			targets = append(targets, line)
		}
	}
	return
}
