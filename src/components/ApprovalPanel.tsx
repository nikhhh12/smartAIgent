"use client";

import { useState } from "react";
import { UserCheck, Check, Edit3, X, Mail, Trash2, AlertTriangle, Save } from "lucide-react";

interface Approval {
  id: string;
  workflowId: string;
  actionId: string;
  status: string;
  originalContent: {
    description?: string;
    toolName?: string;
    toolInput?: Record<string, unknown>;
  };
  editedContent?: Record<string, unknown> | null;
}

interface Props {
  workflowId: string;
  approvals: Approval[];
  onApprove: (actionId: string) => Promise<void>;
  onReject: (actionId: string, reason?: string) => Promise<void>;
  onEdit: (actionId: string, editedPayload: Record<string, unknown>) => Promise<void>;
}

export default function ApprovalPanel({
  workflowId,
  approvals,
  onApprove,
  onReject,
  onEdit,
}: Props) {
  const pendingApprovals = approvals.filter((a) => a.status === "PENDING" || a.status === "EDITED");
  const resolvedApprovals = approvals.filter((a) => a.status === "APPROVED" || a.status === "REJECTED");

  const [editingActionId, setEditingActionId] = useState<string | null>(null);
  const [editRecipient, setEditRecipient] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (approvals.length === 0) return null;

  const startEditing = (ap: Approval) => {
    setEditingActionId(ap.actionId);
    const content = (ap.editedContent || ap.originalContent.toolInput || {}) as Record<string, string>;
    setEditRecipient(content.recipient || "");
    setEditSubject(content.subject || "");
    setEditBody(content.body || "");
  };

  const handleSaveEdit = async (actionId: string) => {
    setIsSubmitting(true);
    try {
      await onEdit(actionId, {
        recipient: editRecipient,
        subject: editSubject,
        body: editBody,
        type: "email",
      });
      setEditingActionId(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApprove = async (actionId: string) => {
    setIsSubmitting(true);
    try {
      await onApprove(actionId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async (actionId: string) => {
    setIsSubmitting(true);
    try {
      await onReject(actionId, "User rejected action in approval panel.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-900/90 border border-orange-950/80 rounded-xl p-6 backdrop-blur-md shadow-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2 text-orange-400">
          <UserCheck className="w-5 h-5" />
          <h3 className="text-lg font-semibold text-slate-100">Human-in-the-Loop Approval Queue</h3>
        </div>
        <span className="text-xs bg-orange-950/80 text-orange-400 border border-orange-800/80 px-2.5 py-1 rounded-full font-bold">
          {pendingApprovals.length} Action(s) Pending Approval
        </span>
      </div>

      {/* Pending Items */}
      {pendingApprovals.length > 0 ? (
        <div className="space-y-4">
          {pendingApprovals.map((ap) => {
            const currentContent = (ap.editedContent || ap.originalContent.toolInput || {}) as Record<string, unknown>;
            const toolName = ap.originalContent.toolName || "draftCommunication";
            const isEditingThis = editingActionId === ap.actionId;
            const isDeleteDeployment = toolName === "deleteDeployment";
            const isCommunication = toolName === "draftCommunication";

            return (
              <div
                key={ap.id}
                className="bg-slate-950/80 border border-orange-900/50 rounded-lg p-5 space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      {isDeleteDeployment ? (
                        <Trash2 className="w-4 h-4 text-red-400" />
                      ) : (
                        <Mail className="w-4 h-4 text-orange-400" />
                      )}
                      <h4 className="text-sm font-bold text-slate-100">
                        {ap.originalContent.description || "Action Pending Approval"}
                      </h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Tool: <code className="text-orange-300">{toolName}</code> • Status:{" "}
                      <span className="font-semibold text-orange-400">
                        {ap.status === "EDITED" ? "EDITED (AWAITING APPROVAL)" : "PENDING HUMAN APPROVAL"}
                      </span>
                    </p>
                  </div>

                  {isDeleteDeployment ? (
                    <span className="text-xs bg-red-950 text-red-400 border border-red-800 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> High-Risk Production Action
                    </span>
                  ) : (
                    <span className="text-xs bg-amber-950/60 text-amber-400 border border-amber-800/60 px-2.5 py-1 rounded-full font-medium">
                      No External Email Will Be Sent
                    </span>
                  )}
                </div>

                {/* Conditional Card Content based on Tool Type */}
                {isDeleteDeployment ? (
                  /* Destructive Deployment Approval Details */
                  <div className="bg-slate-900/90 border border-red-950 rounded-md p-4 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-400">Action:</span>{" "}
                      <span className="text-slate-100 font-medium">{ap.originalContent.description}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Deployment ID:</span>{" "}
                      <span className="text-red-300 font-mono bg-red-950/60 px-2 py-0.5 rounded border border-red-900/60">
                        {String(currentContent.deploymentId || "prod-api-2026-08-22")}
                      </span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Target Platform:</span>{" "}
                      <span className="text-slate-200 font-semibold">{String(currentContent.platform || "Vercel")}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Risk Assessment:</span>{" "}
                      <span className="text-red-400 font-bold uppercase">HIGH / DESTRUCTIVE OPERATION</span>
                    </div>
                  </div>
                ) : isCommunication && !isEditingThis ? (
                  /* Communication Draft Approval Details */
                  <div className="bg-slate-900/90 border border-slate-800 rounded-md p-4 space-y-2 text-xs">
                    <div>
                      <span className="font-semibold text-slate-400">Recipient:</span>{" "}
                      <span className="text-slate-200">{String(currentContent.recipient || "Unspecified")}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Subject:</span>{" "}
                      <span className="text-slate-200 font-medium">{String(currentContent.subject || "No subject")}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-slate-400">Body Preview:</span>
                      <pre className="mt-1 p-2.5 bg-slate-950 rounded border border-slate-800/80 text-slate-300 font-sans whitespace-pre-wrap">
                        {String(currentContent.body || "No body content")}
                      </pre>
                    </div>
                  </div>
                ) : isCommunication && isEditingThis ? (
                  /* Edit Communication Form */
                  <div className="bg-slate-900/90 border border-amber-900/60 rounded-md p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
                      <span className="flex items-center gap-1">
                        <Edit3 className="w-3.5 h-3.5" />
                        Edit Draft Content (Requires Subsequent Approval)
                      </span>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Recipient</label>
                      <input
                        type="text"
                        value={editRecipient}
                        onChange={(e) => setEditRecipient(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Subject</label>
                      <input
                        type="text"
                        value={editSubject}
                        onChange={(e) => setEditSubject(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Body</label>
                      <textarea
                        value={editBody}
                        onChange={(e) => setEditBody(e.target.value)}
                        rows={4}
                        className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-amber-500 resize-none font-sans"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingActionId(null)}
                        className="text-xs bg-slate-800 text-slate-300 px-3 py-1.5 rounded hover:bg-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(ap.actionId)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1 text-xs bg-amber-600 hover:bg-amber-500 text-white font-medium px-3.5 py-1.5 rounded transition"
                      >
                        <Save className="w-3.5 h-3.5" />
                        Save Edits (Keep Pending)
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Generic Tool Approval Details */
                  <div className="bg-slate-900/90 border border-slate-800 rounded-md p-4 space-y-2 text-xs">
                    {Object.entries(currentContent).map(([k, v]) => (
                      <div key={k}>
                        <span className="font-semibold text-slate-400">{k}:</span>{" "}
                        <span className="text-slate-200">{String(v)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Approval Action Buttons */}
                {!isEditingThis && (
                  <div className="flex items-center justify-end gap-3 pt-2">
                    {isCommunication && (
                      <button
                        type="button"
                        onClick={() => startEditing(ap)}
                        disabled={isSubmitting}
                        className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3.5 py-2 rounded-lg font-medium transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                        Edit Draft
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleReject(ap.actionId)}
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 text-xs bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800/80 px-3.5 py-2 rounded-lg font-medium transition"
                    >
                      <X className="w-3.5 h-3.5" />
                      Reject Action
                    </button>

                    <button
                      type="button"
                      onClick={() => handleApprove(ap.actionId)}
                      disabled={isSubmitting}
                      className={`flex items-center gap-1.5 text-xs text-white font-semibold px-4 py-2 rounded-lg shadow-md transition ${
                        isDeleteDeployment
                          ? "bg-red-600 hover:bg-red-500"
                          : "bg-emerald-600 hover:bg-emerald-500"
                      }`}
                    >
                      <Check className="w-4 h-4" />
                      {isDeleteDeployment ? "Approve & Delete Deployment" : "Approve & Execute Tool"}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 bg-slate-950/40 rounded-lg text-center">
          <p className="text-xs text-slate-400">All human approval items have been resolved.</p>
        </div>
      )}

      {/* Resolved Approvals History */}
      {resolvedApprovals.length > 0 && (
        <div className="border-t border-slate-800 pt-4 space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Resolved Approvals</h4>
          <div className="space-y-2">
            {resolvedApprovals.map((ap) => (
              <div
                key={ap.id}
                className="flex items-center justify-between p-3 bg-slate-950/40 rounded border border-slate-800/60 text-xs"
              >
                <span className="text-slate-300">{ap.originalContent.description || "Action Item"}</span>
                <span
                  className={`font-bold px-2.5 py-0.5 rounded-full ${
                    ap.status === "APPROVED"
                      ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                      : "bg-red-950 text-red-400 border border-red-800"
                  }`}
                >
                  {ap.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
