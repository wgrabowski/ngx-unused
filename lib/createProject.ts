import { existsSync } from 'fs';
import { globSync } from 'glob';
import path from 'path';
import { Project } from 'ts-morph';
import { RuntimeConfig } from './types';

export function createProject({
	tsConfigFilePath,
	sourceRoots,
}: RuntimeConfig): Project {
	const project: Project = new Project({
		tsConfigFilePath,
		skipAddingFilesFromTsConfig: true,
		skipFileDependencyResolution: true,
		skipLoadingLibFiles: true,
	});
	project.addSourceFilesAtPaths(getSourceFiles(sourceRoots));
	return project;
}

function getSourceFiles(sourceRoots: string[]): string[] {
	const existingDirectories = sourceRoots.filter(directory =>
		existsSync(directory)
	);
	const includePatterns = existingDirectories.map(
		directory => `${path.resolve(directory)}/**/*.ts`
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
