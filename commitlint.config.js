module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    // Type must be one of these values
    'type-enum': [
      2,
      'always',
      [
        'feat', // New feature
        'fix', // Bug fix
        'docs', // Documentation
        'style', // Code style (formatting, missing semicolons, etc.)
        'refactor', // Code refactoring
        'test', // Adding or modifying tests
        'chore', // Maintenance tasks
        'revert', // Reverting changes
        'ci', // CI/CD changes
        'build', // Build system changes
        'perf', // Performance improvements
      ],
    ],

    // Scope should be one of these values (warning only)
    'scope-enum': [
      1,
      'always',
      [
        'client',
        'server',
        'engine',
        'rules',
        'board',
        'player',
        'bot',
        'ui',
        'auth',
        'socket',
        'db',
        'ci',
        'docs',
        'deps',
      ],
    ],

    // Subject must be lowercase
    'subject-case': [2, 'always', 'lower-case'],

    // Subject cannot be empty
    'subject-empty': [2, 'never'],

    // Subject max length
    'subject-max-length': [2, 'always', 72],

    // Body line max length (warning)
    'body-max-line-length': [1, 'always', 100],

    // Header max length
    'header-max-length': [2, 'always', 100],

    // Type cannot be empty
    'type-empty': [2, 'never'],

    // Type must be lowercase
    'type-case': [2, 'always', 'lower-case'],
  },

  // Help message for invalid commits
  helpUrl:
    'https://www.conventionalcommits.org/en/v1.0.0/',
};
