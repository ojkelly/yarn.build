# Yarn Build

For yarn v2.

To install:

```
yarn plugin import https://github.com/KablamoOSS/yarn-build/releases/download/0.9.2/plugin-build.js
```

## Commands

`build`: build your package and all dependencies

`bundle`: bundle a package and its local dependencies, designed for containers and AWS lambda.

Bundle will drop a file `./entrypoint.js` that loads the pnp modules and re-exports the file listed in
`package.json.main` if listed. You should add the path to your compiled file there.
