#!/usr/bin/env bash
for ((i=1;i<26;i++)); do printf -v day 'day%02d' $i; for ((j=1;j<3;j++)); do mkdir -p "$day/part$j"; done; done