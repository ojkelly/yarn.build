# Building yarn.build

Clone this repo, and install the dependencies `yarn install`

To test run `yarn build` to build everything in the `packages/example` folder.

To update the plugin run `yarn update` in `packages/plugins/plugin-build`.

## Releases

Releases are automatic with the workflow at `.github/workflows/main.yml`
and build off of SemVer tags in the format `v*`

`git tag -a "vX.X.X -m "Release notes"`

`git push --tags`

## TODO:

- allow passing of var to all builds from root
- use this ^ to ask builds to fail
- ensure all errors are shown to the user
- tidy up build error log
