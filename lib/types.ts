import { ParsedArgs } from 'minimist';

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
