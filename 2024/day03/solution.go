//go:build ignore

package main

import (
	"fmt"
	"os"
	"regexp"
	"strconv"
)

func main() {
	data := readData("input.txt")
	// fmt.Println(data)
	part1(data)
	part2(data)
}

func part1(data string) {
	regex, _ := regexp.Compile("mul\\(([0-9]+),([0-9]+)\\)")
	matches := regex.FindAllStringSubmatch(data, -1)
	total := 0
	// fmt.Printf("matches: %v\n", matches)
	for _, match := range matches {
		// fmt.Printf("match: %v\n", match)
		valA, _ := strconv.Atoi(match[1])
		valB, _ := strconv.Atoi(match[2])
		total += valA * valB
	}
	fmt.Printf("part 1: %d\n", total)
}

func part2(data string) {
	regex, _ := regexp.Compile("(mul\\(([0-9]+),([0-9]+)\\)|do\\(\\)|don't\\(\\))")
	matches := regex.FindAllStringSubmatch(data, -1)
	total := 0
	enable := true
	// fmt.Printf("matches: %v\n", matches)
	for _, match := range matches {
		// fmt.Printf("match: %v\n", match)
		switch match[1] {
		case "do()":
			enable = true
		case "don't()":
			enable = false
		default:
			if enable {
				valA, _ := strconv.Atoi(match[2])
				valB, _ := strconv.Atoi(match[3])
				total += valA * valB
			}
		}
	}
	fmt.Printf("part 2: %d\n", total)
}

func readData(filename string) string {
	content, _ := os.ReadFile(filename)
	return string(content)
}
