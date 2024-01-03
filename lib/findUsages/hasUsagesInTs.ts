// if class is used in ts - excluding imports, exports, and declarations in NgModule decorator
// with exception useClass,useExisting in providers
import { ClassDeclaration, Node, SyntaxKind } from 'ts-morph';

export function hasUsagesInTs(declaration: ClassDeclaration): boolean {
	const referencingNodes = declaration.findReferencesAsNodes().filter(node => {
		const sourceFile = node.getSourceFile();
		return (
			!sourceFile.isDeclarationFile() &&
			!sourceFile.getBaseName().includes('.spec.ts')
		);
	});
	return referencingNodes.some(node => isReferecingNodeRelevant(node));
}

function isReferecingNodeRelevant(node: Node): boolean {
	const irrelevantNodeKinds = [
		SyntaxKind.ImportSpecifier,
		SyntaxKind.ExportSpecifier,
	];
	const irrelevantParentNodeKinds = [
		SyntaxKind.ExportAssignment,
		SyntaxKind.ClassDeclaration,
		SyntaxKind.ImportSpecifier,
		SyntaxKind.ExportSpecifier,
	];
	const isOfIrrelevantKind = irrelevantNodeKinds.includes(node.getKind());
	const hasParentOfIrrelevantKind =
		node.getParent() !== undefined &&
		irrelevantParentNodeKinds.includes(node.getParent()!.getKind());

	return (
		(!isOfIrrelevantKind &&
			!hasParentOfIrrelevantKind &&
			!isInNgModuleDecoratorCall(node)) ||
		node.getParent()!.isKind(SyntaxKind.PropertyAssignment)
	);
}

function isInNgModuleDecoratorCall(node: Node): boolean {
	if (node.getParent() === undefined) {
		return false;
	}
	// when used with useClass, useExisting it is relevant as it will not be injected by its own name
	if (node.getParent()!.isKind(SyntaxKind.PropertyAssignment)) {
		return false;
	}
	// bootstrap
	if (
		node.getFirstAncestor(
			ancestor =>
				ancestor.isKind(SyntaxKind.PropertyAssignment) &&
				ancestor.getName() === 'bootstrap'
		) !== undefined
	) {
		return false;
	}

	return (
		node.getFirstAncestor(
			ancestor =>
				ancestor.isKind(SyntaxKind.Decorator) &&
				ancestor.getFullName() === 'NgModule'
		) !== undefined
	);
}
