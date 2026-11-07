// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt({
  rules: {
    'vue/multi-word-component-names': 'off',
    'vue/no-v-html': 'error',
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
}, {
  files: ['scripts/**'],
  rules: { 'no-console': 'off' },
}, {
  // Composants d'interface copiés/adaptés de shadcn-vue : leurs props optionnelles n'ont pas de valeur par défaut.
  files: ['app/components/ui/**'],
  rules: { 'vue/require-default-prop': 'off' },
})
