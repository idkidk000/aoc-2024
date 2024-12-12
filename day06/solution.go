package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Coord struct {
	row int
	col int
}
type CoordAndDir struct {
	row int
	col int
	dir int
}

func main(){
	grid:=readData("input.txt")
	// fmt.Println(grid)
	startCoord:=findChar(grid,"^")
	part1(grid,startCoord)
	part2(grid,startCoord)
}

func part2(grid[][]string,startCoord Coord){
	rowCount:=len(grid)
	colCount:=len(grid[0])
	coord:=startCoord
	direction:=0
	guardPath:=map[Coord]bool{}
	for true{
		nextCoord:=move(coord,direction)
		if inBounds(nextCoord,rowCount,colCount){
			// on-map
			switch grid[nextCoord.row][nextCoord.col]{
				case "#":
					// box: turn right,
					direction=(direction+1)%4
				case "^":
					// guard start. advance but don't add to guardPath
					coord=nextCoord
				default:
					// path clear, move
					guardPath[nextCoord]=true;
					coord=nextCoord
			}
		} else {
			// off map
			break
		}
	}

	loopCount:=0
	for boxCoord:=range guardPath{
		// deep copy so that updates dont corrupt the grid
		var testGrid[][]string
		for _,row:=range grid{
			testGrid=append(testGrid,append([]string(nil),row...))
		}
		testGrid[boxCoord.row][boxCoord.col]="#"
		testPath:=map[CoordAndDir]bool{}
		coord:=startCoord
		direction:=0
		// fmt.Println("drop box at",boxCoord,"loops:",loopCount)

		for true{
			nextCoord:=move(coord,direction)
			if inBounds(nextCoord,rowCount,colCount){
				// on-map
				if testGrid[nextCoord.row][nextCoord.col]=="#" {
					// box: turn right,
					direction=(direction+1)%4
				} else {
					// path clear, move
					nextCoordAndDir:=CoordAndDir{nextCoord.row,nextCoord.col,direction}
					foundPath,_:=testPath[nextCoordAndDir]
					if foundPath{
						loopCount++
						fmt.Println("loop",loopCount,"at box",boxCoord)
						break
					}
					testPath[nextCoordAndDir]=true;
					coord=nextCoord
				}
			} else {
				// off map
				break
			}
		}
	}
	// BUG: off by one - should be 1719, get 1720
	fmt.Println("part 2:",loopCount,"len guardPath",len(guardPath))
}

func part1(grid[][]string,startCoord Coord){
	rowCount:=len(grid)
	colCount:=len(grid[0])
	coord:=startCoord
	direction:=0
	distinctCoords:=map[Coord]bool{}
	for true{
		nextCoord:=move(coord,direction)
		if inBounds(nextCoord,rowCount,colCount){
			// on-map
			if grid[nextCoord.row][nextCoord.col]=="#" {
				// box: turn right,
				direction=(direction+1)%4
			} else {
				// path clear, move
				distinctCoords[nextCoord]=true;
				coord=nextCoord
			}
		} else {
			// off map
			break
		}
	}
	fmt.Printf("part 1: %d\n",len(distinctCoords))
}

func inBounds(coord Coord,rowCount int,colCount int)(bool){
	return 0<=coord.row && coord.row<rowCount && 0<=coord.col && coord.col<colCount
}

func move(coord Coord,dir int)(Coord){
	newCoord:=Coord{row:coord.row,col:coord.col}
	switch dir{
		case 0: newCoord.row--
		case 1: newCoord.col++
		case 2: newCoord.row++
		case 3: newCoord.col--
	}
	return newCoord
}

func findChar(grid[][]string,find string)(Coord){
	for rowIx,row:=range grid{
		for colIx,char:=range row{
			if char==find{
				return Coord{row:rowIx,col:colIx}
			}
		}
	}
	return Coord{row:-1,col:-1}
}

func readData(filename string)([][]string){
	f,_:=os.Open(filename)
	defer f.Close()
	var data[][]string
	scanner:=bufio.NewScanner(f)
	for scanner.Scan(){
		line:=scanner.Text()
		chars:=strings.Split(line,"")
		data=append(data, chars)
	}
	return data
}