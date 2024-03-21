import { stdout } from 'process';
import { ClassDeclaration, SourceFile } from 'ts-morph';
import { print } from '../output.js';
import { ClassTypes, Result, TsConfigFileResolverArgs } from '../types.js';
import { ModuleService } from './services/module.service.js';
import { RelevantClassesService } from './services/relevant-classes.service.js';
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
	const moduleService = new ModuleService(
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
			return !isUsed(declaration, templateService, moduleService);
		})
		.map(asResult);
}

function isUsed(
	declaration: ClassDeclaration,
	templateService: TemplateService,
	moduleService: ModuleService
): boolean {
	const relevantDecorator = getRelevantDecorator(declaration)!;
	const classType = relevantDecorator.getFullName();
	const hasTsUsages = hasUsagesInTs(declaration);

	if (hasTsUsages) {
		return true;
	}

	if (
		classType === ClassTypes.Component ||
		classType === ClassTypes.Directive
	) {
		return (
			templateService.hasUsagesBySelectors(relevantDecorator) ||
			moduleService.isStandaloneComponentUseAsRoute(
				declaration,
				relevantDecorator
			)
		);
	}
	if (classType === ClassTypes.Pipe) {
		return templateService.hasUsagesByPipeName(relevantDecorator);
	}
	if (isGuardClass(declaration)) {
		return hasUsagesByCanActivateCall(declaration);
	}

	return false;
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
