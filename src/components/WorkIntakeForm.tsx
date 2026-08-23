"use client";

import { useState } from "react";
import { Send, Sparkles, AlertCircle } from "lucide-react";

interface Props {
  onSubmit: (text: string) => Promise<void>;
  isLoading: boolean;
}

export default function WorkIntakeForm({ onSubmit, isLoading }: Props) {
  const [requestText, setRequestText] = useState("");

  const presetScenarios = [
    {
      label: "Scenario 1: Business Work",
      text: "We spoke to ABC Corp. They need the updated pricing document by Friday. Please prepare a response, create a task for the team, and remind me next week.",
    },
    {
      label: "Scenario 2: Website Work",
      text: "Review hedamo.com and produce a short technical report.",
    },
    {
      label: "Scenario 3: Ambiguous Request",
      text: "Please take care of the documentation and send it to everyone before the meeting.",
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requestText.trim() || isLoading) return;
    onSubmit(requestText);
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-slate-100">Work Request Intake</h2>
        </div>
        <span className="text-xs text-slate-400 font-mono bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
          Agentic Intake Engine v1.0
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <textarea
            id="work-request-input"
            value={requestText}
            onChange={(e) => setRequestText(e.target.value)}
            placeholder="Enter an unstructured work request (e.g., 'We spoke to ABC Corp. They need the updated pricing document by Friday...')"
            className="w-full h-32 bg-slate-950/70 border border-slate-700/80 rounded-lg p-3.5 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition font-sans text-sm resize-none"
            disabled={isLoading}
          />
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400 mr-1">Load Preset:</span>
          {presetScenarios.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setRequestText(s.text)}
              className="text-xs bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white px-3 py-1.5 rounded-md border border-slate-700/60 transition"
              disabled={isLoading}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between pt-2">
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
            Untrusted text is isolated and parsed into structured JSON schemas.
          </p>

          <button
            id="process-request-btn"
            type="submit"
            disabled={isLoading || !requestText.trim()}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-medium text-sm px-5 py-2.5 rounded-lg shadow-lg shadow-emerald-950/30 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Process Request
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
