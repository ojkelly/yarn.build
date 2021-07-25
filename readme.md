# yarn.Build

[![Netlify Status](https://api.netlify.com/api/v1/badges/6b14fc77-846f-4035-944a-ff1c7843b70d/deploy-status)](https://app.netlify.com/sites/loving-wing-5cc62e/deploys)

yarn.BUILD is a plugin for [Yarn 2/3 (berry)](https://github.com/yarnpkg/berry). It uses your dependency graph to build just whats needed, when it's needed. You can setup a monorepo with a few backend packages, a server package, maybe a graphQL schema package, and a frontend package. And build it all, in the order it's needed. Then, only rebuild when something changes.

See the full docs at [yarn.BUILD](https://yarn.build)

Install for Yarn 2:

```
yarn plugin import https://yarn.build/v2
```

To install for Yarn 3:

```
yarn plugin import https://yarn.build/latest
```

## Commands

`build`: build your package and all dependencies

`bundle`: bundle a package and its local dependencies, designed for containers and AWS lambda.

`test`: test your package and it's dependencies

## Config

By default yarn.build looks at your `package.json` and chooses some reasonable defaults.

```json
{
  "name": "@internal/lorem-ipsum",
  "version": "1.0.0",
  "main": "build/index.js",
  "license": "UNLICENSED",
  "private": true,
  "scripts": {
    "build": "tsc",
    "test": "jest"
  }
}
```

When you specify `main` yarn.build will exclude that folder from the build tracker, and use the
package root (the same directory as the `package.json`) as the input folder to track.

If you want to customise the input and output folders per package you can setup a package.json as follows:

```json
{
  "name": "@internal/lorem-ipsum",
  "version": "1.0.0",
  "license": "UNLICENSED",
  "private": true,
  "scripts": {
    "build": "tsc -outDir dist",
    "test": "jest"
  },
  "yarn.build": {
    "input": ".",
    "output": "dist"
  }
}
```

## plugin-package-yaml

Have you ever wanted to write you `package.json` as `package.yaml` or even `package.yml`?

Well now you can!\*

\*This is an initial seemingly stable release, but may break things - raise an issue if it does.

To install:

```
yarn plugin import https://yarn.build/yaml
```

Swap an existing `package.json` over to a `package.yaml` by converting it's contents to YAML, and renaming the file.

This plugin will transparently convert your `package.yaml` back into json for all of Yarn's tooling, meaning Yarn has no idea
it's not writing to a `package.json`.

```yaml filename=package.yml
name: "@internal/lorem-ipsum"
version: 1.0.0
main: dist/index.js

# license, none for the example
license: UNLICENSED
private: true

# scripts comment
scripts:
  build: tsc
  test: jest
  dev: ts-node ./src/index.ts

dependencies:
  "@internal/phrase-lorem-ipsum": "workspace:*"
  jest: "^26"
  ts-jest: "^26.4.4"
  typescript: ^4.3.5

devDependencies:
  "@types/node": ^16.4.1
  ts-node: ^10.1.0
  "@types/jest": ^26.0.24

jest:
  preset: ts-jest

# here we define our input and output
# as we defined main above, we don't need this
# if your output directory is different or not easily definable in main
# specify it here
yarn.build:
  input: .
  output: dist
```

### Caveats

PNP is not supported yet, as neither is a node.

You can still read the yaml file directly (it is just a file after all), but existing tooling that wants to read from your `package.json` will break.

### Example

The initial usecase for this is for non-javascript packages in a polyglot yarn.build repository. As an example this is how you can build a go app, leveraging yarn and yarn.build but with a yaml file as your build specification (ie `package.yaml`).

In this example we have a graphql schema defined in typescript that generates type files we can consume in our go binary.

```yaml filename=package.yaml
name: "@internal/server"
version: 1.0.0
main: cmd/main.go

# license, none for the example
license: UNLICENSED
private: true

# scripts comment
scripts:
  build: GOOS=linux GOARCH=amd64 go build -o .build/main cmd/main.go
  test: go test ./...
  dev: go run cmd/main.go

dependencies:
  "@internal/graphql-schema": "workspace:*"

yarn.build:
  input: .
  output: .build
```

For developing on this repository see [packages/plugins/plugin-build/readme.md](packages/plugins/plugin-build/readme.md)
