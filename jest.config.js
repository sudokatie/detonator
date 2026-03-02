/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/server'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  collectCoverageFrom: ['src/game/**/*.ts', '!src/game/Renderer.ts'],
  testTimeout: 5000,
}
