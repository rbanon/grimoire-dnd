import pluginVue from 'eslint-plugin-vue'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default [
  {
    ignores: ['dist/**', 'node_modules/**', 'src/auto-imports.d.ts', 'src/components.d.ts'],
  },
  ...pluginVue.configs['flat/recommended'],
  {
    files: ['**/*.{ts,tsx,vue}'],
    languageOptions: {
      parser: (await import('vue-eslint-parser')).default,
      parserOptions: {
        parser: tsParser,
        extraFileExtensions: ['.vue'],
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'vue/multi-word-component-names': 'off',
      'vue/block-lang': 'off',
    },
  },
]
