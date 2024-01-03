import { stdout } from 'process';
import { ClassDeclaration, Decorator, SourceFile } from 'ts-morph';
import { RELEVANT_DECORATOR_NAMES } from '../constants.js';
import { print } from '../output.js';
import { ClassType, Result } from '../types';
import { hasUsagesByPipeName } from './hasUsagesByPipeName.js';
import { hasUsagesBySelectors } from './hasUsagesBySelectors.js';
import { hasUsagesInTs } from './hasUsagesInTs.js';
import { TemplateService } from './templateService.js';

export function findUnusedClasses(sourceFiles: SourceFile[]): Result[] {
	const classes = sourceFiles
		.filter(file => !file.getBaseName().includes('.spec.ts'))
		.flatMap(file => file.getClasses())
		.filter(declaration => getRelevantDecorator(declaration) !== undefined);

	const componentClasses = classes
		.filter(
			declaration =>
				getRelevantDecorator(declaration)?.getFullName() === 'Component'
		)
		.map(getRelevantDecorator)
		.filter(decorator => decorator !== undefined);
	const templateService = new TemplateService(componentClasses as Decorator[]);

	if (stdout.isTTY) {
		print(
			`Found ${classes.length} classes from ${sourceFiles.length} files.\n`
		);
	}
	return classes
		.filter((declaration, index, { length }) => {
			const percentage = Math.round(((index + 1) / length) * 100);
			if (stdout.isTTY) {
				print(`Analyzing ${index + 1}/${length} (${percentage}%)`, true);
				if (index === length - 1) stdout.write('\n');
			}
			return !isUsed(declaration, templateService);
		})
		.map(asResult);
}

function isUsed(
	declaration: ClassDeclaration,
	templateService: TemplateService
): boolean {
	const relevantDecorator = getRelevantDecorator(declaration)!;
	const classType = relevantDecorator.getFullName();
	const hasTsUsages = hasUsagesInTs(declaration);
	if (hasTsUsages) {
		return true;
	}

	if (classType === 'Component' || classType === 'Directive') {
		return hasUsagesBySelectors(relevantDecorator, templateService);
	}
	if (classType === 'Pipe') {
		return hasUsagesByPipeName(relevantDecorator, templateService);
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
