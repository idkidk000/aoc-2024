//go:build ignore

package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Coord struct {
	r, c int
}
type Cheat struct {
	r, c, t int
}

func main() {
	// d4:=[][]int{{-1, 0},{0, 1},{1, 0},{0, -1}}
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	mapData, start, end := readData(filename)
	if debug > 0 {
		fmt.Println(mapData)
		fmt.Println("start", start, "end", end)
	}
	part1 := solve(mapData, start, end, 2, debug)
	fmt.Println("part 1:", part1)
	part2 := solve(mapData, start, end, 20, debug)
	fmt.Println("part 2:", part2)
}

func solve(mapData [][]string, start Coord, end Coord, radius int, debug uint8) int {
	rows := len(mapData)
	cols := len(mapData[0])

	// initialise mapTimes
	mapTimes := make([][]int, 0, rows)
	for row := 0; row < rows; row++ {
		row := make([]int, cols)
		for col := 0; col < cols; col++ {
			row[col] = -1
		}
		mapTimes = append(mapTimes, row)
	}

	// walk mapData and populate mapTimes
	current := Coord{start.r, start.c}
	mapTimes[current.r][current.c] = 0
	for current != end {
		for d := 0; d < 4; d++ {
			test := Coord{current.r, current.c}
			switch d {
			case 0:
				test.r--
			case 1:
				test.c++
			case 2:
				test.r++
			case 3:
				test.c--
			}
			// continue on wall or walked (no need for oob check since the map is surrounded by wall)
			if mapData[test.r][test.c] == "#" || mapTimes[test.r][test.c] != -1 {
				continue
			}
			// path is valid, move and break from the direction loop
			mapTimes[test.r][test.c] = mapTimes[current.r][current.c] + 1
			current = test
			break
		}
	}
	if debug > 1 {
		fmt.Println("mapTimes:")
		for _, row := range mapTimes {
			fmt.Println(row)
		}
	}

	// precalculate the available cheat moves
	cheats := []Cheat{}
	for row := 0 - radius; row <= radius; row++ {
		for col := 0 - radius; col <= radius; col++ {
			moves := intAbs(row) + intAbs(col)
			if moves >= 2 && moves <= radius {
				cheats = append(cheats, Cheat{row, col, moves})
			}
		}
	}
	if debug > 1 {
		fmt.Println("cheats:")
		for _, offset := range cheats {
			fmt.Println(offset)
		}
	}

	// test each possible cheat
	count := 0
	for row := 0; row < rows; row++ {
		for col := 0; col < cols; col++ {
			originTime := mapTimes[row][col]
			if originTime == -1 {
				continue
			}
			for _, offset := range cheats {
				nr := row + offset.r
				nc := col + offset.c
				// oob
				if nr < 0 || nr >= rows || nc < 0 || nc >= cols {
					continue
				}
				destTime := mapTimes[nr][nc]
				// wall
				if destTime == -1 {
					continue
				}
				saving := destTime - originTime - offset.t
				if saving < 100 {
					continue
				}
				count++
			}

		}
	}
	return count
}

func intAbs(value int) int {
	if value < 0 {
		return 0 - value
	} else {
		return value
	}
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

func readData(filename string) (mapData [][]string, start Coord, end Coord) {
	f, _ := os.Open(filename)
	scanner := bufio.NewScanner(f)
	rowIx := 0
	for scanner.Scan() {
		chars := strings.Split(scanner.Text(), "")
		mapData = append(mapData, chars)
		for colIx, char := range chars {
			switch char {
			case "S":
				start = Coord{rowIx, colIx}
			case "E":
				end = Coord{rowIx, colIx}
			}
		}
		rowIx++
	}
	return
}
