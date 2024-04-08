import { SourceFile } from 'ts-morph';

export function isTestFile(sourceFile: SourceFile) {
	return ['.spec.ts', '.cy.ts'].some(suffix =>
		sourceFile.getBaseName().includes(suffix)
	);
}
