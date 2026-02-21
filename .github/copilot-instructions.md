# Copilot Instructions

## Repository Overview

**Staff Engineer Auto** is a Node.js productivity and automation tool for software engineering workflows. It uses a modular design with three main modules:

- **`src/github_integration/`** – Authenticated GitHub API client helpers (create branches, read/write files, open PRs) built on `@octokit/rest` and `@octokit/app`.
- **`src/navigation/`** – Core navigation engine (Apple MapKit / CarPlay compliant, TTS voice guidance).
- **`src/hazard_detection/`** – AI-driven hazard detection module.

## Tech Stack

- **Runtime:** Node.js with ES Modules (`"type": "module"` in `package.json`).
- **Test framework:** Jest (`node --experimental-vm-modules`) — all tests live in `tests/`.
- **Dependencies:** `@octokit/app`, `@octokit/rest`.

## Development Workflow

1. **Install dependencies:** `npm install`
2. **Run tests:** `npm test`
3. No separate lint or build step is configured; keep code style consistent with existing files.

## Coding Conventions

- Use **ES module** syntax (`import`/`export`) — never `require()`.
- All functions must have **JSDoc comments** documenting parameters and return types, matching the style in `src/github_integration/index.js`.
- Tests use `jest.unstable_mockModule` for ES module mocking; follow the pattern in `tests/github_integration.test.js`.
- Keep modules focused and side-effect-free; GitHub API calls belong in `src/github_integration/`.

## Key Files

| Path | Purpose |
|---|---|
| `src/github_integration/index.js` | GitHub API helper functions |
| `tests/github_integration.test.js` | Unit tests for GitHub integration |
| `.github/workflows/ci.yml` | CI pipeline (runs on push and PR) |
| `MASTER_STATE.md` | Project milestone tracking |
