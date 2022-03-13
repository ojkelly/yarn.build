# yarn.build

[![Netlify Status](https://api.netlify.com/api/v1/badges/6b14fc77-846f-4035-944a-ff1c7843b70d/deploy-status)](https://app.netlify.com/sites/loving-wing-5cc62e/deploys)

yarn.BUILD is a plugin for [Yarn 2/3 (berry)](https://github.com/yarnpkg/berry). It uses your dependency graph to build just whats needed, when it's needed. You can setup a monorepo with a few backend packages, a server package, maybe a graphQL schema package, and a frontend package. And build it all, in the order it's needed. Then, only rebuild when something changes.

See the full docs at [yarn.BUILD](https://yarn.build)

To install for Yarn 3:

```
yarn plugin import https://yarn.build/latest
```

Or install any of the commands individually with

```
yarn plugin import https://yarn.build/latest/build
yarn plugin import https://yarn.build/latest/test
yarn plugin import https://yarn.build/latest/bundle
```

Install for Yarn 2:

```
yarn plugin import https://yarn.build/v2
```

## Commands

### `build`

Build your package and all dependencies.

Run in the root of your project, or in a non-workspace folder to build everything.

Run in a specific workspace to build that workspace and all of its dependencies
in the correct order, only rebuidling what's changed.

_My builds are never cached?_

Yarn build tries to guess your input and output folders based on common conventions.

If they're different you can specify them explicitly in `package.json`:

```json
  "yarn.build": {
    "input": "src",
    "output": "dist"
  }
```

If that still doesn't work, check to see if your build script is modifying any
files in your `input` folder. Some build tools like to mess with files like
`tsconfig.json` and others.

The most ideal state is that your input folder is never modified by your build
step. If this continues to happen, you should try to adjust the build scripts,
or workspace layout to avoid it.

As this is fundemental to ensuring sound builds, yarn build will never cache the
input folder if it's changed.

## Git / CI integration

Use the flag `--changes`, to ignore the build cache, and build everything with changes staged or in the last commit.

Use `--since-branch main` to ignore the build cache, and build everything with changes based on what git says is different between the current branch and `main` (or another branch of your choosing).

Use `--since ${COMMIT_HASH}` to ignore the build cache, and build everything with changes between the current commit and the provided one.

#### `query`

Run `yarn build query` from within a package to see the dependency graph of what
might be built.

_Query doesn't currently show what's cached / needs to be rebuilt._

### `bundle`

Bundle a package and its local dependencies, designed for containers and AWS lambda.

A file `entrypoint.js` is added to the project root, that reexports the file you
specify as `main` in `package.json`.

_Output `bundle.zip` to a specific folder_

```bash
# or any path you want to put it in
yarn bundle --output-directory ../tmp
```

_Bundle but don't zip_

This is useful when you're building inside a docker container.

Choose an output directory outside your project and pass `--no-compress`.

```bash
# or any path you want to put it in that's outside your project root
yarn bundle --no-compress --output-directory /srv/app
```

#### `.bundleignore` NEW!

You can set files to be ignored when bundling for even smaller bundles.

Add a `.bundleignore` file with the same format as `.gitignore` next to the
`package.json` you are bundling.

Optionally put one next to your root `package.json` to apply to all bundles.

You can pass `--ignore-file` to specify a different ignore file.

Or decide at bundle time what to ignore by passing `--exclude` along with the file path to ignore.

See #112 for the original PR.

### `test`

Test your package and it's dependencies.

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

## Troubleshooting

**The output is interlaced, or mangled, or not useful in CI**

yarn.build uses `is-ci` to check if it's running in a CI environment, and will not print progress in the same way it does when run locally (or with an interactive tty).

Typically `is-ci` is really good at detecting a CI environment. It does this by checking a for one of many known environment variables set by CI tools. Including the most common and most useful fallback `CI=true`.

If you run `yarn build` or `yarn test` wrapped inside another execution environment inside your CI pipeline, you might need to pass an environment variable (ENV) to let yarn.build know it's being run in CI.

Depending on how your script is run, you can do something like the following:

```
CI=true yarn build
```

Adapted for Docker / BuildKit, the following will set `CI` for the script, but not the whole container. [See issue #5 for more information](https://github.com/ojkelly/yarn.build/issues/5#issuecomment-888166665)

```
RUN env CI=true yarn build
```

---

## plugin-package-yaml

Have you ever wanted to write you `package.json` as `package.yaml` or even `package.yml`?

Well now you can!

To install:

```
yarn plugin import https://yarn.build/yaml
```

Once installed, any folder with a `package.yaml` and without a `package.json` will run through this plugin. This lets you opt-in packages that don't have any tooling that _requires_ `package.json` to be present on disk.

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

Existing tooling that wants to read from your `package.json` will break, unless it reads it via Yarn.

#### Troubleshooting

If it breaks, convert your yaml package file back to json, and comment the plugin out from `.yarnrc.yml`.

Please also make an issue describing you problem, so we can hopefully fix it.

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

---

For developing on this repository see [packages/plugins/readme.md](packages/plugins/readme.md)
