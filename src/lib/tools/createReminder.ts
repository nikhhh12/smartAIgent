import { repository } from "../db/repository";

export interface CreateReminderInput {
  reminderText?: string;
  dueDate?: string;
}

export async function executeCreateReminder(
  workflowId: string,
  actionId: string,
  input: CreateReminderInput
) {
  const reminderId = `rem-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const reminderText = input.reminderText || "Follow-up reminder";
  const dueDate = input.dueDate || "7 days from today";

  await repository.createReminderRecord({
    id: reminderId,
    workflowId,
    actionId,
    reminderText,
    dueDate,
    status: "SCHEDULED",
  });

  return {
    reminderId,
    reminderText,
    dueDate,
    status: "SCHEDULED",
    timestamp: new Date().toISOString(),
  };
}
