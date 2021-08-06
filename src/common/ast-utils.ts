import { readFileSync } from "fs";
import { resolve } from "path";
import {
  Decorator,
  Identifier,
  Node,
  Project,
  SourceFile,
  SyntaxKind,
} from "ts-morph";
import {
  AngularDecorators,
  CommonSourceFile,
  ComponentSourceFile,
  DirectiveSourceFile,
  NgModuleMetadataField,
  PipeSourceFile,
  ServiceSourceFile,
} from "./model";

export function getProjectFiles(tsConfigFilePath: string): SourceFile[] {
  process.stdout.write(`Analyzing files from ${tsConfigFilePath} project...\n`);
  return new Project({
    tsConfigFilePath: tsConfigFilePath,
  }).getSourceFiles();
}

export function hasDecorator(
  decoratorName: string
): (file: SourceFile) => boolean {
  return file => {
    return file
      .getClasses()
      .some(classDeclaration => classDeclaration.getDecorator(decoratorName));
  };
}

export function getDecorator(
  decoratorName: string
): (file: SourceFile) => Decorator | undefined {
  return file =>
    file
      .getClasses()
      .filter(classDeclaration =>
        classDeclaration.getDecorator(decoratorName)
      )[0]
      .getDecorator(decoratorName);
}
export function getClassNameWithDecorator(
  decoratorName: string
): (file: SourceFile) => string {
  return file =>
    file
      .getClasses()
      .filter(classDeclaration =>
        classDeclaration.getDecorator(decoratorName)
      )[0]
      .getName() || "";
}

export const getPropertyValueFromDecorator = (
  componentDecorator: Decorator,
  property: string
): string | null => {
  let value: string | null = null;

  componentDecorator?.getArguments().forEach(argument => {
    const argumentValueIfSelector = argument
      .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
      .filter(child => child?.getName() === property)
      .map(child => child.getInitializer()?.getText());

    if (argumentValueIfSelector?.length) {
      value = argumentValueIfSelector[0] || null;
      return;
    }
  });
  return typeof value === "string"
    ? (value as string).replace(/['"]/g, "")
    : value;
};

export const getClassReferencingNodesInOtherFiles = (
  file: SourceFile,
  className: string,
  excludedFileNamePattern: RegExp
) =>
  file
    .getDescendantsOfKind(SyntaxKind.ClassDeclaration)
    .filter(node => node?.getSymbol()?.getEscapedName() === className)[0]
    ?.findReferencesAsNodes()
    .filter(node => {
      const sourceFile = node.getSourceFile();

      return (
        sourceFile.getFilePath() !== file.getFilePath() &&
        (!excludedFileNamePattern ||
          !excludedFileNamePattern.test(sourceFile.getFilePath()))
      );
    })
    .reduce((references: Node[], referencingNode: Node) => {
      references.push(referencingNode);
      return references;
    }, []) || [];

export const isNgModuleField = (
  node: Identifier | Node,
  field: NgModuleMetadataField
): boolean => getAncestorArrayName(node) === field;

export const getAncestorArrayName = (node: Identifier | Node) =>
  node
    .getParentIfKind(SyntaxKind.ArrayLiteralExpression)
    ?.getParentIfKind(SyntaxKind.PropertyAssignment)
    ?.getSymbol()
    ?.getEscapedName();

export function getPipesFiles(sourceFiles: SourceFile[]): PipeSourceFile[] {
  return sourceFiles.filter(hasDecorator(AngularDecorators.pipe)).map(file => {
    const pipeDecorator = getDecorator(AngularDecorators.pipe)(
      file
    ) as Decorator;

    return {
      file,
      pipeName: getPropertyValueFromDecorator(pipeDecorator, "name") || "",
      className: getClassNameWithDecorator(AngularDecorators.pipe)(file),
    };
  });
}

export function getServiceFiles(
  sourceFiles: SourceFile[]
): ServiceSourceFile[] {
  return sourceFiles
    .filter(hasDecorator(AngularDecorators.service))
    .map(file => {
      return {
        file,
        className: getClassNameWithDecorator(AngularDecorators.service)(file),
      };
    });
}

export function getDirectiveFiles(
  sourceFiles: SourceFile[]
): DirectiveSourceFile[] {
  return sourceFiles
    .filter(hasDecorator(AngularDecorators.directive))
    .map(file => {
      const directiveDecorator = getDecorator(AngularDecorators.directive)(
        file
      ) as Decorator;
      // if there are multiple selectors, take first
      const selector = (
        getPropertyValueFromDecorator(directiveDecorator, "selector") || ""
      )
        .replace("[", "")
        .replace("]", "")
        .split(",")
        .map((selector: string) => selector.trim())[0];

      return {
        file,
        selector,
        isStructuralDirective: false,
        className: getClassNameWithDecorator(AngularDecorators.directive)(file),
      };
    });
}

export function getComponentFiles(
  sourceFiles: SourceFile[]
): ComponentSourceFile[] {
  return sourceFiles
    .filter(hasDecorator(AngularDecorators.component))
    .map(file => {
      let componentTemplateSource = "";
      const componentDecorator = getDecorator(AngularDecorators.component)(
        file
      ) as Decorator;
      const inlineTemplate = getPropertyValueFromDecorator(
        componentDecorator,
        "template"
      );
      const templateUrl = getPropertyValueFromDecorator(
        componentDecorator,
        "templateUrl"
      ) as string;

      if (!inlineTemplate && templateUrl) {
        componentTemplateSource = readFileSync(
          resolve(file.getDirectoryPath(), templateUrl),
          { encoding: "utf-8" }
        );
      } else {
        componentTemplateSource = inlineTemplate || "";
      }

      return {
        file,
        componentSelector:
          getPropertyValueFromDecorator(componentDecorator, "selector") || "",
        componentTemplateSource,
        className: getClassNameWithDecorator(AngularDecorators.component)(file),
      };
    });
}

export function getFileClassUsages(file: CommonSourceFile): number {
  return getClassReferencingNodesInOtherFiles(
    file.file,
    file.className,
    /\.spec\.ts$/
  )
    .filter(node => {
      return !Node.isImportSpecifier(node.getParent());
    })
    .filter(node => !isNgModuleField(node, NgModuleMetadataField.declarations))
    .filter(node => !isNgModuleField(node, NgModuleMetadataField.exports))
    .filter(node => !isNgModuleField(node, NgModuleMetadataField.providers))
    .length;
}
