import { ClassTypes } from './types';

export const RELEVANT_DECORATOR_NAMES: (ClassTypes | string)[] = [
	'Component',
	'Injectable',
	'Pipe',
	'Directive',
];

export const MODULE_DECORATOR = 'NgModule';

export const GUARD_INTERFACES = [
	'CanActivateChild',
	'CanActivate',
	'CanDeactivate',
	'CanComponentDeactivate',
	'CanLoad',
];
