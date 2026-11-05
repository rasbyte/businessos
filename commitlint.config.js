export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'scope-enum': [
      2,
      'always',
      ['api', 'web', 'database', 'contracts', 'config', 'docs', 'infra', 'ci', 'deps'],
    ],
  },
};
