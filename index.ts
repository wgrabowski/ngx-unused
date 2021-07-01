#!/usr/bin/env node
const packageJson = require("./package.json");
import { exit, stdout } from "process";
import { Node } from "ts-morph";
import {
  getProjectFiles,
  getComponentFiles,
  getClassReferencingNodesInOtherFiles,
  isNgModuleField,
  NgModuleMetadataField,
  ComponentSourceFile,
} from "./packages/ast/src";
console.log(`[${packageJson.name} v.${packageJson.version}]`);
if (process.argv.length < 3) {
  console.log("You have to provide path to tsconfig file");
  exit();
}
stdout.write("Analyzing files. Be patient, it can take some time\n");
const files = getProjectFiles(process.argv[2]);
const componentFiles: ComponentSourceFile[] = getComponentFiles(files);
const selectorUsages = getComponentUsagesBySelector(componentFiles);
const classNameUsages = getComponentUsagesByClassName(componentFiles);

const usages = componentFiles.map(({ file, className, componentSelector }) => ({
  filePath: file.getFilePath(),
  selectorUsage: selectorUsages[file.getFilePath()],
  classUsage: classNameUsages[file.getFilePath()],
  className,
  componentSelector,
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


const unusedComponents = usages.filter(({ probablyUnused }) => probablyUnused);
// temporary outout formatting
const maxClassNameLength = Math.max(
  ...unusedComponents.map((file) => file.className.length)
);
const maxSelectorLength = Math.max(
  ...unusedComponents.map((file) => file.className.length)
);

if (unusedComponents.length) {
  stdout.write(`\n${unusedComponents.length} probably unused component(s):\n`);
  stdout.write(
    `${"Class name".padEnd(maxClassNameLength)} | ${"Selector".padEnd(
      maxSelectorLength
    )} | file path\n`
  );

  unusedComponents.forEach((file) => {
    stdout.write(
      `${file.className.padEnd(
        maxClassNameLength
      )} | ${file.componentSelector.padEnd(maxSelectorLength)} | ${
        file.filePath
      }\n`
    );
  });
}
