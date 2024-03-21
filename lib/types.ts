import { ParsedArgs } from 'minimist';
import { CompilerOptions, Project } from 'ts-morph';

export interface RuntimeConfig {
	sourceRoots: string[];
	tsConfigFilePath: string;
	decorateOutput: boolean;
	// decorate cli
	// ci -mode , whatever
}

// export type ClassType = 'Component' | 'Injectable' | 'Pipe' | 'Directive';

export enum ClassTypes {
	Component = 'Component',
	Injectable = 'Injectable',
	Pipe = 'Pipe',
	Directive = 'Directive',
}

export interface Result {
	fileName: string;
	directory: string;
	className: string;
	classType: ClassTypes;
}

export interface CliArgs extends ParsedArgs {
	help?: boolean;
	project?: string;
	sourceRoots?: string[];
	decorateOutput?: string;
}

export interface TsConfigFileResolverArgs {
	project: Project;
	containingFile: string;
	compilerOptions: CompilerOptions;
}

export interface StandAloneComponentArgs {
	fullImportPath: string | undefined;
	componentClassName: string | undefined;
}
