# Contributing to js-data-firebase

[Read the general Contributing Guide](http://js-data.io/docs/contributing).

## Project structure

* `dist/` - Contains final build files for distribution
* `doc/` - Output folder for JSDocs
* `src/` - Project source code
* `test/` - Project tests

## Clone, build & test

1. `clone git@github.com:js-data/js-data-firebase.git`
1. `cd js-data-firebase`
1. `npm install`
1. `npm test` - Lint, build, and test

## To cut a release

1. Checkout master
1. Bump version in `package.json` appropriately
1. Update `CHANGELOG.md` appropriately
1. Run `npm run release`
1. Commit and push changes
1. Checkout `release`, merge `master` into `release`
1. Run `npm run release` again
1. Commit and push changes
1. Make a GitHub release
  - tag from `release` branch
  - set tag name to version
  - set release name to version
  - set release body to changelog entry for the version
1. `npm publish .`

See also [Community & Support](http://js-data.io/docs/community).
