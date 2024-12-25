package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

type Gate struct {
	operator,left,right string
}


func main() {
	// d4:=[][]int{{-1, 0},{0, 1},{1, 0},{0, -1}}
	filename,debug:=parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	wires,gates := readData(filename)
	if debug>0{
		fmt.Println("wires",wires)
		fmt.Println("gates",gates)
	}
	part1(wires,gates,debug)
	// no part 2 since it needs to be solved by manual analysis. for the python solve, i created some helper functions and used the repl to investigate
}

func part1(wires map[string]bool,gates map[string]Gate,debug uint8){
	var resolve func(gate string)(bool)
	resolve=func(gate string)(bool){
		if cached,ok:=wires[gate]; ok {
			return cached
		}
		definition:=gates[gate]
		if debug>1{
			fmt.Println("resolve",gate,definition)
		}
		left:=resolve(definition.left)
		right:=resolve(definition.right)
		var result bool
		switch definition.operator{
		case "AND": result=left&&right
		case "OR": result=left||right
		case "XOR": result=left!=right
		}
		wires[gate]=result
		return result
	}
	zGates:=make([]string,0)
	for gate:=range gates{
		if string(gate[0])=="z"{
			zGates = append(zGates, gate)
		}
	}
	sort.Slice(zGates, func(i, j int) bool {
		return zGates[i]<zGates[j]
	})
	if debug>0{
		fmt.Println("zGates",zGates)
	}
	result:=0
	for i,zGate:=range zGates{
		if resolve(zGate){
			result+=1<<i
		}
	}
	fmt.Println("part 1",result)
}

func parseArgs() (filename string, debug uint8) {
	filename = "example.txt"
	debug = 0
	for _, arg := range os.Args[1:] {
		switch arg {
		case "-i":
			filename = "input.txt"
		case "-e":
			filename = "example.txt"
		case "-e2":
			filename = "example2.txt"
		case "-e3":
			filename = "example3.txt"
		case "-e4":
			filename = "example4.txt"
		case "-d":
			debug = 1
		case "-d2":
			debug = 2
		case "-d3":
			debug = 3
		default:
			fmt.Printf("unknown arg: %s\n", arg)
		}
	}
	return
}

func readData(filename string)(wires map[string]bool,gates map[string]Gate){
	wires=make(map[string]bool)
	gates=make(map[string]Gate,0)

	f, _ := os.Open(filename)
	defer f.Close()
	scanner := bufio.NewScanner(f)
	scanner.Split(bufio.ScanLines)
	section := 0
	for scanner.Scan() {
		line := scanner.Text()
		switch section {
		case 0:
			if line == "" {
				section = 1
				continue
			}
			parts := strings.Split(line, ": ")
			wires[parts[0]]=parts[1]=="1"
		case 1:
			parts := strings.Split(line, " ")
			gates[parts[4]]=Gate{parts[1],parts[0],parts[2]}
		}
	}
	return
}
