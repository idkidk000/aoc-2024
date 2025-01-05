#!/usr/bin/env bash
declare -r year="${1:-$(date +%Y)}"
declare -a dirs
for ((i=1;i<26;i++)); do
  printf -v dir '%04d/day%02d' $year $i
  dirs+=("$dir")
done
echo "dirs: ${dirs[*]}"
read -ep "ok to create? y/n: " response
[ "${response,,}" == 'y' ] || exit
mkdir -p "${dirs[@]}"