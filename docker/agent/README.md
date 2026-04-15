# hermes-agent Docker image

## Deterministic builds

The Dockerfile pins two things for reproducibility:

1. **`HERMES_AGENT_SHA`** — commit SHA checked out from the hermes-agent repo. Bumping requires editing the Dockerfile.
2. **`requirements.lock`** — fully-resolved Python dependency set with hashes. Produced in the hermes-agent repo by `uv pip compile pyproject.toml -o requirements.lock --generate-hashes`.

If `requirements.lock` is absent in the checked-out tree, the image falls back to editable install with version ranges — non-deterministic and a warning is printed.

## Bumping the pinned SHA

```bash
# 1. Pick a commit in hermes-agent
cd ../../hermes-agent && git log -1 --format=%H

# 2. Update Dockerfile
sed -i '' "s/^ARG HERMES_AGENT_SHA=.*/ARG HERMES_AGENT_SHA=<NEW_SHA>/" docker/agent/Dockerfile

# 3. Regenerate lockfile
cd ../hermes-agent
uv pip compile pyproject.toml -o requirements.lock --generate-hashes
git add pyproject.toml requirements.lock && git commit -m "chore: bump requirements.lock"

# 4. Rebuild image
docker compose build --no-cache agent
```

## Verifying determinism

Building the same SHA twice should produce byte-identical layer digests for the `pip install` step:

```bash
docker compose build --no-cache agent | tee build1.log
docker compose build --no-cache agent | tee build2.log
# Compare the sha256 of the pip-install layer in each log.
```
