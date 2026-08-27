import { z } from "zod";

import type { AdaptiveCard, StatusCakeTemplateData } from "../types";
import {
  createActivitySummary,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
} from "./shared";

const UnixTimestampSchema = z.string().trim().regex(/^\d+$/, "Expected Unix timestamp in seconds");

// https://www.statuscake.com/kb/knowledge-base/how-to-use-the-web-hook-url/
export const StatusCakeTemplateDataSchema = z.object({
  status: z.string().trim().min(1).max(64), // POST['Status']
  testName: z.string().min(1).optional(), // POST['Name']
  websiteUrl: z.string().url().optional(), // POST['URL']
  statusCode: z.string().optional(), // POST['StatusCode']
  ip: z.string().optional(), // POST['IP']
  tags: z.string().optional(), // POST['Tags']
  checkRate: z.string().optional(), // POST['Checkrate']
  testId: z.string().optional(), // body.TestID from n8n payload
  method: z.string().optional(), // body.Method from n8n payload
  validFrom: UnixTimestampSchema.optional(), // body.ValidFrom from n8n payload
  validUntil: UnixTimestampSchema.optional(), // body.ValidUntil from n8n payload
});

function getStatusPresentation(
  status: string,
  method: string | undefined,
): { label: string; color: string } | undefined {
  switch (method?.trim().toLowerCase()) {
    case "website":
      return status.trim().toLowerCase() === "up" ? { label: "🟢 UP", color: "Good" } : { label: "🔴 DOWN", color: "Attention" };
    case "page speed":
      return { label: `⚡ PAGE SPEED - ${status.toUpperCase()}`, color: "Default" };
    case "ssl":
      return { label: `🔒 SSL - ${status.toUpperCase()}`, color: "Default" };
    default:
      return undefined;
  }
}

function getActionUrl(testId: string | undefined, method: string | undefined): string | undefined {
  if (!method || !testId) return undefined;

  switch (method.trim().toLowerCase()) {
    case "website":
      return `https://app.statuscake.com/UptimeStatus.php?tid=${encodeURIComponent(testId)}`;
    case "page speed":
      return `https://app.statuscake.com/SpeedMonitor.php?PSID=${encodeURIComponent(testId)}`;
    // case "ssl": // Currently testId is not provided in the SSL webhook payload. If that changes, we can use this URL to link to the SSL details page.
    //   return `https://app.statuscake.com/ssl_detail.php?id=${encodeURIComponent(testId)}`;
    default:
      return undefined;
  }
}

function toHostname(value: string | undefined): string | undefined {
  if (!value) return undefined;

  try {
    return new URL(value).hostname;
  } catch {
    return undefined;
  }
}

function getDisplayName(data: StatusCakeTemplateData): string {
  return data.testName?.trim()
    || toHostname(data.websiteUrl)
    || data.websiteUrl
    || (data.method?.trim().toLowerCase() === "ssl" ? "SSL certificate" : "StatusCake alert");
}

function formatUnixTimestamp(value: string | undefined): string | undefined {
  if (!value) return undefined;

  const date = new Date(Number(value) * 1000);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
}

export function summarizeStatusCakeTemplate(
  data: StatusCakeTemplateData,
): string {
  const displayName = getDisplayName(data);

  return createActivitySummary([
    data.method?.trim().toLowerCase() === "ssl"
      ? `SSL on ${displayName} is ${data.status.toUpperCase()}`
      : `${displayName} is ${data.status.toUpperCase()}`,
  ]);
}

export function renderStatusCakeTemplate(
  data: StatusCakeTemplateData,
): AdaptiveCard {
  const statusPresentation = getStatusPresentation(data.status, data.method);
  const statusItems: Array<Record<string, unknown>> = statusPresentation
    ? [
        {
          type: "TextBlock",
          text: statusPresentation.label,
          size: "Small",
          color: statusPresentation.color,
          weight: "Bolder",
          spacing: "None",
        },
      ]
    : [];

  const contentItems: Array<Record<string, unknown>> = [
    {
      type: "ColumnSet",
      spacing: "None",
      columns: [
        {
          type: "Column",
          width: "stretch",
          items: statusItems,
        },
        {
          type: "Column",
          width: "auto",
          items: [
            {
              type: "TextBlock",
              text: "StatusCake",
              size: "Small",
              isSubtle: true,
              spacing: "None",
            },
          ],
        },
      ],
    },
    {
      type: "TextBlock",
      text: getDisplayName(data),
      weight: "Bolder",
      size: "Large",
      wrap: true,
      spacing: "Small",
    },
  ];

  const factSet = createFactSet([
    { title: "Website", value: toHostname(data.websiteUrl) },
    { title: "Method", value: data.method },
    { title: "Status code", value: data.statusCode },
    { title: "Check rate", value: data.checkRate },
    { title: "Tags", value: data.tags },
    { title: "IP", value: data.ip },
    { title: "Valid from", value: formatUnixTimestamp(data.validFrom) },
    { title: "Valid until", value: formatUnixTimestamp(data.validUntil) },
  ]);

  if (factSet) {
    contentItems.push(createSectionSeparator());
    contentItems.push(factSet);
  }

  const actionUrl = getActionUrl(data.testId, data.method);

  if (actionUrl) {
    contentItems.push({
      type: "ActionSet",
      spacing: "Medium",
      actions: [
        {
          type: "Action.OpenUrl",
          title: "Open StatusCake Alert",
          url: actionUrl,
        },
      ],
    });
  }

  return createBaseCard([createCardFrame(contentItems)]);
}
