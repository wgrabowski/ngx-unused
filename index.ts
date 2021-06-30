#!/usr/bin/env node
const packageJson = require('./package.json');
import { exit } from "process";
import { Node } from "ts-morph";
import {
  getProjectFiles,
  getComponentFiles,
  getClassReferencingNodesInOtherFiles,
  isNgModuleField,
  NgModuleMetadataField,
  ComponentSourceFile,
} from "./packages/ast/src";
console.log(`[${packageJson.name} v.${packageJson.version}]`)
if(process.argv.length < 3){
    console.log("You have to provide path to tsconfig file");
    exit();
}
const files = getProjectFiles(process.argv[2]);
const componentFiles: ComponentSourceFile[] = getComponentFiles(files);
const selectorUsages = getComponentUsagesBySelector(componentFiles);
const classNameUsages = getComponentUsagesByClassName(componentFiles);

const usages = componentFiles.map(({ file }) => ({
  filePath: file.getFilePath(),
  selectorUsage: selectorUsages[file.getFilePath()],
  classUsage: classNameUsages[file.getFilePath()],
  probablyUnused:
    selectorUsages[file.getFilePath()] + classNameUsages[file.getFilePath()] <=
    0,
}));

function getComponentUsagesBySelector(componentFiles: ComponentSourceFile[]) {
  return componentFiles.reduce((result, file, index, allFiles) => {
    result[file.file.getFilePath()] = allFiles.filter((f) =>
      f.componentTemplateSource.includes(file.componentSelector)
    ).length;
    return result;
  }, {} as Record<string, any>);
}

function getComponentUsagesByClassName(componentFiles: ComponentSourceFile[]) {
  return componentFiles.reduce((result, file, index, allFiles) => {
    result[file.file.getFilePath()] = getClassReferencingNodesInOtherFiles(
      file.file,
      file.className,
      /\.spec\.ts$/
    )
      .filter((node) => {
        return !Node.isImportSpecifier(node.getParent());
      })
      .filter(
        (node) => !isNgModuleField(node, NgModuleMetadataField.declarations)
      )
      .filter(
        (node) => !isNgModuleField(node, NgModuleMetadataField.exports)
      ).length;

    return result;
  }, {} as any);
}

console.log('Probably unused components:')
console.log(
  usages
    .filter(({ probablyUnused }) => probablyUnused)
    .map(({ filePath }) => filePath).join("\n")
);
