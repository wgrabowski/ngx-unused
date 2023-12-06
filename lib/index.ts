import minimist from 'minimist';
import { argv, exit } from 'process';
import { getRuntimeConfig, validate } from './cli.js';
import { createProject } from './createProject.js';
import { findUnusedClasses } from './findUsages/index.js';
import { help, print, printResults } from './output.js';
import { CliArgs } from './types.js';

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
if (!inputValidation.valid) {
	help();
	exit(1);
}
const { tsConfigFilePath, sourceRoots, decorateOutput } =
	getRuntimeConfig(cliArgs);

const project = createProject({
	tsConfigFilePath,
	sourceRoots,
	decorateOutput,
});
const sourceFiles = project.getSourceFiles();

print(`${sourceFiles.length} matched files\n`, decorateOutput);
print('Looking for unused classes...\n', decorateOutput);

const results = findUnusedClasses(sourceFiles);

printResults(results);
exit(0);
