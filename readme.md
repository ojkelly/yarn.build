# Yarn Build

[![Netlify Status](https://api.netlify.com/api/v1/badges/6b14fc77-846f-4035-944a-ff1c7843b70d/deploy-status)](https://app.netlify.com/sites/loving-wing-5cc62e/deploys)

For yarn v2.

To install:

```
yarn plugin import https://yarn.build/latest
```

## Commands

`build`: build your package and all dependencies

`bundle`: bundle a package and its local dependencies, designed for containers and AWS lambda.

Bundle will drop a file `./entrypoint.js` that loads the pnp modules and re-exports the file listed in
`package.json.main` if listed. You should add the path to your compiled file there.

---

For developing on this repository see [packages/plugins/plugin-build/readme.md](packages/plugins/plugin-build/readme.md)
