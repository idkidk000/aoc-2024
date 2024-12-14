#!/usr/bin/env -S deno --allow-read

const DEBUG = true;
const EXAMPLE = true;

const text = await Deno.readTextFile(EXAMPLE ? 'example.txt' : 'input.txt');
if (DEBUG) console.debug('text', text);
