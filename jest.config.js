module.exports = {
  testEnvironment: "node",

  testMatch: ["**/src/tests/**/*.test.js"],

  setupFiles: ["<rootDir>/src/tests/setupEnv.js"],

  setupFilesAfterEnv: ["<rootDir>/src/tests/teardown.js"],

  clearMocks: true,
  restoreMocks: true,
};
