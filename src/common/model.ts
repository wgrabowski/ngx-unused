import { SourceFile } from "ts-morph";

export interface CommonSourceFile {
  file: SourceFile;
  className: string;
}

export interface ComponentSourceFile extends CommonSourceFile {
  componentSelector: string;
  componentTemplateSource: string;
}

export interface PipeSourceFile extends CommonSourceFile {
  pipeName: string;
}

export interface ServiceSourceFile extends CommonSourceFile {}

export interface DirectiveSourceFile extends CommonSourceFile {
  selector: string;
}

export const enum AngularDecorators {
  component = "Component",
  directive = "Directive",
  pipe = "Pipe",
  service = "Injectable",
}

export const enum NgModuleMetadataField {
  declarations = "declarations",
  exports = "exports",
  entryComponents = "entryComponents",
  imports = "imports",
  providers = "providers",
}

export interface Usage {
  filePath: string;
  classUsageCount: number;
  className: string;
  probablyUnused: boolean;
  selectorUsageCount?: number;
  selectorName?: string;
}
