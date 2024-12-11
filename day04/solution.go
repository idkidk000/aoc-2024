package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

var DIR_OFFSETS=map[int]map[string]int{
	0:{"row":-1, "col":0, },
	1:{"row":-1, "col":1, },
	2:{"row":0, "col":1, },
	3:{"row":1, "col":1, },
	4:{"row":1, "col":0, },
	5:{"row":1, "col":-1, },
	6:{"row":0, "col":-1, },
	7:{"row":-1, "col":-1, },
}

func main(){
	data:=readData("input.txt")
	// fmt.Println(data)
	part1(data)
	part2(data)
}

func part2(data[][]string){
	rowCount:=len(data)
	colCount:=len(data[0])
	wordCount:=0
	for rowIx,row:=range data{
		if rowIx==0 || rowIx==rowCount-1 {
			continue
		}
		for colIx,char:=range row {
			if colIx==0 || colIx==colCount-1 || char!="A" {
				continue
			}
			charsA:=[]string{
				data[rowIx-1][colIx-1],
				data[rowIx+1][colIx+1],
			}
			charsB:=[]string{
				data[rowIx-1][colIx+1],
				data[rowIx+1][colIx-1],
			}
			wordA:=strings.Join(charsA,"")
			wordB:=strings.Join(charsB,"")
			if (wordA=="MS" || wordA=="SM") && (wordB=="MS" || wordB=="SM"){
				wordCount++
			}

		}
	}
	fmt.Printf("part 2 %d\n",wordCount)
}

func part1(data [][]string){
	rowCount:=len(data)
	colCount:=len(data[0])
	wordCount:=0
	for rowIx,row:=range data{
		// fmt.Printf("rowIx: %v\n", rowIx)
		for colIx,char:=range row {
			if char!="X" {
				continue
			}
			for dirIx:=0;dirIx<8;dirIx++{
				wordChars:=[4]string{"X"}
				for charIx:=1;charIx<4;charIx++{
					charRowIx:=rowIx+(DIR_OFFSETS[dirIx]["row"]*charIx)
					charColIx:=colIx+(DIR_OFFSETS[dirIx]["col"]*charIx)
					if 0<=charRowIx && charRowIx<rowCount && 0<=charColIx && charColIx<colCount{
						wordChars[charIx]=data[charRowIx][charColIx]
					}
				}
				word:=strings.Join(wordChars[:],"")
				// if rowIx==0{
				// 	fmt.Println(rowIx,colIx,dirIx,word)
				// }
				if word=="XMAS"{
					wordCount++;
				}
			}
		}
	}
	fmt.Printf("part 1 %d\n",wordCount)
}

func readData(filename string)([][]string){
	f,_:=os.Open(filename)
	defer f.Close()
	var data[][]string
	scanner:=bufio.NewScanner(f)
	for scanner.Scan(){
		chars:=strings.Split(scanner.Text(), "")
		data=append(data, chars)
	}
	return data
}