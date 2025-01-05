//go:build ignore

package main

import (
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
)

type Coord struct {
	x, y int
}

func main() {
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	blocks := readData(filename)
	switch debug {
	case 0:
		break
	case 1:
		fmt.Println("len blocks", len(blocks))
	default:
		fmt.Println(blocks)
	}
	lenX := 0
	lenY := 0
	numBlocks := 0
	switch filename {
	case "example.txt":
		lenX = 7
		lenY = 7
		// numBlocks = 12
		numBlocks = 3
	case "input.txt":
		lenX = 71
		lenY = 71
		numBlocks = 1024
	}
	part1(lenX, lenY, blocks[0:numBlocks], debug)
	part2(lenX, lenY, blocks, debug)
}

func part2(lenX int, lenY int, blocks []Coord, debug int) {
	startAt := Coord{0, 0}
	endAt := Coord{lenX - 1, lenY - 1}
	for i := len(blocks); i > 0; i-- {
		mapData := genMap(lenX, lenY, blocks[0:i])
		if debug > 0 {
			drawMap(mapData)
		}
		pathLength := getShortestPath(mapData, startAt, endAt, debug)
		if pathLength > -1 {
			blockingCoord := blocks[i]
			fmt.Println("part 2:", i+1, blockingCoord)
			break
		}
	}
}

func part1(lenX int, lenY int, blocks []Coord, debug int) {
	mapData := genMap(lenX, lenY, blocks)
	if debug > 0 {
		drawMap(mapData)
	}
	startAt := Coord{0, 0}
	endAt := Coord{lenX - 1, lenY - 1}
	pathLength := getShortestPath(mapData, startAt, endAt, debug)
	fmt.Println("part 1:", pathLength)
}

func getShortestPath(mapData [][]bool, startAt Coord, endAt Coord, debug int) int {
	lenX := len(mapData[0])
	lenY := len(mapData)
	paths := [][]Coord{{startAt}}
	coordDistances := map[Coord]int{}
	for i := 0; i < lenX*lenY; i++ {
		if debug > 0 {
			fmt.Printf("i=%d len=%d\n", i, len(paths))
		}
		newPaths := [][]Coord{}
		for _, path := range paths {
			for d := 0; d < 4; d++ {
				prevCoord := path[i]
				coord := Coord{prevCoord.x, prevCoord.y}
				switch d {
				case 0:
					coord.y--
				case 1:
					coord.x++
				case 2:
					coord.y++
				case 3:
					coord.x--
				}
				// continue on oob, block, in path
				if coord.x < 0 || coord.x >= lenX || coord.y < 0 || coord.y >= lenY || mapData[coord.x][coord.y] || inPath(path, coord) {
					continue
				}
				coordDistance := coordDistances[coord]
				pathLen := i + 1
				if coordDistance == 0 {
					// set coord distance if none exists
					coordDistances[coord] = pathLen
				} else if coordDistance <= pathLen {
					// continue if our path is not shorter
					continue
				}
				if coord == endAt {
					// first to reach the end
					return pathLen
				}
				// otherwise, push the new path onto new paths
				newPath := make([]Coord, i+2)
				copy(newPath, path)
				newPath[pathLen] = coord
				newPaths = append(newPaths, newPath)
			}
		}
		paths = newPaths
	}
	return -1
}

func inPath(path []Coord, search Coord) bool {
	for _, i := range path {
		if i == search {
			return true
		}
	}
	return false
}

func drawMap(mapData [][]bool) {
	lenX := len(mapData[0])
	lenY := len(mapData)
	row := make([]string, lenX+1)
	for y := 0; y < lenY; y++ {
		row[0] = fmt.Sprintf("% 3d:  ", y)
		for x := 0; x < lenX; x++ {
			if mapData[x][y] {
				row[x+1] = "#"
			} else {
				row[x+1] = "."
			}
		}
		fmt.Println(strings.Join(row, ""))
	}
}

func genMap(lenX int, lenY int, blocks []Coord) [][]bool {
	data := make([][]bool, lenX)
	for i := 0; i < lenX; i++ {
		data[i] = make([]bool, lenY)
	}
	for _, block := range blocks {
		data[block.x][block.y] = true
	}
	return data
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

func parseArgs() (filename string, debug int) {
	filename = "example.txt"
	debug = 0
	for _, arg := range os.Args[1:] {
		switch arg {
		case "-i":
			filename = "input.txt"
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
