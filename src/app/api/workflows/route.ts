import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { interpretRequest } from "@/lib/llm/interpreter";
import { planExecution } from "@/lib/planner";
import { executeTool } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const requestText = body.requestText?.trim();

    if (!requestText) {
      return NextResponse.json(
        { error: "Request text is required" },
        { status: 400 }
      );
    }

    const workflowId = `wf-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 1. INTAKE
    await repository.createWorkflow(workflowId, requestText);
    await repository.logActivity({
      id: `act-${Date.now()}-1`,
      workflowId,
      eventType: "REQUEST_RECEIVED",
      message: "New unstructured work request ingested.",
      status: "INFO",
      metadata: { requestText },
    });

    // 2. INTERPRETATION
    await repository.logActivity({
      id: `act-${Date.now()}-2`,
      workflowId,
      eventType: "INTERPRETATION_STARTED",
      message: "LLM interpretation engine analyzing request payload.",
      status: "INFO",
    });

    let interpretationResult;
    try {
      interpretationResult = await interpretRequest(requestText);
    } catch (llmErr) {
      const errMsg = llmErr instanceof Error ? llmErr.message : String(llmErr);
      await repository.updateWorkflowStatus(workflowId, "FAILED");
      await repository.logActivity({
        id: `act-${Date.now()}-err`,
        workflowId,
        eventType: "VALIDATION_FAILED",
        message: `LLM interpretation failed: ${errMsg}`,
        status: "ERROR",
      });
      return NextResponse.json(
        { error: `Interpretation failed: ${errMsg}` },
        { status: 422 }
      );
    }

    const { data: interp, isMock, modelName, traceEvents } = interpretationResult;

    // Log granular trace events returned by interpreter
    if (traceEvents && traceEvents.length > 0) {
      for (const te of traceEvents) {
        await repository.logActivity({
          id: `act-${Date.now()}-te-${Math.random().toString(36).substring(2, 7)}`,
          workflowId,
          eventType: te.eventType,
          message: te.message,
          status: te.status,
        });
      }
    }

    await repository.saveInterpretation({
      id: `interp-${workflowId}`,
      workflowId,
      taskTitle: interp.taskTitle,
      summary: interp.summary,
      priority: interp.priority,
      deadline: interp.deadline,
      missingInformation: interp.missingInformation,
      automatableActions: interp.automatableActions,
      humanConfirmationRequired: interp.humanConfirmationRequired,
    });

    await repository.updateWorkflowStatus(workflowId, "INTERPRETED");
    await repository.logActivity({
      id: `act-${Date.now()}-3`,
      workflowId,
      eventType: "INTERPRETATION_COMPLETED",
      message: `Structured output generated (${modelName || "Gemini 2.0 Flash"}). Priority: ${interp.priority}.`,
      status: "SUCCESS",
      metadata: { title: interp.taskTitle, isMock, modelName },
    });

    // 3. PLANNING
    const plannedActions = planExecution(interp);
    await repository.updateWorkflowStatus(workflowId, "PLANNED");

    await repository.logActivity({
      id: `act-${Date.now()}-4`,
      workflowId,
      eventType: "PLAN_CREATED",
      message: `Execution plan constructed with ${plannedActions.length} action item(s).`,
      status: "SUCCESS",
    });

    let hasPendingApproval = false;
    let hasClarification = false;

    // Save action items & process execution strategy
    for (const action of plannedActions) {
      const actionId = action.id.startsWith(workflowId) ? action.id : `${workflowId}-${action.id}`;

      await repository.saveActionItem({
        id: actionId,
        workflowId,
        description: action.description,
        category: action.category,
        reason: action.reason,
        toolName: action.toolName,
        toolInput: action.toolInput,
        status: action.status,
      });

      if (action.category === "EXECUTE_AUTOMATICALLY" && action.toolName) {
        await repository.logActivity({
          id: `act-${Date.now()}-tool-start-${actionId}`,
          workflowId,
          eventType: "TOOL_STARTED",
          message: `Auto-executing tool '${action.toolName}' for action: ${action.description}`,
          status: "INFO",
        });

        await executeTool(action.toolName, workflowId, actionId, action.toolInput);
      } else if (action.category === "PREPARE_FOR_HUMAN_REVIEW") {
        hasPendingApproval = true;
        await repository.createApproval({
          id: `appr-${actionId}`,
          workflowId,
          actionId: actionId,
          status: "PENDING",
          originalContent: {
            description: action.description,
            toolName: action.toolName,
            toolInput: action.toolInput,
          },
        });

        await repository.logActivity({
          id: `act-${Date.now()}-appr-${actionId}`,
          workflowId,
          eventType: "APPROVAL_REQUIRED",
          message: `Action requires human confirmation: ${action.description}`,
          status: "WARNING",
          metadata: { actionId, toolName: action.toolName },
        });
      } else if (action.category === "REQUIRES_CLARIFICATION") {
        hasClarification = true;
        await repository.logActivity({
          id: `act-${Date.now()}-clarify-${actionId}`,
          workflowId,
          eventType: "REQUIRES_CLARIFICATION",
          message: `Action routed to clarification: ${action.reason}`,
          status: "WARNING",
        });
      } else if (action.category === "CANNOT_EXECUTE_WITH_AVAILABLE_TOOLS") {
        await repository.logActivity({
          id: `act-${Date.now()}-unexec-${actionId}`,
          workflowId,
          eventType: "ACTION_UNEXECUTABLE",
          message: `Action cannot be automated: ${action.reason}`,
          status: action.status === "UNSAFE_INPUT" ? "ERROR" : "WARNING",
        });
      }
    }

    // Determine overall workflow status
    if (hasPendingApproval) {
      await repository.updateWorkflowStatus(workflowId, "AWAITING_APPROVAL");
    } else if (hasClarification) {
      await repository.updateWorkflowStatus(workflowId, "REQUIRES_CLARIFICATION");
    } else {
      await repository.updateWorkflowStatus(workflowId, "COMPLETED");
      await repository.logActivity({
        id: `act-${Date.now()}-complete`,
        workflowId,
        eventType: "WORKFLOW_COMPLETED",
        message: "Workflow processing completed.",
        status: "SUCCESS",
      });
    }

    const fullWorkflow = await repository.getWorkflow(workflowId);
    return NextResponse.json(fullWorkflow);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Internal workflow error: ${errMsg}` },
      { status: 500 }
    );
  }
}

export async function GET() {
  const workflowsList = await repository.listWorkflows();
  return NextResponse.json(workflowsList);
}
