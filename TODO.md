Progress of rewrite:

- [x] remove old code
- [x] setup code quality tools, git hooks, linters etc
- [x] basic cli with options parsing
- [ ] get source files list from angular.json (ignore .spec.ts files by default)
- [ ] add cli flag for excluded files pattern (defaults to \*_/_.spec.ts)
- [ ] AST code to iterate over nodes in source files
- [ ] detecting unused Injectable classes
- [ ] detecting unused Component classes
- [ ] detecting unused Directive classes
- [ ] detecting unused Pipe classes
- [ ] output printing, progress printing for TTY
