package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
)

func main() {
	data := readData("input.txt")
	fmt.Println(data)
	solve(data, 25)
	solve(data, 75)
}

func solve(data []int, iterations int) {
	counter := map[int]int{}
	for _, x := range data {
		counter[x]++
	}
	for i := 1; i < iterations+1; i++ {
		// make a new counter to update
		newCounter := map[int]int{}
		//so we can loop over the old one
		for number, count := range counter {
			if count == 0 {
				continue
			}
			if number == 0 {
				newCounter[1] += count
			} else {
				numberStr := strconv.Itoa(number)
				numberStrLen := len(numberStr)
				if numberStrLen%2 == 0 {
					numberStrA := numberStr[:numberStrLen/2]
					numberStrB := numberStr[numberStrLen/2:]
					numberA, _ := strconv.Atoi(numberStrA)
					numberB, _ := strconv.Atoi(numberStrB)
					newCounter[numberA] += count
					newCounter[numberB] += count
				} else {
					newCounter[number*2024] += count
				}
			}
		}
		// fmt.Println("i=",i,"counter=",newCounter)
		counter = newCounter
	}
	total := 0
	for _, value := range counter {
		total += value
	}
	fmt.Println("interations", iterations, "total", total)
}

func readData(filename string) []int {
	f, _ := os.Open(filename)
	defer f.Close()
	var data []int
	scanner := bufio.NewScanner(f)
	scanner.Split(bufio.ScanWords)
	for scanner.Scan() {
		parsed, _ := strconv.Atoi(scanner.Text())
		data = append(data, parsed)
	}
	return data
}
