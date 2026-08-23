import { db } from "./index";
import {
  workflows,
  interpretations,
  actionItems,
  tasks,
  communicationDrafts,
  reminders,
  toolExecutions,
  approvals,
  activityLogs,
} from "./schema";
import { eq, desc } from "drizzle-orm";

export const repository = {
  // Workflows
  async createWorkflow(id: string, originalRequest: string) {
    const now = new Date().toISOString();
    await db.insert(workflows).values({
      id,
      originalRequest,
      status: "INTAKE",
      createdAt: now,
      updatedAt: now,
    });
    return this.getWorkflow(id);
  },

  async updateWorkflowStatus(id: string, status: string) {
    const now = new Date().toISOString();
    await db
      .update(workflows)
      .set({ status, updatedAt: now })
      .where(eq(workflows.id, id));
  },

  async getWorkflow(id: string) {
    const [wf] = await db.select().from(workflows).where(eq(workflows.id, id));
    if (!wf) return null;

    const [interp] = await db
      .select()
      .from(interpretations)
      .where(eq(interpretations.workflowId, id));

    const actions = await db
      .select()
      .from(actionItems)
      .where(eq(actionItems.workflowId, id));

    const taskList = await db
      .select()
      .from(tasks)
      .where(eq(tasks.workflowId, id));

    const drafts = await db
      .select()
      .from(communicationDrafts)
      .where(eq(communicationDrafts.workflowId, id));

    const reminderList = await db
      .select()
      .from(reminders)
      .where(eq(reminders.workflowId, id));

    const executions = await db
      .select()
      .from(toolExecutions)
      .where(eq(toolExecutions.workflowId, id));

    const approvalList = await db
      .select()
      .from(approvals)
      .where(eq(approvals.workflowId, id));

    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.workflowId, id))
      .orderBy(desc(activityLogs.createdAt));

    return {
      ...wf,
      interpretation: interp
        ? {
            ...interp,
            missingInformation: JSON.parse(interp.missingInformation),
            automatableActions: JSON.parse(interp.automatableActions),
            humanConfirmationRequired: JSON.parse(interp.humanConfirmationRequired),
          }
        : null,
      actionItems: actions.map((a) => ({
        ...a,
        toolInput: a.toolInput ? JSON.parse(a.toolInput) : null,
      })),
      tasks: taskList,
      communicationDrafts: drafts,
      reminders: reminderList,
      toolExecutions: executions.map((e) => ({
        ...e,
        input: JSON.parse(e.input),
        output: e.output ? JSON.parse(e.output) : null,
      })),
      approvals: approvalList.map((ap) => ({
        ...ap,
        originalContent: JSON.parse(ap.originalContent),
        editedContent: ap.editedContent ? JSON.parse(ap.editedContent) : null,
      })),
      activityLogs: logs.map((l) => ({
        ...l,
        metadata: l.metadata ? JSON.parse(l.metadata) : null,
      })),
    };
  },

  async listWorkflows() {
    const list = await db
      .select()
      .from(workflows)
      .orderBy(desc(workflows.createdAt));
    return list;
  },

  // Interpretation
  async saveInterpretation(data: {
    id: string;
    workflowId: string;
    taskTitle: string;
    summary: string;
    priority: string;
    deadline?: string | null;
    missingInformation: string[];
    automatableActions: string[];
    humanConfirmationRequired: string[];
  }) {
    const now = new Date().toISOString();
    await db.insert(interpretations).values({
      id: data.id,
      workflowId: data.workflowId,
      taskTitle: data.taskTitle,
      summary: data.summary,
      priority: data.priority,
      deadline: data.deadline || null,
      missingInformation: JSON.stringify(data.missingInformation),
      automatableActions: JSON.stringify(data.automatableActions),
      humanConfirmationRequired: JSON.stringify(data.humanConfirmationRequired),
      createdAt: now,
    });
  },

  // Action Items
  async saveActionItem(data: {
    id: string;
    workflowId: string;
    description: string;
    category: string;
    reason: string;
    toolName?: string | null;
    toolInput?: Record<string, unknown> | null;
    status: string;
  }) {
    const now = new Date().toISOString();
    await db.insert(actionItems).values({
      id: data.id,
      workflowId: data.workflowId,
      description: data.description,
      category: data.category,
      reason: data.reason,
      toolName: data.toolName || null,
      toolInput: data.toolInput ? JSON.stringify(data.toolInput) : null,
      status: data.status,
      createdAt: now,
    });
  },

  async updateActionItemStatus(
    actionId: string,
    status: string,
    toolInput?: Record<string, unknown>
  ) {
    const updateData: { status: string; toolInput?: string } = { status };
    if (toolInput) {
      updateData.toolInput = JSON.stringify(toolInput);
    }
    await db
      .update(actionItems)
      .set(updateData)
      .where(eq(actionItems.id, actionId));
  },

  // Dedicated Tables
  async createTaskRecord(data: {
    id: string;
    workflowId: string;
    actionId?: string;
    title: string;
    description: string;
    priority: string;
    deadline?: string | null;
    status: string;
  }) {
    const now = new Date().toISOString();
    await db.insert(tasks).values({
      id: data.id,
      workflowId: data.workflowId,
      actionId: data.actionId || null,
      title: data.title,
      description: data.description,
      priority: data.priority,
      deadline: data.deadline || null,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    });
  },

  async createCommunicationDraft(data: {
    id: string;
    workflowId: string;
    actionId?: string;
    recipient?: string | null;
    subject: string;
    body: string;
    type: string;
    status: string;
  }) {
    const now = new Date().toISOString();
    await db.insert(communicationDrafts).values({
      id: data.id,
      workflowId: data.workflowId,
      actionId: data.actionId || null,
      recipient: data.recipient || null,
      subject: data.subject,
      body: data.body,
      type: data.type,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    });
  },

  async updateCommunicationDraft(
    draftId: string,
    data: { recipient?: string; subject?: string; body?: string; status?: string }
  ) {
    const now = new Date().toISOString();
    await db
      .update(communicationDrafts)
      .set({ ...data, updatedAt: now })
      .where(eq(communicationDrafts.id, draftId));
  },

  async createReminderRecord(data: {
    id: string;
    workflowId: string;
    actionId?: string;
    reminderText: string;
    dueDate: string;
    status: string;
  }) {
    const now = new Date().toISOString();
    await db.insert(reminders).values({
      id: data.id,
      workflowId: data.workflowId,
      actionId: data.actionId || null,
      reminderText: data.reminderText,
      dueDate: data.dueDate,
      status: data.status,
      createdAt: now,
      updatedAt: now,
    });
  },

  // Tool Executions
  async recordToolExecution(data: {
    id: string;
    workflowId: string;
    actionId?: string;
    toolName: string;
    input: Record<string, unknown>;
    output?: Record<string, unknown> | null;
    status: string;
    error?: string | null;
  }) {
    const now = new Date().toISOString();
    await db.insert(toolExecutions).values({
      id: data.id,
      workflowId: data.workflowId,
      actionId: data.actionId || null,
      toolName: data.toolName,
      input: JSON.stringify(data.input),
      output: data.output ? JSON.stringify(data.output) : null,
      status: data.status,
      error: data.error || null,
      createdAt: now,
    });
  },

  // Approvals
  async createApproval(data: {
    id: string;
    workflowId: string;
    actionId: string;
    status: string;
    originalContent: Record<string, unknown>;
  }) {
    const now = new Date().toISOString();
    await db.insert(approvals).values({
      id: data.id,
      workflowId: data.workflowId,
      actionId: data.actionId,
      status: data.status,
      originalContent: JSON.stringify(data.originalContent),
      createdAt: now,
    });
  },

  async updateApproval(
    approvalId: string,
    status: string,
    editedContent?: Record<string, unknown>
  ) {
    const updateData: { status: string; editedContent?: string } = { status };
    if (editedContent) {
      updateData.editedContent = JSON.stringify(editedContent);
    }
    await db.update(approvals).set(updateData).where(eq(approvals.id, approvalId));
  },

  // Activity Logs
  async logActivity(data: {
    id: string;
    workflowId: string;
    eventType: string;
    message: string;
    status: string;
    metadata?: Record<string, unknown>;
  }) {
    const now = new Date().toISOString();
    await db.insert(activityLogs).values({
      id: data.id,
      workflowId: data.workflowId,
      eventType: data.eventType,
      message: data.message,
      status: data.status,
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
      createdAt: now,
    });
  },
};
