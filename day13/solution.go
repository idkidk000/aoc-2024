package main

import (
	"fmt"
	"math"
	"os"
	"regexp"
	"strconv"
)

type Machine struct {
	ax, ay, bx, by, px, py int
}

func main() {
	// data:=readData("example.txt")
	data := readData("input.txt")
	// fmt.Println(data)
	solve(data, 0)
	solve(data, 10000000000000)
}

func solve(machines []Machine, offset int) {
	totalCost := 0
	for _, machine := range machines {
		ax := float64(machine.ax)
		ay := float64(machine.ay)
		bx := float64(machine.bx)
		by := float64(machine.by)
		px := float64(machine.px + offset)
		py := float64(machine.py + offset)

		// i think the operands need casting to floats
		ma := (px*by - py*bx) / (ax*by - ay*bx)
		mb := (px - ma*ax) / bx

		_, ma_f := math.Modf(ma)
		_, mb_f := math.Modf(mb)

		valid := (ma > 0 || mb > 0) && ma_f == 0 && mb_f == 0
		cost := int(ma*3 + mb)

		// fmt.Println("machine",machine,"ma",ma,"mb",mb,"valid",valid,"cost",cost)

		if valid {
			totalCost += cost
		}
	}
	fmt.Println("offset", offset, "totalCost", totalCost)
}

func readData(filename string) (data []Machine) {
	content, _ := os.ReadFile(filename)
	regex, _ := regexp.Compile("([0-9]+)")
	matches := regex.FindAllStringSubmatch(string(content), -1)
	fields := make([]int, 6)
	for i, match := range matches {
		fields[i%6], _ = strconv.Atoi(match[0])
		if i%6 == 5 {
			machine := Machine{
				fields[0],
				fields[1],
				fields[2],
				fields[3],
				fields[4],
				fields[5],
			}
			data = append(data, machine)
		}
		// fmt.Println("i",i,"match",match,fields)
	}
	return
}
