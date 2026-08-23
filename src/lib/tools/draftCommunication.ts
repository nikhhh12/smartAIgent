import { repository } from "../db/repository";

export interface DraftCommunicationInput {
  recipient?: string;
  subject?: string;
  body?: string;
  content?: string;
  message?: string;
  type?: string;
}

export async function executeDraftCommunication(
  workflowId: string,
  actionId: string,
  input: DraftCommunicationInput,
  isApproved: boolean = false
) {
  const draftId = `draft-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const recipient = input.recipient || "Unspecified Recipient";
  const subject = input.subject || "Draft Communication";
  const body = input.body || input.content || input.message || "No body content generated.";
  const type = input.type || "email";
  const status = isApproved ? "APPROVED_DRAFT" : "DRAFT";

  await repository.createCommunicationDraft({
    id: draftId,
    workflowId,
    actionId,
    recipient,
    subject,
    body,
    type,
    status,
  });

  return {
    draftId,
    recipient,
    subject,
    body,
    type,
    status,
    note: "DRAFT ONLY. No external communication was sent.",
    timestamp: new Date().toISOString(),
  };
}
