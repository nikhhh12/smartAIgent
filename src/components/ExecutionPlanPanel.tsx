"use client";

import { ShieldCheck, HelpCircle, UserCheck, AlertOctagon, Wrench } from "lucide-react";

interface ActionItem {
  id: string;
  description: string;
  category: string;
  reason: string;
  toolName?: string | null;
  status: string;
}

interface Props {
  actionItems: ActionItem[];
}

export default function ExecutionPlanPanel({ actionItems }: Props) {
  if (!actionItems || actionItems.length === 0) return null;

  const categoryMeta: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: React.ReactNode }
  > = {
    EXECUTE_AUTOMATICALLY: {
      label: "Execute Automatically",
      bg: "bg-emerald-950/60",
      text: "text-emerald-400",
      border: "border-emerald-800/80",
      icon: <ShieldCheck className="w-4 h-4 text-emerald-400" />,
    },
    PREPARE_FOR_HUMAN_REVIEW: {
      label: "Prepare for Human Review",
      bg: "bg-orange-950/60",
      text: "text-orange-400",
      border: "border-orange-800/80",
      icon: <UserCheck className="w-4 h-4 text-orange-400" />,
    },
    REQUIRES_CLARIFICATION: {
      label: "Requires Clarification",
      bg: "bg-amber-950/60",
      text: "text-amber-400",
      border: "border-amber-800/80",
      icon: <HelpCircle className="w-4 h-4 text-amber-400" />,
    },
    CANNOT_EXECUTE_WITH_AVAILABLE_TOOLS: {
      label: "Cannot Automate",
      bg: "bg-red-950/60",
      text: "text-red-400",
      border: "border-red-800/80",
      icon: <AlertOctagon className="w-4 h-4 text-red-400" />,
    },
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Wrench className="w-5 h-5 text-teal-400" />
          Agent Execution Plan
        </h3>
        <span className="text-xs text-slate-400">
          Deterministic Category Router ({actionItems.length} action{actionItems.length > 1 ? "s" : ""})
        </span>
      </div>

      <div className="space-y-3">
        {actionItems.map((item) => {
          const meta =
            categoryMeta[item.category] || categoryMeta.CANNOT_EXECUTE_WITH_AVAILABLE_TOOLS;

          return (
            <div
              key={item.id}
              className={`p-4 rounded-lg border ${meta.bg} ${meta.border} flex flex-col md:flex-row md:items-center justify-between gap-4`}
            >
              <div className="space-y-1 max-w-2xl">
                <div className="flex items-center gap-2">
                  {meta.icon}
                  <h4 className="text-sm font-semibold text-slate-100">{item.description}</h4>
                </div>
                <p className="text-xs text-slate-400 italic">Reason: {item.reason}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {item.toolName && (
                  <span className="text-xs font-mono bg-slate-900/80 text-teal-300 border border-teal-800/60 px-2.5 py-1 rounded-md">
                    Tool: {item.toolName}
                  </span>
                )}
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full border ${meta.text} ${meta.border}`}
                >
                  {meta.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
