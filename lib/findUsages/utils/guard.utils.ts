import { ClassDeclaration, Decorator, Node, SyntaxKind } from 'ts-morph';
import { GUARD_INTERFACES, MODULE_DECORATOR } from '../../constants.js';
import { ClassTypes } from '../../types.js';
import { isTestFile } from './source-file.utils.js';

export function isGuardClass(classDeclaration: ClassDeclaration) {
	const isInjectable = classDeclaration.getDecorator(
		decorator =>
			(decorator.getFullName() as ClassTypes) === ClassTypes.Injectable
	);
	return (
		isInjectable &&
		classDeclaration
			?.getHeritageClauseByKind(SyntaxKind.ImplementsKeyword)
			?.getTypeNodes()
			.find(node =>
				GUARD_INTERFACES.some(
					i => i.toLowerCase() === node.getText().toLocaleLowerCase()
				)
			)
	);
}

export function hasUsagesByCanActivateCall(declaration: ClassDeclaration) {
	declaration.getHeritageClauseByKind(SyntaxKind.ImplementsKeyword);
	const referencingNodes = declaration.findReferencesAsNodes().filter(node => {
		const sourceFile = node.getSourceFile();
		return !sourceFile.isDeclarationFile() && !isTestFile(sourceFile);
	});
	return referencingNodes.some(node => isReferecingInCanActivatePropery(node));
}

function isReferecingInCanActivatePropery(node: Node): boolean {
	const parentNode = node.getParent();
	const moduleAncestor = parentNode?.getFirstAncestor(
		ancestor =>
			ancestor.isKind(SyntaxKind.Decorator) &&
			ancestor.getFullName() === MODULE_DECORATOR
	) as Decorator;
	const arg = moduleAncestor?.getArguments()[0];

	return (
		arg
			?.getDescendants()
			.find(
				d =>
					d.getKind() === SyntaxKind.PropertyAssignment &&
					d.compilerNode
						.getChildren()
						.find(c =>
							GUARD_INTERFACES.some(
								i => i.toLowerCase() === c.getText().toLocaleLowerCase()
							)
						) &&
					d.compilerNode
						.getChildren()
						.find(c => c.getText().includes(node.getText()))
			) !== undefined
	);
}
