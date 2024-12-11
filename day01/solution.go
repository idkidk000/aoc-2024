package main

import (
	"bufio"
	"fmt"
	"math"
	"os"
	"slices"
	"strconv"
)

func main(){
	left,right:=readData("input.txt")
	part1(left,right)
	part2(left,right)
}

func part2(left[]int,right[]int){
	rightCounts:=make(map[int]int)
	for _,rightValue:=range right{
		rightCounts[rightValue]++
	}
	simTotal:=0
	for _,leftValue:=range left{
		simTotal+=leftValue*rightCounts[leftValue]
	}
	fmt.Printf("part 2 %d\n",simTotal)
}

func part1(left[]int,right[]int){
	total:=0
	for ix:=range left{
		total+=int(math.Abs(float64(left[ix]-right[ix])))
	}
	fmt.Printf("part 1 %d\n",total)
}

func readData(filename string)(left []int, right []int){
	f,_:=os.Open(filename)
	defer f.Close()
	scanner:=bufio.NewScanner(f)
	scanner.Split(bufio.ScanWords)
	ix:=0;
	for scanner.Scan(){
		parsed,_:=strconv.Atoi(scanner.Text())
		if (ix%2==0){
			left=append(left,parsed)
			} else {
			right=append(right,parsed)
		}
		ix++
	}
	slices.Sort(left)
	slices.Sort(right)
	return
}