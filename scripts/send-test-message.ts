#!/usr/bin/env tsx

import { config as loadDotenv } from 'dotenv';

import type { TemplateName } from '../src/types';

loadDotenv();

type MessageType = 'text' | 'template';

interface Args {
  type: MessageType;
  template: TemplateName;
  preview?: boolean;
  message?: string;
  title?: string;
  body?: string;
  severity?: string;
  url?: string;
  urlLabel?: string;
  source?: string;
  event?: 'opened' | 'merged' | 'closed' | 'sync_succeeded' | 'sync_failed' | 'out_of_sync';
  repo?: string;
  author?: string;
  alertName?: string;
  scope?: string;
  description?: string;
  timestamp?: string;
  status?: 'up' | 'degraded' | 'down' | 'success' | 'warning' | 'failed';
  service?: string;
  responseTimeMs?: number;
  downSince?: string;
  database?: string;
  duration?: string;
  size?: string;
  container?: string;
  application?: string;
  syncStatus?: 'Synced' | 'OutOfSync' | 'Unknown';
  healthStatus?: 'Healthy' | 'Degraded' | 'Progressing' | 'Missing' | 'Suspended' | 'Unknown';
  revision?: string;
  project?: string;
  targetName?: string;
}

function printHelp(): void {
  console.log(`
Teams Connector Test Script

Usage:
  Text message:
    npm run send:test -- --type text --message "Your message here"

  Preview mode (no delivery):
    npm run send:test -- --preview --type template --template sysdig --severity high \\
      --alertName "CPU saturation"

  Generic template:
    npm run send:test -- --type template --template generic --title "Maintenance" \\
      --body "DB maintenance in 30 minutes" --severity warning --url "https://example.com"

  GitHub template:
    npm run send:test -- --type template --template github --event opened --title "PR #123" \\
      --repo "org/repo" --author "octocat" --url "https://github.com/org/repo/pull/123"

  Sysdig template:
    npm run send:test -- --type template --template sysdig --severity high \\
      --alertName "CPU saturation" --scope "prod-cluster"

  Uptime template:
    npm run send:test -- --type template --template uptime --status degraded \\
      --service "payments-api" --responseTimeMs 620

  DB backup template:
    npm run send:test -- --type template --template db_backup --status success \\
      --database "users" --duration "2m 03s" --size "1.2 GB" --container "backup-job-1"

  Argo CD template:
    npm run send:test -- --type template --template argocd --event sync_failed \\
      --application "platform-registry-prod" --syncStatus OutOfSync --healthStatus Degraded \\
      --revision "f4e5d6c" --targetName "abc123-prod" --url "https://argocd.example.com/applications/platform-registry-prod"

Options:
  --type <text|template>                  Message type (required)
  --preview                               Use /messages/preview endpoint (no Bot Framework delivery)
  --template <generic|github|sysdig|uptime|db_backup|argocd>
                                          Template name (for template type, default: generic)

  Text options:
  --message <string>                      Message text

  Generic options:
  --title <string>                        Template title
  --body <string>                         Body text
  --severity <level>                      generic: critical|warning|info|success
  --url <url>                             Action URL
  --urlLabel <string>                     Action button label
  --source <string>                       Source system

  GitHub options:
  --event <opened|merged|closed>
  --repo <org/repo>
  --author <string>

  Sysdig options:
  --alertName <string>
  --scope <string>
  --description <string>
  --timestamp <ISO8601>
  --severity <critical|high|medium|low|info>

  Uptime options:
  --status <up|degraded|down>
  --service <string>
  --responseTimeMs <number>
  --downSince <ISO8601>

  DB backup options:
  --status <success|warning|failed>
  --database <string>
  --duration <string>
  --size <string>
  --container <string>

  Argo CD options:
  --event <sync_succeeded|sync_failed|out_of_sync>
  --application <string>
  --syncStatus <Synced|OutOfSync|Unknown>
  --healthStatus <Healthy|Degraded|Progressing|Missing|Suspended|Unknown>
  --revision <string>
  --project <string>
  --targetName <string>
  --timestamp <ISO8601>
  --message <string>
  --url <url>

Environment Variables:
  CONNECTOR_API_KEY                       API key for authentication
  USER_ENTRA_ID                           User Entra ID (Azure AD user ID)
  TEAM_ID                                 Target team ID (UUID)
  CHANNEL_ID                              Target channel ID (19:xxx@thread.tacv2)
  CONNECTOR_URL                           Connector URL (default: http://localhost:3000)
`);
}

