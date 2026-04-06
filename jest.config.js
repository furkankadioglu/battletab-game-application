/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests', '<rootDir>/shared', '<rootDir>/server'],
  testMatch: [
    '**/tests/**/*.test.js',
    '**/tests/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/client/',
    '/tests/visual/',
    '/tests/perf/'
  ],
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'shared/**/*.js',
    'server/src/**/*.js',
    '!**/node_modules/**'
  ],
  verbose: true,
  forceExit: true,
  detectOpenHandles: true
};
