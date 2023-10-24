import { existsSync } from 'fs';
import { globSync } from 'glob';
import minimist, { ParsedArgs } from 'minimist';
import { argv, cwd, exit, stdout } from 'process';

interface CliArgs extends ParsedArgs {
	help?: boolean;
	h?: boolean;
}

function help() {
	stdout.write('usage: ngx-unused [<directory>] [-h | --help]\n\n');
	stdout.write(
		'<directory> - source root directiories from Angular workspace\n'
	);
	stdout.write('              (optional, current directory is default)\n');
	stdout.write(
		'              (node_modules and .spec.ts files will be ignored, not existing directories will be ignored)\n'
	);
	stdout.write('--help,-h   - show this help\n');
}

const cliArgs: CliArgs = minimist(argv.slice(2));

if (cliArgs.help || cliArgs.h) {
	help();
	exit(0);
}
const sourceRoots = cliArgs._.length > 0 ? cliArgs._ : [cwd()];
const sourceFiles = getSourceFiles(sourceRoots);
stdout.write(`found ${sourceFiles.length} source files\n`);
exit(0);

export function getSourceFiles(sourceRoots: string[]): string[] {
	const existingDirectories = sourceRoots.filter(directory =>
		existsSync(directory)
	);
	const includePatterns = existingDirectories.map(
		directory => `${directory}/**/*.ts`
	);
	const excludePatterns = existingDirectories.flatMap(directory => [
		`${directory}/**/node_modules/**`,
		`${directory}/**/*.spec.ts`,
		`${directory}/**/*.d.ts`,
	]);

	return globSync(includePatterns, {
		ignore: [...excludePatterns, 'node_modules/**'],
	});
}
