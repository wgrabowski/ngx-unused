#!/usr/bin/env node
const packageJson = require("./package.json");
import { exit } from "process";
import { countUsages, printFoundUnused } from "./src";

if (!process.argv[2]) {
  console.log("You have to provide path to tsconfig file");
  exit();
}
const usages = countUsages(process.argv[2]);
printFoundUnused(usages);
