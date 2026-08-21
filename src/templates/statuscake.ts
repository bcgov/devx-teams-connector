import { z } from "zod";

import type { AdaptiveCard, StatusCakeTemplateData } from "../types";
import {
  createActivitySummary,
  createBaseCard,
  createCardFrame,
  createFactSet,
  createSectionSeparator,
} from "./shared";

// https://www.statuscake.com/kb/knowledge-base/how-to-use-the-web-hook-url/
export const StatusCakeTemplateDataSchema = z.object({
  status: z.enum(["up", "down"]), // POST['Status']
  testName: z.string().min(1), // POST['Name']
  websiteUrl: z.string().min(1).optional(), // POST['URL'] - may be a bare host, not a full URL
  statusCode: z.string().optional(), // POST['StatusCode']
  ip: z.string().optional(), // POST['IP']
  tags: z.string().optional(), // POST['Tags']
  checkRate: z.string().optional(), // POST['Checkrate']
  testId: z.string().optional(), // body.TestID from n8n payload
  method: z.string().optional(), // body.Method from n8n payload
});

const statusBadges: Record<StatusCakeTemplateData["status"], string> = {
  up: "🟢 UP",
  down: "🔴 DOWN",
};

export function summarizeStatusCakeTemplate(
  data: StatusCakeTemplateData,
): string {
  return createActivitySummary([
    `${data.testName} is ${data.status.toUpperCase()}`,
  ]);
}

export function renderStatusCakeTemplate(
  data: StatusCakeTemplateData,
): AdaptiveCard {
  const contentItems: Array<Record<string, unknown>> = [
    {
      type: "ColumnSet",
      spacing: "None",
      columns: [
        {
          type: "Column",
          width: "stretch",
          items: [
            {
              type: "TextBlock",
              text: statusBadges[data.status],
              size: "Small",
              color: data.status === "up" ? "Good" : "Attention",
              weight: "Bolder",
              spacing: "None",
            },
          ],
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
      text: data.testName,
      weight: "Bolder",
      size: "Large",
      wrap: true,
      spacing: "Small",
    },
  ];

  const factSet = createFactSet([
    { title: "Website", value: data.websiteUrl },
    { title: "Method", value: data.method },
    { title: "Status code", value: data.statusCode },
    { title: "Check rate", value: data.checkRate },
    { title: "Tags", value: data.tags },
    { title: "IP", value: data.ip },
  ]);

  if (factSet) {
    contentItems.push(createSectionSeparator());
    contentItems.push(factSet);
  }

  const actionUrl = data.testId
    ? `https://app.statuscake.com/UptimeStatus.php?tid=${encodeURIComponent(data.testId)}`
    : undefined;

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
