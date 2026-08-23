import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";
import { executeTool } from "@/lib/tools";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { actionId } = body;

    if (!actionId) {
      return NextResponse.json({ error: "actionId is required" }, { status: 400 });
    }

    const workflow = await repository.getWorkflow(params.id);
    if (!workflow) {
      return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }

    const action = workflow.actionItems.find((a) => a.id === actionId);
    if (!action) {
      return NextResponse.json({ error: "Action item not found" }, { status: 404 });
    }

    const approval = workflow.approvals.find((ap) => ap.actionId === actionId);

    // 1. Idempotency Check: If already approved or action executed, do not re-run tool
    if (approval?.status === "APPROVED" || action.status === "EXECUTED") {
      console.log(`[Approval Route] Action ${actionId} is already approved/executed. Returning existing workflow state.`);
      return NextResponse.json(workflow);
    }

    if (approval?.status === "REJECTED") {
      return NextResponse.json({ error: "Cannot approve a rejected action." }, { status: 400 });
    }

    // 2. Mark Approval as APPROVED
    if (approval) {
      await repository.updateApproval(approval.id, "APPROVED");
    }

    await repository.logActivity({
      id: `act-${Date.now()}-granted`,
      workflowId: params.id,
      eventType: "APPROVAL_GRANTED",
      message: `Human granted approval for action: ${action.description}`,
      status: "SUCCESS",
      metadata: { actionId, toolName: action.toolName },
    });

    // 3. Execute approved tool using strictly validated stored payload (no re-interpretation)
    if (action.toolName) {
      const payload = (approval?.editedContent || action.toolInput || {}) as Record<string, unknown>;

      await repository.updateWorkflowStatus(params.id, "EXECUTING");

      await repository.logActivity({
        id: `act-${Date.now()}-tool-start`,
        workflowId: params.id,
        eventType: "TOOL_STARTED",
        message: `Executing approved tool '${action.toolName}' for action: ${action.description}`,
        status: "INFO",
        metadata: { toolName: action.toolName, payload },
      });

      const toolResult = await executeTool(action.toolName, params.id, action.id, payload, true);

      if (toolResult.success) {
        await repository.updateActionItemStatus(actionId, "EXECUTED");

        // Check if all pending approvals are resolved
        const updatedWf = await repository.getWorkflow(params.id);
        const pendingRemaining = updatedWf?.approvals.some((a) => a.status === "PENDING");

        if (!pendingRemaining) {
          await repository.updateWorkflowStatus(params.id, "COMPLETED");
          await repository.logActivity({
            id: `act-${Date.now()}-completed-appr`,
            workflowId: params.id,
            eventType: "WORKFLOW_COMPLETED",
            message: `Approved tool '${action.toolName}' executed successfully. Workflow completed.`,
            status: "SUCCESS",
          });
        }
      } else {
        await repository.updateActionItemStatus(actionId, "FAILED");
        await repository.updateWorkflowStatus(params.id, "FAILED");
        await repository.logActivity({
          id: `act-${Date.now()}-failed-appr`,
          workflowId: params.id,
          eventType: "WORKFLOW_FAILED",
          message: `Approved tool '${action.toolName}' execution failed: ${toolResult.error}`,
          status: "ERROR",
        });
      }
    } else {
      await repository.updateActionItemStatus(actionId, "APPROVED");
      await repository.updateWorkflowStatus(params.id, "COMPLETED");
    }

    const finalWf = await repository.getWorkflow(params.id);
    return NextResponse.json(finalWf);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
