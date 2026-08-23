"use client";

import { CheckCircle2, AlertTriangle, Clock, ListChecks, HelpCircle } from "lucide-react";

interface Props {
  interpretation: {
    taskTitle: string;
    summary: string;
    priority: string;
    deadline?: string | null;
    missingInformation: string[];
    automatableActions: string[];
    humanConfirmationRequired: string[];
  } | null;
}

export default function InterpretationPanel({ interpretation }: Props) {
  if (!interpretation) {
    return (
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-xl p-6 text-center">
        <p className="text-slate-500 text-sm">No request interpreted yet. Submit a work request above to begin.</p>
      </div>
    );
  }

  const priorityColors: Record<string, string> = {
    low: "bg-blue-950/80 text-blue-400 border-blue-800/60",
    medium: "bg-amber-950/80 text-amber-400 border-amber-800/60",
    high: "bg-orange-950/80 text-orange-400 border-orange-800/60",
    critical: "bg-red-950/80 text-red-400 border-red-800/60",
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl space-y-6">
      <div className="flex items-start justify-between border-b border-slate-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-emerald-400">
            LLM Interpretation & Structured JSON Output
          </span>
          <h3 className="text-xl font-bold text-slate-100 mt-1">{interpretation.taskTitle}</h3>
          <p className="text-sm text-slate-400 mt-1">{interpretation.summary}</p>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full border ${
              priorityColors[interpretation.priority] || priorityColors.medium
            }`}
          >
            {interpretation.priority.toUpperCase()} PRIORITY
          </span>
          {interpretation.deadline && (
            <span className="text-xs font-medium text-slate-300 bg-slate-800 px-3 py-1 rounded-full border border-slate-700 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              {interpretation.deadline}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Missing Information */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center gap-2 text-amber-400 mb-2">
            <HelpCircle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Missing Information</h4>
          </div>
          {interpretation.missingInformation.length > 0 ? (
            <ul className="space-y-2">
              {interpretation.missingInformation.map((item, idx) => (
                <li key={idx} className="text-xs text-amber-200/90 flex items-start gap-1.5">
                  <span className="text-amber-500 font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">None identified. Full context present.</p>
          )}
        </div>

        {/* Automatable Actions */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center gap-2 text-emerald-400 mb-2">
            <CheckCircle2 className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Automatable Actions</h4>
          </div>
          {interpretation.automatableActions.length > 0 ? (
            <ul className="space-y-2">
              {interpretation.automatableActions.map((item, idx) => (
                <li key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                  <span className="text-emerald-400 font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No fully automatic actions found.</p>
          )}
        </div>

        {/* Human Confirmation Required */}
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-4">
          <div className="flex items-center gap-2 text-orange-400 mb-2">
            <AlertTriangle className="w-4 h-4" />
            <h4 className="text-xs font-bold uppercase tracking-wider">Requires Confirmation</h4>
          </div>
          {interpretation.humanConfirmationRequired.length > 0 ? (
            <ul className="space-y-2">
              {interpretation.humanConfirmationRequired.map((item, idx) => (
                <li key={idx} className="text-xs text-orange-200/90 flex items-start gap-1.5">
                  <span className="text-orange-400 font-bold">•</span>
                  {item}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-500 italic">No human confirmations requested.</p>
          )}
        </div>
      </div>
    </div>
  );
}
