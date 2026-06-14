import coreWebVitals from 'eslint-config-next/core-web-vitals'
import typescript from 'eslint-config-next/typescript'

/**
 * ESLint 9 flat config. Uses eslint-config-next's native flat exports directly
 * (Next 16) instead of FlatCompat — the compat shim throws a circular-JSON error
 * under ESLint 9.x. `next lint` was removed in Next 16, so package.json runs the
 * ESLint CLI (`eslint .`) against this config.
 */
const eslintConfig = [
  { ignores: ['.next/**', 'node_modules/**', 'next-env.d.ts'] },
  ...coreWebVitals,
  ...typescript,
  {
    rules: {
      // Allow intentional unused args/vars when prefixed with `_` (placeholder
      // params in API stubs, etc.) — standard convention.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
    },
  },
]

export default eslintConfig
