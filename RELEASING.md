# Releasing

This repo is source-only; there are no versioned binary artifacts.

1. Merge fixes on `main` with CI green (`web` build, `api` pytest, `e2e` when applicable).
2. Summarize user-visible changes in the merge commit or a short note for your fork.
3. For deployments, pin Docker image digests or git SHAs in your environment; keep `DATABASE_URL`, `DATA_DIR`, and optional `MDCHAT_API_WRITE_KEY` out of git.

Optional tags: `git tag -a v0.x.y -m "Describe change"` and push tags on your fork if preferred.
