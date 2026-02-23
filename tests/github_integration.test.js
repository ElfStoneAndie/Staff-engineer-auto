import { jest, beforeEach, describe, it, expect } from '@jest/globals';

// ---------------------------------------------------------------------------
// Shared mock octokit instance (mutated per test via buildRestMocks helper)
// ---------------------------------------------------------------------------
const mockOctokit = {};
const mockGetInstallationOctokit = jest.fn().mockResolvedValue(mockOctokit);
const MockApp = jest.fn().mockImplementation(() => ({
  getInstallationOctokit: mockGetInstallationOctokit,
}));
const MockOctokit = jest.fn().mockImplementation(() => mockOctokit);

// Must be called before the module under test is imported
jest.unstable_mockModule('@octokit/app', () => ({ App: MockApp }));
jest.unstable_mockModule('@octokit/rest', () => ({ Octokit: MockOctokit }));

const {
  createInstallationClient,
  createPATClient,
  listContents,
  readFile,
  writeFile,
  createBranch,
  createPullRequest,
  requestReviewers,
  getPullRequestChecks,
  mergePullRequest,
} = await import('../src/github_integration/index.js');

// ---------------------------------------------------------------------------
// Helper – attach fresh REST mocks before each test
// ---------------------------------------------------------------------------
function buildRestMocks() {
  mockOctokit.rest = {
    repos: {
      getContent: jest.fn(),
      createOrUpdateFileContents: jest.fn(),
    },
    git: {
      getRef: jest.fn(),
      createRef: jest.fn(),
    },
    pulls: {
      create: jest.fn(),
      requestReviewers: jest.fn(),
      get: jest.fn(),
      merge: jest.fn(),
    },
    checks: {
      listForRef: jest.fn(),
    },
  };
}

beforeEach(() => {
  buildRestMocks();
  MockApp.mockClear();
  MockOctokit.mockClear();
  mockGetInstallationOctokit.mockClear();
});

// ---------------------------------------------------------------------------
// createInstallationClient
// ---------------------------------------------------------------------------
describe('createInstallationClient', () => {
  it('returns an authenticated Octokit instance', async () => {
    const config = { appId: '1', privateKey: 'pem', installationId: 42 };
    const client = await createInstallationClient(config);
    expect(MockApp).toHaveBeenCalledWith(
      expect.objectContaining({ appId: '1', privateKey: 'pem' }),
    );
    expect(client).toBe(mockOctokit);
  });
});

// ---------------------------------------------------------------------------
// createPATClient
// ---------------------------------------------------------------------------
describe('createPATClient', () => {
  it('returns an Octokit instance authenticated with the given token', () => {
    const client = createPATClient('my-token');
    expect(MockOctokit).toHaveBeenCalledWith({ auth: 'my-token' });
    expect(client).toBe(mockOctokit);
  });
});

// ---------------------------------------------------------------------------
// listContents
// ---------------------------------------------------------------------------
describe('listContents', () => {
  it('returns an array of items when the API returns an array', async () => {
    const items = [{ name: 'README.md' }, { name: 'src' }];
    mockOctokit.rest.repos.getContent.mockResolvedValue({ data: items });

    const result = await listContents(mockOctokit, 'owner', 'repo', '');
    expect(result).toEqual(items);
    expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: '',
    });
  });

  it('wraps a single file object in an array', async () => {
    const fileItem = { name: 'README.md', type: 'file' };
    mockOctokit.rest.repos.getContent.mockResolvedValue({ data: fileItem });

    const result = await listContents(mockOctokit, 'owner', 'repo', 'README.md');
    expect(result).toEqual([fileItem]);
  });
});

// ---------------------------------------------------------------------------
// readFile
// ---------------------------------------------------------------------------
describe('readFile', () => {
  it('decodes base64 content', async () => {
    const text = 'Hello, world!';
    mockOctokit.rest.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from(text).toString('base64'), encoding: 'base64' },
    });

    const result = await readFile(mockOctokit, 'owner', 'repo', 'README.md');
    expect(result).toBe(text);
  });

  it('returns content as-is when encoding is not base64', async () => {
    mockOctokit.rest.repos.getContent.mockResolvedValue({
      data: { content: 'raw content', encoding: 'utf-8' },
    });

    const result = await readFile(mockOctokit, 'owner', 'repo', 'file.txt');
    expect(result).toBe('raw content');
  });

  it('passes ref when provided', async () => {
    mockOctokit.rest.repos.getContent.mockResolvedValue({
      data: { content: Buffer.from('data').toString('base64'), encoding: 'base64' },
    });

    await readFile(mockOctokit, 'owner', 'repo', 'file.txt', 'my-branch');
    expect(mockOctokit.rest.repos.getContent).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      path: 'file.txt',
      ref: 'my-branch',
    });
  });
});

