import { describe, expect, it } from "vitest";

import {
  renderStatusCakeTemplate,
  StatusCakeTemplateDataSchema,
  summarizeStatusCakeTemplate,
} from "../../src/templates/statuscake";

function getContentItems(card: {
  body: Array<Record<string, unknown>>;
}): Array<Record<string, unknown>> {
  const columns =
    (card.body[0]?.columns as Array<Record<string, unknown>>) ?? [];
  const contentColumn = columns.at(-1) as Record<string, unknown> | undefined;
  return (contentColumn?.items as Array<Record<string, unknown>>) ?? [];
}

describe("renderStatusCakeTemplate", () => {
  it("renders uptime presentation and action button for each status", () => {
    for (const status of ["up", "down"] as const) {
      const card = renderStatusCakeTemplate({
        status,
        testName: "payments-api",
        websiteUrl: "https://developer.gov.bc.ca/payments-api",
        testId: "123456",
        method: "Website",
      });

      const items = getContentItems(card);
      const header = items[0] as Record<string, unknown>;
      const columns = header.columns as Array<Record<string, unknown>>;
      const statusItems = columns[0]?.items as Array<Record<string, unknown>>;
      const actionSet = items.find((item) => item.type === "ActionSet");
      const actions = actionSet?.actions as Array<Record<string, unknown>>;

      expect(statusItems[0]?.text).toBe(status === "up" ? "🟢 UP" : "🔴 DOWN");
      expect(actions?.[0]).toEqual({
        type: "Action.OpenUrl",
        title: "Open StatusCake Alert",
        url: "https://app.statuscake.com/UptimeStatus.php?tid=123456",
      });
    }
  });

  it("renders Page Speed presentation and action URL", () => {
    const card = renderStatusCakeTemplate({
      status: "Alerted",
      testName: "homepage performance",
      websiteUrl: "https://developer.gov.bc.ca",
      testId: "124262",
      method: "Page speed",
    });

    const items = getContentItems(card);
    const columns = items[0]?.columns as Array<Record<string, unknown>>;
    const statusItems = columns[0]?.items as Array<Record<string, unknown>>;
    const actionSet = items.find((item) => item.type === "ActionSet");
    const actions = actionSet?.actions as Array<Record<string, unknown>>;

    expect(statusItems[0]?.text).toBe("⚡ PAGE SPEED - ALERTED");
    expect(actions?.[0]?.url).toBe(
      "https://app.statuscake.com/SpeedMonitor.php?PSID=124262",
    );
  });

  it("renders SSL presentation and certificate dates without a test name or ID", () => {
    const card = renderStatusCakeTemplate({
      status: "Expiring",
      websiteUrl: "https://developer.gov.bc.ca",
      method: "SSL",
      validFrom: "1774224000",
      validUntil: "1791417540",
    });

    const items = getContentItems(card);
    const columns = items[0]?.columns as Array<Record<string, unknown>>;
    const statusItems = columns[0]?.items as Array<Record<string, unknown>>;
    const title = items.find((item) => item.type === "TextBlock" && item.size === "Large");
    const factSet = items.find((item) => item.type === "FactSet");
    const facts = factSet?.facts as Array<Record<string, string>>;

    expect(statusItems[0]?.text).toBe("🔒 SSL - EXPIRING");
    expect(title?.text).toBe("developer.gov.bc.ca");
    expect(facts).toContainEqual({
      title: "Valid from:",
      value: "2026-03-23T00:00:00.000Z",
    });
    expect(facts).toContainEqual({
      title: "Valid until:",
      value: "2026-10-07T23:59:00.000Z",
    });
    expect(items.some((item) => item.type === "ActionSet")).toBe(false);
    expect(summarizeStatusCakeTemplate({
      status: "Expired",
      websiteUrl: "https://developer.gov.bc.ca",
      method: "SSL",
    })).toContain("SSL on developer.gov.bc.ca is EXPIRED");
  });

  it.each([undefined, "Domain"])(
    "omits the badge for unsupported method %s",
    (method) => {
      const card = renderStatusCakeTemplate({
        status: "Alerted",
        testName: "domain expiry",
        method,
      });

      const items = getContentItems(card);
      const columns = items[0]?.columns as Array<Record<string, unknown>>;
      const statusItems = columns[0]?.items as Array<Record<string, unknown>>;

      expect(statusItems).toEqual([]);
    },
  );

  it("accepts non-uptime statuses", () => {
    expect(StatusCakeTemplateDataSchema.parse({
      status: "Expiring",
      websiteUrl: "https://developer.gov.bc.ca",
      method: "SSL",
      validFrom: "1774224000",
      validUntil: "1791417540",
    }).status).toBe("Expiring");
  });

  it("renders StatusCake-specific fields in fact set", () => {
    const card = renderStatusCakeTemplate({
      status: "down",
      testName: "payments-api",
      websiteUrl: "https://developer.gov.bc.ca/payments-api",
      testId: "123456",
      method: "Website",
      statusCode: "403",
      checkRate: "60",
      tags: "platform",
      ip: "127.0.0.1",
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === "FactSet");
    const facts = factSetBlock?.facts as Array<Record<string, string>>;

    expect(facts).toContainEqual({
      title: "Website:",
      value: "developer.gov.bc.ca",
    });
    expect(facts).toContainEqual({ title: "Check rate:", value: "60" });
    expect(facts).toContainEqual({ title: "Method:", value: "Website" });
    expect(facts).toContainEqual({ title: "Status code:", value: "403" });
    expect(facts).toContainEqual({ title: "Tags:", value: "platform" });
    expect(facts).toContainEqual({ title: "IP:", value: "127.0.0.1" });
  });

  it("omits fact set when optional values are missing", () => {
    const card = renderStatusCakeTemplate({
      status: "up",
      testName: "payments-api",
    });

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === "FactSet");

    expect(factSetBlock).toBeUndefined();
  });
});
