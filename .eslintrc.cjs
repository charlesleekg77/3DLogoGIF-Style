/** @type {import('eslint').Linter.Config} */
module.exports = {
  root: true,
  extends: ["next/core-web-vitals", "next/typescript"],
  rules: {
    // The 3D layer holds Three.js objects in refs and mutates them in frame
    // loops by design; flagging that pattern would be noise, not signal.
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-unused-vars": [
      "warn",
      { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
    ],
    "react-hooks/exhaustive-deps": "warn",
  },
  ignorePatterns: ["public/vendor/**", ".next/**", "node_modules/**"],
};
