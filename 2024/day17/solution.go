//go:build ignore

package main

import (
	"fmt"
	"os"
	"regexp"
	"sort"
	"strconv"
	"strings"
)

func main() {
	filename, debug := parseArgs()
	fmt.Printf("filename: %s; debug: %d\n", filename, debug)
	program, regA, regB, regC := readData(filename)
	fmt.Printf("registers a: %d; b: %d; c: %d\n", regA, regB, regC)
	fmt.Println("program:", intArrayToString(program))
	part1(program, regA, regB, regC, debug)
	part2(program, regB, regC, debug)
}

func part2(program []int, regB uint64, regC uint64, debug int) {
	inputs := []uint64{}
	for i := 0; i < 8; i++ {
		inputs = append(inputs, uint64(i))
	}
	for instruction := len(program) - 1; instruction > -1; instruction-- {
		nextInputs := []uint64{}
		wantedResult := intArrayToString(program[instruction:])
		if debug > 0 {
			fmt.Printf("instruction: %d; inputs: %d; wantedResult: %s\n", instruction, len(inputs), wantedResult)
		}
		for _, prevInput := range inputs {
			for thisByte := 0; thisByte < 8; thisByte++ {
				nextInput := (prevInput << uint64(3)) + uint64(thisByte)
				resultStr := intArrayToString(runProgram(program, nextInput, regB, regC, debug))
				if debug > 1 {
					fmt.Printf("prevInput: %d; nextInput: %d; result: %s\n", prevInput, nextInput, resultStr)
				}
				if wantedResult == resultStr {
					nextInputs = append(nextInputs, nextInput)
				}
			}
		}
		if len(nextInputs) == 0 {
			fmt.Println("no inputs found")
			break
		}
		inputs = nextInputs
	}
	sort.Slice(inputs, func(i, j int) bool {
		return i < j
	})
	if debug > 0 {
		fmt.Println("inputs:", inputs)
	}
	fmt.Println("part 2:", inputs[0])
}

func part1(program []int, regA uint64, regB uint64, regC uint64, debug int) {
	result := runProgram(program, regA, regB, regC, debug)
	fmt.Print("part 1: ", intArrayToString(result), "\n")
}

func intArrayToString(data []int) string {
	strs := make([]string, len(data))
	for i, v := range data {
		strs[i] = strconv.Itoa(v)
	}
	return strings.Join(strs, ",")
}

func comboOperand(operand int, regA uint64, regB uint64, regC uint64) uint64 {
	switch operand {
	case 4:
		return regA
	case 5:
		return regB
	case 6:
		return regC
	case 7:
		fmt.Printf("invalid operand %d", operand) //no such thing as exceptions
	}
	return uint64(operand)
}

func runProgram(program []int, regA uint64, regB uint64, regC uint64, debug int) (output []int) {
	pointer := 0
	for pointer < len(program) {
		opcode := program[pointer]
		operand := program[pointer+1]
		if debug > 2 {
			fmt.Printf("pointer: %d; opcode: %d; operand: %d; a: %d; b: %d; c: %d\n", pointer, opcode, operand, regA, regB, regC)
		}
		pointer += 2
		switch opcode {
		case 0: //adv
			regA = regA >> comboOperand(operand, regA, regB, regC)
		case 1: //bxl
			regB = regB ^ uint64(operand)
		case 2: //bst
			regB = comboOperand(operand, regA, regB, regC) & 7
		case 3: //jnz
			if regA != 0 {
				pointer = operand
			}
		case 4: //bxc
			regB = regB ^ regC
		case 5: //out
			output = append(output, int(comboOperand(operand, regA, regB, regC)&uint64(7)))
		case 6: //bdv
			regB = regA >> comboOperand(operand, regA, regB, regC)
		case 7: //cdv
			regC = regA >> comboOperand(operand, regA, regB, regC)
		default:
			fmt.Printf("invalid opcode %d", opcode) //no such thing as exceptions
		}
	}
	return output
}

func parseArgs() (filename string, debug int) {
	filename = "example.txt"
	debug = 0
	for _, arg := range os.Args[1:] {
		switch arg {
		case "-i":
			filename = "input.txt"
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

func readData(filename string) (program []int, regA uint64, regB uint64, regC uint64) {
	content, err := os.ReadFile(filename)
	if err != nil {
		fmt.Println(err)
	}
	regex, _ := regexp.Compile("(-?[0-9]+)")
	matches := regex.FindAllStringSubmatch(string(content), -1)
	for i, match := range matches {
		if i < 3 {
			val, _ := strconv.ParseUint(match[0], 10, 64)
			switch i {
			case 0:
				regA = val
			case 1:
				regB = val
			case 2:
				regC = val
			}
		} else {
			val, _ := strconv.Atoi(match[0])
			program = append(program, val)
		}
	}
	return
}
