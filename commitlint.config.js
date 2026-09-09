module.exports = {
  // Inherit base rules from Conventional Commits
  extends: ['@commitlint/config-conventional'],

  // Custom parser to define commit header format
  parserPreset: {
    parserOpts: {
      // Regex to parse commit message
      // Format: <type>(<scope>): <subject>
      // Example: feat(auth): add login functionality with JWT
      headerPattern: /^(\w+)\(([^)]+)\): (.*)$/,

      // Map regex capture groups to commitlint fields
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },

  // Commit message enforcement rules
  rules: {
    // Allowed commit types
    // feat, fix, docs, style, refactor, test, chore, revert
    'type-enum': [
      2, // level 2 = error (reject commit if invalid)
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'test', 'chore', 'revert'],
    ],
    // Header minimum length of 10 characters
    'header-min-length': [2, 'always', 10],

    // Header maximum length of 160 characters
    'header-max-length': [2, 'always', 160],

    // Body max line length of 120 characters
    'body-max-line-length': [2, 'always', 120],

    // Subject casing (off)
    'subject-case': [
      0, // off
      'never',
      ['sentence-case', 'start-case', 'pascal-case', 'upper-case'],
    ],
  },
};
