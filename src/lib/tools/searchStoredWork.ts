import { repository } from "../db/repository";

export interface SearchStoredWorkInput {
  query?: string;
}

export async function executeSearchStoredWork(
  workflowId: string,
  actionId: string,
  input: SearchStoredWorkInput
) {
  const query = (input.query || "").toLowerCase();
  const workflows = await repository.listWorkflows();

  const matches = workflows
    .filter(
      (w) =>
        w.id.includes(query) ||
        w.originalRequest.toLowerCase().includes(query) ||
        w.status.toLowerCase().includes(query)
    )
    .slice(0, 5)
    .map((w) => ({
      id: w.id,
      request: w.originalRequest,
      status: w.status,
      createdAt: w.createdAt,
    }));

  return {
    query,
    matchCount: matches.length,
    matches,
    timestamp: new Date().toISOString(),
  };
}
