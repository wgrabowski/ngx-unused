import minimist from 'minimist';
import { argv, exit } from 'process';
import { getRuntimeConfig, validate } from './cli.js';
import { createProject } from './createProject.js';
import { findUnusedClasses } from './findUsages/index.js';
import {
	help,
	invalidTsConfig,
	printNoFiles,
	printResults,
	usage,
} from './output.js';
import { CliArgs, TsConfigFileResolverArgs } from './types.js';

const cliArgs: CliArgs = minimist(argv.slice(2), {
	alias: {
		decorateOutput: 'd',
		project: 'p',
		help: 'h',
	} as Record<keyof CliArgs, string>,
});

if (cliArgs.help || cliArgs.h) {
	help();
	exit(0);
}

const inputValidation = validate(cliArgs);
if (!inputValidation.tsConfigFilePath) {
	invalidTsConfig();
	exit(2);
}
if (!inputValidation.valid) {
	usage();
	exit(2);
}
const { tsConfigFilePath, sourceRoots, decorateOutput } =
	getRuntimeConfig(cliArgs);

const project = createProject({
	tsConfigFilePath,
	sourceRoots,
	decorateOutput,
});

const sourceFiles = project.getSourceFiles();

if (sourceFiles.length === 0) {
	printNoFiles();
	exit(0);
}

const tsConfigFileResolverArgs: TsConfigFileResolverArgs = {
	project: project,
	containingFile: tsConfigFilePath,
	compilerOptions: project.compilerOptions.get(),
};

const results = findUnusedClasses(sourceFiles, tsConfigFileResolverArgs);

printResults(results);
exit(results.length ? 1 : 0);
