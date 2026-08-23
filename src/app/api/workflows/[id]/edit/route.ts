import { NextResponse } from "next/server";
import { repository } from "@/lib/db/repository";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { actionId, editedPayload } = body;

    if (!actionId || !editedPayload) {
      return NextResponse.json(
        { error: "actionId and editedPayload are required" },
        { status: 400 }
      );
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
    if (approval) {
      await repository.updateApproval(approval.id, "EDITED", editedPayload);
    }

    // Update action item status & tool input (keeping status as EDITED / AWAITING_APPROVAL)
    await repository.updateActionItemStatus(actionId, "EDITED", editedPayload);

    await repository.logActivity({
      id: `act-${Date.now()}-edited`,
      workflowId: params.id,
      eventType: "ACTION_EDITED",
      message: `Human edited action payload for: ${action.description}. Action remains awaiting approval.`,
      status: "INFO",
      metadata: { actionId, editedPayload },
    });

    const finalWf = await repository.getWorkflow(params.id);
    return NextResponse.json(finalWf);
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: errMsg }, { status: 500 });
  }
}
