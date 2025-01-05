//go:build ignore

package main

import (
	"fmt"
	"math"
	"os"
	"regexp"
	"strconv"
)

type Robot struct {
	px, py, vx, vy int
}

func main() {
	// data,lenX,lenY:=readData("example.txt",11,7)
	data, lenX, lenY := readData("input.txt", 101, 103)
	// fmt.Println(data,lenX,lenY)
	// fmt.Println(len(data))
	part1(data, lenX, lenY)
	part2(data, lenX, lenY)
}

func part2(robots []Robot, lenX int, lenY int) {
	splitX := (lenX - 1) / 2
	splitY := (lenY - 1) / 2
	iterations := lenX * lenY
	products := make([]int, iterations)
	for i := 0; i < iterations; i++ {
		quadCount := make([]int, 4)
		for _, robot := range robots {
			// mod doesn't wrap back up to positive
			nx := (((robot.px + robot.vx*i) % lenX) + lenX) % lenX
			ny := (((robot.py + robot.vy*i) % lenY) + lenY) % lenY
			if nx == splitX || ny == splitY {
				continue
			}
			if nx < splitX {
				if ny < splitY {
					quadCount[0]++
				} else {
					quadCount[1]++
				}
			} else {
				if ny < splitY {
					quadCount[2]++
				} else {
					quadCount[3]++
				}
			}
		}
		product := quadCount[0] * quadCount[1] * quadCount[2] * quadCount[3]
		products[i] = product
	}
	// fmt.Println(products)
	lowestIx, highestIx := -1, -1
	lowest, highest := int(math.Pow(float64(len(robots)), float64(4))), 0
	for i, p := range products {
		if p > highest {
			highest = p
			highestIx = i
		}
		if p < lowest {
			lowest = p
			lowestIx = i
		}
	}
	if 1 == 0 {
		fmt.Println("lowestIx", lowestIx, "highestIx", highestIx, "lowest", lowest, "highest", highest)
	}
	fmt.Println("part 2: ", lowestIx)

}

func part1(robots []Robot, lenX int, lenY int) {
	i := 100
	quadCount := make([]int, 4)
	splitX := (lenX - 1) / 2
	splitY := (lenY - 1) / 2
	for robotIx, robot := range robots {
		// mod doesn't wrap back up to positive
		nx := (((robot.px + robot.vx*i) % lenX) + lenX) % lenX
		ny := (((robot.py + robot.vy*i) % lenY) + lenY) % lenY
		if 1 == 0 {
			fmt.Println(robotIx, "robot", robot, "nx", nx, "ny", ny)
		}
		if nx == splitX || ny == splitY {
			continue
		}
		if nx < splitX {
			if ny < splitY {
				quadCount[0]++
			} else {
				quadCount[1]++
			}
		} else {
			if ny < splitY {
				quadCount[2]++
			} else {
				quadCount[3]++
			}
		}
	}
	product := quadCount[0] * quadCount[1] * quadCount[2] * quadCount[3]
	// fmt.Println("quadCount",quadCount,"product",product)
	fmt.Println("part 1:", product)
}

func readData(filename string, lenX int, lenY int) ([]Robot, int, int) {
	content, _ := os.ReadFile(filename)
	regex, _ := regexp.Compile("(-?[0-9]+)")
	matches := regex.FindAllStringSubmatch(string(content), -1)
	data := []Robot{}
	fields := make([]int, 4)
	for i, match := range matches {
		fields[i%len(fields)], _ = strconv.Atoi(match[0])
		if i%len(fields) == len(fields)-1 {
			machine := Robot{
				fields[0],
				fields[1],
				fields[2],
				fields[3],
			}
			data = append(data, machine)
		}
		// fmt.Println("i",i,"match",match,fields)
	}
	return data, lenX, lenY
}
