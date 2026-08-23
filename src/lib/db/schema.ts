import { sqliteTable, text } from "drizzle-orm/sqlite-core";

export const workflows = sqliteTable("workflows", {
  id: text("id").primaryKey(),
  originalRequest: text("original_request").notNull(),
  status: text("status").notNull(), // INTAKE | INTERPRETED | PLANNED | EXECUTING | AWAITING_APPROVAL | EXECUTING_APPROVED_ACTION | REQUIRES_CLARIFICATION | COMPLETED | FAILED
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const interpretations = sqliteTable("interpretations", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  taskTitle: text("task_title").notNull(),
  summary: text("summary").notNull(),
  priority: text("priority").notNull(), // low | medium | high | critical
  deadline: text("deadline"),
  missingInformation: text("missing_information").notNull(), // JSON array
  automatableActions: text("automatable_actions").notNull(), // JSON array
  humanConfirmationRequired: text("human_confirmation_required").notNull(), // JSON array
  createdAt: text("created_at").notNull(),
});

export const actionItems = sqliteTable("action_items", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  description: text("description").notNull(),
  category: text("category").notNull(), // EXECUTE_AUTOMATICALLY | PREPARE_FOR_HUMAN_REVIEW | CANNOT_EXECUTE_WITH_AVAILABLE_TOOLS | REQUIRES_CLARIFICATION
  reason: text("reason").notNull(),
  toolName: text("tool_name"),
  toolInput: text("tool_input"), // JSON object
  status: text("status").notNull(), // PENDING | AWAITING_APPROVAL | EDITED | APPROVED | REJECTED | EXECUTED | FAILED | NEEDS_CLARIFICATION | UNSAFE_INPUT
  createdAt: text("created_at").notNull(),
});

export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  actionId: text("action_id").references(() => actionItems.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  priority: text("priority").notNull(),
  deadline: text("deadline"),
  status: text("status").notNull(), // PENDING | IN_PROGRESS | COMPLETED
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const communicationDrafts = sqliteTable("communication_drafts", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  actionId: text("action_id").references(() => actionItems.id),
  recipient: text("recipient"),
  subject: text("subject").notNull(),
  body: text("body").notNull(),
  type: text("type").notNull(), // email | message | report
  status: text("status").notNull(), // DRAFT | APPROVED_DRAFT | REJECTED_DRAFT
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const reminders = sqliteTable("reminders", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  actionId: text("action_id").references(() => actionItems.id),
  reminderText: text("reminder_text").notNull(),
  dueDate: text("due_date").notNull(),
  status: text("status").notNull(), // SCHEDULED | COMPLETED
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
});

export const toolExecutions = sqliteTable("tool_executions", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  actionId: text("action_id").references(() => actionItems.id),
  toolName: text("tool_name").notNull(),
  input: text("input").notNull(), // JSON string
  output: text("output"), // JSON string
  status: text("status").notNull(), // SUCCESS | FAILED | REJECTED
  error: text("error"),
  createdAt: text("created_at").notNull(),
});

export const approvals = sqliteTable("approvals", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  actionId: text("action_id").notNull().references(() => actionItems.id),
  status: text("status").notNull(), // PENDING | APPROVED | EDITED | REJECTED
  originalContent: text("original_content").notNull(), // JSON string
  editedContent: text("edited_content"), // JSON string
  createdAt: text("created_at").notNull(),
});

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(),
  workflowId: text("workflow_id").notNull().references(() => workflows.id),
  eventType: text("event_type").notNull(),
  message: text("message").notNull(),
  status: text("status").notNull(), // INFO | SUCCESS | WARNING | ERROR
  metadata: text("metadata"), // JSON string
  createdAt: text("created_at").notNull(),
});
