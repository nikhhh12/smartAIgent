"use client";

import { History, ArrowRight } from "lucide-react";

interface WorkflowSummary {
  id: string;
  originalRequest: string;
  status: string;
  createdAt: string;
}

interface Props {
  workflows: WorkflowSummary[];
  activeWorkflowId: string | null;
  onSelect: (id: string) => void;
}

export default function WorkflowHistory({
  workflows,
  activeWorkflowId,
  onSelect,
}: Props) {
  if (!workflows || workflows.length === 0) return null;

  const statusColors: Record<string, string> = {
    COMPLETED: "bg-emerald-950 text-emerald-400 border-emerald-800",
    AWAITING_APPROVAL: "bg-orange-950 text-orange-400 border-orange-800",
    REQUIRES_CLARIFICATION: "bg-amber-950 text-amber-400 border-amber-800",
    FAILED: "bg-red-950 text-red-400 border-red-800",
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
          <History className="w-4 h-4 text-emerald-400" />
          Previous Workflows ({workflows.length})
        </h3>
      </div>

      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {workflows.map((wf) => {
          const isActive = wf.id === activeWorkflowId;
          const formattedDate = new Date(wf.createdAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          return (
            <button
              key={wf.id}
              onClick={() => onSelect(wf.id)}
              className={`w-full text-left p-3 rounded-lg border text-xs transition duration-150 flex items-center justify-between gap-3 ${
                isActive
                  ? "bg-slate-800 border-emerald-500/80 text-slate-100 shadow-md"
                  : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:text-white"
              }`}
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-emerald-400 truncate">{wf.id}</span>
                  <span
                    className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                      statusColors[wf.status] || "bg-slate-800 text-slate-300 border-slate-700"
                    }`}
                  >
                    {wf.status}
                  </span>
                </div>
                <p className="truncate text-slate-400">{wf.originalRequest}</p>
                <p className="text-[10px] text-slate-500">{formattedDate}</p>
              </div>

              <ArrowRight className={`w-4 h-4 shrink-0 ${isActive ? "text-emerald-400" : "text-slate-600"}`} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