function parseArgs(): Args {
  const args: Args = {
    type: 'text',
    template: 'generic',
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const next = process.argv[i + 1];

    switch (arg) {
      case '--type':
        args.type = next as MessageType;
        i++;
        break;
      case '--template':
        args.template = next as TemplateName;
        i++;
        break;
      case '--preview':
        args.preview = true;
        break;
      case '--message':
        args.message = next;
        i++;
        break;
      case '--title':
        args.title = next;
        i++;
        break;
      case '--body':
        args.body = next;
        i++;
        break;
      case '--severity':
        args.severity = next;
        i++;
        break;
      case '--url':
        args.url = next;
        i++;
        break;
      case '--urlLabel':
        args.urlLabel = next;
        i++;
        break;
      case '--source':
        args.source = next;
        i++;
        break;
      case '--event':
        args.event = next as Args['event'];
        i++;
        break;
      case '--repo':
        args.repo = next;
        i++;
        break;
      case '--author':
        args.author = next;
        i++;
        break;
      case '--alertName':
        args.alertName = next;
        i++;
        break;
      case '--scope':
        args.scope = next;
        i++;
        break;
      case '--description':
        args.description = next;
        i++;
        break;
      case '--timestamp':
        args.timestamp = next;
        i++;
        break;
      case '--status':
        args.status = next as Args['status'];
        i++;
        break;
      case '--service':
        args.service = next;
        i++;
        break;
      case '--responseTimeMs':
        args.responseTimeMs = next ? Number(next) : undefined;
        i++;
        break;
      case '--downSince':
        args.downSince = next;
        i++;
        break;
      case '--database':
        args.database = next;
        i++;
        break;
      case '--duration':
        args.duration = next;
        i++;
        break;
      case '--size':
        args.size = next;
        i++;
        break;
      case '--container':
        args.container = next;
        i++;
        break;
      case '--application':
        args.application = next;
        i++;
        break;
      case '--syncStatus':
        args.syncStatus = next as Args['syncStatus'];
        i++;
        break;
      case '--healthStatus':
        args.healthStatus = next as Args['healthStatus'];
        i++;
        break;
      case '--revision':
        args.revision = next;
        i++;
        break;
      case '--project':
        args.project = next;
        i++;
        break;
      case '--targetName':
        args.targetName = next;
        i++;
        break;
      case '--help':
        printHelp();
        process.exit(0);
      default:
        break;
    }
  }

  return args;
}

function getRequired(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    console.error(`Error: ${name} environment variable is required`);
    process.exit(1);
  }
  return value;
}

function requireArg(value: string | undefined, name: string): string {
  if (!value) {
    console.error(`Error: ${name} is required`);
    process.exit(1);
  }

  return value;
}

function ensureValueInSet(value: string | undefined, fieldName: string, allowed: string[]): string {
  const resolved = requireArg(value, fieldName);

  if (!allowed.includes(resolved)) {
    console.error(`Error: ${fieldName} must be one of: ${allowed.join(', ')}`);
    process.exit(1);
  }

  return resolved;
}

