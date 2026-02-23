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
  listPullRequests,
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
      list: jest.fn(),
      merge: jest.fn(),
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
// listPullRequests
// ---------------------------------------------------------------------------
describe('listPullRequests', () => {
  it('returns open pull requests by default', async () => {
    const prs = [{ number: 1 }, { number: 2 }];
    mockOctokit.rest.pulls.list.mockResolvedValue({ data: prs });

    const result = await listPullRequests(mockOctokit, 'owner', 'repo');

    expect(mockOctokit.rest.pulls.list).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      state: 'open',
    });
    expect(result).toBe(prs);
  });

  it('passes the given state filter', async () => {
    mockOctokit.rest.pulls.list.mockResolvedValue({ data: [] });

    await listPullRequests(mockOctokit, 'owner', 'repo', 'closed');

    expect(mockOctokit.rest.pulls.list).toHaveBeenCalledWith({
      owner: 'owner',
      repo: 'repo',
      state: 'closed',
    });
  });
});

// ---------------------------------------------------------------------------
// mergePullRequest
// ---------------------------------------------------------------------------
describe('mergePullRequest', () => {
  it('merges a pull request with the default merge method', async () => {
    const mergeData = { merged: true, message: 'Pull Request successfully merged' };
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

  it('passes the specified merge method', async () => {
    mockOctokit.rest.pulls.merge.mockResolvedValue({ data: {} });

    await mergePullRequest(mockOctokit, 'owner', 'repo', 3, 'squash');

    const callArg = mockOctokit.rest.pulls.merge.mock.calls[0][0];
    expect(callArg.merge_method).toBe('squash');
  });
});
