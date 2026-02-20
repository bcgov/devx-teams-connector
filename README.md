# Teams Connector PoC

Minimal TypeScript/Express proof-of-concept for posting notifications to Microsoft Teams via a Teams app bot using Bot Framework.

## Scope

Implemented:
- `POST /api/v1/messages`
- `GET /api/v1/health`
- API key auth + required `X-User-Entra-Id` header
- Explicit `teamId + channelId` targeting
- Content kinds:
  - `text`
  - `template` with `template=generic`

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
  -H "X-User-Entra-Id: ${USER_ENTRA_ID}" \
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

### Send generic template message

```bash
curl -X POST http://localhost:3000/api/v1/messages \
  -H "Authorization: Bearer ${CONNECTOR_API_KEY}" \
  -H "X-User-Entra-Id: ${USER_ENTRA_ID}" \
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

Send generic template:

```bash
npm run send:test -- --type template --title "Maintenance Window" --body "DB maintenance in 30 minutes." --severity warning
```

Script env vars:
- `CONNECTOR_API_KEY`
- `USER_ENTRA_ID`
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
