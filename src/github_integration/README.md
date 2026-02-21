# GitHub App Integration

This module provides a GitHub App client for interacting with GitHub repositories programmatically using the [`@octokit/app`](https://github.com/octokit/app.js) and [`@octokit/rest`](https://github.com/octokit/rest.js) libraries.

## Environment Variables

Set the following variables in your environment (see `config/environment.template`):

| Variable | Description |
|---|---|
| `GITHUB_TOKEN` | Personal Access Token for PAT-based authentication |
| `GITHUB_APP_ID` | The numeric ID of your GitHub App |
| `GITHUB_APP_PRIVATE_KEY` | The PEM-encoded private key for your GitHub App |
| `GITHUB_APP_INSTALLATION_ID` | The installation ID for the target repository/org |
| `GITHUB_APP_WEBHOOK_SECRET` | The webhook secret configured for your GitHub App |

## API

### `createPATClient(token)`

Returns an authenticated `Octokit` instance using a Personal Access Token.

```js
import { createPATClient } from './src/github_integration/index.js';

const octokit = createPATClient(process.env.GITHUB_TOKEN);
```

### `createInstallationClient(config)`

Returns an authenticated `Octokit` instance scoped to a specific installation.

```js
import { createInstallationClient } from './src/github_integration/index.js';

const octokit = await createInstallationClient({
  appId: process.env.GITHUB_APP_ID,
  privateKey: process.env.GITHUB_APP_PRIVATE_KEY,
  installationId: process.env.GITHUB_APP_INSTALLATION_ID,
});
```

### `listContents(octokit, owner, repo, path)`

Lists the contents of a directory in a repository.

```js
const items = await listContents(octokit, 'owner', 'repo', 'src');
```

### `readFile(octokit, owner, repo, path, ref?)`

Reads and returns the decoded text content of a file.

```js
const content = await readFile(octokit, 'owner', 'repo', 'README.md');
```

### `writeFile(octokit, owner, repo, path, content, message, branch, sha?)`

Creates or updates a file with the given content. Pass the existing file SHA when updating.

```js
await writeFile(octokit, 'owner', 'repo', 'docs/note.md', '# Note', 'Add note', 'main');
```

### `createBranch(octokit, owner, repo, branchName, fromRef)`

Creates a new branch from an existing branch or SHA.

```js
await createBranch(octokit, 'owner', 'repo', 'feature/my-feature', 'main');
```

### `createPullRequest(octokit, owner, repo, title, head, base, body?)`

Opens a pull request from `head` into `base`.

```js
await createPullRequest(octokit, 'owner', 'repo', 'My PR', 'feature/my-feature', 'main', 'Description');
```

## Setting Up a Personal Access Token (PAT)

1. Go to **Settings → Developer settings → Personal access tokens** and click **Generate new token**.
2. Select the required scopes: `repo` (for private repos) or `public_repo` (for public repos).
3. Copy the generated token and set it as `GITHUB_TOKEN` in your environment.
4. Use `createPATClient(process.env.GITHUB_TOKEN)` to obtain an authenticated client.

## Setting Up a GitHub App

1. Go to **Settings → Developer settings → GitHub Apps** and click **New GitHub App**.
2. Set the required permissions (Contents: Read & Write, Pull requests: Read & Write).
3. Generate and download a private key.
4. Install the app on the target repository/organization to obtain an installation ID.
5. Populate the environment variables above with the values from your app.
