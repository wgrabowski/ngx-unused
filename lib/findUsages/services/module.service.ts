import {
	ClassDeclaration,
	Decorator,
	JsxAttribute,
	Node,
	SourceFile,
	SyntaxKind,
	ts,
} from 'ts-morph';
import {
	StandAloneComponentArgs,
	TsConfigFileResolverArgs,
} from '../../types.js';
import { isModuleDecorator } from '../utils/module.utils.js';
import { getPropertyFromDecoratorCall } from '../utils/relevant-class.utils.js';
import { isTestFile } from '../utils/source-file.utils.js';

export class ModuleService {
	private loadedComponents: StandAloneComponentArgs[];

	private fileResolverArgs: TsConfigFileResolverArgs;

	constructor(
		sourceFiles: SourceFile[],
		tsConfigFileResolverArgs: TsConfigFileResolverArgs
	) {
		this.fileResolverArgs = tsConfigFileResolverArgs;
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
		const loadedComponents: StandAloneComponentArgs[] = [];
		const importRegex = /'([^']+)'/;

		const nodesFromRoutes = (
			decorator
				.getDescendants()
				.filter(d => d.getKind() === SyntaxKind.CallExpression)
				.find(x => x.getText()?.includes('RouterModule.forChild'))
				?.getDescendants()
				?.filter(d => d.getKind() === SyntaxKind.Identifier)
				?.filter(x => x.getType().getAliasSymbol()?.getName() === 'Routes')[0]
				?.getSymbol()
				?.getValueDeclaration() as JsxAttribute
		)
			?.getInitializer()
			?.getDescendants()
			.filter((d: Node) => d.getKind() === SyntaxKind.PropertyAssignment)
			.filter((x: Node) => x.getText().includes('loadComponent')) as
			| Array<Node>
			| undefined;

		decorator
			.getDescendants()
			.filter(d => d.getKind() === SyntaxKind.CallExpression)
			.find(x => x.getText().includes('RouterModule.forChild'))
			?.getDescendants()
			.filter(d => d.getKind() === SyntaxKind.Identifier)
			.filter(x => x.getType().getAliasSymbol()?.getName() === 'Routes');

		const nodesFromDecorator = decorator
			?.getDescendants()
			.filter(
				d =>
					d.getKind() === SyntaxKind.PropertyAssignment &&
					d.compilerNode
						.getChildren()
						.find(c => c.getText() === 'loadComponent')
			);

		const nodes = (nodesFromRoutes ?? []).concat(nodesFromDecorator ?? []);

		if (nodes?.length > 0) {
			nodes.forEach(node => {
				const accessExpressions = node
					?.getDescendants()
					.filter(d => d.getKind() === SyntaxKind.PropertyAccessExpression);
				if (accessExpressions?.length > 0) {
					const matchImport = accessExpressions[0].getText().match(importRegex);
					if (matchImport) {
						const nodeFilePath = accessExpressions[0]
							.getSourceFile()
							.getFilePath();
						const path = matchImport ? matchImport[1] : '';
						const componentClassName = accessExpressions[1]
							?.getChildren()
							.filter(d => d.getKind() === SyntaxKind.Identifier)[1]
							.getText();

						const fullImportPath = this.getFullImportPath(path, nodeFilePath);
						loadedComponents.push({
							fullImportPath: fullImportPath,
							componentClassName: componentClassName,
						});
					}
				}
			});
		}
		return loadedComponents;
	}
	getFullImportPath(path: string, nodeFilePath: string) {
		let filePath: string | undefined = '';
		try {
			const isAlias = path.includes('@');
			const moduleName = isAlias
				? path
				: this.convertToAbsolutePath(path, nodeFilePath);

			const resolveModuleName = ts.resolveModuleName(
				moduleName,
				this.fileResolverArgs.containingFile,
				this.fileResolverArgs.compilerOptions,
				ts.sys
			);
			filePath = resolveModuleName.resolvedModule?.resolvedFileName;
		} catch (err) {
			console.log(err);
		}
		return filePath;
	}

	convertToAbsolutePath(relativePath: string, sourceFilePath: string) {
		const relativePathSplited = relativePath.split('/');
		const sourceFilePathSplited = sourceFilePath.split('/');
		const absolutePathSplited = [];
		const currentDirectoryMark = ['.', ''];

		const jumpBackCount = currentDirectoryMark.some(
			i => i === relativePathSplited[0]
		)
			? 1
			: relativePathSplited.filter(i => i === '..').length + 1;
		const startCopyFromIndex = currentDirectoryMark.some(
			i => i === relativePathSplited[0]
		)
			? 1
			: jumpBackCount - 1;
		const endCopyIndex = sourceFilePathSplited.length - jumpBackCount;

		for (let index = 0; index < endCopyIndex; index++) {
			absolutePathSplited.push(sourceFilePathSplited[index]);
		}
		for (
			let index = startCopyFromIndex;
			index < relativePathSplited.length;
			index++
		) {
			absolutePathSplited.push(relativePathSplited[index]);
		}
		return absolutePathSplited.join('/');
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
					classDeclaration.getSourceFile().getFilePath() === c.fullImportPath
			);
		}
		return useAsRoute;
	}
}
