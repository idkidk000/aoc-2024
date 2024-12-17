package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Coord struct {
	x, y int
}

func main() {
	grid, antennas := readData("input.txt")
	// for _,row:=range grid{
	// 	fmt.Println(row)
	// }
	// fmt.Println("antennas:",antennas)
	rowCount := len(grid)
	colCount := len(grid[0])
	part1(antennas, rowCount, colCount)
	part2(antennas, rowCount, colCount)
}

func part2(antennas map[string][]Coord, countX int, countY int) {
	// using x and y instead of row/col which is technically wrong but easier
	uniqueAntinodes := map[Coord]bool{}
	for frequency, coords := range antennas {
		if 1 == 0 {
			fmt.Println("frequency", frequency, "coords", coords)
		}
		for antennaAIx, antennaA := range coords {
			for _, antennaB := range coords[antennaAIx+1:] {
				// fmt.Println("antennaA",antennaA,"antennaB",antennaB)
				multiplier := 0
				anyValid := true
				for anyValid {
					anyValid = false
					antinodeA := Coord{
						antennaA.x + ((antennaA.x - antennaB.x) * multiplier),
						antennaA.y + ((antennaA.y - antennaB.y) * multiplier),
					}
					antinodeB := Coord{
						antennaB.x + ((antennaB.x - antennaA.x) * multiplier),
						antennaB.y + ((antennaB.y - antennaA.y) * multiplier),
					}
					// fmt.Println("antinodeA",antinodeA,"antinodeB",antinodeB)
					if 0 <= antinodeA.x && antinodeA.x < countX && 0 <= antinodeA.y && antinodeA.y < countY {
						uniqueAntinodes[antinodeA] = true
						anyValid = true
					}
					if 0 <= antinodeB.x && antinodeB.x < countX && 0 <= antinodeB.y && antinodeB.y < countY {
						uniqueAntinodes[antinodeB] = true
						anyValid = true
					}

					multiplier++
				}
			}
		}
	}
	fmt.Println("part 2:", len(uniqueAntinodes))
}

func part1(antennas map[string][]Coord, countX int, countY int) {
	// using x and y instead of row/col which is technically wrong but easier
	uniqueAntinodes := map[Coord]bool{}
	for frequency, coords := range antennas {
		if 1 == 0 {
			fmt.Println("frequency", frequency, "coords", coords)
		}
		for antennaAIx, antennaA := range coords {
			for _, antennaB := range coords[antennaAIx+1:] {
				// fmt.Println("antennaA",antennaA,"antennaB",antennaB)
				antinodeA := Coord{
					antennaA.x + (antennaA.x - antennaB.x),
					antennaA.y + (antennaA.y - antennaB.y),
				}
				antinodeB := Coord{
					antennaB.x + (antennaB.x - antennaA.x),
					antennaB.y + (antennaB.y - antennaA.y),
				}
				// fmt.Println("antinodeA",antinodeA,"antinodeB",antinodeB)
				if 0 <= antinodeA.x && antinodeA.x < countX && 0 <= antinodeA.y && antinodeA.y < countY {
					uniqueAntinodes[antinodeA] = true
				}
				if 0 <= antinodeB.x && antinodeB.x < countX && 0 <= antinodeB.y && antinodeB.y < countY {
					uniqueAntinodes[antinodeB] = true
				}
			}
		}
	}
	fmt.Println("part 1:", len(uniqueAntinodes))
}

// func abs(value int)(int){
// 	return int(math.Abs(float64(value)))
// }

func readData(filename string) ([][]string, map[string][]Coord) {
	f, _ := os.Open(filename)
	defer f.Close()
	var data [][]string
	antennas := map[string][]Coord{}
	scanner := bufio.NewScanner(f)
	ixRow := 0
	for scanner.Scan() {
		line := scanner.Text()
		chars := strings.Split(line, "")
		data = append(data, chars)
		for ixCol, char := range chars {
			if char != "." {
				antennas[char] = append(antennas[char], Coord{ixRow, ixCol})
			}
		}
		ixRow++
	}
	return data, antennas
}
