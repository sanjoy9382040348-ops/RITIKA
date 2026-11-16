module.exports = {
  preset: 'jest-expo',
  moduleNameMapper: {
    '^@api/(.*)$': '<rootDir>/src/api/$1',
    '^@components/(.*)$': '<rootDir>/src/components/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@i18n/(.*)$': '<rootDir>/src/i18n/$1',
    '^@navigation/(.*)$': '<rootDir>/src/navigation/$1',
    '^@providers/(.*)$': '<rootDir>/src/providers/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1'
  }
};
