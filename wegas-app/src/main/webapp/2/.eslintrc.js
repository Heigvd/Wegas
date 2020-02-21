module.exports = {
  root: true,
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'prettier',
    'prettier/@typescript-eslint',
    'prettier/react',
  ],
  plugins: ['react-hooks'],
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  settings: {
    react: {
      version: '16.8',
    },
  },
  env: { browser: true, es6: true },
  rules: {
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    'no-console': 'warn',
    'no-alert': 'error',
    'no-var': 'error',
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-param-reassign': 'error',
    'prefer-const': 'error',
    'linebreak-style': ['error', 'unix'],
    'react/no-unescaped-entities': 'off',
    'react/prop-types': 'off',
    'react/no-unsafe': ['error', { checkAliases: true }],
    // eslint@6.8.0
    '@typescript-eslint/ban-ts-ignore': 'off',
    '@typescript-eslint/no-inferrable-types': 'off',
  },
  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 2018,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
        warnOnUnsupportedTypeScriptVersion: true,
      },
      rules: {
        'no-undef': 'off',
        '@typescript-eslint/explicit-function-return-type': 'off',
        '@typescript-eslint/no-non-null-assertion': 'off',
        '@typescript-eslint/no-unused-vars': 'off',
        '@typescript-eslint/explicit-member-accessibility': 'off',
        '@typescript-eslint/interface-name-prefix': 'off',
        '@typescript-eslint/no-use-before-define': 'off',
        '@typescript-eslint/camelcase': 'off',
        '@typescript-eslint/no-object-literal-type-assertion': 'off',
      },
    },
    {
      files: ['*.spec.ts', '*.spec.tsx'],
      env: {
        node: true,
        jest: true,
      },
    },
  ],
};
