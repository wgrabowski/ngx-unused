import {
	ClassDeclaration,
	Decorator,
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

export class StandaloneComponentsService {
	private standaloneComponents: StandAloneComponentArgs[];

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

		this.standaloneComponents = modulesClasses
			.map(decorator => this.getLoadedStandaloneComponentsByRoute(decorator))
			.filter(x => x !== undefined)
			.flat();
	}
	private getLoadedStandaloneComponentsByRoute(decorator: ClassDeclaration) {
		const standaloneComponents: StandAloneComponentArgs[] = [];
		const importRegex = /'([^']+)'/;

		const loadComponentNodes = decorator
			.getParent()
			.getDescendants()
			.filter(d => d.getKind() === SyntaxKind.PropertyAssignment)
			.filter(x => x.getSymbol()?.getEscapedName() === 'loadComponent');

		if (loadComponentNodes?.length > 0) {
			loadComponentNodes.forEach(node => {
				const dynamicImportArrowFunction = node
					?.getDescendants()
					.find(
						d =>
							d.getText().includes('() => import') &&
							d.getKind() === SyntaxKind.ArrowFunction
					);

				if (dynamicImportArrowFunction) {
					const dynamicImportAccessExpression =
						dynamicImportArrowFunction?.getDescendantsOfKind(
							SyntaxKind.PropertyAccessExpression
						);
					const importPath = dynamicImportAccessExpression[0]
						?.getFirstDescendantByKind(SyntaxKind.StringLiteral)
						?.getText();
					const componentClassNameIdentifiers =
						dynamicImportAccessExpression[1]?.getDescendantsOfKind(
							SyntaxKind.Identifier
						);
					if (componentClassNameIdentifiers?.length > 0) {
						const componentClassName =
							componentClassNameIdentifiers[
								componentClassNameIdentifiers.length - 1
							]?.getText();

						const matchImport = importPath?.match(importRegex);
						const path = matchImport ? matchImport[1] : '';
						const parentFilePath = node?.getSourceFile().getFilePath();

						const fullImportPath = this.getFullImportPath(path, parentFilePath);
						standaloneComponents.push({
							fullImportPath: fullImportPath,
							componentClassName: componentClassName,
						});
					}
				}
			});
		}

		return standaloneComponents;
	}
	private getFullImportPath(path: string, nodeFilePath: string) {
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

	private convertToAbsolutePath(relativePath: string, sourceFilePath: string) {
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

	public isStandaloneComponentUseAsRoute(
		classDeclaration: ClassDeclaration,
		relevantDecorator: Decorator
	) {
		let useAsRoute = false;
		const isStandalone = getPropertyFromDecoratorCall(
			relevantDecorator,
			'standalone'
		);

		if (isStandalone?.toLowerCase() === 'true') {
			useAsRoute = this.standaloneComponents.some(
				c =>
					c.componentClassName === classDeclaration.getName() &&
					classDeclaration.getSourceFile().getFilePath() === c.fullImportPath
			);
		}
		return useAsRoute;
	}
}
