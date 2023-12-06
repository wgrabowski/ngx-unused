// if class is used in ts - excluding imports, exports, and declarations in NgModule decorator
// with exception useClass,useExisting in providers
import { ClassDeclaration, Node, SyntaxKind } from 'ts-morph';

export function hasUsagesInTs(declaration: ClassDeclaration): boolean {
	const referencingNodes = declaration.findReferencesAsNodes();
	return referencingNodes.some(isReferecingNodeRelevant);
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
		!isOfIrrelevantKind &&
		!hasParentOfIrrelevantKind &&
		!isInNgModuleDecoratorCall(node)
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

	return (
		node.getFirstAncestor(
			node =>
				node.isKind(SyntaxKind.Decorator) && node.getFullName() === 'NgModule'
		) !== undefined
	);
}
