module.exports = {
  preset: 'ts-jest',
  transform: {
    '^.+.ts?$': [
      'ts-jest',
      {
        tsconfig: './tsconfig.json',
      },
    ],
  },
  testEnvironment: 'node',
  roots: ['<rootDir>/packages'],
  testMatch: [
    '**/packages/dvbcss-node/tests/specs/**/*.test.ts',
    '**/packages/dvbcss-clocks/tests/specs/**/*.test.ts',
  ],
  transformIgnorePatterns: [
    '<rootDir>/node_modules/',
  ]
};
