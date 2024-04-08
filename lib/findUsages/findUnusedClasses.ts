import { stdout } from 'process';
import { ClassDeclaration, SourceFile } from 'ts-morph';
import { print } from '../output.js';
import { ClassTypes, Result, TsConfigFileResolverArgs } from '../types.js';
import { RelevantClassesService } from './services/relevant-classes.service.js';
import { StandaloneComponentsService } from './services/standalone-components.service.js';
import { TemplateService } from './services/template.service.js';
import {
	hasUsagesByCanActivateCall,
	isGuardClass,
} from './utils/guard.utils.js';
import {
	getRelevantDecorator,
	hasUsagesInTs,
} from './utils/relevant-class.utils.js';

export function findUnusedClasses(
	sourceFiles: SourceFile[],
	tsConfigFileResolverArgs: TsConfigFileResolverArgs
): Result[] {
	const relevantClassesService = new RelevantClassesService(sourceFiles);
	const standaloneComponentsService = new StandaloneComponentsService(
		sourceFiles,
		tsConfigFileResolverArgs
	);
	const templateService = new TemplateService(
		relevantClassesService.componentClasses
	);

	if (stdout.isTTY) {
		print(
			`Found ${relevantClassesService.releventClasses.length} classes from ${sourceFiles.length} files.\n`
		);
	}
	return relevantClassesService.releventClasses
		.filter((declaration, index, { length }) => {
			const percentage = Math.round(((index + 1) / length) * 100);
			if (stdout.isTTY) {
				print(`Analyzing ${index + 1}/${length} (${percentage}%)`, true);
				if (index === length - 1) stdout.write('\n');
			}
			return !isClassInUsed(
				declaration,
				templateService,
				standaloneComponentsService
			);
		})
		.map(asResult);
}

function isClassInUsed(
	declaration: ClassDeclaration,
	templateService: TemplateService,
	standaloneComponentsService: StandaloneComponentsService
): boolean {
	const relevantDecorator = getRelevantDecorator(declaration)!;
	const classType = relevantDecorator.getFullName();
	const hasTsUsages = hasUsagesInTs(declaration);
	let isInUsed = false;

	if (hasTsUsages) {
		isInUsed = true;
	} else {
		if (
			classType === ClassTypes.Component ||
			classType === ClassTypes.Directive
		) {
			isInUsed =
				templateService.hasUsagesBySelectors(relevantDecorator) ||
				standaloneComponentsService.isStandaloneComponentUseAsRoute(
					declaration,
					relevantDecorator
				);
		} else if (classType === ClassTypes.Pipe) {
			isInUsed = templateService.hasUsagesByPipeName(relevantDecorator);
		} else if (isGuardClass(declaration)) {
			isInUsed = hasUsagesByCanActivateCall(declaration);
		}
	}

	return isInUsed;
}

function asResult(declaration: ClassDeclaration): Result {
	const sourceFile = declaration.getSourceFile();
	return {
		// classess without decorators will not be passed to this function
		classType: getRelevantDecorator(declaration)!.getFullName() as ClassTypes,
		className: declaration.getName() ?? '',
		fileName: sourceFile.getBaseName(),
		directory: sourceFile.getDirectory().getPath().toString(),
	};
}
