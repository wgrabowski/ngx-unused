import { ClassDeclaration, SourceFile } from 'ts-morph';
import { RELEVANT_DECORATOR_NAMES } from '../constants';
import { ClassType, Result } from '../types';
import { hasUsagesBySelectors } from './hasUsagesBySelectors';
import { hasUsagesByPipeName } from './hasUsagesInTemplatesByPipeName';
import { hasUsagesInTs } from './hasUsagesInTs';

export function findUnusedClasses(sourceFiles: SourceFile[]): Result[] {
	const classes = sourceFiles.flatMap(file => file.getClasses());

	return classes
		.filter(declaration => getRelevantDecorator(declaration) !== undefined)
		.filter(declaration => !isUsed(declaration))
		.map(asResult);
}

function isUsed(declaration: ClassDeclaration): boolean {
	const relevantDecorator = getRelevantDecorator(declaration)!;
	const classType = relevantDecorator.getFullName();
	const hasTsUsages = hasUsagesInTs(declaration);
	if (hasTsUsages) {
		return true;
	}
	if (classType === 'Component' || classType === 'Directive') {
		return hasUsagesBySelectors(relevantDecorator);
	}
	if (classType === 'Pipe') {
		return hasUsagesByPipeName(relevantDecorator);
	}

	return false;
}

function asResult(declaration: ClassDeclaration): Result {
	const sourceFile = declaration.getSourceFile();
	return {
		// classess without decorators will not be passed to this function
		classType: getRelevantDecorator(declaration)!.getFullName() as ClassType,
		className: declaration.getName() ?? '',
		fileName: sourceFile.getBaseName(),
		directory: sourceFile.getDirectory().getPath().toString(),
	};
}

function getRelevantDecorator(classDeclaration: ClassDeclaration) {
	return classDeclaration.getDecorator(decorator =>
		RELEVANT_DECORATOR_NAMES.includes(decorator.getFullName() as ClassType)
	);
}