// ---------------------------------------------------------------------------
// writeFile
// ---------------------------------------------------------------------------
describe('writeFile', () => {
  it('creates a new file without sha', async () => {
    const commitData = { commit: { sha: 'abc123' } };
    mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({
      data: commitData,
    });

    const result = await writeFile(
      mockOctokit,
      'owner',
      'repo',
      'docs/note.md',
      '# Note',
      'Add note',
      'main',
    );

    expect(result).toBe(commitData);
    const callArg = mockOctokit.rest.repos.createOrUpdateFileContents.mock.calls[0][0];
    expect(callArg.sha).toBeUndefined();
    expect(callArg.content).toBe(Buffer.from('# Note').toString('base64'));
  });

  it('updates an existing file when sha is provided', async () => {
    mockOctokit.rest.repos.createOrUpdateFileContents.mockResolvedValue({ data: {} });

    await writeFile(
      mockOctokit,
      'owner',
      'repo',
      'docs/note.md',
      'Updated',
      'Update note',
      'main',
      'existingsha',
    );

    const callArg = mockOctokit.rest.repos.createOrUpdateFileContents.mock.calls[0][0];
    expect(callArg.sha).toBe('existingsha');
  });
});

// ---------------------------------------------------------------------------
// createBranch
// ---------------------------------------------------------------------------
describe('createBranch', () => {
  it('creates a branch from the given ref', async () => {
    mockOctokit.rest.git.getRef.mockResolvedValue({
      data: { object: { sha: 'deadbeef' } },
    });
    const refData = { ref: 'refs/heads/feature/x', object: { sha: 'deadbeef' } };
    mockOctokit.rest.git.createRef.mockResolvedValue({ data: refData });

    const result = await createBranch(mockOctokit, 'owner', 'repo', 'feature/x', 'main');

    expect(mockOctokit.rest.git.getRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'heads/main',
    });
    expect(mockOctokit.rest.git.createRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'refs/heads/feature/x',
      sha: 'deadbeef',
    });
    expect(result).toBe(refData);
  });
});

// ---------------------------------------------------------------------------
// createPullRequest
// ---------------------------------------------------------------------------
describe('createPullRequest', () => {
  it('creates a pull request with all fields', async () => {
    const prData = { number: 1, html_url: 'https://github.com/owner/repo/pull/1' };
    mockOctokit.rest.pulls.create.mockResolvedValue({ data: prData });

    const result = await createPullRequest(
      mockOctokit,
      'owner',
      'repo',
      'My PR',
      'feature/x',
      'main',
      'Description',
    );

    expect(mockOctokit.rest.pulls.create).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      title: 'My PR',
      head: 'feature/x',
      base: 'main',
      body: 'Description',
    });
    expect(result).toBe(prData);
  });

  it('defaults body to empty string when not provided', async () => {
    mockOctokit.rest.pulls.create.mockResolvedValue({ data: {} });

    await createPullRequest(mockOctokit, 'owner', 'repo', 'PR', 'feat', 'main');

    const callArg = mockOctokit.rest.pulls.create.mock.calls[0][0];
    expect(callArg.body).toBe('');
  });
});

