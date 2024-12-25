package main

import (
	"fmt"
	"os"
	"strings"
)

func main() {
	filename,debug:=parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	locks,keys,rows,cols := readData(filename)
	if debug>0{
		fmt.Println("locks",locks)
		fmt.Println("keys",keys)
		fmt.Println("rows",rows,"cols",cols)
	}
	part1(locks,keys,rows,cols,debug)
}

func part1(locks[][]int,keys[][]int,rows int,cols int,debug uint8){
	fitCount:=0
	for _,lock:=range locks{
		for _,key:=range keys{
			fit:=true
			for c:=0;c<cols;c++{
				if lock[c]+key[c]>=rows-1 {
					fit=false
					break
				}
			}
			if debug>0 {
				fmt.Println("lock",lock,"key",key,"fit",fit)
			}
			if fit{
				fitCount++
			}
		}
	}
	fmt.Println("part 1", fitCount)
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

func readData(filename string)(locks [][]int, keys [][]int, rows int, cols int){
	content, _ := os.ReadFile(filename)
	locks=make([][]int, 0)
	keys=make([][]int, 0)
	rows=7
	cols=5
	for _,item:=range strings.Split(string(content),"\n\n"){
		// fmt.Println("item",item)
		lines:=strings.Split(item,"\n")
		heights:=make([]int,cols)
		if string(lines[0][0])=="#" {
			//lock
			for c:=0;c<cols;c++{
				for r:=0;r<rows;r++{
					if string(lines[r][c])=="." {
						heights[c]=r-1
						break
					}
				}
			}
			locks = append(locks, heights)
		} else {
			for c:=0;c<cols;c++{
				for r:=0;r<rows;r++{
					if string(lines[r][c])=="#" {
						heights[c]=rows-r-1
						break
					}
				}
			}
			keys = append(keys, heights)
		}
	}
	return
}
