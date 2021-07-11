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

**You probably don't need a config file.** This config file is deprecated in favour of per package config.

To change any of the defaults add the following to `.yarnbuildrc.yml` in the root of your yarn workspace (next to `yarn.lock`).

```yaml
folders:
  # input defaults to the whole package directory
  input: .
  # output defaults to a folder called build. This can be set individually in package.json (see below)
  output: build

# Optional: Limit the number of concurrent builds/tests that can occur at once globally.
# This can also be set as a command line switch --max-concurrency 4
# Defaults to use all available CPUs
maxConcurrency: 4
```

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

---

For developing on this repository see [packages/plugins/plugin-build/readme.md](packages/plugins/plugin-build/readme.md)
