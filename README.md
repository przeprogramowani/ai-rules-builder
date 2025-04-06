# 10xRules.ai by 10xDevs

<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->

[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors-)

<!-- ALL-CONTRIBUTORS-BADGE:END -->

[![Build and Deploy](https://github.com/przeprogramowani/ai-rules-builder/actions/workflows/master.yml/badge.svg)](https://github.com/przeprogramowani/ai-rules-builder/actions/workflows/master.yml)

![](./public/demo.png)

👉 [10xRules.ai](https://10xrules.ai)

Create so called "rules for AI" written in Markdown, used by tools such as GitHub Copilot, Cursor and Windsurf, through an interactive, visual interface.

## Features

- **Build AI Rules:** Create customized rule sets for different editors (Copilot, Cursor, Windsurf)
- **Export Options:** Easily copy to clipboard or download as markdown files
- **Smart Import:** Automatically generate rules by dropping package.json or requirements.txt files

## Getting Started

1. **Installation**

   ```bash
   npm install
   ```

2. **Development**

   ```bash
   npm run dev
   ```

3. **Build**
   ```bash
   npm run build
   ```

## Tech Stack

- Astro 5
- TypeScript 5
- React 18.3
- Tailwind 4
- Zustand
- Lucide React

### Testing

This project uses a comprehensive testing stack including unit tests and end-to-end tests.

### Unit Testing with Vitest

Unit tests are implemented using Vitest with JSDOM for browser environment simulation and React Testing Library for component testing.

Available commands:

```bash
# Run unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### End-to-End Testing with Playwright

E2E tests are implemented using Playwright with the Page Object Model pattern for maintainable tests.

Available commands:

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with UI
npm run test:e2e:ui

# Generate test code with codegen
npm run test:e2e:codegen
```

### Test Structure

- `tests/unit/` - Unit tests
- `tests/setup/` - Test setup files
- `e2e/` - End-to-end tests
- `e2e/page-objects/` - Page Object Model classes
- `e2e/fixtures/` - Test fixtures and data

### CI/CD Integration

Tests are automatically run in the CI/CD pipeline using GitHub Actions. See `.github/workflows/tests.yml` for configuration.

## Contributions

Send updates to:

- `src/data/dictionaries.ts`
- `src/data/rules/...`

Important: Introduce translations for new rules in `src/i18n/translations.ts`, otherwise the unit test will fail.

## How to Write Effective Rules

When contributing new rules, please:

- **Be specific:** "Use React.memo for expensive components" not "Optimize components"
- **Make it actionable:** Provide clear guidance that can be immediately applied
- **Include placeholders:** Use `{{placeholder_text}}` for project-specific values
- **Follow conventions:** Match the style and structure of existing rules
- **Focus on best practices:** Rules should represent industry standards, not personal preferences

See examples in `src/data/rules/` directory for each technology stack.

---

[10xDevs](https://10xdevs.pl) - launching soon 🚀

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/damianidczak"><img src="https://avatars.githubusercontent.com/u/21343496?v=4?s=100" width="100px;" alt="Damian"/><br /><sub><b>Damian</b></sub></a><br /><a href="https://github.com/przeprogramowani/ai-rules-builder/commits?author=damianidczak" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/pawel-twardziak"><img src="https://avatars.githubusercontent.com/u/180847852?v=4?s=100" width="100px;" alt="pawel-twardziak"/><br /><sub><b>pawel-twardziak</b></sub></a><br /><a href="https://github.com/przeprogramowani/ai-rules-builder/commits?author=pawel-twardziak" title="Code">💻</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dudziakm"><img src="https://avatars.githubusercontent.com/u/10773170?v=4?s=100" width="100px;" alt="Michal Dudziak"/><br /><sub><b>Michal Dudziak</b></sub></a><br /><a href="#maintenance-dudziakm" title="Maintenance">🚧</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://www.linkedin.com/in/artur-laskowski94"><img src="https://avatars.githubusercontent.com/u/92392161?v=4?s=100" width="100px;" alt="Artur Laskowski"/><br /><sub><b>Artur Laskowski</b></sub></a><br /><a href="https://github.com/przeprogramowani/ai-rules-builder/commits?author=arturlaskowski" title="Code">💻</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

We're recognizing all contributors with [all-contributors](https://github.com/all-contributors/all-contributors). Feel invited to collaborate!
