# yarn.build

Yarn 4 plugin providing dependency-aware `build` and `test` commands
for monorepos. Prioritises simplicity, speed, and minimal ceremony.

## Design

- **Uses existing `package.json` scripts directly.** No special build config — if a package has a `build` script, `yarn build` will run it in dependency order.
- **Local-dev-first cache.** The build cache uses file modification times, designed for fast local iteration.
- **CI pipeline orchestration.** Different pipeline stages can be orchestrated by calling different script names via `-c`:

```bash
yarn build -c build:docker    # Build docker images in dependency order
yarn build -c docker:upload   # Push images
yarn build -c deploy          # Deploy services
```

- **Cyclic dependency escape hatch.** Only packages that define the same named script are considered when detecting cycles. Unintentional cyclic dependencies can be broken by using differently named scripts for different concerns.

## Commands

```bash
# Build
yarn build                    # Build current package and its dependencies
yarn build -r --all           # Rebuild all packages (ignore cache)
yarn build:plugin             # Build the plugin-all package
yarn build -c build:update    # Build plugin and copy to .yarn/plugins

# Test
yarn test                     # Run vitest (all packages)
yarn vitest                   # Vitest in watch mode

# Lint & Format
yarn lint                     # oxlint
yarn fmt                      # oxfmt (write)
yarn fmt:check                # oxfmt (check only)

```

## Architecture

```
packages/
  plugins/
    plugin-all/              # Aggregates all plugins into one
    plugin-build/            # `yarn build` command
    plugin-test/             # `yarn test` command
shared/                  # Shared utilities (@ojkelly/yarn-build-shared)
      src/supervisor/        # RunSupervisor - core orchestration
      src/tracing/           # Optional OpenTelemetry tracing
  tools/
    do/                      # Custom build tool (Yarn plugin)
  examples/                  # Example monorepo packages
```

### RunSupervisor (`shared/src/supervisor/`)

Core orchestration class. Builds the dependency graph, topologically sorts workspaces, manages parallel execution with concurrency limits, and tracks build cache via modification times stored in `.yarn/local-build-cache.json`.

### The `do` Tool (`packages/tools/do/`)

Custom Yarn plugin registered in `.yarnrc.yml`. Automatically injected into all workspace packages via `registerPackageExtensions`. Runs scripts from `packages/tools/do/scripts/`:

- `build-plugin` - Build a Yarn plugin via `@yarnpkg/builder`, patch output for `@yarn.build` namespace
- `update-plugin` - Build and copy to `.yarn/plugins/@yarn.build/`
- `clean-plugin` - Remove plugin bundles

Enriches env vars: `PACKAGE_PATH`, `PACKAGE_RAW_NAME`, `PACKAGE_SCOPE`, `PACKAGE_NAME`, `PACKAGE_BUILD_FOLDER`.

### Self-Hosting

The project uses its own `@yarn.build/yarn-plugin-all` plugin for builds. Plugin source is in `packages/plugins/`, built plugin lives at `.yarn/plugins/@yarn.build/yarn-plugin-all.cjs`.

## Testing

- **Framework**: Vitest 4, configured in `vitest.config.mjs`
- **Pool**: `vmThreads`
- **Pattern**: `**/*.test.ts` files alongside source
- **Key test files**:
  - `shared/src/supervisor/graph.test.ts` - Graph traversal
  - `plugin-test/src/commands/test/supervisor.test.ts` - Test supervisor

## Constraints

- **Node**: `>=22.2.0`
- **Yarn**: `4.13.0` (via corepack, `packageManager` field)
- **Module type**: ESM (`"type": "module"`)
- **TypeScript**: Target ES2022, module Node16
- **Internal deps**: Use `workspace:^` protocol (enforced by `yarn.config.cjs`)
- **Pre-commit**: Husky + lint-staged runs oxlint and oxfmt

## Plugin Structure

Each plugin follows this pattern:
1. `src/index.ts` - Exports Yarn Plugin object with commands
2. `src/commands/` - Command implementations extending `BaseCommand`
3. Built via `@yarnpkg/builder` into `bundles/@yarnpkg/plugin-*.js`
4. Extends `tsconfig.plugin.json` with `outDir: "dist"`
