`build`: build your package and all dependencies

`dev`: build all your package dependencies and run the `"dev"` command for your
package.

## TODO:

- [ ] Deal with cyclic dependencies (currently we just break the loop and continue, but realy this should be a hard fail)
- [ ] get yarn.build website up with some docs
- [ ] investigate is a full on DAG is needed, especially for the more complicated dependency chains
  - works for `packages/example/counter`, but not well for `.`