// ---------------------------------------------------------------------------
// requestReviewers
// ---------------------------------------------------------------------------
describe('requestReviewers', () => {
  it('requests individual reviewers for a pull request', async () => {
    const prData = { number: 7, requested_reviewers: [{ login: 'alice' }] };
    mockOctokit.rest.pulls.requestReviewers.mockResolvedValue({ data: prData });

    const result = await requestReviewers(mockOctokit, 'owner', 'repo', 7, ['alice']);

    expect(mockOctokit.rest.pulls.requestReviewers).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 7,
      reviewers: ['alice'],
      team_reviewers: [],
    });
    expect(result).toBe(prData);
  });

  it('requests team reviewers for a pull request', async () => {
    mockOctokit.rest.pulls.requestReviewers.mockResolvedValue({ data: {} });

    await requestReviewers(mockOctokit, 'owner', 'repo', 3, [], ['core-team']);

    const callArg = mockOctokit.rest.pulls.requestReviewers.mock.calls[0][0];
    expect(callArg.team_reviewers).toEqual(['core-team']);
    expect(callArg.reviewers).toEqual([]);
  });

  it('defaults both reviewer lists to empty arrays', async () => {
    mockOctokit.rest.pulls.requestReviewers.mockResolvedValue({ data: {} });

    await requestReviewers(mockOctokit, 'owner', 'repo', 5);

    const callArg = mockOctokit.rest.pulls.requestReviewers.mock.calls[0][0];
    expect(callArg.reviewers).toEqual([]);
    expect(callArg.team_reviewers).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getPullRequestChecks
// ---------------------------------------------------------------------------
describe('getPullRequestChecks', () => {
  it('returns success state when all checks are completed successfully', async () => {
    mockOctokit.rest.pulls.get.mockResolvedValue({
      data: { head: { sha: 'abc123' } },
    });
    mockOctokit.rest.checks.listForRef.mockResolvedValue({
      data: {
        check_runs: [
          { status: 'completed', conclusion: 'success' },
          { status: 'completed', conclusion: 'success' },
        ],
      },
    });

    const result = await getPullRequestChecks(mockOctokit, 'owner', 'repo', 10);

    expect(mockOctokit.rest.pulls.get).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 10,
    });
    expect(mockOctokit.rest.checks.listForRef).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      ref: 'abc123',
    });
    expect(result.state).toBe('success');
    expect(result.checks).toHaveLength(2);
  });

  it('returns failure state when any check has failed', async () => {
    mockOctokit.rest.pulls.get.mockResolvedValue({
      data: { head: { sha: 'deadbeef' } },
    });
    mockOctokit.rest.checks.listForRef.mockResolvedValue({
      data: {
        check_runs: [
          { status: 'completed', conclusion: 'success' },
          { status: 'completed', conclusion: 'failure' },
        ],
      },
    });

    const result = await getPullRequestChecks(mockOctokit, 'owner', 'repo', 11);

    expect(result.state).toBe('failure');
  });

  it('returns pending state when checks are still running', async () => {
    mockOctokit.rest.pulls.get.mockResolvedValue({
      data: { head: { sha: 'cafebabe' } },
    });
    mockOctokit.rest.checks.listForRef.mockResolvedValue({
      data: {
        check_runs: [
          { status: 'in_progress', conclusion: null },
        ],
      },
    });

    const result = await getPullRequestChecks(mockOctokit, 'owner', 'repo', 12);

    expect(result.state).toBe('pending');
  });

  it('returns pending state when there are no checks', async () => {
    mockOctokit.rest.pulls.get.mockResolvedValue({
      data: { head: { sha: 'f00d' } },
    });
    mockOctokit.rest.checks.listForRef.mockResolvedValue({
      data: { check_runs: [] },
    });

    const result = await getPullRequestChecks(mockOctokit, 'owner', 'repo', 13);

    expect(result.state).toBe('pending');
    expect(result.checks).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// mergePullRequest
// ---------------------------------------------------------------------------
describe('mergePullRequest', () => {
  it('merges a pull request with the default merge method', async () => {
    const mergeData = { sha: 'mergesha', merged: true, message: 'Merged' };
    mockOctokit.rest.pulls.merge.mockResolvedValue({ data: mergeData });

    const result = await mergePullRequest(mockOctokit, 'owner', 'repo', 7);

    expect(mockOctokit.rest.pulls.merge).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      pull_number: 7,
      merge_method: 'merge',
    });
    expect(result).toBe(mergeData);
  });

  it('merges using squash method when specified', async () => {
    mockOctokit.rest.pulls.merge.mockResolvedValue({ data: {} });

    await mergePullRequest(mockOctokit, 'owner', 'repo', 8, 'squash');

    const callArg = mockOctokit.rest.pulls.merge.mock.calls[0][0];
    expect(callArg.merge_method).toBe('squash');
  });

  it('includes commit_title when provided', async () => {
    mockOctokit.rest.pulls.merge.mockResolvedValue({ data: {} });

    await mergePullRequest(mockOctokit, 'owner', 'repo', 9, 'squash', 'My squash commit');

    const callArg = mockOctokit.rest.pulls.merge.mock.calls[0][0];
    expect(callArg.commit_title).toBe('My squash commit');
  });

  it('omits commit_title when not provided', async () => {
    mockOctokit.rest.pulls.merge.mockResolvedValue({ data: {} });

    await mergePullRequest(mockOctokit, 'owner', 'repo', 10);

    const callArg = mockOctokit.rest.pulls.merge.mock.calls[0][0];
    expect(callArg.commit_title).toBeUndefined();
  });
});
