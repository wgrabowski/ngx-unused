import { existsSync } from 'fs';
import minimist, { ParsedArgs } from 'minimist';
import { join } from 'path';
import { argv, cwd, exit, stdout } from 'process';

interface CliArgs extends ParsedArgs {
	help?: boolean;
	h?: boolean;
}

function help() {
	stdout.write('usage: ngx-unused [<directory>] [-h | --help]\n\n');
	stdout.write('<directory> - root directory of Angular workspace\n');
	stdout.write('              (optional, current directory is default)\n');
	stdout.write('--help,-h   - show this help\n');
}

const cliArgs: CliArgs = minimist(argv.slice(2));

if (cliArgs.help || cliArgs.h) {
	help();
	exit(0);
}

const workspaceDir = cliArgs._.length === 1 ? cliArgs._[0] : cwd();
const workspaceDirExists = existsSync(workspaceDir);
const isAngularWorkspace = existsSync(join(workspaceDir, 'angular.json'));

if (!workspaceDirExists) {
	stdout.write(`Directory ${workspaceDir} doesn't exists.`);
	exit(2);
}

if (!isAngularWorkspace) {
	stdout.write(
		`Directory ${workspaceDir} is not an Agular workspace root directory.\n`
	);
	stdout.write('Directory must contain angular.json file.\n');
	exit(2);
}

stdout.write('Checking files...\n'); // TODO implementation goes there
