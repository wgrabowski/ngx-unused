import { getFileClassUsages } from "../common/ast-utils";
import { printProgress } from "../common/cli-utils";
import { ComponentSourceFile, PipeSourceFile, Usage } from "../common/model";

function countPipesUsage(
  files: PipeSourceFile[],
  componentFiles: ComponentSourceFile[]
): Record<string, Usage> {
  return files.reduce((result, file, index, { length }) => {
    printProgress(index + 1, length, "Analyzing pipes");
    const classUsageCount = getFileClassUsages(file);
    const selectorUsageCount = getPipeUsagesFromComponentTemplates(
      file,
      componentFiles
    );

    result[file.file.getFilePath()] = {
      className: file.className,
      filePath: file.file.getFilePath().toString(),
      selectorName: file.pipeName,
      classUsageCount,
      selectorUsageCount,
      probablyUnused: classUsageCount + selectorUsageCount <= 0,
    } as Usage;

    return result;
  }, {} as Record<string, Usage>);
}

function getPipeUsagesFromComponentTemplates(
  pipeFile: PipeSourceFile,
  componentFiles: ComponentSourceFile[]
): number {
  const pipeSelectorRegexp = new RegExp(`\\|\\s*${pipeFile.pipeName}\\b`, "gm");

  return componentFiles.filter(f => {
    return pipeSelectorRegexp.test(f.componentTemplateSource);
  }).length;
}

export { countPipesUsage };
