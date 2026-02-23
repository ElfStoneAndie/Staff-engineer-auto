"""
PR Agent — autonomous pull-request handler.

Triggered hourly by the pr_agent GitHub Actions workflow (or manually via
workflow_dispatch).  For every open pull request the agent:

1. Fetches the combined CI status / check-run conclusions for the head SHA.
2. Ensures the correct label is applied:
   - ``ci-passing``   — all required checks succeeded.
   - ``ci-failing``   — at least one check failed.
   - ``needs-review`` — no check runs reported yet (new PR).
3. Posts (or updates) a single bot-status comment that summarises the PR
   state so reviewers can act at a glance.
4. Auto-merges (squash) PRs that carry the ``auto-merge`` label AND have
   all checks passing.

Environment variables (injected by the workflow):
    GITHUB_TOKEN       — token with ``repo`` scope.
    GITHUB_REPOSITORY  — ``owner/repo`` string (e.g. ``octocat/hello-world``).
"""

from __future__ import annotations

import os
import sys
import json
import urllib.request
import urllib.error

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
_TOKEN = os.environ.get("GITHUB_TOKEN", "")
_REPO = os.environ.get("GITHUB_REPOSITORY", "")
_API = "https://api.github.com"
_BOT_COMMENT_MARKER = "<!-- pr-agent-bot -->"

_LABEL_PASSING = "ci-passing"
_LABEL_FAILING = "ci-failing"
_LABEL_NEEDS_REVIEW = "needs-review"
_LABEL_AUTO_MERGE = "auto-merge"
_CI_LABELS = {_LABEL_PASSING, _LABEL_FAILING, _LABEL_NEEDS_REVIEW}


# ---------------------------------------------------------------------------
# HTTP helpers
# ---------------------------------------------------------------------------

def _headers() -> dict:
    return {
        "Authorization": f"Bearer {_TOKEN}",
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "pr-agent-bot/1.0",
    }


