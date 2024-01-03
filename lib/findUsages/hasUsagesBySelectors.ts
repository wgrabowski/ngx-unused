import { Decorator } from 'ts-morph';
import { getPropertyFromDecoratorCall } from './getPropertyFromDecorator.js';
import { TemplateService } from './templateService.js';

export function hasUsagesBySelectors(
	decorator: Decorator,
	templateService: TemplateService
): boolean {
	const selector = getPropertyFromDecoratorCall(decorator, 'selector');
	return templateService.matchesSelectors(selector?.split(',') ?? []);
}
