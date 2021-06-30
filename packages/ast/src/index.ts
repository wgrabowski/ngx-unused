import { readFileSync } from "fs";
import { resolve } from "path";
import { Decorator, Project, SourceFile, SyntaxKind, Node,Identifier } from "ts-morph";

export interface ComponentSourceFile {
  file: SourceFile;
  componentSelector: string;
  componentTemplateSource: string;
  className: string;
}
export enum NgModuleMetadataField {
	declarations = 'declarations',
	exports = 'exports',
	entryComponents = 'entryComponents',
	imports = 'imports',
}

export function getProjectFiles(tsConfigFilePath: string): SourceFile[] {
  return new Project({
    tsConfigFilePath: tsConfigFilePath,
  }).getSourceFiles();
}

export function getComponentFiles(
  sourceFiles: SourceFile[]
): ComponentSourceFile[] {
  return sourceFiles.filter(hasDecorator("Component")).map((file) => {
    let componentTemplateSource = "";
    const componentDecorator = getDecorator("Component")(file) as Decorator;
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
      className: getClassNameWithDecorator("Component")(file),
    };
  });
}

// source file utils
export function hasDecorator(
  decoratorName: string
): (file: SourceFile) => boolean {
  return (file) =>
    file
      .getClasses()
      .some((classDeclaration) => classDeclaration.getDecorator(decoratorName));
}

export function getDecorator(
  decoratorName: string
): (file: SourceFile) => Decorator | undefined {
  return (file) =>
    file
      .getClasses()
      .filter((classDeclaration) =>
        classDeclaration.getDecorator(decoratorName)
      )[0]
      .getDecorator(decoratorName);
}
export function getClassNameWithDecorator(
  decoratorName: string
): (file: SourceFile) => string {
  return (file) =>
    file
      .getClasses()
      .filter((classDeclaration) =>
        classDeclaration.getDecorator(decoratorName)
      )[0]
      .getName() || "";
}

// decorator utils
export const getPropertyValueFromDecorator = (
  componentDecorator: Decorator,
  property: string
): string | null => {
  let value: string | null = null;

  componentDecorator?.getArguments().forEach((argument) => {
    const argumentValueIfSelector = argument
      .getDescendantsOfKind(SyntaxKind.PropertyAssignment)
      .filter((child) => child?.getName() === property)
      .map((child) => child.getInitializer()?.getText());

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
    .filter((node) => node?.getSymbol()?.getEscapedName() === className)[0]
    ?.findReferencesAsNodes()
    .filter((node) => {
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
    