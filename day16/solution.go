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

type CoordAndDir struct {
	x,y,d int
}

const (
	moveUp uint8 = 0
	moveRight uint8 = 1
	moveDown uint8 = 2
	moveLeft uint8 = 3
	mapFree uint8 = 0
	mapWall uint8 = 1
)


func main() {
	// d4:=[][]int{{-1, 0},{0, 1},{1, 0},{0, -1}}
	filename,debug:=parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	mapData,start,end := readData(filename)
	if debug>0{
		fmt.Println("start:",start,"end:",end)
		drawMap(mapData,start)
	}
	solve(mapData,start,end,debug)
}

func solve(mapData[][]uint8,start Coord,end Coord,debug uint8){
	startDir:=1;
	coordAndDirCosts:=map[CoordAndDir]int{}
	paths:=[][]CoordAndDir{{{start.x,start.y,startDir}}}
	offsets := map[uint8]Coord{
		moveUp:    {0, -1},
		moveRight: {1, 0},
		moveDown:  {0, 1},
		moveLeft:  {-1, 0},
	}
	endCost:=1000*len(mapData)*len(mapData[0]);
	finishedPaths:=[][]CoordAndDir{}

	for len(paths)>0{
		path:=paths[0]
		paths=paths[1:]
		prevCoord:=path[len(path)-1]
		for turn:=-1;turn<2;turn++{
			// turn and gen nextCoordAndDir
			direction:=(prevCoord.d+turn)&3
			offset:=offsets[uint8(direction)]
			nextCoordAndDir:=CoordAndDir{
				prevCoord.x+offset.x,
				prevCoord.y+offset.y,
				direction,
			}

			// continue on wall or loop
			if mapData[nextCoordAndDir.y][nextCoordAndDir.x]==mapWall || pathContainsCoord(path,nextCoordAndDir) {
				continue
			}

			// clone path and append nextCoord
			nextPath:=make([]CoordAndDir,len(path)+1)
			copy(nextPath,path)
			nextPath[len(path)]=nextCoordAndDir

			// calculate cost
			pathCost:=calcPathCost(nextPath)

			// continue if a finished path is cheaper
			if endCost<pathCost {
				continue
			}

			// continue if coord cost not cheaper
			coordAndDirCost,ok:=coordAndDirCosts[nextCoordAndDir]
			if ok && coordAndDirCost<pathCost {
				continue
			}
			// otherwise update
			coordAndDirCosts[nextCoordAndDir]=pathCost

			if nextCoordAndDir.x==end.x && nextCoordAndDir.y==end.y {
				// update endCost if finished
				endCost=pathCost
				finishedPaths = append(finishedPaths, nextPath)
			} else {
				// otherwise push back to paths
				paths = append(paths, nextPath)
			}

		}
	}
	fmt.Println("part 1:",endCost)
	bestPathTiles:=map[Coord]bool{}
	// finishedPaths will contain some paths which finished in fewer moved but were more expensive
	for _,path:=range finishedPaths{
		if calcPathCost(path)==endCost {
			for _,c:=range path{
				// coaerce coordanddir to a coord
				bestPathTiles[Coord{c.x,c.y}]=true
			}
		}
	}
	fmt.Println("part 2:",len(bestPathTiles))
}

func calcPathCost(path[]CoordAndDir)(int){
	cost:=0
	for i:=0;i<len(path)-1;i++{
		prev:=path[i]
		next:=path[i+1]
		if prev.d==next.d {
			cost++
		} else {
			cost+=1001
		}
	}
	return cost
}

func pathContainsCoord(path []CoordAndDir,search CoordAndDir)(bool){
	for _,x:=range path{
		if x.x==search.x && x.y==search.y {
			return true
		}
	}
	return false
}

func drawMap(mapData [][]uint8,target Coord) {
	mapObjects := map[uint8]string{
		mapWall:     "#",
		mapFree:     ".",
	}
	for y, row := range mapData {
		line := make([]string, len(row)+1)
		line[0] = fmt.Sprintf("% 3d:  ", y)
		for x, char := range row {
			if target.x==x && target.y==y {
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

func readData(filename string) (mapData [][]uint8, start Coord, end Coord) {
	f, _ := os.Open(filename)
	defer f.Close()
	scanner := bufio.NewScanner(f)
	scanner.Split(bufio.ScanLines)
	rowIx := 0
	mapObjects := map[string]uint8{
		"#": mapWall,
		".": mapFree,
		"S": mapFree,
		"E": mapFree,
	}
	for scanner.Scan() {
		line := scanner.Text()
		chars := strings.Split(line, "")
		row := []uint8{}
		for charIx, char := range chars {
			if item, ok := mapObjects[char]; ok {
				row = append(row, item)
			}
			switch char {
				case "S":
					start.y = rowIx
					start.x = charIx
				case "E":
					end.y = rowIx
					end.x = charIx
			}
		}
		mapData = append(mapData, row)
		rowIx++
	}
	return
}
