//go:build ignore

package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
)

type Sequence struct {
	a, b, c, d int
}

func main() {
	// d4:=[][]int{{-1, 0},{0, 1},{1, 0},{0, -1}}
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	data := readData(filename)
	if debug > 0 {
		fmt.Println(data)
	}
	part1(data, debug)
	part2(data, debug)
}

func part2(data []int, debug uint8) {
	sequenceTotals := map[Sequence]int{}
	for _, code := range data {
		codeSequences := map[Sequence]int{}
		// preallocate the entire window to avoid excessive memory reallocations in the loop
		window := make([]int, 0, 2000)
		for i := 0; i < 2000; i++ {
			// price from the initial code
			price := code % 10
			// window has an initial size of 0 and max size of 2000, so appends start at 0
			window = append(window, price)
			if i >= 4 {
				// based on the loop index
				sequence := Sequence{
					window[i-3] - window[i-4],
					window[i-2] - window[i-3],
					window[i-1] - window[i-2],
					window[i] - window[i-1],
				}
				// only add to code sequences if not exists
				if _, ok := codeSequences[sequence]; !ok {
					codeSequences[sequence] = price
				}
			}
			// the last evolve call is discarded but it's probably fine
			code = evolve(code)
		}
		if debug > 1 {
			fmt.Println("codeSequences", codeSequences)
		}
		// push the per-code values to the totals
		for key, val := range codeSequences {
			sequenceTotals[key] += val
		}
	}
	if debug > 0 {
		fmt.Println("sequenceTotals", sequenceTotals)
	}
	//now just select the highest value from sequenceTotals values
	highestPrice := 0
	var highestSequnce Sequence
	for sequence, price := range sequenceTotals {
		if price > highestPrice {
			highestPrice = price
			highestSequnce = sequence
		}
	}
	fmt.Println("part 2:", highestPrice, "sequence:", highestSequnce)
}

func part1(data []int, debug uint8) {
	total := uint64(0)
	for _, code := range data {
		for i := 0; i < 2000; i++ {
			code = evolve(code)
		}
		if debug > 0 {
			fmt.Println(code)
		}
		total += uint64(code)
	}
	fmt.Println("part 1:", total)
}

func evolve(input int) int {
	value := input
	value ^= (value << 6)
	value &= 16777215
	value ^= (value >> 5)
	value &= 16777215
	value ^= (value << 11)
	value &= 16777215
	return value
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

func readData(filename string) (data []int) {
	f, _ := os.Open(filename)
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		value, _ := strconv.Atoi(scanner.Text())
		data = append(data, value)
	}
	return data
}
