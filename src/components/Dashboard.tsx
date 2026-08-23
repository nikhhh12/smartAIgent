"use client";

import { useState, useEffect } from "react";
import WorkIntakeForm from "./WorkIntakeForm";
import InterpretationPanel from "./InterpretationPanel";
import ExecutionPlanPanel from "./ExecutionPlanPanel";
import ApprovalPanel from "./ApprovalPanel";
import ToolExecutionsPanel from "./ToolExecutionsPanel";
import ActivityTrace from "./ActivityTrace";
import WorkflowHistory from "./WorkflowHistory";
import { ShieldCheck, Cpu, LayoutDashboard, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const [currentWorkflow, setCurrentWorkflow] = useState<any>(null);
  const [workflowsList, setWorkflowsList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchWorkflowsList = async () => {
    try {
      const res = await fetch("/api/workflows");
      if (res.ok) {
        const data = await res.json();
        setWorkflowsList(data);
      }
    } catch (e) {
      console.error("Failed to load workflow history:", e);
    }
  };

  const loadWorkflowDetails = async (id: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/workflows/${id}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentWorkflow(data);
      } else {
        setErrorMsg("Failed to load workflow details");
      }
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Network error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkflowsList();
  }, []);

  const handleProcessRequest = async (requestText: string) => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestText }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process workflow");
      }

      const data = await res.json();
      setCurrentWorkflow(data);
      await fetchWorkflowsList();
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : "Error processing request");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveAction = async (actionId: string) => {
    if (!currentWorkflow) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workflows/${currentWorkflow.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentWorkflow(updated);
        await fetchWorkflowsList();
      }
    } catch (e) {
      setErrorMsg("Failed to approve action");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRejectAction = async (actionId: string, reason?: string) => {
    if (!currentWorkflow) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workflows/${currentWorkflow.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, reason }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentWorkflow(updated);
        await fetchWorkflowsList();
      }
    } catch (e) {
      setErrorMsg("Failed to reject action");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditAction = async (actionId: string, editedPayload: Record<string, unknown>) => {
    if (!currentWorkflow) return;
    setIsLoading(true);
    try {
      const res = await fetch(`/api/workflows/${currentWorkflow.id}/edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ actionId, editedPayload }),
      });
      if (res.ok) {
        const updated = await res.json();
        setCurrentWorkflow(updated);
        await fetchWorkflowsList();
      }
    } catch (e) {
      setErrorMsg("Failed to edit action payload");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-emerald-500 selection:text-white">
      {/* Top Header Navigation */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-tr from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-950/50">
              <Cpu className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-100 tracking-tight">
                Altibbe Work Intake & Execution Engine
              </h1>
              <p className="text-xs text-slate-400">
                Agentic Automation • Structured JSON • Human-in-the-Loop • Persistent Trace
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-3 py-1 rounded-full font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Security Boundaries Active
            </span>
            <button
              onClick={() => fetchWorkflowsList()}
              className="text-slate-400 hover:text-slate-200 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-700/60 transition"
              title="Refresh History"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left / Main Workspace (8 columns) */}
        <div className="lg:col-span-8 space-y-8">
          {/* Error Banner */}
          {errorMsg && (
            <div className="bg-red-950/80 border border-red-800 text-red-300 p-4 rounded-xl text-xs font-medium flex items-center justify-between">
              <span>{errorMsg}</span>
              <button onClick={() => setErrorMsg(null)} className="text-red-400 hover:text-white">
                Dismiss
              </button>
            </div>
          )}

          {/* Intake Component */}
          <WorkIntakeForm onSubmit={handleProcessRequest} isLoading={isLoading} />

          {/* Workflow Status Banner */}
          {currentWorkflow && (
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <LayoutDashboard className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400 font-mono">Active Workflow ID:</span>
                <span className="text-emerald-400 font-mono font-bold">{currentWorkflow.id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Current Status:</span>
                <span className="font-bold px-3 py-1 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {currentWorkflow.status}
                </span>
              </div>
            </div>
          )}

          {/* Interpretation Section */}
          <InterpretationPanel interpretation={currentWorkflow?.interpretation} />

          {/* Execution Plan Section */}
          <ExecutionPlanPanel actionItems={currentWorkflow?.actionItems} />

          {/* Human Approval Queue Panel */}
          {currentWorkflow?.approvals && currentWorkflow.approvals.length > 0 && (
            <ApprovalPanel
              workflowId={currentWorkflow.id}
              approvals={currentWorkflow.approvals}
              onApprove={handleApproveAction}
              onReject={handleRejectAction}
              onEdit={handleEditAction}
            />
          )}

          {/* Tool Executions & DB Outputs Panel */}
          {currentWorkflow && (
            <ToolExecutionsPanel
              tasks={currentWorkflow.tasks || []}
              drafts={currentWorkflow.communicationDrafts || []}
              reminders={currentWorkflow.reminders || []}
              executions={currentWorkflow.toolExecutions || []}
            />
          )}
        </div>

        {/* Right Sidebar (4 columns) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Chronological Activity Trace */}
          <ActivityTrace logs={currentWorkflow?.activityLogs || []} />

          {/* Previous Workflow History */}
          <WorkflowHistory
            workflows={workflowsList}
            activeWorkflowId={currentWorkflow?.id || null}
            onSelect={loadWorkflowDetails}
          />
        </div>
      </main>
    </div>
  );
}
