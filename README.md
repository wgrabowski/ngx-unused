# ngx-unused
Find declared but unused Angular code.
This tool recognizes components, directives, pipes and services in Angular code and cheks if they are used in provided project.


# Usage 
Simplest way to use is via npx:

`npx ngx-unused <tsconfig-path>`


`<tsconfig-path>` - path to tsconfig file _(note: files excluded in given config will not be analyzed)_

This project is on early stage so using `@latest` version tag is recommended:

`npx ngx-unused@latest <tsconfig-path>`






