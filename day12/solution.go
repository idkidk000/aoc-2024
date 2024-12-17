package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Edge struct {
	row, col, dir int
}

func main() {
	// mapData:=readData("example.txt")
	// mapData:=readData("example2.txt")
	mapData := readData("input.txt")
	mapWalked := make([][]bool, len(mapData))
	for i, row := range mapData {
		mapWalked[i] = make([]bool, len(row))
	}
	// fmt.Println(mapData)
	// fmt.Println(mapWalked)
	totalCost1 := 0
	totalCost2 := 0
	for ixRow, row := range mapData {
		for ixCol, char := range row {
			if !mapWalked[ixRow][ixCol] {
				area, perimeter, edges := walk(mapData, mapWalked, ixRow, ixCol)
				cost1 := area * perimeter
				// fmt.Println(ixRow,ixCol,char,area,perimeter,cost1,edges)
				edgeCount := 0
				for _, edge := range edges {
					// fmt.Println("  edge",edge)
					testEdge := Edge{edge.row, edge.col, edge.dir}
					switch edge.dir {
					case 0, 2:
						testEdge.col--
					case 1, 3:
						testEdge.row--
					}
					// fmt.Println("    testEdge",testEdge)
					found := false
					for _, e := range edges {
						if e == testEdge {
							// fmt.Println("      found",e)
							found = true
							break
						}
					}
					if !found {
						// fmt.Println("      edgeCount++")
						edgeCount++
					}
				}
				cost2 := area * edgeCount
				fmt.Println(ixRow, ixCol, char, area, perimeter, cost1, edgeCount, cost2)
				totalCost1 += cost1
				totalCost2 += cost2
			}
		}
	}
	fmt.Println("part 1:", totalCost1)
	fmt.Println("part 2:", totalCost2)
}

func walk(mapData [][]string, mapWalked [][]bool, rowIx int, colIx int) (area int, perimeter int, edges []Edge) {
	area = 1
	perimeter = 0
	mapWalked[rowIx][colIx] = true
	rowCount := len(mapData)
	colCount := len(mapData[0])
	charAt := mapData[rowIx][colIx]
	for dirIx := 0; dirIx < 4; dirIx++ {
		testRowIx := rowIx
		testColIx := colIx
		switch dirIx {
		case 0:
			testRowIx--
		case 1:
			testColIx++
		case 2:
			testRowIx++
		case 3:
			testColIx--
		}
		edge := Edge{rowIx, colIx, dirIx}
		if 0 <= testRowIx && testRowIx < rowCount && 0 <= testColIx && testColIx < colCount {
			// on map
			if mapData[testRowIx][testColIx] == charAt {
				// our area
				if !mapWalked[testRowIx][testColIx] {
					walkedArea, walkedPerimeter, walkedEdges := walk(mapData, mapWalked, testRowIx, testColIx)
					area += walkedArea
					perimeter += walkedPerimeter
					edges = append(edges, walkedEdges...)
				}
			} else {
				// different area
				perimeter++
				edges = append(edges, edge)
			}
		} else {
			// off map
			perimeter++
			edges = append(edges, edge)
		}
	}
	return area, perimeter, edges
}

func readData(filename string) [][]string {
	f, _ := os.Open(filename)
	defer f.Close()
	var data [][]string
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		chars := strings.Split(scanner.Text(), "")
		data = append(data, chars)
	}
	return data
}
