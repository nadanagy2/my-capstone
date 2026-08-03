# CLAUDE.md

Guidance for Claude Code (or any AI assistant) working in this repository.

## Project overview

This is the capstone project for a frontend development internship track.
It's a frontend web application scaffolded with Vite + React.

## Tech stack

- **Framework:** React (JavaScript)
- **Build tool:** Vite
- **Package manager:** npm
- **Styling:** (fill in once decided — e.g. CSS Modules, Tailwind, plain CSS)
- **Linting/formatting:** ESLint (selected during Vite scaffolding)
- **Testing:** (fill in once decided — e.g. Vitest + React Testing Library)

## Commands

- `npm install` — install dependencies
- `npm run dev` — start local dev server
- `npm run build` — production build
- `npm run preview` — preview the production build locally
- `npm run lint` — run ESLint

## Conventions

- **Commits:** follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/)
  format — `type(scope): description`. Common types: `feat`, `fix`, `docs`,
  `chore`, `refactor`, `test`, `style`.
- **Components:** one component per file, PascalCase filenames
  (e.g. `Navbar.jsx`), colocate component-specific styles/tests.
- **Branches:** short-lived feature branches off `main`, named
  `feature/short-description` or `fix/short-description`.
- **Code style:** prefer functional components and hooks over class
  components; keep components small and focused; avoid inline styles unless
  trivial.

## Notes for the AI assistant

- Prefer minimal, incremental diffs over large rewrites.
- When adding a dependency, explain why it's needed before installing.
- When editing README.md or docs, keep language clear and beginner-friendly —
  this repo is also a learning artifact for the internship track.
- Always propose the commit message in Conventional Commits format after
  completing a task.

## Rules learned from the Round 1 vs Round 2 prompting drill

- Every form component must ship with at least one test covering an invalid-input
  case (empty required field, malformed value). Round 1's form had zero
  validation and zero tests — it "saved" any input, including a blank form.
- Forms use react-hook-form + zod for validation; never rely on a submit
  handler that saves state unconditionally.
- Every invalid form field must have both a visible inline error message and
  aria-invalid + aria-describedby set — Round 1 had neither.