//go:build ignore

package main

import (
	"bufio"
	"fmt"
	"os"
	"strconv"
)

func main() {
	data := readData("input.txt")
	// fmt.Println(data)
	part1(copyDiskmap(data))
	// fmt.Println(data)
	part2(copyDiskmap(data))
}

func part2(diskMap []int) {
	lastFileId := -1
	for fromIxEnd := len(diskMap) - 1; fromIxEnd >= 0; fromIxEnd-- {
		fileId := diskMap[fromIxEnd]
		if fileId == -1 || fileId == lastFileId {
			continue
		}
		lastFileId = fileId
		fromIxStart := indexOf(diskMap, fileId)
		fileLength := fromIxEnd - fromIxStart + 1
		// fmt.Println("fileId",fileId,"fromIxStart",fromIxStart,"fromIxEnd",fromIxEnd,"fileLength",fileLength)
		spaceLength := 0
		spaceStartIx := -1
		for spaceScanIx := 0; spaceScanIx < fromIxStart; spaceScanIx++ {
			if diskMap[spaceScanIx] == -1 {
				spaceLength++
				if spaceStartIx == -1 {
					spaceStartIx = spaceScanIx
				}
				if spaceLength == fileLength {
					//BUG: we're insertint 1 index higher than actual
					for i := 0; i < fileLength; i++ {
						diskMap[spaceStartIx+i] = fileId
						diskMap[fromIxStart+i] = -1
					}
					// fmt.Println("move file",fileId,"from",fromIxStart,"length",fileLength,"to",spaceStartIx)
					break
				}
			} else {
				spaceLength = 0
				spaceStartIx = -1
			}
		}
	}
	checksum := 0
	for i, fileId := range diskMap {
		if fileId == -1 {
			continue
		}
		checksum += i * fileId
	}
	// fmt.Println(diskMap)
	fmt.Println("part 2:", checksum)
}

func indexOf(items []int, search int) int {
	for ix, item := range items {
		if item == search {
			return ix
		}
	}
	return -1
}

func part1(diskMap []int) {
	lastToIx := 0
	for fromIx := len(diskMap) - 1; fromIx >= 0; fromIx-- {
		fileId := diskMap[fromIx]
		if fileId == -1 {
			continue
		}
		for toIx := lastToIx; toIx < fromIx; toIx++ {
			if diskMap[toIx] == -1 {
				// fmt.Println("move file",fileId,"from",fromIx,"to",toIx)
				diskMap[toIx] = fileId
				diskMap[fromIx] = -1
				lastToIx = toIx
				break
			}
		}
	}
	// fmt.Println(diskMap)
	checksum := 0
	for i, fileId := range diskMap {
		if fileId == -1 {
			continue
		}
		checksum += i * fileId
	}
	fmt.Println("part 1:", checksum)
}

func copyDiskmap(data []int) []int {
	newData := make([]int, len(data))
	copy(newData, data)
	return newData
}

func readData(filename string) []int {
	f, _ := os.Open(filename)
	defer f.Close()
	var data []int
	scanner := bufio.NewScanner(f)
	scanner.Split(bufio.ScanRunes)
	charIx := 0
	for scanner.Scan() {
		length, _ := strconv.Atoi(scanner.Text())
		fileId := -1
		if charIx%2 == 0 {
			fileId = charIx / 2
		}
		fileData := make([]int, length)
		for i := range fileData {
			fileData[i] = fileId
		}
		data = append(data, fileData...)
		charIx++
	}
	return data
}
