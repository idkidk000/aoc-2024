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
	f,_:=os.Open("input.txt")
	defer f.Close()
	scanner:=bufio.NewScanner(f)
	scanner.Split(bufio.ScanWords)
	left:=[]int{}
	right:=[]int{}
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
	// fmt.Println(left)
	// fmt.Println(right)
	total:=0
	rightCounts:=make(map[int]int)
	for ix:=0;ix<len(left);ix++{
		total+=int(math.Abs(float64(left[ix]-right[ix])))
		rightCounts[right[ix]]+=1
	}
	fmt.Printf("part 1 %d\n",total)
	// fmt.Println(rightCounts)
	simTotal:=0
	for ix:=0;ix<len(left);ix++{
		simTotal+=(left[ix]*rightCounts[left[ix]])
	}
	fmt.Printf("part 2 %d\n",simTotal)

}