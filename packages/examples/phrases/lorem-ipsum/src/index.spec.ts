import phrase from "./index";

test("phrase matches expected", () => {
  expect(phrase).toBe(
    "lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc id faucibus metus, ac maximus lectus. Class aptent adipiscing sociosqu ad litora torquent per conubia nostra dolor. In hac habitasse platea consectetur. Maecenas et blandit nisl elit."
  );
});