function buildTemplateContent(args: Args): { kind: 'template'; template: TemplateName; data: Record<string, unknown> } {
  switch (args.template) {
    case 'generic': {
      const severity = args.severity
        ? ensureValueInSet(args.severity, '--severity', ['critical', 'warning', 'info', 'success'])
        : 'info';

      return {
        kind: 'template',
        template: 'generic',
        data: {
          title: requireArg(args.title, '--title'),
          ...(args.body && { body: args.body }),
          severity,
          ...(args.url && { url: args.url }),
          ...(args.urlLabel && { urlLabel: args.urlLabel }),
          ...(args.source && { source: args.source }),
        },
      };
    }

    case 'github':
      return {
        kind: 'template',
        template: 'github',
        data: {
          event: ensureValueInSet(args.event, '--event', ['opened', 'merged', 'closed']),
          title: requireArg(args.title, '--title'),
          repo: requireArg(args.repo, '--repo'),
          author: requireArg(args.author, '--author'),
          url: requireArg(args.url, '--url'),
          ...(args.body && { body: args.body }),
        },
      };

    case 'sysdig':
      return {
        kind: 'template',
        template: 'sysdig',
        data: {
          severity: ensureValueInSet(args.severity, '--severity', ['critical', 'high', 'medium', 'low', 'info']),
          alertName: requireArg(args.alertName, '--alertName'),
          ...(args.scope && { scope: args.scope }),
          ...(args.description && { description: args.description }),
          ...(args.timestamp && { timestamp: args.timestamp }),
          ...(args.url && { url: args.url }),
        },
      };

    case 'uptime':
      return {
        kind: 'template',
        template: 'uptime',
        data: {
          status: ensureValueInSet(args.status, '--status', ['up', 'degraded', 'down']),
          service: requireArg(args.service, '--service'),
          ...(typeof args.responseTimeMs === 'number' && Number.isFinite(args.responseTimeMs)
            ? { responseTimeMs: args.responseTimeMs }
            : {}),
          ...(args.downSince && { downSince: args.downSince }),
          ...(args.url && { url: args.url }),
        },
      };

    case 'db_backup':
      return {
        kind: 'template',
        template: 'db_backup',
        data: {
          status: ensureValueInSet(args.status, '--status', ['success', 'warning', 'failed']),
          database: requireArg(args.database, '--database'),
          ...(args.duration && { duration: args.duration }),
          ...(args.size && { size: args.size }),
          ...(args.message && { message: args.message }),
          ...(args.container && { container: args.container }),
        },
      };

    case 'argocd':
      return {
        kind: 'template',
        template: 'argocd',
        data: {
          event: ensureValueInSet(args.event, '--event', ['sync_succeeded', 'sync_failed', 'out_of_sync']),
          application: requireArg(args.application, '--application'),
          ...(args.syncStatus && {
            syncStatus: ensureValueInSet(args.syncStatus, '--syncStatus', ['Synced', 'OutOfSync', 'Unknown']),
          }),
          ...(args.healthStatus && {
            healthStatus: ensureValueInSet(args.healthStatus, '--healthStatus', [
              'Healthy',
              'Degraded',
              'Progressing',
              'Missing',
              'Suspended',
              'Unknown',
            ]),
          }),
          ...(args.revision && { revision: args.revision }),
          ...(args.project && { project: args.project }),
          ...(args.targetName && { target: args.targetName }),
          ...(args.timestamp && { timestamp: args.timestamp }),
          ...(args.message && { message: args.message }),
          ...(args.url && { url: args.url }),
        },
      };

    default:
      console.error(`Error: unsupported template ${args.template}`);
      process.exit(1);
  }
}

async function sendMessage(args: Args): Promise<void> {
  const apiKey = getRequired('CONNECTOR_API_KEY');
  const userEntraId = getRequired('USER_ENTRA_ID');
  const teamId = getRequired('TEAM_ID');
  const channelId = getRequired('CHANNEL_ID');
  const connectorUrl = process.env.CONNECTOR_URL?.trim() || 'http://localhost:3000';

  let content: Record<string, unknown>;

  if (args.type === 'text') {
    content = {
      kind: 'text',
      text: requireArg(args.message, '--message'),
    };
  } else {
    content = buildTemplateContent(args);
  }

  const requestBody = {
    target: {
      teamId,
      channelId,
    },
    content,
    metadata: {
      source: 'send-test-message.ts',
    },
  };

  console.log('Sending message to Teams Connector...');
  const endpoint = args.preview ? '/api/v1/messages/preview' : '/api/v1/messages';
  console.log('URL:', `${connectorUrl}${endpoint}`);

  const response = await fetch(`${connectorUrl}${endpoint}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'X-User-Entra-Id': userEntraId,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  let responseData: unknown = responseText;

  if (responseText) {
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = responseText;
    }
  }

  if (!response.ok) {
    console.error('Error response:', response.status, response.statusText);
    console.error('Body:', typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2));
    process.exit(1);
  }

  console.log('Success!');
  console.log(typeof responseData === 'string' ? responseData : JSON.stringify(responseData, null, 2));
}

const args = parseArgs();
sendMessage(args).catch((error) => {
  console.error('Failed to send message:', error);
  process.exit(1);
});
