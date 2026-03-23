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
  event?: string;
  conclusion?: string;
  repo?: string;
  author?: string;
  branch?: string;
  workflow?: string;
  sha?: string;
  alertName?: string;
  state?: string;
  scope?: string;
  description?: string;
  timestamp?: string;
  status?: string;
  service?: string;
  downSince?: string;
  projectName?: string;
  projectFriendlyName?: string;
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
    npm run send:test -- --preview --type template --template sysdig --severity 1 \\
      --alertName "CPU saturation"

  Generic template:
    npm run send:test -- --type template --template generic --title "Maintenance" \\
      --body "DB maintenance in 30 minutes" --severity warning --url "https://example.com"

  GitHub PR template:
    npm run send:test -- --type template --template github_pull_request --event opened \\
      --title "PR #123" --repo "org/repo" --author "octocat" \\
      --url "https://github.com/org/repo/pull/123"

  GitHub workflow template:
    npm run send:test -- --type template --template github_workflow_run --event completed \\
      --conclusion failure --workflow "CI/CD Pipeline" --repo "org/repo" --branch main \\
      --author "octocat" --url "https://github.com/org/repo/actions/runs/123"

  Sysdig template:
    npm run send:test -- --type template --template sysdig --severity 1 \\
      --alertName "CPU saturation" --scope "prod-cluster"

  Uptime template:
    npm run send:test -- --type template --template uptime --status down \\
      --service "payments-api" --downSince "2026-02-22T11:40:00Z"

  DB backup template:
    npm run send:test -- --type template --template db_backup --status info \\
      --projectName "abc123" --projectFriendlyName "My Project"

  Argo CD template:
    npm run send:test -- --type template --template argocd --event sync_failed \\
      --application "platform-registry-prod" --syncStatus OutOfSync --healthStatus Degraded \\
      --revision "f4e5d6c" --targetName "abc123-prod" --url "https://argocd.example.com/applications/platform-registry-prod"

Options:
  --type <text|template>                  Message type (required)
  --preview                               Use /messages/preview endpoint (no Bot Framework delivery)
  --template <generic|github_pull_request|github_workflow_run|sysdig|uptime|db_backup|argocd>
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

  GitHub PR options:
  --event <string>                        PR action (e.g. opened, closed)
  --title <string>                        PR title
  --repo <org/repo>                       Repository full name
  --author <string>                       PR author
  --url <url>                             PR URL
  --body <string>                         PR body text

  GitHub workflow options:
  --event <string>                        Workflow action (e.g. completed)
  --conclusion <string>                   Conclusion (success, failure, cancelled)
  --workflow <string>                     Workflow name
  --repo <org/repo>                       Repository full name
  --branch <string>                       Branch name
  --author <string>                       Triggering actor
  --url <url>                             Workflow run URL
  --sha <string>                          Short commit SHA
  --message <string>                      Commit message

  Sysdig options:
  --alertName <string>                    Alert name
  --severity <0-7>                        Numeric severity (0=critical, 1=high, 2-3=medium, 4-5=low, 6-7=info)
  --state <active|ok>                     Alert state
  --scope <string>                        Alert scope
  --description <string>                  Alert description
  --timestamp <ISO8601>                   Alert timestamp
  --url <url>                             Sysdig alert URL

  Uptime options:
  --status <up|down>                      Service status
  --service <string>                      Service name
  --downSince <ISO8601>                   Down since timestamp
  --url <url>                             Status page URL

  DB backup options:
  --status <info|warn|error>              Backup status
  --projectName <string>                  Project name
  --projectFriendlyName <string>          Project friendly name
  --message <string>                      Backup message

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
        args.event = next;
        i++;
        break;
      case '--conclusion':
        args.conclusion = next;
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
      case '--branch':
        args.branch = next;
        i++;
        break;
      case '--workflow':
        args.workflow = next;
        i++;
        break;
      case '--sha':
        args.sha = next;
        i++;
        break;
      case '--alertName':
        args.alertName = next;
        i++;
        break;
      case '--state':
        args.state = next;
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
        args.status = next;
        i++;
        break;
      case '--service':
        args.service = next;
        i++;
        break;
      case '--downSince':
        args.downSince = next;
        i++;
        break;
      case '--projectName':
        args.projectName = next;
        i++;
        break;
      case '--projectFriendlyName':
        args.projectFriendlyName = next;
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

    case 'github_pull_request':
      return {
        kind: 'template',
        template: 'github_pull_request',
        data: {
          event: requireArg(args.event, '--event'),
          title: requireArg(args.title, '--title'),
          repo: requireArg(args.repo, '--repo'),
          author: requireArg(args.author, '--author'),
          url: requireArg(args.url, '--url'),
          ...(args.body && { body: args.body }),
        },
      };

    case 'github_workflow_run':
      return {
        kind: 'template',
        template: 'github_workflow_run',
        data: {
          event: requireArg(args.event, '--event'),
          ...(args.conclusion && { conclusion: args.conclusion }),
          workflow: requireArg(args.workflow, '--workflow'),
          repo: requireArg(args.repo, '--repo'),
          branch: requireArg(args.branch, '--branch'),
          author: requireArg(args.author, '--author'),
          url: requireArg(args.url, '--url'),
          ...(args.sha && { sha: args.sha }),
          ...(args.message && { message: args.message }),
        },
      };

    case 'sysdig': {
      const severityNum = Number(requireArg(args.severity, '--severity'));
      if (!Number.isInteger(severityNum) || severityNum < 0 || severityNum > 7) {
        console.error('Error: --severity must be an integer from 0 to 7');
        process.exit(1);
      }

      return {
        kind: 'template',
        template: 'sysdig',
        data: {
          severity: severityNum,
          alertName: requireArg(args.alertName, '--alertName'),
          ...(args.state && { state: ensureValueInSet(args.state, '--state', ['active', 'ok']) }),
          ...(args.scope && { scope: args.scope }),
          ...(args.description && { description: args.description }),
          ...(args.timestamp && { timestamp: args.timestamp }),
          ...(args.url && { url: args.url }),
        },
      };
    }

    case 'uptime':
      return {
        kind: 'template',
        template: 'uptime',
        data: {
          status: ensureValueInSet(args.status, '--status', ['up', 'down']),
          service: requireArg(args.service, '--service'),
          ...(args.downSince && { downSince: args.downSince }),
          ...(args.url && { url: args.url }),
        },
      };

    case 'db_backup':
      return {
        kind: 'template',
        template: 'db_backup',
        data: {
          status: ensureValueInSet(args.status, '--status', ['info', 'warn', 'error']),
          projectName: requireArg(args.projectName, '--projectName'),
          projectFriendlyName: requireArg(args.projectFriendlyName, '--projectFriendlyName'),
          ...(args.message && { message: args.message }),
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
