#!/usr/bin/env tsx

import { config as loadDotenv } from 'dotenv';

loadDotenv();

interface Args {
  type: 'text' | 'template';
  message?: string;
  title?: string;
  body?: string;
  severity?: 'critical' | 'warning' | 'info' | 'success';
  url?: string;
  urlLabel?: string;
  source?: string;
}

function printHelp(): void {
  console.log(`
Teams Connector Test Script

Usage:
  Text message:
    npm run send:test -- --type text --message "Your message here"

  Template message:
    npm run send:test -- --type template --title "Alert Title" \\
      --body "Alert body" --severity warning --url "https://example.com" \\
      --urlLabel "View Details" --source "Test System"

Options:
  --type <text|template>     Message type (required)
  --message <string>         Message text (for text type)
  --title <string>           Alert title (for template type)
  --body <string>            Alert body (for template type)
  --severity <level>         Severity: critical|warning|info|success (default: info)
  --url <url>                Action URL (for template type)
  --urlLabel <string>        Action button label (for template type)
  --source <string>          Source system (for template type)

Environment Variables:
  CONNECTOR_API_KEY          API key for authentication
  USER_ENTRA_ID              User Entra ID (Azure AD user ID)
  TEAM_ID                    Target team ID (UUID)
  CHANNEL_ID                 Target channel ID (19:xxx@thread.tacv2)
  CONNECTOR_URL              Connector URL (default: http://localhost:3000)
`);
}

function parseArgs(): Args {
  const args: Args = {
    type: 'text',
  };

  for (let i = 2; i < process.argv.length; i++) {
    const arg = process.argv[i];
    const next = process.argv[i + 1];

    switch (arg) {
      case '--type':
        args.type = next as 'text' | 'template';
        i++;
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
        args.severity = next as 'critical' | 'warning' | 'info' | 'success';
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

async function sendMessage(args: Args): Promise<void> {
  const apiKey = getRequired('CONNECTOR_API_KEY');
  const userEntraId = getRequired('USER_ENTRA_ID');
  const teamId = getRequired('TEAM_ID');
  const channelId = getRequired('CHANNEL_ID');
  const connectorUrl = process.env.CONNECTOR_URL?.trim() || 'http://localhost:3000';

  let content: Record<string, unknown>;

  if (args.type === 'text') {
    if (!args.message) {
      console.error('Error: --message is required for text type');
      process.exit(1);
    }

    content = {
      kind: 'text',
      text: args.message,
    };
  } else {
    if (!args.title) {
      console.error('Error: --title is required for template type');
      process.exit(1);
    }

    content = {
      kind: 'template',
      template: 'generic',
      data: {
        title: args.title,
        ...(args.body && { body: args.body }),
        severity: args.severity || 'info',
        ...(args.url && { url: args.url }),
        ...(args.urlLabel && { urlLabel: args.urlLabel }),
        ...(args.source && { source: args.source }),
      },
    };
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
  console.log('URL:', `${connectorUrl}/api/v1/messages`);

  const response = await fetch(`${connectorUrl}/api/v1/messages`, {
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
