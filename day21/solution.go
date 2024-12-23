package main

/*
	FIXME: INCOMPLETE
*/

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

type Coord struct {
	r, c int
}

type CoordPress struct {
	r int
	c int
	b string
}

// can't use slices as constants
var numericKeypad = [][]string{
	{"7", "8", "9"},
	{"4", "5", "6"},
	{"1", "2", "3"},
	{"", "0", "A"},
}

var directionalKeypad = [][]string{
	{"", "^", "A"},
	{"<", "v", ">"},
}

func main() {
	// d4:=[][]int{{-1, 0},{0, 1},{1, 0},{0, -1}}
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	codes := readData(filename)
	if debug > 0 {
		fmt.Println("codes", codes)
	}
	numericMoves := walkKeypad(numericKeypad,0)
	if debug > 0 {
		fmt.Println(numericMoves)
	}
	directionalMoves := walkKeypad(directionalKeypad,0)
	if debug > 0 {
		fmt.Println(directionalMoves)
	}
	part1(codes,numericMoves,directionalMoves,debug)
}

func part1(codes []string, numericMoves map[string][]string,directionalMoves map[string][]string,debug uint8){
	for _,code:=range codes{
		result:=transcribe(code,numericMoves,debug)
		fmt.Println("code",code,"sequences",result)
		// need to write a function which accepts an [][] of sequences and a keymap , wraps transcribe(), and returns the shortest sequences
		// then we can call it 4 times in itself to get the result for part 1
		// part 2 needs much more big braining
		for _,sequence:=range result {
			for _,subsequence:=range sequence {
				result2:=transcribe(subsequence,directionalMoves,debug)
				fmt.Println("subsequence",subsequence,"sequences",result2)
			}
		}
	}
}

func transcribe(code string,moves map[string][]string, debug uint8)(sequences [][]string){
	// accepts either the numeric or direction keypad moves and transcribes to another layer of directional moves
	sequences=make([][]string,0,len(code))
	prefixedCode:=fmt.Sprintf("A%s",code)
	for i:=1;i<len(prefixedCode);i++{
		index:=prefixedCode[i-1:i+1]
		subsequence:=moves[index]
		sequences = append(sequences, subsequence)
		if debug>1 {
			fmt.Println("transcribe code",code,"i",i,"index",index,"seqs",subsequence)
		}
	}
	return
}

func walkKeypad(keypad [][]string, debug uint8) (moves map[string][]string) {
	moves = make(map[string][]string)
	keyMap := map[string]Coord{}
	rows := len(keypad)
	cols := len(keypad[0])
	// build a map of key names and coords
	for r, row := range keypad {
		for c, col := range row {
			if col != "" {
				keyMap[col] = Coord{r, c}
			}
		}
	}
	if debug>1 {
		fmt.Println("keyMap",keyMap)
	}
	// walk from each button to each button. add each valid path to moves
	for fromKey, fromCoord := range keyMap {
		for toKey, toCoord := range keyMap {
			if debug>1 {
				fmt.Println("fromKey",fromKey,"toKey",toKey)
			}
			minMoves := rows * cols
			// cache key for moves map
			movesIndex := fmt.Sprintf("%s%s", fromKey, toKey)
			// same button only requires a press
			if fromKey == toKey {
				moves[movesIndex] = []string{"A"}
				continue
			}
			// otherwise, init to an empty slice
			moves[movesIndex] = []string{}
			// init paths
			paths := [][]CoordPress{{CoordPress{fromCoord.r, fromCoord.c, ""}}}
			for len(paths) > 0 {
				if debug>1 {
					fmt.Println("len paths loop top")
				}
				// pop left
				path := paths[0]
				paths = paths[1:]
				if len(path) > minMoves {
					continue
				}
				current := path[len(path)-1]
				if debug>1 {
					fmt.Println("path",path,"len(paths)",len(paths),"current",current)
				}
				for d := 0; d < 4; d++ {
					next := CoordPress{current.r, current.c, ""}
					switch d {
					case 0:
						next.r--
						next.b = "^"
					case 1:
						next.c++
						next.b = ">"
					case 2:
						next.r++
						next.b = "v"
					case 3:
						next.c--
						next.b = "<"
					}
					// oob
					if next.r < 0 || next.r >= rows || next.c < 0 || next.c >= cols {
						if debug>1 {
							fmt.Println("oob",next)
						}
						continue
					}
					// missing key
					if keypad[next.r][next.c]=="" {
						if debug>1{
							fmt.Println("missing key",next)
						}
						continue
					}
					// bit grim
					duplicate := false
					for _, p := range path {
						if p.r == next.r && p.c == next.c {
							duplicate = true
							break
						}
					}
					if duplicate {
						if debug>1 {
							fmt.Println("duplicate", next)
						}
						continue
					}
					if next.r == toCoord.r && next.c == toCoord.c {
						if debug>1 {
							fmt.Println("reached end",path,next)
						}
						// push the keys and "A" to moves[movesIndex]=[]
						presses := make([]string, len(path)+1)
						for i, c := range path[1:] {
							presses[i] = c.b
						}
						presses[len(path)-1] = next.b
						presses[len(path)] = "A"
						if debug>1 {
							fmt.Println(movesIndex,"found path",presses,path)
						}
						moves[movesIndex] = append(moves[movesIndex], strings.Join(presses, ""))
						minMoves = len(path)
						if (debug>1 ){
							fmt.Println("reached end done",path,next)
						}
						break
					} else {
						if debug>1 {
							fmt.Println("continue", next)
						}
						nextPath := make([]CoordPress, len(path)+1)
						copy(nextPath, path)
						nextPath[len(path)] = next
						paths = append(paths, nextPath)
						if debug>1 {
							fmt.Println("continue done. path:",path,"next:",next,"nextPath",nextPath)
						}
					}
				}
			}
			if debug>1{
				fmt.Println("moves=",moves)
			}
		}
	}
	return
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

func readData(filename string) (codes []string) {
	f, _ := os.Open(filename)
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		codes = append(codes, scanner.Text())
	}
	return
}