def _request(method: str, path: str, body: dict | None = None) -> dict | list | None:
    url = f"{_API}{path}"
    data = json.dumps(body).encode() if body is not None else None
    req = urllib.request.Request(url, data=data, headers=_headers(), method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw else None
    except urllib.error.HTTPError as exc:
        raw = exc.read()
        print(f"  HTTP {exc.code} {method} {url}: {raw.decode(errors='replace')}", file=sys.stderr)
        return None


def _get(path: str) -> dict | list | None:
    return _request("GET", path)


def _post(path: str, body: dict) -> dict | None:
    return _request("POST", path, body)


def _patch(path: str, body: dict) -> dict | None:
    return _request("PATCH", path, body)


def _put(path: str, body: dict) -> dict | None:
    return _request("PUT", path, body)


def _delete(path: str) -> None:
    _request("DELETE", path)


# ---------------------------------------------------------------------------
# Label helpers
# ---------------------------------------------------------------------------

def _ensure_label_exists(label: str, color: str) -> None:
    result = _get(f"/repos/{_REPO}/labels/{label}")
    if result is None:
        _post(f"/repos/{_REPO}/labels", {"name": label, "color": color})


def _current_labels(pr: dict) -> set:
    return {lbl["name"] for lbl in pr.get("labels", [])}


def _set_ci_label(pr_number: int, existing: set, new_label: str) -> None:
    stale = existing & _CI_LABELS - {new_label}
    for lbl in stale:
        _delete(f"/repos/{_REPO}/issues/{pr_number}/labels/{lbl}")
    if new_label not in existing:
        _post(f"/repos/{_REPO}/issues/{pr_number}/labels", {"labels": [new_label]})


# ---------------------------------------------------------------------------
# CI status helpers
# ---------------------------------------------------------------------------

def _ci_status(sha: str) -> str:
    """Return 'passing', 'failing', or 'pending' for the given commit SHA."""
    result = _get(f"/repos/{_REPO}/commits/{sha}/check-runs?per_page=100")
    if result is None:
        return "pending"
    runs = result.get("check_runs", [])
    if not runs:
        return "pending"
    # If any run is still in progress, CI has not completed yet.
    if any(r.get("status") != "completed" for r in runs):
        return "pending"
    conclusions = {r.get("conclusion") for r in runs if r.get("conclusion")}
    if not conclusions:
        return "pending"
    if "failure" in conclusions or "timed_out" in conclusions or "cancelled" in conclusions:
        return "failing"
    if all(c in {"success", "neutral", "skipped"} for c in conclusions):
        return "passing"
    return "pending"


# ---------------------------------------------------------------------------
# Comment helpers
# ---------------------------------------------------------------------------

def _bot_comment_id(pr_number: int) -> int | None:
    comments = _get(f"/repos/{_REPO}/issues/{pr_number}/comments")
    if not isinstance(comments, list):
        return None
    for c in comments:
        if _BOT_COMMENT_MARKER in c.get("body", ""):
            return c["id"]
    return None


def _upsert_comment(pr_number: int, body: str) -> None:
    full_body = f"{_BOT_COMMENT_MARKER}\n{body}"
    comment_id = _bot_comment_id(pr_number)
    if comment_id:
        _patch(f"/repos/{_REPO}/issues/comments/{comment_id}", {"body": full_body})
    else:
        _post(f"/repos/{_REPO}/issues/{pr_number}/comments", {"body": full_body})


# ---------------------------------------------------------------------------
# Core PR handling
# ---------------------------------------------------------------------------

def _handle_pr(pr: dict) -> None:
    number = pr["number"]
    title = pr["title"]
    sha = pr["head"]["sha"]
    current = _current_labels(pr)

    print(f"  PR #{number}: {title}")

    status = _ci_status(sha)
    print(f"    CI status: {status}")

    label_map = {
        "passing": _LABEL_PASSING,
        "failing": _LABEL_FAILING,
        "pending": _LABEL_NEEDS_REVIEW,
    }
    target_label = label_map[status]
    _set_ci_label(number, current, target_label)

    status_icon = {"passing": "✅", "failing": "❌", "pending": "⏳"}[status]
    comment = (
        f"**Automated PR Status** {status_icon}\n\n"
        f"| Field | Value |\n"
        f"|---|---|\n"
        f"| PR | #{number} |\n"
        f"| Head SHA | `{sha[:7]}` |\n"
        f"| CI Status | **{status}** |\n"
        f"| Label applied | `{target_label}` |\n\n"
        f"*Updated automatically by the PR agent.*"
    )
    _upsert_comment(number, comment)

    if status == "passing" and _LABEL_AUTO_MERGE in current:
        print(f"    Auto-merging PR #{number} (squash)…")
        merge_result = _put(
            f"/repos/{_REPO}/pulls/{number}/merge",
            {"merge_method": "squash", "commit_title": f"Auto-merge PR #{number}: {title}"},
        )
        if merge_result and merge_result.get("merged"):
            print(f"    PR #{number} merged successfully.")
        else:
            msg = merge_result.get("message", "unknown error") if isinstance(merge_result, dict) else "no response"
            print(f"    Auto-merge failed for PR #{number}: {msg}", file=sys.stderr)


def main() -> None:
    if not _TOKEN:
        print("GITHUB_TOKEN is not set — aborting.", file=sys.stderr)
        sys.exit(1)
    if not _REPO:
        print("GITHUB_REPOSITORY is not set — aborting.", file=sys.stderr)
        sys.exit(1)

    print(f"PR Agent running for {_REPO}")

    # Ensure CI labels exist in the repo.
    _ensure_label_exists(_LABEL_PASSING, "0e8a16")
    _ensure_label_exists(_LABEL_FAILING, "d73a4a")
    _ensure_label_exists(_LABEL_NEEDS_REVIEW, "e4e669")

    prs: list = []
    page = 1
    while True:
        page_data = _get(f"/repos/{_REPO}/pulls?state=open&per_page=100&page={page}")
        if not isinstance(page_data, list):
            print("Failed to fetch open PRs.", file=sys.stderr)
            sys.exit(1)
        prs.extend(page_data)
        if len(page_data) < 100:
            break
        page += 1

    print(f"Found {len(prs)} open PR(s).")
    for pr in prs:
        _handle_pr(pr)

    print("PR Agent done.")


if __name__ == "__main__":
    main()
