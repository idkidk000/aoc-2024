#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
const FILENAME = 'example.txt';

console.log(FILENAME);
const text = await Deno.readTextFile(FILENAME);
if (DEBUG) console.debug({ text });
