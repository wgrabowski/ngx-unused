import { getFileClassUsages } from "../common/ast-utils";
import { printProgress } from "../common/cli-utils";
import { ComponentSourceFile, Usage } from "../common/model";

function countComponentUsages(
  files: ComponentSourceFile[]
): Record<string, Usage> {
  return files.reduce((result, file, index, { length }) => {
    printProgress(index + 1, length, "Analyzing components");
    const classUsageCount = getFileClassUsages(file);
    const selectorUsageCount = getComponentUsagesBySelector(file, files);

    result[file.file.getFilePath()] = {
      className: file.className,
      filePath: file.file.getFilePath().toString(),
      selectorName: file.componentSelector,
      classUsageCount,
      selectorUsageCount,
      probablyUnused: classUsageCount + selectorUsageCount <= 0,
    } as Usage;

    return result;
  }, {} as Record<string, Usage>);
}

function getComponentUsagesBySelector(
  file: ComponentSourceFile,
  allFiles: ComponentSourceFile[]
): number {
  return allFiles.filter(otherComponent =>
    otherComponent.componentTemplateSource.includes(file.componentSelector)
  ).length;
}

export { countComponentUsages };
