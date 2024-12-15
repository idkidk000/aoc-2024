package main

import (
	"fmt"
	"os"
	"regexp"
	"strconv"
)

type Coord struct {
	x,y int
}

func main(){
	// data:=readData("example.txt")
	data:=readData("input.txt")
	fmt.Println(data)
	// fmt.Println(len(data))
	// part1(data)
	// part2(data)
}

func readData(filename string)([]Coord){
	content,_:=os.ReadFile(filename)
	regex,_:=regexp.Compile("(-?[0-9]+)")
	matches:=regex.FindAllStringSubmatch(string(content),-1)
	data:=[]Coord{}
	fields:=make([]int,2)
	for i,match:=range matches{
		fields[i%len(fields)],_=strconv.Atoi(match[0])
		if i%len(fields)==len(fields)-1{
				data = append(data, Coord{
					fields[0],
					fields[1],
				})
			}
		// fmt.Println("i",i,"match",match,fields)
	}
	return data
}