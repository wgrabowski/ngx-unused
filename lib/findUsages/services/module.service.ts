import { ClassDeclaration, Decorator, SourceFile, SyntaxKind } from 'ts-morph';
import { isModuleDecorator } from '../utils/module.utils.js';
import { getPropertyFromDecoratorCall } from '../utils/relevant-class.utils.js';
import { isTestFile } from '../utils/source-file.utils.js';
export class ModuleService {
	private loadedComponents: {
		importPath: string;
		componentClassName: string;
	}[];

	constructor(sourceFiles: SourceFile[]) {
		const modulesClasses = sourceFiles
			.filter(file => !isTestFile(file))
			.flatMap(file => file.getClasses())
			.filter(declaration => isModuleDecorator(declaration) !== undefined);

		this.loadedComponents = modulesClasses
			.map(decorator => this.getLoadedStandaloneComponentsByRoute(decorator))
			.filter(x => x !== undefined)
			.flat();
	}
	getLoadedStandaloneComponentsByRoute(decorator: ClassDeclaration) {
		const loadedComponents: {
			importPath: string;
			componentClassName: string;
		}[] = [];
		const importRegex = /'([^']+)'/;

		const nodes = decorator
			?.getDescendants()
			.filter(
				d =>
					d.getKind() === SyntaxKind.PropertyAssignment &&
					d.compilerNode
						.getChildren()
						.find(c => c.getText() === 'loadComponent')
			);

		if (nodes?.length > 0) {
			nodes.forEach(node => {
				const accessExpressions = node
					?.getDescendants()
					.filter(d => d.getKind() === SyntaxKind.PropertyAccessExpression);
				if (accessExpressions) {
					const matchImport = accessExpressions[0].getText().match(importRegex);
					loadedComponents.push({
						importPath: matchImport
							? matchImport[1].replace(/\.\.\/|\.\//g, '')
							: '',
						componentClassName: accessExpressions[1]
							?.getChildren()[2]
							?.getText(),
					});
				}
			});
		}
		return loadedComponents;
	}

	isStandaloneComponentUseAsRoute(
		classDeclaration: ClassDeclaration,
		relevantDecorator: Decorator
	) {
		let useAsRoute = false;
		const isStandalone = getPropertyFromDecoratorCall(
			relevantDecorator,
			'standalone'
		);

		if (isStandalone?.toLowerCase() === 'true') {
			useAsRoute = this.loadedComponents.some(
				c =>
					c.componentClassName === classDeclaration.getName() &&
					classDeclaration.getSourceFile().getFilePath().includes(c.importPath)
			);
		}
		return useAsRoute;
	}
}
