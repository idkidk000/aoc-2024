package main

import (
	"fmt"
	"os"
	"regexp"
	"strconv"
)

type Coord struct {
	x, y int
}

func main() {
	// d4:=[][]int{{-1, 0},{0, 1},{1, 0},{0, -1}}
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	data := readData(filename)
	fmt.Println(data)
	if debug > 0 {
		fmt.Println(len(data))
	}
	// part1(data)
	// part2(data)
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

func readData(filename string) []Coord {
	content, _ := os.ReadFile(filename)
	regex, _ := regexp.Compile("(-?[0-9]+)")
	matches := regex.FindAllStringSubmatch(string(content), -1)
	data := []Coord{}
	fields := make([]int, 2)
	for i, match := range matches {
		fields[i%len(fields)], _ = strconv.Atoi(match[0])
		if i%len(fields) == len(fields)-1 {
			data = append(data, Coord{
				fields[0],
				fields[1],
			})
		}
		// fmt.Println("i",i,"match",match,fields)
	}
	return data
}
