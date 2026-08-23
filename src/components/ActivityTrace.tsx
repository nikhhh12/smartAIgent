"use client";

import { Activity, CheckCircle, Info, AlertTriangle, XCircle } from "lucide-react";

interface LogEvent {
  id: string;
  eventType: string;
  message: string;
  status: string;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

interface Props {
  logs: LogEvent[];
}

export default function ActivityTrace({ logs }: Props) {
  if (!logs || logs.length === 0) return null;

  const statusIcons: Record<string, React.ReactNode> = {
    SUCCESS: <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />,
    INFO: <Info className="w-4 h-4 text-blue-400 shrink-0" />,
    WARNING: <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />,
    ERROR: <XCircle className="w-4 h-4 text-red-400 shrink-0" />,
  };

  const statusBadges: Record<string, string> = {
    SUCCESS: "bg-emerald-950/80 text-emerald-400 border-emerald-800",
    INFO: "bg-blue-950/80 text-blue-400 border-blue-800",
    WARNING: "bg-amber-950/80 text-amber-400 border-amber-800",
    ERROR: "bg-red-950/80 text-red-400 border-red-800",
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 backdrop-blur-md shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          Chronological Activity Trace
        </h3>
        <span className="text-xs text-slate-400 font-mono">
          {logs.length} Event Log Entry{logs.length > 1 ? "s" : ""}
        </span>
      </div>

      <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
        {logs.map((log) => {
          const formattedTime = new Date(log.createdAt).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          });

          return (
            <div key={log.id} className="relative flex items-start justify-between gap-4 text-xs">
              <div className="absolute -left-6 top-0.5 bg-slate-900 p-0.5 rounded-full border border-slate-800">
                {statusIcons[log.status] || statusIcons.INFO}
              </div>

              <div className="space-y-1 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-slate-200">{log.eventType}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                      statusBadges[log.status] || statusBadges.INFO
                    }`}
                  >
                    {log.status}
                  </span>
                </div>
                <p className="text-slate-300 font-sans">{log.message}</p>
              </div>

              <span className="font-mono text-[11px] text-slate-400 shrink-0">{formattedTime}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
