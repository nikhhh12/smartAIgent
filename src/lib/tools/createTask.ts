import { repository } from "../db/repository";
import { randomUUID } from "crypto";

export interface CreateTaskInput {
  title?: string;
  description?: string;
  priority?: string;
  deadline?: string | null;
}

export async function executeCreateTask(
  workflowId: string,
  actionId: string,
  input: CreateTaskInput
) {
  const taskId = `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const title = input.title || "Untitled Task";
  const description = input.description || "No description provided.";
  const priority = input.priority || "medium";
  const deadline = input.deadline || null;

  await repository.createTaskRecord({
    id: taskId,
    workflowId,
    actionId,
    title,
    description,
    priority,
    deadline,
    status: "PENDING",
  });

  return {
    taskId,
    status: "CREATED",
    title,
    description,
    priority,
    deadline,
    timestamp: new Date().toISOString(),
  };
}
