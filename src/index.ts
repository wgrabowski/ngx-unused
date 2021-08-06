import {
  getComponentFiles as getComponentsFiles,
  getDirectiveFiles as getDirectivesFiles,
  getPipesFiles,
  getProjectFiles,
  getServiceFiles as getServicesFiles,
} from "./common/ast-utils";
import { printUnused } from "./common/cli-utils";
import {
  ComponentSourceFile,
  DirectiveSourceFile,
  PipeSourceFile,
  ServiceSourceFile,
  Usage,
} from "./common/model";
import { countComponentUsages } from "./component/usage";
import { countDirectivesUsage } from "./directive/usage";
import { countPipesUsage } from "./pipe/usage";
import { countServicesUsage } from "./service/usage";

function countUsages(tsProjectPath: string): {
  componentsUsages: Record<string, Usage>;
  pipesUsages: Record<string, Usage>;
  directivesUsages: Record<string, Usage>;
  servicesUsages: Record<string, Usage>;
} {
  const files = getProjectFiles(tsProjectPath);
  const componentFiles: ComponentSourceFile[] = getComponentsFiles(files);
  const pipesFiles: PipeSourceFile[] = getPipesFiles(files);
  const servicesFiles: ServiceSourceFile[] = getServicesFiles(files);
  const directiveFiles: DirectiveSourceFile[] = getDirectivesFiles(files);

  const componentsUsages = countComponentUsages(componentFiles);
  const directivesUsages = countDirectivesUsage(directiveFiles, componentFiles);
  const pipesUsages = countPipesUsage(pipesFiles, componentFiles);
  const servicesUsages = countServicesUsage(servicesFiles);

  return {
    componentsUsages,
    pipesUsages,
    directivesUsages,
    servicesUsages,
  };
}

function printFoundUnused(totalUsage: {
  componentsUsages: Record<string, Usage>;
  pipesUsages: Record<string, Usage>;
  directivesUsages: Record<string, Usage>;
  servicesUsages: Record<string, Usage>;
}) {
  printUnused(totalUsage.componentsUsages, "component");
  printUnused(totalUsage.directivesUsages, "directive");
  printUnused(totalUsage.pipesUsages, "pipe");
  printUnused(totalUsage.servicesUsages, "service");
}

export { countUsages, printFoundUnused };
