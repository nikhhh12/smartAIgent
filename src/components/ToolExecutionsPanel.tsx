"use client";

import { Database, CheckCircle, FileText, Bell, Globe, Mail } from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  deadline?: string | null;
  status: string;
}

interface Draft {
  id: string;
  recipient?: string | null;
  subject: string;
  body: string;
  type: string;
  status: string;
}

interface Reminder {
  id: string;
  reminderText: string;
  dueDate: string;
  status: string;
}

interface ToolExecution {
  id: string;
  toolName: string;
  input: Record<string, unknown>;
  output?: Record<string, unknown> | null;
  status: string;
  error?: string | null;
}

interface Props {
  tasks: Task[];
  drafts: Draft[];
  reminders: Reminder[];
  executions: ToolExecution[];
}

export default function ToolExecutionsPanel({
  tasks,
  drafts,
  reminders,
  executions,
}: Props) {
  if (
    tasks.length === 0 &&
    drafts.length === 0 &&
    reminders.length === 0 &&
    executions.length === 0
  ) {
    return null;
  }

  const websiteExecution = executions.find((e) => e.toolName === "websiteCheck" && e.output);
  const websiteResult = websiteExecution?.output as any;

  const briefExecution = executions.find((e) => e.toolName === "generateMarkdownBrief" && e.output);
  const briefResult = briefExecution?.output as any;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Database className="w-5 h-5 text-emerald-400" />
          Tool Outputs & Persistent Storage Records
        </h3>
        <span className="text-xs text-slate-400">Database Persistent State</span>
      </div>

      {/* Website Inspection Report (Scenario 2) */}
      {websiteResult && (
        <div className="bg-slate-950/80 border border-teal-900/80 rounded-lg p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-teal-900/60 pb-3">
            <div className="flex items-center gap-2 text-teal-400">
              <Globe className="w-5 h-5" />
              <h4 className="text-sm font-bold">Website Technical Audit — {websiteResult.url}</h4>
            </div>
            <span className="text-xs font-mono bg-teal-950 text-teal-300 border border-teal-800 px-2.5 py-1 rounded">
              HTTP {websiteResult.httpStatus} • {websiteResult.responseTimeMs}ms
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <p className="font-semibold text-slate-400">Page Title:</p>
              <p className="text-slate-200 mt-0.5">{websiteResult.title}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-400">Meta Description:</p>
              <p className="text-slate-200 mt-0.5">{websiteResult.metaDescription}</p>
            </div>
          </div>

          <div className="bg-slate-900/90 rounded p-3 text-xs space-y-1">
            <p className="font-bold text-slate-300">Security Response Headers Audit:</p>
            <div className="grid grid-cols-3 gap-2 text-slate-400 pt-1">
              <div>
                HSTS: <span className="text-slate-200">{websiteResult.securityHeaders?.strictTransportSecurity}</span>
              </div>
              <div>
                CSP: <span className="text-slate-200">{websiteResult.securityHeaders?.contentSecurityPolicy}</span>
              </div>
              <div>
                X-Frame-Options: <span className="text-slate-200">{websiteResult.securityHeaders?.xFrameOptions}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
            <div className="bg-emerald-950/40 border border-emerald-900/40 rounded p-3">
              <p className="font-bold text-emerald-400 mb-1">Checks Performed:</p>
              <ul className="space-y-1 text-slate-300">
                {websiteResult.checksPerformed?.map((c: string, i: number) => (
                  <li key={i}>✓ {c}</li>
                ))}
              </ul>
            </div>
            <div className="bg-amber-950/40 border border-amber-900/40 rounded p-3">
              <p className="font-bold text-amber-400 mb-1">Checks Not Implemented (Honest Bounds):</p>
              <ul className="space-y-1 text-slate-400">
                {websiteResult.checksNotImplemented?.map((c: string, i: number) => (
                  <li key={i}>- {c}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Generated Markdown Brief */}
      {briefResult && (
        <div className="bg-slate-950/80 border border-blue-900/80 rounded-lg p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-400">
            <FileText className="w-5 h-5" />
            <h4 className="text-sm font-bold">{briefResult.title}</h4>
          </div>
          <pre className="p-4 bg-slate-900 border border-slate-800 rounded text-xs text-slate-300 font-mono whitespace-pre-wrap overflow-x-auto">
            {briefResult.markdownContent}
          </pre>
        </div>
      )}

      {/* Persistent Tasks Table */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            Created Tasks ({tasks.length})
          </h4>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-slate-800 rounded-lg overflow-hidden">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-3">Task ID</th>
                  <th className="p-3">Title</th>
                  <th className="p-3">Priority</th>
                  <th className="p-3">Deadline</th>
                  <th className="p-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-200">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-950/50">
                    <td className="p-3 font-mono text-emerald-400">{t.id}</td>
                    <td className="p-3 font-medium">{t.title}</td>
                    <td className="p-3">
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                        {t.priority}
                      </span>
                    </td>
                    <td className="p-3">{t.deadline || "None"}</td>
                    <td className="p-3 font-semibold text-emerald-400">{t.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Communication Drafts List */}
      {drafts.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Mail className="w-4 h-4 text-orange-400" />
            Communication Drafts ({drafts.length})
          </h4>
          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d.id} className="p-4 bg-slate-950/60 border border-slate-800 rounded-lg text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-slate-400">Draft ID: {d.id}</span>
                  <span className="font-bold px-2.5 py-0.5 rounded-full bg-orange-950 text-orange-400 border border-orange-800">
                    {d.status}
                  </span>
                </div>
                <div className="text-slate-300">
                  <span className="font-semibold text-slate-400">Subject:</span> {d.subject}
                </div>
                <div className="p-2.5 bg-slate-900 rounded border border-slate-800 text-slate-300 font-sans whitespace-pre-wrap">
                  {d.body}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reminders List */}
      {reminders.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Bell className="w-4 h-4 text-amber-400" />
            Scheduled Reminders ({reminders.length})
          </h4>
          <div className="space-y-2">
            {reminders.map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-between p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs"
              >
                <div>
                  <p className="font-medium text-slate-200">{r.reminderText}</p>
                  <p className="text-slate-400 text-[11px]">Due: {r.dueDate}</p>
                </div>
                <span className="font-mono text-amber-400 bg-amber-950/60 border border-amber-800/80 px-2 py-0.5 rounded">
                  {r.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
