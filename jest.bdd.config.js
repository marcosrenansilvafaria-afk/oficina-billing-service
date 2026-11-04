module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'test/bdd',
  testRegex: '.*\\.steps\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
};
