package main

import (
	"bufio"
	"fmt"
	"math"
	"os"
	"strconv"
	"strings"
)

func main() {
	reports := readData("input.txt")
	// fmt.Println(reports)
	bothParts(reports)
}

func isReportSafe(report []int) bool {
	var deltas []int
	var prevValue int
	firstValue := true
	for _, value := range report {
		if firstValue {
			firstValue = false
		} else {
			deltas = append(deltas, prevValue-value)
		}
		prevValue = value
	}
	allSafe := true
	lastPositive := deltas[0] >= 0
	for _, delta := range deltas {
		absDelta := int(math.Abs(float64(delta)))
		inRange := 1 <= absDelta && absDelta <= 3
		sameSign := lastPositive == (delta >= 0)
		if !(inRange && sameSign) {
			allSafe = false
		}
	}
	// fmt.Println(deltas,allSafe)
	return allSafe
}

func bothParts(reports [][]int) {
	totalSafe := 0
	totalDampedSafe := 0
	for _, report := range reports {
		if isReportSafe(report) {
			totalSafe++
		} else {
			for ixExclude := range report {
				//BUG
				var dampedReport []int
				dampedReport = append(dampedReport, report[:ixExclude]...)
				dampedReport = append(dampedReport, report[ixExclude+1:]...)
				// fmt.Println(report,ixExclude,dampedReport)
				if isReportSafe(dampedReport) {
					totalDampedSafe++
					break
				}
			}
		}
	}
	fmt.Printf("part 1 %d\n", totalSafe)
	fmt.Printf("part 2 %d\n", totalSafe+totalDampedSafe)
}

func readData(filename string) [][]int {
	f, _ := os.Open(filename)
	defer f.Close()
	var reports [][]int
	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		words := strings.Fields(scanner.Text())
		var report []int
		for _, word := range words {
			parsed, _ := strconv.Atoi(word)
			report = append(report, parsed)
		}
		reports = append(reports, report)
	}
	return reports
}
