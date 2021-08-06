# ngx-unused
Find declared but unused Angular code.

This tool recognizes components, directives, pipes and services in Angular code and cheks if they are used in provided project.

# Usage
Simplest way to use is via npx:

`npx ngx-unused <tsconfig-path>`

`<tsconfig-path>` - path to tsconfig file _(note: files excluded in given config will not be analyzed)_

# Important notes
Component - is a class with `Component` decorator.

Directive - is a class with `Directive` decorator.

Pipe - is a class with `Pipe` decorator.

Service - is a class with `Injectable` decorator.

Only classes with default Angular decorators will be recognized.
