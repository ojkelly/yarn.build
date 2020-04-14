# Yarn Build

To install:

```
yarn add -D @kablamo/yarn-plugin-build
```

then add the following to your `.yarnrc.yml`

```
plugins:
 - path: .yarn/plugins/plugin-build.js
   spec: "@kablamo/yarn-plugin-build"
```

## For yarn v2

This plugin only works with yarn v2.
