# ngx-unused

Find declared but unused Angular classes in your codebase.

This tool recognizes components, directives, pipes and services in Angular code and checks if they are used in provided
project.

# Usage

Simplest way to use is via npx:

`npx ngx-unused <source-root> -p <tsconfig-path>`

```shell
ngx-unused - find unused classes in Angular codebase


Usage: ngx-unused <directory> [-p | --project] <tsconfig-file>

<directory>     - directory to be scanned
                  to scan multiple directories pass names separated by space
                  (usages of classes from source roots will be also searched in source roots)

<tsconfig-file> - main tsconfig file
                  should be one containing @paths definitions
                  for NX projects its usually tsconfig.base.json


Options:
-p | --project <tsconfigfile>  - tsconfig file path (required)
-h | --help                    - print this help
Source root directories and tsconfig file must be under the same root directory.

Examples:
ngx-unused . -p tsconfig.base.json
ngx-unused libs apps/my-app -p tsconfig.base.json
```

# How does it work?

Code from provided source root directory (or directories) is analyzed to find [relevant classes](#relevant-classes).
Relevant class is class with on of following Angular decorators: `@Component`,`@Directory`,`@Pipe`,`@Injectable`.
Each class is checked for [relevant usages](#relevant-usages) in codebase. When it has no relevant usages it is
considered unused.

## Relevant classes

Class decorated with one of Angular decorators

- `@Component`
- `@Directive`
- `@Pipe`
- `@Injectable`

Classes declared in [ignored files](#ignored-files) will be ignored.

## Relevant usages

Relevant usage is any usage that is not one of following:

- import
- export
- usage in `@NgModule` decorator (in `imports`,`exports`, `declarations`, `providers` properties)
- with exception for `useClass` and `useExisting` in provider object
- usage in any of [ignored files](#ignored-files)

## Ignored files

Files matching `*.spec.ts` glob will be ignored.
Future version may have option to configure that.

# Output

Output is printed to standard output. If `process.stdout.isTTY` is false no decorative texts and no progress will be
printed, so it can be safely piped.

## Output formatting

Output contains progress information and formatted results.
Formatted results is a list of unused classes, grouped by files.

## Exit codes

`0` No unused classes detected.

`1` Detected unused component, directive, pipe, or service.

`2`: Invalid configuration
