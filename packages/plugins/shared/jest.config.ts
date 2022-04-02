import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "node",
  resolver: require.resolve(`jest-pnp-resolver`),
  verbose: true,
};

export default config;
