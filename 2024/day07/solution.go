//go:build ignore

package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
	"strings"
)

func main() {
	data := readData("input.txt")
	fmt.Println(data)
	part1(data)
	part2(data)
}

func part2(data [][]int) {
	total := 0
	for ixRow, row := range data {
		fmt.Println("row", ixRow, row)
		target := row[0]
		results := []int{row[1]}
		for _, operand := range row[2:] {
			var newResults []int
			for _, prevResult := range results {
				newResults = append(newResults, prevResult+operand)
				newResults = append(newResults, prevResult*operand)
				//TODO: cast as string, concat, cast as int
				newResults = append(newResults, intConcat(prevResult, operand))
			}
			// fmt.Println("  ",results,"->",newResults)
			results = newResults
		}
		if indexOf(results, target) > -1 {
			total += target
		}
	}
	fmt.Println("part 2:", total)
}

func intConcat(left int, right int) int {
	leftStr := strconv.Itoa(left)
	rightStr := strconv.Itoa(right)
	concatStr := leftStr + rightStr
	concatInt, err := strconv.Atoi(concatStr)
	if err != nil {
		fmt.Println("error concating", left, right, "->", leftStr, rightStr, "->", concatStr, "->", concatInt)
	}
	return concatInt
}

func part1(data [][]int) {
	total := 0
	for ixRow, row := range data {
		fmt.Println("row", ixRow, row)
		target := row[0]
		results := []int{row[1]}
		for _, operand := range row[2:] {
			var newResults []int
			for _, prevResult := range results {
				newResults = append(newResults, prevResult+operand)
				newResults = append(newResults, prevResult*operand)
			}
			// fmt.Println("  ",results,"->",newResults)
			results = newResults
		}
		if indexOf(results, target) > -1 {
			total += target
		}
	}
	fmt.Println("part 1:", total)
}

func indexOf(items []int, search int) int {
	for ix, item := range items {
		if item == search {
			return ix
		}
	}
	return -1
}
func readData(filename string) [][]int {
	f, _ := os.Open(filename)
	defer f.Close()
	var data [][]int
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		words := strings.Fields(strings.Replace(scanner.Text(), ":", "", -1))
		var line []int
		for _, word := range words {
			parsed, _ := strconv.Atoi(word)
			line = append(line, parsed)
		}
		data = append(data, line)
	}
	return data
}
