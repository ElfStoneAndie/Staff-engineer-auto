import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';

/**
 * Creates an authenticated Octokit instance for a given installation.
 *
 * @param {object} config - GitHub App configuration
 * @param {string} config.appId - GitHub App ID
 * @param {string} config.privateKey - GitHub App private key (PEM)
 * @param {string|number} config.installationId - GitHub App installation ID
 * @returns {Promise<Octokit>} Authenticated Octokit instance
 */
export async function createInstallationClient(config) {
  const app = new App({
    appId: config.appId,
    privateKey: config.privateKey,
    Octokit,
  });
  return app.getInstallationOctokit(config.installationId);
}

/**
 * Creates an authenticated Octokit instance using a Personal Access Token (PAT).
 *
 * @param {string} token - GitHub Personal Access Token (GITHUB_TOKEN)
 * @returns {Octokit} Authenticated Octokit instance
 */
export function createPATClient(token) {
  return new Octokit({ auth: token });
}

/**
 * Lists the contents of a repository directory.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} [path=''] - Directory path within the repository
 * @returns {Promise<Array>} Array of content items
 */
export async function listContents(octokit, owner, repo, path = '') {
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path });
  return Array.isArray(data) ? data : [data];
}

/**
 * Reads a file from a repository and returns its decoded content.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path within the repository
 * @param {string} [ref] - Branch, tag, or commit SHA (optional)
 * @returns {Promise<string>} Decoded file content
 */
export async function readFile(octokit, owner, repo, path, ref) {
  const params = { owner, repo, path };
  if (ref) params.ref = ref;
  const { data } = await octokit.rest.repos.getContent(params);
  if (data.encoding === 'base64') {
    return Buffer.from(data.content, 'base64').toString('utf8');
  }
  return data.content;
}

/**
 * Creates or updates a file in a repository.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} path - File path within the repository
 * @param {string} content - File content (plain text)
 * @param {string} message - Commit message
 * @param {string} branch - Target branch
 * @param {string} [sha] - Existing file SHA (required when updating)
 * @returns {Promise<object>} Commit data from the API
 */
export async function writeFile(octokit, owner, repo, path, content, message, branch, sha) {
  const params = {
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content, 'utf8').toString('base64'),
    branch,
  };
  if (sha) params.sha = sha;
  const { data } = await octokit.rest.repos.createOrUpdateFileContents(params);
  return data;
}

/**
 * Creates a new branch from an existing ref.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} branchName - Name of the new branch
 * @param {string} fromRef - Existing branch or SHA to branch from
 * @returns {Promise<object>} Ref data for the created branch
 */
export async function createBranch(octokit, owner, repo, branchName, fromRef) {
  // Resolve the SHA of the source ref
  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo,
    ref: `heads/${fromRef}`,
  });
  const sha = refData.object.sha;

  const { data } = await octokit.rest.git.createRef({
    owner,
    repo,
    ref: `refs/heads/${branchName}`,
    sha,
  });
  return data;
}

/**
 * Creates a pull request.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {string} title - Pull request title
 * @param {string} head - Head branch (source)
 * @param {string} base - Base branch (target)
 * @param {string} body - Pull request description
 * @returns {Promise<object>} Pull request data
 */
export async function createPullRequest(octokit, owner, repo, title, head, base, body = '') {
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body,
  });
  return data;
}

/**
 * Requests reviewers for a pull request.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @param {string[]} [reviewers=[]] - GitHub usernames to request reviews from
 * @param {string[]} [teamReviewers=[]] - Team slugs to request reviews from
 * @returns {Promise<object>} Updated pull request data
 */
export async function requestReviewers(octokit, owner, repo, pullNumber, reviewers = [], teamReviewers = []) {
  const { data } = await octokit.rest.pulls.requestReviewers({
    owner,
    repo,
    pull_number: pullNumber,
    reviewers,
    team_reviewers: teamReviewers,
  });
  return data;
}

/**
 * Retrieves the combined check-run status for a pull request's head commit.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @returns {Promise<{state: string, checks: Array}>} Combined status and individual check runs
 */
export async function getPullRequestChecks(octokit, owner, repo, pullNumber) {
  const { data: pr } = await octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber });
  const ref = pr.head.sha;
  const { data } = await octokit.rest.checks.listForRef({ owner, repo, ref });
  const checks = data.check_runs;
  const allSuccess = checks.length > 0 && checks.every(
    (c) => c.status === 'completed' && c.conclusion === 'success',
  );
  const anyFailure = checks.some((c) => c.conclusion === 'failure');
  let state;
  if (allSuccess) {
    state = 'success';
  } else if (anyFailure) {
    state = 'failure';
  } else {
    state = 'pending';
  }
  return { state, checks };
}

/**
 * Merges a pull request.
 *
 * @param {Octokit} octokit - Authenticated Octokit instance
 * @param {string} owner - Repository owner
 * @param {string} repo - Repository name
 * @param {number} pullNumber - Pull request number
 * @param {string} [mergeMethod='merge'] - Merge method: 'merge', 'squash', or 'rebase'
 * @param {string} [commitTitle] - Title for the merge commit (optional)
 * @returns {Promise<object>} Merge result data
 */
export async function mergePullRequest(octokit, owner, repo, pullNumber, mergeMethod = 'merge', commitTitle) {
  const params = {
    owner,
    repo,
    pull_number: pullNumber,
    merge_method: mergeMethod,
  };
  if (commitTitle) params.commit_title = commitTitle;
  const { data } = await octokit.rest.pulls.merge(params);
  return data;
}
