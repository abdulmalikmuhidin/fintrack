const createJestConfig = require("next/jest");

const createConfig = createJestConfig({
  dir: "./",
});

module.exports = createConfig({
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testPathIgnorePatterns: ["<rootDir>/.next/", "<rootDir>/node_modules/"],
  collectCoverageFrom: [
    "src/app/**/*.{ts,tsx}",
    "src/lib/**/*.{ts,tsx}",
    "!src/app/layout.tsx",
    "!src/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
});
