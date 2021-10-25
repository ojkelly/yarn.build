// Integration tests are the same as regular tests, except they match a
// different path pattern so that they can be run at a different time from the
// unit tests.
module.exports = Object.assign(require('./jest.config'), {
  testMatch: [
    "**/*.integration.(ts|js)"
  ],
});
