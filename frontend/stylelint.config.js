import stylelintConfigStandard from 'stylelint-config-standard';

export default {
  ...stylelintConfigStandard,
  rules: {
    ...stylelintConfigStandard.rules,
    'at-rule-no-unknown': [
      true,
      {
        ignoreAtRules: [
          'import',
          'layer',
          'theme',
          'tailwind',
          'config',
          'responsive',
          'variants',
          'keyframes',
        ],
      },
    ],
  },
};
