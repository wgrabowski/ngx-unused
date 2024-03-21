import { existsSync, readFileSync } from 'fs';
import { parse } from 'node-html-parser';
import { dirname, join, resolve } from 'path';
import { Decorator } from 'ts-morph';
import { getPropertyFromDecoratorCall } from '../utils/relevant-class.utils.js';

export class TemplateService {
	private templates: string[];

	constructor(componentDecorators: Decorator[]) {
		this.templates = componentDecorators.map(decorator =>
			this.getTemplateHtmlFromDecorator(decorator)
		);
	}

	public hasUsagesByPipeName(decorator: Decorator): boolean {
		const name = getPropertyFromDecoratorCall(decorator, 'name');
		return this.matchesPipeName(name ?? '');
	}

	public hasUsagesBySelectors(decorator: Decorator): boolean {
		const selector = getPropertyFromDecoratorCall(decorator, 'selector');
		return this.matchesSelectors(selector?.split(',') ?? []);
	}

	private matchesSelectors(selectors: string[]) {
		return this.templates.some(template =>
			this.templateMatchesSelectors(template, selectors)
		);
	}

	private templateMatchesSelectors(
		template: string,
		selectors: string[]
	): boolean {
		const root = parse(template);

		// directive selector can be used as input or attribute
		const normalizeSelectors = selectors.flatMap(selector => {
			const withParensEscaped = selector
				.replace(/^\[/, '[\\[')
				.replace(/]$/, '\\]]')
				.trim();

			return [withParensEscaped, selector.trim()];
		});

		return normalizeSelectors.some(selector => {
			return root.querySelectorAll(selector).length > 0;
		});
	}

	private getTemplateHtmlFromDecorator(decorator: Decorator): string {
		const templateString = getPropertyFromDecoratorCall(decorator, 'template');
		if (templateString) {
			return templateString;
		}
		const templateUrl = getPropertyFromDecoratorCall(decorator, 'templateUrl');
		if (templateUrl) {
			return this.getTemplateFromFile(
				decorator.getSourceFile().getFilePath(),
				templateUrl
			);
		}
		return '';
	}

	private getTemplateFromFile(
		decoratorSourceFilePath: string,
		templateUrl: string
	): string {
		const templateFilePath = resolve(
			join(dirname(decoratorSourceFilePath), templateUrl)
		);
		return existsSync(templateFilePath)
			? readFileSync(templateFilePath, { encoding: 'utf-8' })
			: '';
	}

	matchesPipeName(name: string) {
		const pipeSelectorRegexp = new RegExp(`\\|\\s*${name}\\b`, 'gm');
		return this.templates.some(template => pipeSelectorRegexp.test(template));
	}
}
