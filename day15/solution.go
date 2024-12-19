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

const (
	moveUp      uint8 = 0
	moveRight   uint8 = 1
	moveDown    uint8 = 2
	moveLeft    uint8 = 3
	mapFree     uint8 = 0
	mapWall     uint8 = 1
	mapBox      uint8 = 2
	mapBoxLeft  uint8 = 3
	mapBoxRight uint8 = 4
)

func main() {
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	part1(filename, debug)
	part2(filename, debug)
}

func part2(filename string, debug uint8) {
	mapData, moves, start := readData(filename, true)
	if debug > 0 {
		// fmt.Println(mapData)
		drawMap(mapData, start)
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
	isBox := map[uint8]bool{
		mapBoxLeft:  true,
		mapBoxRight: true,
	}
	writeBox := []uint8{
		mapBoxLeft,
		mapBoxRight,
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
		case mapBoxLeft, mapBoxRight:
			if move == moveLeft || move == moveRight {
				// keep searching in offset until not box
				for isBox[mapData[testNext.y][testNext.x]] {
					testNext.x += offset.x
				}
				switch mapData[testNext.y][testNext.x] {
				case mapFree:
					if debug > 1 {
						fmt.Println("move:", move, "about to move boxes horizontally")
						drawMap(mapData, current)
					}
					for i := min(current.x+offset.x, testNext.x); i <= max(current.x+offset.x, testNext.x); i++ {
						// coerce i from a fixed position to a distance, coerce offset.x from -1/1 to -1/0 then sum and uint mod 2 to get an index into the writeBox slice
						mapData[current.y][i] = writeBox[(i-current.x+(offset.x-1)/2)&1]
					}
					mapData[current.y][current.x] = mapFree
					current.x += offset.x
					mapData[current.y][current.x] = mapFree
					if debug > 1 {
						fmt.Println("moved boxes horizontally")
						drawMap(mapData, current)
					}
				case mapWall:
					break
				}
			} else {
				// using maps as both of these will get dupes otherwise
				boxesToMove := map[Coord]bool{{testNext.x, testNext.y}: true}
				colsToResolve := map[int]bool{testNext.x: true}
				foundWall := false
				// set the initial states
				if mapData[testNext.y][testNext.x] == mapBoxLeft {
					boxesToMove[Coord{testNext.x + 1, testNext.y}] = true
					colsToResolve[testNext.x+1] = true
				} else {
					boxesToMove[Coord{testNext.x - 1, testNext.y}] = true
					colsToResolve[testNext.x-1] = true
				}
				// then loop until wall or free
				for len(colsToResolve) > 0 && !foundWall {
					testNext.y += offset.y
					for x := range colsToResolve {
						switch mapData[testNext.y][x] {
						case mapWall:
							foundWall = true
							continue
						case mapFree:
							delete(colsToResolve, x)
						case mapBoxLeft:
							boxesToMove[Coord{x, testNext.y}] = true
							boxesToMove[Coord{x + 1, testNext.y}] = true
							colsToResolve[x+1] = true
						case mapBoxRight:
							boxesToMove[Coord{x - 1, testNext.y}] = true
							boxesToMove[Coord{x, testNext.y}] = true
							colsToResolve[x-1] = true
						}
					}
				}
				if foundWall {
					continue
				}
				// copy box map data to a map and set the old coords to mapFree
				if debug > 1 {
					fmt.Println("about to move boxes vertically", boxesToMove)
					drawMap(mapData, current)
				}
				boxMapData := map[Coord]uint8{}
				for box := range boxesToMove {
					boxMapData[box] = mapData[box.y][box.x]
					mapData[box.y][box.x] = mapFree
				}
				if debug > 1 {
					fmt.Println("boxMapData:", boxMapData)
				}
				// loop over the copied data and write to mapData+offset.y
				for box, val := range boxMapData {
					mapData[box.y+offset.y][box.x] = val
				}
				current.y += offset.y
				if debug > 1 {
					fmt.Println("moved boxes vertically")
					drawMap(mapData, current)
				}
			}
		}
	}
	if debug > 0 {
		drawMap(mapData, current)
		fmt.Println("current:", current)
	}
	gpsSum := 0
	for y, row := range mapData {
		for x, item := range row {
			if item == mapBoxLeft {
				gpsSum += y*100 + x
			}
		}
	}
	fmt.Println("part 2:", gpsSum)
}

func part1(filename string, debug uint8) {
	mapData, moves, start := readData(filename, false)
	if debug > 0 {
		// fmt.Println(mapData)
		drawMap(mapData, start)
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
		drawMap(mapData, current)
		fmt.Println("current:", current)
	}
	gpsSum := 0
	for y, row := range mapData {
		for x, item := range row {
			if item == mapBox {
				gpsSum += y*100 + x
			}
		}
	}
	fmt.Println("part 1:", gpsSum)
}

func drawMap(mapData [][]uint8, target Coord) {
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
			if target.x == x && target.y == y {
				line[x+1] = "@"
			} else {
				line[x+1] = mapObjects[char]
			}
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
