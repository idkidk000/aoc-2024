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

const moveUp uint8 = 0
const moveRight uint8 = 1
const moveDown uint8 = 2
const moveLeft uint8 = 3

const mapFree uint8 = 0
const mapWall uint8 = 1
const mapBox uint8 = 2
const mapBoxLeft uint8 = 3
const mapBoxRight uint8 = 4

func main() {
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	part1(filename, debug)
	// part2(data)
}

func part1(filename string, debug uint8) {
	mapData, moves, start := readData(filename, false)
	if debug > 0 {
		// fmt.Println(mapData)
		drawMap(mapData)
		// fmt.Println(moves)
		fmt.Println("start:", start)
	}
	current := Coord{start.x, start.y}
	offsets := map[uint8]Coord{
		moveUp:    {0, -1},
		moveRight: {1, 0},
		moveDown:  {0, 1},
		moveLeft:  {-1, 0},
	}
	for _, move := range moves {
		offset := offsets[move]
		testNext := Coord{current.x + offset.x, current.y + offset.y}
		if debug > 1 {
			fmt.Println("current:", current, "move:", move, "offset:", offset, "testNext", testNext)
		}
		switch mapData[testNext.y][testNext.x] {
		case mapFree:
			current = testNext
		case mapWall:
			break
		case mapBox:
			for mapData[testNext.y][testNext.x] == mapBox {
				testNext.x += offset.x
				testNext.y += offset.y
			}
			switch mapData[testNext.y][testNext.x] {
			case mapFree:
				mapData[testNext.y][testNext.x] = mapBox
				current.x += offset.x
				current.y += offset.y
				mapData[current.y][current.x] = mapFree
			case mapWall:
				break
			}
		}
	}
	if debug > 0 {
		drawMap(mapData)
		fmt.Println("current:", current)
	}
	gpsSum:=0
	for y,row:=range mapData{
		for x,item:=range row{
			if item==mapBox{
				gpsSum+=y*100+x
			}
		}
	}
	fmt.Println("part 1:",gpsSum)
}

func drawMap(mapData [][]uint8) {
	mapObjects := map[uint8]string{
		mapWall:     "#",
		mapBox:      "O",
		mapFree:     ".",
		mapBoxLeft:  "[",
		mapBoxRight: "]",
	}
	for y, row := range mapData {
		line := make([]string, len(row)+1)
		line[0] = fmt.Sprintf("% 3d:  ", y)
		for x, char := range row {
			line[x+1] = mapObjects[char]
		}
		fmt.Println(strings.Join(line, ""))
	}
}

func parseArgs() (filename string, debug uint8) {
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

func readData(filename string, doubleWidth bool) (mapData [][]uint8, moves []uint8, start Coord) {
	f, _ := os.Open(filename)
	defer f.Close()
	scanner := bufio.NewScanner(f)
	scanner.Split(bufio.ScanLines)
	section := 0
	rowIx := 0
	directions := map[string]uint8{
		"^": moveUp,
		">": moveRight,
		"v": moveDown,
		"<": moveLeft,
	}
	mapObjects := map[string]uint8{
		"#": mapWall,
		"O": mapBox,
		".": mapFree,
		"@": mapFree,
	}
	mapObjectsWide := map[string][]uint8{
		"#": {mapWall, mapWall},
		"O": {mapBoxLeft, mapBoxRight},
		".": {mapFree, mapFree},
		"@": {mapFree, mapFree},
	}

	for scanner.Scan() {
		line := scanner.Text()
		chars := strings.Split(line, "")
		switch section {
		case 0:
			if line == "" {
				section = 1
				continue
			}
			row := []uint8{}
			for charIx, char := range chars {
				if doubleWidth {
					if items, ok := mapObjectsWide[char]; ok {
						row = append(row, items...)
					}
					if char == "@" {
						start.y = rowIx
						start.x = charIx * 2
					}
				} else {
					if item, ok := mapObjects[char]; ok {
						row = append(row, item)
					}
					if char == "@" {
						start.y = rowIx
						start.x = charIx
					}
				}
			}
			mapData = append(mapData, row)
		case 1:
			// directions, possibly split onto multiple lines
			for _, char := range chars {
				// discard unmatched characters
				if move, ok := directions[char]; ok {
					moves = append(moves, move)
				}
			}
		}
		rowIx++
	}
	return
}
