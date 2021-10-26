module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  resolver: require.resolve(`jest-pnp-resolver`),
  testMatch: ["**/*.integration.(ts|js)"],
};
