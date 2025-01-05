//go:build ignore

package main

import (
	"bufio"
	"fmt"
	"os"
	"sort"
	"strings"
)

type Triplet struct {
	x, y, z string
}

func main() {
	// d4:=[][]int{{-1, 0},{0, 1},{1, 0},{0, -1}}
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	nodeConns := readData(filename)
	if debug > 0 {
		fmt.Println(nodeConns)
	}
	part1(nodeConns, debug)
	part2(nodeConns, debug)
}

func part2(nodeConns map[string]map[string]bool, debug uint8) {
	// nested function needs to be declared before assignment so that we can call it from itself
	var walk func(nodeA string, network map[string]bool)
	walk = func(nodeA string, network map[string]bool) {
		for nodeB := range nodeConns[nodeA] {
			// ignore if nodeB in network already
			if _, ok := network[nodeB]; ok {
				continue
			}
			// test if node b is connected to every node of network
			nodeBConns := nodeConns[nodeB]
			fullyConnected := true
			for networkNode := range network {
				if _, ok := nodeBConns[networkNode]; !ok {
					fullyConnected = false
					break
				}
			}
			// and if true, add nodeB to the network and walk it
			if fullyConnected {
				network[nodeB] = true
				walk(nodeB, network)
			}
		}
	}

	// recursively map each network. networks will contain duplicates but it doesn't matter
	networks := []map[string]bool{}
	for node := range nodeConns {
		network := map[string]bool{node: true}
		walk(node, network)
		networks = append(networks, network)
	}
	// sort by network len descending
	sort.Slice(networks, func(a, b int) bool {
		return len(networks[b]) < len(networks[a])
	})
	largestNetwork := networks[0]
	if debug > 0 {
		fmt.Println("largestNetwork", largestNetwork)
	}
	// pull the nodes out of the map and add to an array
	// the thee makes params are type, size, max size. by setting size to 0, we can append from the beginning into preallocated memory and don't need to track the index
	nodes := make([]string, 0, len(largestNetwork))
	for node := range largestNetwork {
		nodes = append(nodes, node)
	}
	// sort the nodes array and join to make the password
	sort.Strings(nodes)
	password := strings.Join(nodes, ",")
	fmt.Println("part 2:", password)
}

func part1(nodeConns map[string]map[string]bool, debug uint8) {
	triplets := make(map[Triplet]bool)
	for nodeA, nodeAConns := range nodeConns {
		for nodeB := range nodeAConns {
			for nodeC := range nodeConns[nodeB] {
				if !(nodeA[0] == 't' || nodeB[0] == 't' || nodeC[0] == 't') {
					continue
				}
				if _, ok := nodeAConns[nodeC]; ok {
					nodes := []string{nodeA, nodeB, nodeC}
					sort.Strings(nodes)
					triplets[Triplet{nodes[0], nodes[1], nodes[2]}] = true
				}
			}
		}
		if debug > 0 {
			fmt.Println(triplets)
		}
	}
	fmt.Println("part 1:", len(triplets))
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

func readData(filename string) map[string]map[string]bool {
	f, _ := os.Open(filename)
	scanner := bufio.NewScanner(f)
	data := make(map[string]map[string]bool)
	for scanner.Scan() {
		nodes := strings.Split(scanner.Text(), "-")
		if len(nodes) != 2 {
			continue
		}
		if _, ok := data[nodes[0]]; !ok {
			data[nodes[0]] = make(map[string]bool)
		}
		data[nodes[0]][nodes[1]] = true
		if _, ok := data[nodes[1]]; !ok {
			data[nodes[1]] = make(map[string]bool)
		}
		data[nodes[1]][nodes[0]] = true
	}
	return data
}
