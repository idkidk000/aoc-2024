package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

type Coord struct {
	x, y int
}
type DoubleCoord struct {
	a, b Coord
}

func main() {
	data, zeroes := readData("input.txt")
	// for _,row:=range data{
	// 	fmt.Println(row)
	// }
	// fmt.Println(zeroes)
	solve(data, zeroes)
}

func solve(data [][]int, zeroes []Coord) {
	// dynamic size so we can duplicate the entire trail if the path splits
	maxX := len(data) - 1
	maxY := len(data[0]) - 1
	trails := [][]Coord{}
	for _, coord := range zeroes {
		trail := make([]Coord, 10)
		trail[0] = coord
		trails = append(trails, trail)
	}
	// fmt.Println("zeroes",zeroes)
	// fmt.Println("trails start",trails)
	for i := 1; i < 10; i++ {
		newTrails := [][]Coord{}
		for _, trail := range trails {
			coord := trail[i-1]
			for dir := 0; dir < 4; dir++ {
				testCoord := Coord{
					coord.x,
					coord.y,
				}
				switch dir {
				case 0:
					testCoord.x--
				case 1:
					testCoord.y++
				case 2:
					testCoord.x++
				case 3:
					testCoord.y--
				}
				if 0 <= testCoord.x && testCoord.x <= maxX && 0 <= testCoord.y && testCoord.y <= maxY && data[testCoord.x][testCoord.y] == i {
					// fmt.Println("origin",trail[0],"found",i,"at",testCoord)
					newTrail := make([]Coord, 10)
					copy(newTrail, trail)
					newTrail[i] = testCoord
					newTrails = append(newTrails, newTrail)
				}
			}
		}
		trails = newTrails
	}

	uniqueStartEnds := map[DoubleCoord]bool{}
	for _, trail := range trails {
		dc := DoubleCoord{trail[0], trail[9]}
		// fmt.Println(trail,dc)
		uniqueStartEnds[dc] = true
	}
	fmt.Println("part 1:", len(uniqueStartEnds))
	fmt.Println("part 2:", len(trails))
}

func readData(filename string) ([][]int, []Coord) {
	f, _ := os.Open(filename)
	defer f.Close()
	var data [][]int
	var zeroes []Coord
	scanner := bufio.NewScanner(f)
	ixRow := 0
	for scanner.Scan() {
		chars := strings.Split(scanner.Text(), "")
		nums := make([]int, len(chars))
		for ixCol, char := range chars {
			num, _ := strconv.Atoi(char)
			if num == 0 {
				zeroes = append(zeroes, Coord{ixRow, ixCol})
			}
			nums[ixCol] = num
		}
		data = append(data, nums)
		ixRow++
	}
	return data, zeroes
}
