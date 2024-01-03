import { Decorator } from 'ts-morph';
import { getPropertyFromDecoratorCall } from './getPropertyFromDecorator.js';
import { TemplateService } from './templateService.js';

export function hasUsagesByPipeName(
	decorator: Decorator,
	templateService: TemplateService
): boolean {
	const name = getPropertyFromDecoratorCall(decorator, 'name');
	return templateService.matchesPipeName(name ?? '');
}
