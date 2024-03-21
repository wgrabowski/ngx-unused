import {
	ClassDeclaration,
	Decorator,
	Node,
	ObjectLiteralExpression,
	SyntaxKind,
} from 'ts-morph';
import { MODULE_DECORATOR, RELEVANT_DECORATOR_NAMES } from '../../constants.js';
import { ClassTypes } from '../../types.js';
import { isTestFile } from './source-file.utils.js';

export function getRelevantDecorator(classDeclaration: ClassDeclaration) {
	return classDeclaration.getDecorator(decorator =>
		RELEVANT_DECORATOR_NAMES.includes(decorator.getFullName() as ClassTypes)
	);
}

export function getPropertyFromDecoratorCall(
	decorator: Decorator,
	propertyName: 'selector' | 'name' | 'template' | 'templateUrl' | 'standalone'
) {
	const decoratorCallArguments = decorator.getArguments();
	const matchedProperty = decoratorCallArguments
		.flatMap(argument =>
			(argument as ObjectLiteralExpression)
				.getProperties()
				.map(prop => prop.asKind(SyntaxKind.PropertyAssignment))
				.filter(value => value !== undefined)
		)
		.find(structure => structure!.getName() === propertyName);

	return (
		matchedProperty?.getInitializerIfKind(SyntaxKind.StringLiteral) ||
		matchedProperty?.getInitializerIfKind(SyntaxKind.TrueKeyword)
	)
		?.getLiteralValue()
		.toString();
}

export function hasUsagesInTs(declaration: ClassDeclaration): boolean {
	const referencingNodes = declaration.findReferencesAsNodes().filter(node => {
		const sourceFile = node.getSourceFile();
		return !sourceFile.isDeclarationFile() && !isTestFile(sourceFile);
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
				ancestor.getFullName() === MODULE_DECORATOR
		) !== undefined
	);
}
