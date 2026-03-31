# Contributing to Studio Post

Thank you for your interest in contributing! This guide will help you get started.

## Development Setup

### Prerequisites

- Node.js 18.17+
- pnpm 8+
- A Firebase project (free Spark plan is sufficient for development)
- Google AI API key (Gemini)
- OpenAI API key

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/studio-post.git
cd studio-post

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local
# Fill in your Firebase + API keys in .env.local

# Start the dev server
pnpm dev
```

## Making Changes

### Branch Naming

- `feature/description` — New features
- `fix/description` — Bug fixes
- `docs/description` — Documentation changes
- `refactor/description` — Code refactoring

### Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add brand kit color picker
fix: resolve carousel slide ordering bug
docs: update API reference for variations endpoint
style: format constants file
refactor: extract pricing logic to utility
perf: optimize Firestore queries with composite indexes
chore: update dependencies
```

### Code Guidelines

1. **TypeScript strict mode** — avoid `any` types
2. **App Router patterns** — use `'use client'` only where needed
3. **shadcn/ui components** — reuse from `src/components/ui/` before adding new ones
4. **Tailwind CSS** — utility-first, no custom CSS files
5. **Firestore CRUD** — route all operations through `src/lib/creative-service.ts`
6. **State management** — use the `useCreative()` hook for generation logic
7. **File naming** — kebab-case for files, PascalCase for components, camelCase for functions

### Before Submitting

```bash
# Ensure the project builds without errors
pnpm build

# Run linting
pnpm lint
```

## Pull Request Process

1. Fork the repository
2. Create your branch from `main`
3. Make your changes
4. Ensure `pnpm build` and `pnpm lint` pass
5. Push to your fork
6. Open a Pull Request against `main`
7. Fill out the PR template with a clear description
8. Wait for review

## Reporting Issues

Use [GitHub Issues](../../issues) with the following templates:

### Bug Report

- Steps to reproduce
- Expected behavior
- Actual behavior
- Environment (OS, browser, Node version)
- Screenshots if applicable

### Feature Request

- Clear description of the feature
- Use case / motivation
- Proposed implementation (optional)

## Code of Conduct

Be respectful and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.
