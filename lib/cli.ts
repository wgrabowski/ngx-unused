import { existsSync } from 'fs';
import { stdout } from 'process';
import { CliArgs, RuntimeConfig } from './types';

interface InputValidation {
	tsConfigFilePath: boolean;
	sourceRoots: boolean;
	valid: boolean;
}

export function getRuntimeConfig(cliArgs: CliArgs): RuntimeConfig {
	return {
		tsConfigFilePath: cliArgs.project || '',
		sourceRoots: cliArgs._ || [],
		decorateOutput: stdout.isTTY,
	};
}

export function validate(cliArgs: CliArgs): InputValidation {
	return {
		tsConfigFilePath: !!cliArgs.project && existsSync(cliArgs.project),
		sourceRoots: !!cliArgs._.length,
		valid: !!cliArgs.project && !!cliArgs._.length,
	};
}
