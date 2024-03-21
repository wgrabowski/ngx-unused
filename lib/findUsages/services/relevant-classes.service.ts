import { ClassDeclaration, Decorator, SourceFile } from 'ts-morph';
import { ClassTypes } from '../../types.js';
import { getRelevantDecorator } from '../utils/relevant-class.utils.js';
import { isTestFile } from '../utils/source-file.utils.js';

export class RelevantClassesService {
	private _releventClasses: ClassDeclaration[] = [];
	get releventClasses() {
		return this._releventClasses;
	}

	private _componentClasses: (Decorator | undefined)[] = [];
	get componentClasses() {
		return this._componentClasses as Decorator[];
	}

	constructor(sourceFiles: SourceFile[]) {
		this.setProps(sourceFiles);
	}
	setProps(sourceFiles: SourceFile[]) {
		this._releventClasses = sourceFiles
			.filter(file => !isTestFile(file))
			.flatMap(file => file.getClasses())
			.filter(declaration => getRelevantDecorator(declaration) !== undefined);

		this._componentClasses = this._releventClasses
			.filter(
				declaration =>
					getRelevantDecorator(declaration)?.getFullName() ===
					ClassTypes.Component
			)
			.map(getRelevantDecorator)
			.filter(decorator => decorator !== undefined);
	}
}
