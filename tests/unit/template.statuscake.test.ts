import { describe, expect, it } from "vitest";

import {
  renderStatusCakeTemplate,
  StatusCakeTemplateDataSchema,
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
  it("renders StatusCake action button for each status", () => {
    for (const status of ["up", "down"] as const) {
      const card = renderStatusCakeTemplate({
        status,
        testName: "payments-api",
        websiteUrl: "https://developer.gov.bc.ca/payments-api",
        testId: "123456",
      });

      const items = getContentItems(card);
      const actionSet = items.find((item) => item.type === "ActionSet");
      const actions = actionSet?.actions as Array<Record<string, unknown>>;

      expect(actions?.[0]).toEqual({
        type: "Action.OpenUrl",
        title: "Open StatusCake Alert",
        url: "https://app.statuscake.com/UptimeStatus.php?tid=123456",
      });
    }
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
      value: "https://developer.gov.bc.ca/payments-api",
    });
    expect(facts).toContainEqual({ title: "Check rate:", value: "60" });
    expect(facts).toContainEqual({ title: "Method:", value: "Website" });
    expect(facts).toContainEqual({ title: "Status code:", value: "403" });
    expect(facts).toContainEqual({ title: "Tags:", value: "platform" });
    expect(facts).toContainEqual({ title: "IP:", value: "127.0.0.1" });
  });

  it("accepts and displays website values that omit a scheme", () => {
    // Parsed through the schema so a reintroduced .url() check fails here.
    const data = StatusCakeTemplateDataSchema.parse({
      status: "down",
      testName: "payments-api",
      websiteUrl: "developer.gov.bc.ca/payments-api",
    });

    expect(data.websiteUrl).toBe("developer.gov.bc.ca/payments-api");

    const card = renderStatusCakeTemplate(data);

    const items = getContentItems(card);
    const factSetBlock = items.find((item) => item.type === "FactSet");
    const facts = factSetBlock?.facts as Array<Record<string, string>>;

    expect(facts).toContainEqual({
      title: "Website:",
      value: "developer.gov.bc.ca/payments-api",
    });
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
