import { getFileClassUsages } from "../common/ast-utils";
import { printProgress } from "../common/cli-utils";
import {
  ComponentSourceFile,
  DirectiveSourceFile,
  Usage,
} from "../common/model";

function countDirectivesUsage(
  files: DirectiveSourceFile[],
  componentFiles: ComponentSourceFile[]
): Record<string, Usage> {
  return files.reduce((result, file, index, { length }) => {
    printProgress(index + 1, length, "Analyzing directives");
    const classUsageCount = getFileClassUsages(file);
    const selectorUsageCount = getDirectiveUsagesFromComponentTemplates(
      file,
      componentFiles
    );

    result[file.file.getFilePath()] = {
      className: file.className,
      filePath: file.file.getFilePath().toString(),
      selectorName: file.selector,
      classUsageCount,
      selectorUsageCount,
      probablyUnused: classUsageCount + selectorUsageCount <= 0,
    } as Usage;

    return result;
  }, {} as Record<string, Usage>);
}

function getDirectiveUsagesFromComponentTemplates(
  directiveFile: DirectiveSourceFile,
  componentFiles: ComponentSourceFile[]
): number {
  if (!directiveFile.selector) {
    return 0;
  }

  const directiveSelectorRegexp = new RegExp(
    `<.*[\\s\*[]${directiveFile.selector}\\b[\s>\\]]`,
    "gs"
  );

  return componentFiles.filter(f => {
    return directiveSelectorRegexp.test(f.componentTemplateSource);
  }).length;
}

export { countDirectivesUsage };
