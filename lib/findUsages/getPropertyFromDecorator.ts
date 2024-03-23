import { Decorator, ObjectLiteralExpression, SyntaxKind } from 'ts-morph';

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
