import { ClassDeclaration } from 'ts-morph';
import { MODULE_DECORATOR } from '../../constants.js';

export function isModuleDecorator(classDeclaration: ClassDeclaration) {
	return classDeclaration.getDecorator(
		decorator => decorator.getFullName() === MODULE_DECORATOR
	);
}
