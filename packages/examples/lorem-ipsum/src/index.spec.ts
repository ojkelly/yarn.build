import { test, expect } from "vitest";
import { lipsum, expected } from "./index";

test("lipsum matches expected", () => {
  expect(lipsum).toBe(expected);
});
