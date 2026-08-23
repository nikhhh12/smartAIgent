import { z } from "zod";

export const ActionItemSchema = z.object({
  id: z.string(),
  description: z.string(),
  priority: z.enum(["low", "medium", "high", "critical"]),
  requiresHumanConfirmation: z.boolean(),
  suggestedTool: z
    .enum([
      "createTask",
      "draftCommunication",
      "generateMarkdownBrief",
      "createReminder",
      "searchStoredWork",
      "websiteCheck",
      "deleteDeployment",
      "none",
    ])
    .optional(),
  toolInput: z.record(z.unknown()).optional(),
});

export const WorkflowInterpretationSchema = z.object({
  taskTitle: z.string().min(1, "Task title is required"),
  summary: z.string().min(1, "Summary is required"),
  priority: z.enum(["low", "medium", "high", "critical"]),
  deadline: z.string().nullable().optional(),
  actionItems: z.array(ActionItemSchema),
  missingInformation: z.array(z.string()),
  automatableActions: z.array(z.string()),
  humanConfirmationRequired: z.array(z.string()),
});

export type ActionItemType = z.infer<typeof ActionItemSchema>;
export type WorkflowInterpretationType = z.infer<typeof WorkflowInterpretationSchema>;
