// if class is used in ts - excluding imports, exports, and declarations in NgModule decorator
// with exception useClass,useExisting in providers
import { ClassDeclaration } from 'ts-morph';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function hasUsagesInTs(declaration: ClassDeclaration): boolean {
	return false;
}
