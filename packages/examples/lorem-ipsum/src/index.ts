import lipsum from "@internal/phrase-lorem-ipsum";

const expected =
  "lorem ipsum dolor sit amet, consectetur adipiscing elit. Nunc id faucibus metus, ac maximus lectus. Class aptent adipiscing sociosqu ad litora torquent per conubia nostra dolor. In hac habitasse platea consectetur. Maecenas et blandit nisl elit.";

console.info("lipsum === expected", lipsum === expected);

console.info(lipsum);
