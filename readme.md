# yarn.Build

[![Netlify Status](https://api.netlify.com/api/v1/badges/6b14fc77-846f-4035-944a-ff1c7843b70d/deploy-status)](https://app.netlify.com/sites/loving-wing-5cc62e/deploys)

yarn.BUILD is a plugin for Yarn 2. It uses your dependency graph to build just whats needed, when it's needed. You can setup a monorepo with a few backend packages, a server package, maybe a graphQL schema package, and a frontend package. And build it all, in the order it's needed. Then, only rebuild when something changes.

See the full docs at [yarn.BUILD](https://yarn.build)

To install:

```
yarn plugin import https://yarn.build/latest
```

## Commands

`build`: build your package and all dependencies

`bundle`: bundle a package and its local dependencies, designed for containers and AWS lambda.

`test`: test your package and it's dependencies

## Config

This isn't required but, to change any of the defaults or enable beta features add the following to `.yarnbuildrc.yml` in the root of your yarn workspace (next to `yarn.lock`).

```yaml
folders:
  # input defaults to the whole package directory
  input: .
  # output defaults to a folder called build. This can be set individually in package.json (see below)
  output: build
enableBetaFeatures:
  # folderConfiguration defaults to true
  # setting a default input/output folder as shown above
  # and per package i/o folder in package.json as below
  # "yarn.build": {
  #   "input": "src",
  #   "output": "dist"
  # },
  folderConfiguration: true
  # To enable yarn build path/to/package
  targetedBuilds: true
# Optional: Limit the number of concurrent builds/tests that can occur at once globally. This can also be set as a command line switch.
maxConcurrency: 4
```

---

For developing on this repository see [packages/plugins/plugin-build/readme.md](packages/plugins/plugin-build/readme.md)
