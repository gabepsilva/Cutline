# Agent loop

Polls `gh issue list --state open` every 30s.

When open issues exist:

1. **cursor-agent** (`--yolo`) — implement next issue, open PR, green CI (or write `abort` and exit)
2. **claude -p** (`--dangerously-skip-permissions`) — lead reviews latest PR, fixes, merges when CI green, checks deploy

```sh
./scripts/agent-loop/run.sh
```

`AGENT_LOOP_INTERVAL=60` — idle poll when no open issues.  
`AGENT_LOOP_CYCLE_PAUSE=60` — pause after each implementer + lead cycle (default 60s).

Lead failures are logged but do not stop the loop.
