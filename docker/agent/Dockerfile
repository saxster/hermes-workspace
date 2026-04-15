FROM python:3.11-slim

# Pin hermes-agent to a known-good commit.
# To bump: set HERMES_AGENT_SHA to the new commit SHA and rebuild with --no-cache.
ARG HERMES_AGENT_SHA=84e69d45658d8be2859f496dc57e11d18875f78d

RUN apt-get update \
    && apt-get install -y --no-install-recommends curl git \
    && rm -rf /var/lib/apt/lists/*

RUN git clone https://github.com/outsourc-e/hermes-agent.git /app \
    && cd /app \
    && git checkout "${HERMES_AGENT_SHA}"

WORKDIR /app

# Deterministic install: use the committed requirements.lock when present, falling back
# to editable install for dev builds.
RUN if [ -f requirements.lock ]; then \
        pip install --no-cache-dir -r requirements.lock && \
        pip install --no-cache-dir --no-deps -e . ; \
    else \
        echo "WARN: requirements.lock missing, falling back to non-deterministic install" && \
        pip install --no-cache-dir -e . ; \
    fi

EXPOSE 8642

CMD ["hermes", "gateway", "run"]
