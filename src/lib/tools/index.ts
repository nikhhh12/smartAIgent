import { repository } from "../db/repository";
import { executeCreateTask } from "./createTask";
import { executeDraftCommunication } from "./draftCommunication";
import { executeCreateReminder } from "./createReminder";
import { executeGenerateBrief } from "./generateMarkdownBrief";
import { executeSearchStoredWork } from "./searchStoredWork";
import { executeWebsiteCheck } from "./websiteCheck";
import { executeDeleteDeployment } from "./deleteDeployment";

export async function executeTool(
  toolName: string,
  workflowId: string,
  actionId: string,
  input: Record<string, unknown>,
  isApproved: boolean = false
) {
  const executionId = `exec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  try {
    let output: Record<string, unknown> = {};

    switch (toolName) {
      case "createTask":
        output = await executeCreateTask(workflowId, actionId, input);
        break;
      case "draftCommunication":
        output = await executeDraftCommunication(workflowId, actionId, input, isApproved);
        break;
      case "createReminder":
        output = await executeCreateReminder(workflowId, actionId, input);
        break;
      case "generateMarkdownBrief":
        output = await executeGenerateBrief(workflowId, actionId, input);
        break;
      case "searchStoredWork":
        output = await executeSearchStoredWork(workflowId, actionId, input);
        break;
      case "websiteCheck":
        output = await executeWebsiteCheck(workflowId, actionId, input);
        break;
      case "deleteDeployment":
        output = await executeDeleteDeployment(workflowId, actionId, input);
        break;
      default:
        throw new Error(`Tool '${toolName}' is not registered in internal tool registry.`);
    }

    await repository.recordToolExecution({
      id: executionId,
      workflowId,
      actionId,
      toolName,
      input,
      output,
      status: "SUCCESS",
    });

    await repository.updateActionItemStatus(actionId, "EXECUTED");

    await repository.logActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workflowId,
      eventType: "TOOL_COMPLETED",
      message: `Tool '${toolName}' executed successfully for action item.`,
      status: "SUCCESS",
      metadata: { toolName, executionId, output },
    });

    return { success: true, output };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);

    await repository.recordToolExecution({
      id: executionId,
      workflowId,
      actionId,
      toolName,
      input,
      output: null,
      status: "FAILED",
      error: errorMsg,
    });

    await repository.updateActionItemStatus(actionId, "FAILED");

    await repository.logActivity({
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      workflowId,
      eventType: "TOOL_FAILED",
      message: `Tool '${toolName}' execution failed: ${errorMsg}`,
      status: "ERROR",
      metadata: { toolName, executionId, error: errorMsg },
    });

    return { success: false, error: errorMsg };
  }
}
