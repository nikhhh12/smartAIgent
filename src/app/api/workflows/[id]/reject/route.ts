import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { actionId, reason } = body;

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

    // Idempotency Check: If already rejected, return workflow state immediately
    if (approval?.status === "REJECTED" || action.status === "REJECTED") {
      return NextResponse.json(workflow);
    }

    if (approval) {
      await repository.updateApproval(approval.id, "REJECTED");
    }

    await repository.updateActionItemStatus(actionId, "REJECTED");

    await repository.logActivity({
      id: `act-${Date.now()}-rejected`,
      workflowId: params.id,
      eventType: "APPROVAL_REJECTED",
      message: `Human rejected action: ${action.description}. ${reason ? `Reason: ${reason}` : ""}`,
      status: "WARNING",
      metadata: { actionId, reason },
    });

    // Check remaining pending approvals
    const updatedWf = await repository.getWorkflow(params.id);
    const pendingRemaining = updatedWf?.approvals.some((a) => a.status === "PENDING");

    if (!pendingRemaining) {
      await repository.updateWorkflowStatus(params.id, "REJECTED");
      await repository.logActivity({
        id: `act-${Date.now()}-completed-reject`,
        workflowId: params.id,
        eventType: "WORKFLOW_COMPLETED",
        message: "Workflow concluded with rejected action item(s). No tools executed.",
        status: "INFO",
      });
    }

    const finalWf = await repository.getWorkflow(params.id);
    return NextResponse.json(finalWf);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
