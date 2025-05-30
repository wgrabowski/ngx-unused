// if class is used in ts - excluding imports, exports, and declarations in NgModule decorator
// with exception useClass,useExisting in providers
import { ClassDeclaration, Node, SourceFile, SyntaxKind } from 'ts-morph';

export function hasUsagesInTs(declaration: ClassDeclaration): boolean {
	const referencingNodes = declaration.findReferencesAsNodes().filter(node => {
		const sourceFile = node.getSourceFile();
		return !isFileIrrelevant(sourceFile);
	});
	const isDynamicallyImported =
		isClassReferencedInDynamicImportCallback(declaration);

	return (
		referencingNodes.some(node => isReferecingNodeRelevant(node)) ||
		isDynamicallyImported
	);
}

function isFileIrrelevant(sourceFile: SourceFile): boolean {
	return (
		sourceFile.isDeclarationFile() ||
		sourceFile.getBaseName().includes('.spec.ts')
	);
}
function isDynamicImport(node: Node): boolean {
	return (
		node.isKind(SyntaxKind.CallExpression) &&
		!!node.getFirstChildIfKind(SyntaxKind.ImportKeyword)
	);
}

//	assuming dynamic imports looks like this
//  import("../file/path.ts").then(x=>x.ClassName)
function isDynamicImportReferencingClass(
	node: Node,
	declaration: ClassDeclaration
): boolean {
	const importCallback = node
		.getFirstAncestorByKind(SyntaxKind.PropertyAccessExpression)
		?.getFirstAncestorByKind(SyntaxKind.ArrowFunction)
		?.getFirstDescendantByKind(SyntaxKind.ArrowFunction);

	return !!importCallback
		?.getDescendants()
		.some(descendant => descendant.getFullText() === declaration.getName());
}

function isClassReferencedInDynamicImportCallback(
	declaration: ClassDeclaration
): boolean {
	return declaration
		.getSourceFile()
		.getReferencingNodesInOtherSourceFiles()
		.filter(reference => !isFileIrrelevant(reference.getSourceFile()))
		.filter(isDynamicImport)
		.some(node => isDynamicImportReferencingClass(node, declaration));
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
