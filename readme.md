# yarn.build

[![Netlify Status](https://api.netlify.com/api/v1/badges/6b14fc77-846f-4035-944a-ff1c7843b70d/deploy-status)](https://app.netlify.com/sites/loving-wing-5cc62e/deploys)

yarn.BUILD is a plugin for [Yarn 4 (berry)](https://github.com/yarnpkg/berry). It uses your dependency graph to build just whats needed, when it's needed. You can setup a monorepo with a few backend packages, a server package, maybe a graphQL schema package, and a frontend package. And build it all, in the order it's needed. Then, only rebuild when something changes.

See the full docs at [yarn.BUILD](https://yarn.build)

To install for Yarn 4:

```
yarn plugin import https://yarn.build/latest
```

Or install any of the commands individually with

```
yarn plugin import https://yarn.build/latest/build
yarn plugin import https://yarn.build/latest/test
```

**If you're upgrading the plugin** the install location has changed to be under the `@yarn.build` namespace. If you have any yarn.build plugin previously installed you may need to remove the old one manually from `.yarnrc.yml`:

```yaml
plugins:
  - checksum: ...                                 <-- remove this entry if both exist
    path: .yarn/plugins/@ojkelly/plugin-all.cjs   <--
    spec: 'https://yarn.build/latest'             <--
  - checksum: ...
    path: .yarn/plugins/@yarn.build/plugin-all.cjs
    spec: 'https://yarn.build/latest'
```

## OpenTelemetry Support

<details>

yarn.build's `build` and `test` commands now come with optional OpenTelemetry (OTEL) instrumentation.

<summary>To use it, you need to run an OTEL Collector with a http receiver:</summary>

```yaml
receivers:
  otlp:
    protocols:
      grpc:
      http: # this is the one we need, it defaults to port 4318
```

And set the appropirate envar for example `OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318` if you are running the collector on the same host as you're running yarn.build.

NOTE: yarn.build doesn't currently support the `grpc` endpoint.

</details>

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

## Exclude

Pass `--exclude` or `--exclude-current` to selectively exclude packages from
being built.

Pass `-v` for verbose to get a print out of which packages were skipped or excluded.

```bash
yarn build --exclude packages/example/lorem-ipsum
yarn build --exclude packages/example/*

# Globs for package names work too, but you need to quote them so your shell doesn't try to substitute it
yarn build --exclude "@internal*"


# For Dev
# this one is really useful at the start of a dev command or similar where you
# are watching for changes in the current workspace but need to ensure your
# dependencies are built
yarn build --exclude-current

```

NOTE: if you explicitly exclude a workspace that another workspace depends on,
and that workspace is being built the command may fail.

## Git / CI integration

Use the flag `--changes`, to ignore the build cache, and build everything with changes staged or in the last commit.

Use `--since-branch main` to ignore the build cache, and build everything with changes based on what git says is different between the current branch and `main` (or another branch of your choosing).

Use `--since ${COMMIT_HASH}` to ignore the build cache, and build everything with changes between the current commit and the provided one.

#### `query`

Run `yarn build query` from within a package to see the dependency graph of what
might be built.

_Query doesn't currently show what's cached / needs to be rebuilt._

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

<details>

<summary>**The output is interlaced, or mangled, or not useful in CI**</summary>

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

</details>

---

For developing on this repository see [packages/plugins/readme.md](packages/plugins/readme.md)
