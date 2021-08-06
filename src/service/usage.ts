import { getFileClassUsages } from "../common/ast-utils";
import { printProgress } from "../common/cli-utils";
import { ServiceSourceFile, Usage } from "../common/model";

function countServicesUsage(files: ServiceSourceFile[]): Record<string, Usage> {
  return files.reduce((result, file, index, { length }) => {
    printProgress(index + 1, length, "Analyzing services");
    const classUsageCount = getFileClassUsages(file);

    result[file.file.getFilePath()] = {
      className: file.className,
      filePath: file.file.getFilePath().toString(),
      classUsageCount,
      probablyUnused: classUsageCount <= 0,
    } as Usage;

    return result;
  }, {} as Record<string, Usage>);
}

export { countServicesUsage };
