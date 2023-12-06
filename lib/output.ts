import { stdout } from 'process';
import { Result } from './types';

export const CLI_DECORATOR = '[ngx-unused]';

export function help() {
	stdout.write('HELP\n'); // implement later
}

export function print(content: string, decorate: boolean) {
	if (decorate) {
		stdout.write(`${CLI_DECORATOR} `);
	}
	stdout.write(content);
}

export function printResults(results: Result[]) {
	console.table(results); // todo for now
}
