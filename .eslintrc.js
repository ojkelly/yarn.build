module.exports = {
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint", "@kablamo"],
  extends: [
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
    "plugin:@kablamo/recommended",
    "plugin:cypress/recommended"
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true
    },
    ecmaVersion: 6,
    project: "./tsconfig.json",
    sourceType: "module"
  },
  settings: {
    react: {
      version: "detect"
    }
  },
  env: {
    es6: true,
    browser: true,
    jest: true,
    node: true
  },
  rules: {
    semi: [2, "always"],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/explicit-member-accessibility": "off",
    "@typescript-eslint/indent": "off",
    "@typescript-eslint/member-delimiter-style": "off",
    "@typescript-eslint/no-explici-any": "off",
    "@typescript-eslint/no-var-requires": "off",
    "@typescript-eslint/no-use-before-define": "off",
    "@typescript-eslint/prefer-interface": "off",
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        argsIgnorePattern: "^_"
      }
    ],
    "no-console": [
      "error",
      {
        allow: ["warn", "error", "info"]
      }
    ],
    "react/display-name": 0,
    "react/prop-types": 0
  }
};
