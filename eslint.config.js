import pluginVue from 'eslint-plugin-vue'
import globals from 'globals'

export default [
    ...pluginVue.configs['flat/recommended'],
    {
        root: true,
        env: {
            node: true,
        },
        extends: ['plugin:vue/base', 'plugin:vue/vue3-recommended', 'plugin:vue/vue3-essential', 'plugin:vue/vue3-strongly-recommended', 'eslint:recommended', 'prettier'],
        parserOptions: {
            parser: '@babel/eslint-parser',
            requireConfigFile: false,
        },
        ignorePatterns: ['**/lib/*.*'],
        rules: {
            'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
            'no-debugger': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
            'vue/attribute-hyphenation': 'off',
            'no-unused-vars': 'warn',
            'vue/v-on-event-hyphenation': 'warn',
            'vue/no-v-html': 'warn',
            'vue/prop-name-casing': 'warn',
            'vue/attributes-order': 'error',
            'vue/no-template-shadow': 'error',
            'vue/require-default-prop': 'error',
            'vue/require-explicit-emits': 'error',
            'vue/first-attribute-linebreak': 'error',
            'vue/define-macros-order': 'error',
            'vue/component-api-style': 'error',
            'vue/component-name-in-template-casing': 'error',
            'vue/custom-event-name-casing': 'error',
            'vue/no-restricted-props': 'error',
            'vue/camelcase': 'warn',
            'vue/multi-word-component-names': [
                'error',
                {
                    ignores: ['index'],
                },
            ],
        },
        languageOptions: {
            sourceType: 'module',
            globals: {
                ...globals.browser
            }
        }
    }
]
