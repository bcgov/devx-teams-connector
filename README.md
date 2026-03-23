# Teams Connector PoC

Minimal TypeScript/Express proof-of-concept for posting notifications to Microsoft Teams via a Teams app bot using Bot Framework.

## Scope

Implemented:
- `POST /api/v1/messages`
- `POST /api/v1/messages/preview` (validate + render payload only, no Bot Framework delivery)
- `GET /api/v1/health`
- API key auth (Bearer token)
- Explicit `teamId + channelId` targeting
- Content kinds:
  - `text`
  - `template` with `template=generic|github_pull_request|github_workflow_run|sysdig|uptime|db_backup|argocd`

Deferred:
- Graph membership checks and cache
- Additional content kinds/templates

## Prerequisites

- Node.js 20+
- npm
- Working Teams bot credentials (`BOT_ID`, `BOT_SECRET`)
- Teams app already installed in the target team/channel

## Environment Setup

Create `.env` from `.env.example` and fill values:

```bash
cp .env.example .env
```

Required values:

- `CONNECTOR_API_KEY`
- `BOT_ID`
- `BOT_SECRET`

Optional/defaulted:

- `PORT` (default `3000`)
- `BOT_SERVICE_URL` (default `https://smba.trafficmanager.net/teams`)
- `TENANT_ID` or `BOT_TOKEN_TENANT` (default `botframework.com`; set this to your tenant ID for single-tenant bots)
- `LOG_LEVEL` (default `info`)

## Local Run

Install dependencies:

```bash
npm install
```

Run in dev mode:

```bash
npm run dev
```

Build and run production-style:

```bash
npm run build
npm start
```

## Docker

Build image:

```bash
docker build -t teams-connector-poc .
```

Run container:

```bash
docker run --rm -p 3000:3000 --env-file .env teams-connector-poc
```

### Docker Compose

Start with compose:

```bash
npm run compose:up
```

Stop and remove containers:

```bash
npm run compose:down
```

## API Examples

### Health

```bash
curl http://localhost:3000/api/v1/health
```

### Send text message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "text",
      "text": "<b>Test:</b> Deployment complete."
    }
  }'
```

### Preview payload without sending to Teams

```bash
curl -X POST http://localhost:3000/api/v1/messages/preview \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "sysdig",
      "data": {
        "severity": 1,
        "alertName": "CPU saturation"
      }
    }
  }'
```

### Send generic template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "generic",
      "data": {
        "title": "Maintenance Window",
        "severity": "warning",
        "body": "DB maintenance in 30 minutes.",
        "url": "https://status.example.com"
      }
    }
  }'
```

### Send GitHub PR template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "github_pull_request",
      "data": {
        "event": "opened",
        "title": "PR #123: Improve alert rendering",
        "repo": "bcgov/devx-teams-connector",
        "author": "octocat",
        "url": "https://github.com/bcgov/devx-teams-connector/pull/123",
        "body": "Adds support for additional adaptive card templates."
      }
    }
  }'
```

### Send GitHub workflow template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "github_workflow_run",
      "data": {
        "event": "completed",
        "conclusion": "failure",
        "workflow": "CI/CD Pipeline",
        "repo": "bcgov/devx-teams-connector",
        "branch": "main",
        "author": "octocat",
        "url": "https://github.com/bcgov/devx-teams-connector/actions/runs/123",
        "sha": "a1b2c3d"
      }
    }
  }'
```

### Send Sysdig template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "sysdig",
      "data": {
        "severity": 1,
        "alertName": "CPU saturation",
        "scope": "prod-cluster",
        "description": "Sustained CPU > 90% for 5 minutes",
        "timestamp": "2026-02-22T12:00:00Z",
        "url": "https://app.sysdig.com/#/alerts"
      }
    }
  }'
```

### Send uptime template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "uptime",
      "data": {
        "status": "down",
        "service": "payments-api",
        "downSince": "2026-02-22T11:40:00Z",
        "url": "https://status.example.com/payments-api"
      }
    }
  }'
```

