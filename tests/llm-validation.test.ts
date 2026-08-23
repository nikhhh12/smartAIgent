import { describe, it, expect } from "vitest";
import { WorkflowInterpretationSchema } from "../src/lib/schemas/interpretation";

describe("LLM Structured Output Schema Validation", () => {
  it("validates a correctly structured interpretation output", () => {
    const validJson = {
      taskTitle: "Update ABC Corp Pricing",
      summary: "Partner requires updated pricing document by Friday.",
      priority: "high",
      deadline: "Friday",
      actionItems: [
        {
          id: "act-1",
          description: "Create internal task",
          priority: "high",
          requiresHumanConfirmation: false,
          suggestedTool: "createTask",
          toolInput: { title: "Update Pricing", priority: "high" },
        },
      ],
      missingInformation: [],
      automatableActions: ["Create internal task"],
      humanConfirmationRequired: [],
    };

    const parsed = WorkflowInterpretationSchema.safeParse(validJson);
    expect(parsed.success).toBe(true);
  });

  it("rejects invalid priority values (e.g. 'urgent' instead of allowed enum)", () => {
    const invalidJson = {
      taskTitle: "Update ABC Corp Pricing",
      summary: "Invalid priority test",
      priority: "urgent", // Invalid! Enum must be low|medium|high|critical
      deadline: null,
      actionItems: [],
      missingInformation: [],
      automatableActions: [],
      humanConfirmationRequired: [],
    };

    const parsed = WorkflowInterpretationSchema.safeParse(invalidJson);
    expect(parsed.success).toBe(false);
  });
});
