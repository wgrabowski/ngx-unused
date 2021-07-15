#!/usr/bin/env node
const packageJson = require("./package.json");
import { exit, stdout } from "process";
import { Node } from "ts-morph";
import {
  getProjectFiles,
  getPipesFiles,
  getComponentFiles,
  getClassReferencingNodesInOtherFiles,
  isNgModuleField,
  NgModuleMetadataField,
  ComponentSourceFile,
  PipeSourceFile,
  CommonSourceFile,
  getServiceFiles,
  ServiceSourceFile,
} from "./packages/ast/src";
console.log(`[${packageJson.name} v.${packageJson.version}]`);
if (process.argv.length < 3) {
  console.log("You have to provide path to tsconfig file");
  exit();
}
stdout.write("Analyzing files. Be patient, it can take some time\n");
const files = getProjectFiles(process.argv[2]);
const componentFiles: ComponentSourceFile[] = getComponentFiles(files);
const pipesFiles: PipeSourceFile[] = getPipesFiles(files);
const serviceFiles: ServiceSourceFile[] = getServiceFiles(files);
const pipeClassNameUsages = getUsagesByClassName(pipesFiles);
const pipeNameUsages = getPipeUsagesFromComponentTemplates(
  pipesFiles,
  componentFiles
);

const selectorUsages = getComponentUsagesBySelector(componentFiles);
const classNameUsages = getUsagesByClassName(componentFiles);
const serviceClassUsages = getUsagesByClassName(serviceFiles);

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

const pipeUsages = pipesFiles.map(({ file, className, pipeName }) => ({
  filePath: file.getFilePath(),
  nameUsage: pipeNameUsages[file.getFilePath()],
  classUsage: pipeClassNameUsages[file.getFilePath()],
  className,
  pipeName,
  probablyUnused:
    pipeNameUsages[file.getFilePath()] +
      pipeClassNameUsages[file.getFilePath()] <=
    0,
}));

const serviceUsages = serviceFiles.map(({ file, className }) => ({
  filePath: file.getFilePath(),
  classUsage: serviceClassUsages[file.getFilePath()],
  className,
  probablyUnused: serviceClassUsages[file.getFilePath()] <= 0,
}));

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

const unusedPipes = pipeUsages.filter(({ probablyUnused }) => probablyUnused);
// temporary outout formatting
const maxPipeClassNameLength = Math.max(
  ...unusedPipes.map((file) => file.className.length),
  "Class name".length
);
const maxPipeNameLength = Math.max(
  ...unusedPipes.map((file) => file.className.length),
  "Pipe name".length
);

if (unusedPipes.length) {
  stdout.write(`\n${unusedPipes.length} probably unused pipe(s):\n`);
  stdout.write(
    `${"Class name".padEnd(maxPipeClassNameLength)} | ${"Name".padEnd(
      maxPipeNameLength
    )} | file path\n`
  );

  unusedPipes.forEach((file) => {
    stdout.write(
      `${file.className.padEnd(
        maxPipeClassNameLength
      )} | ${file.pipeName.padEnd(maxPipeNameLength)} | ${file.filePath}\n`
    );
  });
}

const unusedServices = serviceUsages.filter(({ probablyUnused }) => probablyUnused);
// temporary outout formatting
const maxServiceClassNameLength = Math.max(
  ...unusedServices.map((file) => file.className.length)
);

if (unusedServices.length) {
  stdout.write(`\n${unusedServices.length} probably unused service(s):\n`);
  stdout.write(
    `${"Class name".padEnd(maxServiceClassNameLength)} | file path\n`
  );

  unusedServices.forEach((file) => {
    stdout.write(
      `${file.className.padEnd(maxServiceClassNameLength)} | ${file.filePath}\n`
    );
  });
}

function getUsagesByClassName(files: CommonSourceFile[]) {
  return files.reduce((result, file, index, allFiles) => {
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
      .filter((node) => !isNgModuleField(node, NgModuleMetadataField.exports))
      .filter(
        (node) => !isNgModuleField(node, NgModuleMetadataField.providers)
      ).length;

    return result;
  }, {} as any);
}

function getPipeUsagesFromComponentTemplates(
  pipeFiles: PipeSourceFile[],
  componentFiles: ComponentSourceFile[]
) {
  return pipeFiles.reduce((result, file) => {
    const pipeUsageRegexp = new RegExp(`\\|\\s*${file.pipeName}\\b`, "gm");
    result[file.file.getFilePath()] = componentFiles.filter((f) => {
      return pipeUsageRegexp.test(f.componentTemplateSource);
    }).length;
    return result;
  }, {} as Record<string, any>);
}
