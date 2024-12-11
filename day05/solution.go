package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main(){
	rules,updates:=readData("input.txt")
	// fmt.Println(rules)
	// fmt.Println(updates)
	part1(rules,updates)
	part2(rules,updates)
}


func indexOf(items[]int,search int)(int){
	for ix,item:=range items {
		if (item==search) {
			return ix
		}
	}
	return -1
}

func moveBefore(items[]int,fromIx int,beforeIx int)([]int){
	elem:=items[fromIx]
	// remove
	if fromIx==len(items)-1{
		items=items[:fromIx]
	} else {
		items=append(items[:fromIx],items[fromIx+1:]...)
	}
	// cursed concat
	return append(items[:beforeIx],append([]int{elem},items[beforeIx:]...)...)
}

func part2(rules[][]int,updates[][]int){
	sumMiddle:=0
	for _,update:=range updates{
		correctOrder:=true
		var updateRules[][]int
		for _,rule:=range rules{
			beforeIx:=indexOf(update,rule[0])
			afterIx:=indexOf(update,rule[1])
			if beforeIx>-1 && afterIx>-1 {
				updateRules=append(updateRules,rule)
				if beforeIx>afterIx  {
					correctOrder=false
				}
			}
		}
		if !correctOrder {
			moved:=true
			for moved {
				moved=false
				for _,rule:=range updateRules{
					beforeIx:=indexOf(update,rule[0])
					afterIx:=indexOf(update,rule[1])
					if beforeIx>afterIx{
						update=moveBefore(update,beforeIx,afterIx)
						moved=true
					}
				}
			}
			sumMiddle+=update[len(update)/2]
		}
	}
	fmt.Printf("part 2: %d\n",sumMiddle)
}
func part1(rules[][]int,updates[][]int){
	sumMiddle:=0
	for _,update:=range updates{
		correctOrder:=true
		for _,rule:=range rules{
			if !correctOrder {
				break
			}
			beforeIx:=indexOf(update,rule[0])
			afterIx:=indexOf(update,rule[1])
			if beforeIx>-1 && afterIx>-1 && beforeIx>afterIx {
				correctOrder=false
				break
			}
		}
		if correctOrder {
			sumMiddle+=update[len(update)/2]
		}
	}
	fmt.Printf("part 1: %d\n",sumMiddle)
}

func readData(filename string)(rules[][]int,updates[][]int){
	f,_:=os.Open(filename)
	defer f.Close()
	var data[][][]int
	data=append(data,[][]int{})
	delim:="|"
	section:=0
	scanner:=bufio.NewScanner(f)
	for scanner.Scan(){
		line:=scanner.Text()
		if line==""{
			delim=","
			section++
			data=append(data,[][]int{})
			continue
		}
		words:=strings.Split(line, delim)
		var numbers[]int
		for _,word:=range words{
			parsed,_:=strconv.Atoi(word)
			numbers=append(numbers,parsed)
		}
		data[section]=append(data[section], numbers)
	}
	rules=data[0]
	updates=data[1]
	return
}