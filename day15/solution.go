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
	part2(filename, debug)
}

func part2(filename string, debug uint8) {
	mapData, moves, start := readData(filename, true)
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
	isBox:=map[uint8]bool{
		mapBoxLeft:true,
		mapBoxRight:true,
	}
	writeBox:=[]uint8{
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
		case mapBoxLeft,mapBoxRight:
			if move==moveLeft || move==moveRight {
				/*
					keep searching in offset until not box
					rewrite the contents of everything between that point and us with box left or right based on distance+(0/1 direction offset)%2
				*/
				for isBox[mapData[testNext.y][testNext.x]] {
					testNext.x+=offset.x
				}
				switch mapData[testNext.y][testNext.x] {
				case mapFree:
					//TODO: *think* i've squashed two off by ones here but need to test
					for i:=min(current.x+offset.x,testNext.x);i<=max(current.x+offset.x,testNext.x);i++{
						// coerce i from a fixed position to a distance, coerce offset.x from -1/1 to 0/1 then sum and uint mod 2 to get an index into the writeBox slice
						//TODO: might need to reverse the offset -1/1 -> 0/1 to get the right index
						mapData[current.y][i]=writeBox[(i-current.x+(offset.x+1)/2)&1]
					}
					mapData[current.y][current.x] = mapFree
					current.x += offset.x
					mapData[current.y][current.x] = mapFree
				case mapWall:
					break
				}
			} else {
				boxesToMove:=[]Coord{{testNext.x,testNext.y}}
				colsToResolve:=map[int]bool{testNext.x:true}
				foundWall:=false
				// set the initial states
				if mapData[testNext.y][testNext.x]==mapBoxLeft{
					boxesToMove = append(boxesToMove, Coord{testNext.x+1,testNext.y})
					colsToResolve[testNext.x+1]=true
				} else {
					boxesToMove = append(boxesToMove, Coord{testNext.x-1,testNext.y})
					colsToResolve[testNext.x-1]=true
				}
				// then loop until wall or free
				for len(colsToResolve)>0 && !foundWall{
					testNext.y+=offset.y
					for x,_:=range colsToResolve{
						switch mapData[testNext.y][x]{
							case mapWall:
								foundWall=true
								continue
							case mapFree:
								delete(colsToResolve,x)
							case mapBoxLeft:
								colsToResolve[x+1]=true
								boxesToMove = append(boxesToMove, Coord{testNext.y,x}, Coord{testNext.y,x+1})
							case mapBoxRight:
								colsToResolve[x-1]=true
								boxesToMove = append(boxesToMove, Coord{testNext.y,x-1}, Coord{testNext.y,x})
						}
					}
				}
				if foundWall{
					continue
				}
				// copy box map data to a map and set the old coords to mapFree
				boxMapData:=map[Coord]uint8{}
				for _,box:=range boxesToMove{
					boxMapData[box]=mapData[box.y][box.x]
					mapData[box.y][box.x]=mapFree
				}
				// loop over the copied data and write to mapData+offset.y
				for box,val:=range boxMapData{
					mapData[box.y+offset.y][box.x]=val
				}
				current.y+=offset.y
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
			if item==mapBoxLeft{
				gpsSum+=y*100+x
			}
		}
	}
	fmt.Println("part 2:",gpsSum)
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
