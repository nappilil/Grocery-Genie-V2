export default {
  transform: {
    '^.+\\.m?[jt]sx?$': 'babel-jest',
  },
  testEnvironment: 'node',
  testMatch: ['**/?(*.)+(test).[mjt]s'], // <== this line makes Jest pick up .test.mjs
};
