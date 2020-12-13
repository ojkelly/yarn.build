import phrase from "./index";

test("phrase matches expected", () => {
  expect(phrase).toBe(
    "Class aptent adipiscing sociosqu ad litora torquent per conubia nostra dolor."
  );
});