### Send DB backup template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "db_backup",
      "data": {
        "status": "info",
        "projectName": "abc123",
        "projectFriendlyName": "My Project",
        "message": "Backup completed"
      }
    }
  }'
```

### Send Argo CD template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "teamId": "00000000-0000-0000-0000-000000000000",
      "channelId": "19:abc123@thread.tacv2"
    },
    "content": {
      "kind": "template",
      "template": "argocd",
      "data": {
        "event": "sync_failed",
        "application": "platform-registry-prod",
        "syncStatus": "OutOfSync",
        "healthStatus": "Degraded",
        "revision": "f4e5d6c",
        "target": "abc123-prod",
        "timestamp": "2026-02-22T12:00:00Z",
        "message": "ComparisonError: failed to sync Deployment/api-gateway",
        "url": "https://argocd.example.com/applications/platform-registry-prod"
      }
    }
  }'
```

## Testing

Run all tests:

```bash
npm test
```

## Helper Script

Use the included script for quick local smoke tests.

Show help:

```bash
npm run send:test -- --help
```

Send text:

```bash
npm run send:test -- --type text --message "Hello from script"
```

Preview mode (does not post to Bot Framework):

```bash
npm run send:test -- --preview --type template --template sysdig --severity 1 --alertName "CPU saturation"
```

Send generic template:

```bash
npm run send:test -- --type template --template generic --title "Maintenance Window" --body "DB maintenance in 30 minutes." --severity warning
```

Send GitHub PR template:

```bash
npm run send:test -- --type template --template github_pull_request --event opened --title "PR #123" --repo "bcgov/devx-teams-connector" --author "octocat" --url "https://github.com/bcgov/devx-teams-connector/pull/123"
```

Send GitHub workflow template:

```bash
npm run send:test -- --type template --template github_workflow_run --event completed --conclusion failure --workflow "CI/CD Pipeline" --repo "bcgov/devx-teams-connector" --branch main --author "octocat" --url "https://github.com/bcgov/devx-teams-connector/actions/runs/123"
```

Send Sysdig template:

```bash
npm run send:test -- --type template --template sysdig --severity 1 --alertName "CPU saturation" --scope "prod-cluster" --timestamp "2026-02-22T12:00:00Z"
```

Send uptime template:

```bash
npm run send:test -- --type template --template uptime --status down --service "payments-api" --downSince "2026-02-22T11:40:00Z"
```

Send DB backup template:

```bash
npm run send:test -- --type template --template db_backup --status info --projectName "abc123" --projectFriendlyName "My Project"
```

Send Argo CD template:

```bash
npm run send:test -- --type template --template argocd --event sync_failed --application "platform-registry-prod" --syncStatus OutOfSync --healthStatus Degraded --revision "f4e5d6c" --targetName "abc123-prod" --url "https://argocd.example.com/applications/platform-registry-prod"
```

Script env vars:
- `CONNECTOR_API_KEY`
- `TEAM_ID`
- `CHANNEL_ID`
- `CONNECTOR_URL` (optional, default `http://localhost:3000`)

## Troubleshooting

- `AUTH_FAILED`: Check `Authorization` header and API key value.
- Docker-specific `AUTH_FAILED`: If your `.env` values are quoted (for example `CONNECTOR_API_KEY="abc123"`), restart with the latest build of this service (it now normalizes quoted env values for Docker `--env-file` compatibility).
- `BACKEND_UNAVAILABLE`: Verify bot credentials and outbound access to Microsoft token/Bot Framework endpoints.
- `Authorization has been denied for this request`: Use the correct token tenant for your bot registration (`TENANT_ID` for single-tenant bots, or default `botframework.com` for multi-tenant bots).
- `DELIVERY_FAILED`: Confirm the Teams app bot is installed in the target team/channel and channel ID is correct.
- `RATE_LIMITED`: Retry after the `Retry-After` header value.
