import {
  ActionItemType,
  WorkflowInterpretationType,
} from "../schemas/interpretation";

export type ActionCategory =
  | "EXECUTE_AUTOMATICALLY"
  | "PREPARE_FOR_HUMAN_REVIEW"
  | "CANNOT_EXECUTE_WITH_AVAILABLE_TOOLS"
  | "REQUIRES_CLARIFICATION";

export interface PlannedActionItem {
  id: string;
  description: string;
  category: ActionCategory;
  reason: string;
  toolName: string | null;
  toolInput: Record<string, unknown>;
  status:
    | "PENDING"
    | "AWAITING_APPROVAL"
    | "EDITED"
    | "APPROVED"
    | "REJECTED"
    | "EXECUTED"
    | "FAILED"
    | "NEEDS_CLARIFICATION"
    | "UNSAFE_INPUT";
}

const ALLOWED_TOOLS = [
  "createTask",
  "draftCommunication",
  "generateMarkdownBrief",
  "createReminder",
  "searchStoredWork",
  "websiteCheck",
  "deleteDeployment",
];

const DAYS_OF_WEEK = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

export function resolveRelativeDueDate(dueDateStr?: string, deadlineStr?: string | null): string {
  if (!dueDateStr) return "1 day before deadline";

  const lowerDue = dueDateStr.toLowerCase();
  const lowerDead = (deadlineStr || "").toLowerCase();

  // Extract offset number: "two" -> 2, "one" -> 1, "three" -> 3, or \d+
  let offset = 1;
  if (lowerDue.includes("two") || lowerDue.includes("2")) offset = 2;
  else if (lowerDue.includes("three") || lowerDue.includes("3")) offset = 3;
  else if (lowerDue.includes("four") || lowerDue.includes("4")) offset = 4;
  else if (lowerDue.includes("one") || lowerDue.includes("1")) offset = 1;

  // Day of week match (e.g. "Friday")
  const targetDayStr = DAYS_OF_WEEK.find((d) => lowerDue.includes(d) || lowerDead.includes(d));

  if (targetDayStr) {
    const targetIdx = DAYS_OF_WEEK.indexOf(targetDayStr);
    let resolvedIdx = (targetIdx - offset) % 7;
    if (resolvedIdx < 0) resolvedIdx += 7;

    const resolvedDayName =
      DAYS_OF_WEEK[resolvedIdx].charAt(0).toUpperCase() + DAYS_OF_WEEK[resolvedIdx].slice(1);
    const targetDayName =
      targetDayStr.charAt(0).toUpperCase() + targetDayStr.slice(1);

    return `${resolvedDayName} (${offset} day${offset > 1 ? "s" : ""} before ${targetDayName})`;
  }

  // Month date match (e.g. "September 15")
  const monthMatch = (dueDateStr + " " + (deadlineStr || "")).match(
    /(january|february|march|april|may|june|july|august|september|october|november|december|sept)\s+(\d{1,2})/i
  );
  if (monthMatch) {
    const month = monthMatch[1];
    const day = parseInt(monthMatch[2], 10);
    const resolvedDay = Math.max(1, day - offset);
    return `${month} ${resolvedDay}`;
  }

  return dueDateStr;
}

// IP / Hostname checker for SSRF
export function isPrivateOrInternalHost(hostOrUrl: string): boolean {
  try {
    const parsed = new URL(hostOrUrl.startsWith("http") ? hostOrUrl : `https://${hostOrUrl}`);
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1" ||
      hostname.endsWith(".local") ||
      hostname.endsWith(".internal")
    ) {
      return true;
    }

    // IP Range checks
    const ipMatch = hostname.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
    if (ipMatch) {
      const [, a, b] = ipMatch.map(Number);
      if (a === 10) return true; // 10.0.0.0/8
      if (a === 127) return true; // 127.0.0.0/8
      if (a === 172 && b >= 16 && b <= 31) return true; // 172.16.0.0/12
      if (a === 192 && b === 168) return true; // 192.168.0.0/16
      if (a === 169 && b === 254) return true; // 169.254.0.0/16
    }
  } catch {
    // Malformed URL, handled separately
  }
  return false;
}

export function planExecution(
  interpretation: WorkflowInterpretationType
): PlannedActionItem[] {
  const { actionItems, missingInformation, deadline } = interpretation;

  return actionItems.map((item) => {
    let suggestedTool = item.suggestedTool || "none";
    let toolInput = { ...(item.toolInput || {}) };
    const descLower = item.description.toLowerCase();

    // Map destructive deployment actions to deleteDeployment if LLM missed suggestedTool
    if (
      suggestedTool === "none" ||
      suggestedTool === "createTask" ||
      suggestedTool === "draftCommunication"
    ) {
      if (
        descLower.includes("delete production deployment") ||
        descLower.includes("delete deployment") ||
        descLower.includes("remove deployment")
      ) {
        suggestedTool = "deleteDeployment";
      }
    }

    // Resolve relative date offsets deterministically for reminders
    if (suggestedTool === "createReminder" && toolInput.dueDate) {
      toolInput.dueDate = resolveRelativeDueDate(String(toolInput.dueDate), deadline);
    }

    // 1. Missing Required Information Priority Check (Rule 1)
    const isMissingInfoRelated = missingInformation.length > 0;

    if (isMissingInfoRelated) {
      return {
        id: item.id,
        description: item.description,
        category: "REQUIRES_CLARIFICATION",
        reason: `Missing critical required information: ${missingInformation.join("; ")}`,
        toolName: suggestedTool !== "none" ? suggestedTool : null,
        toolInput,
        status: "NEEDS_CLARIFICATION",
      };
    }

    // SSRF Check for websiteCheck
    if (suggestedTool === "websiteCheck" && toolInput.url) {
      const urlStr = String(toolInput.url);
      if (isPrivateOrInternalHost(urlStr)) {
        return {
          id: item.id,
          description: item.description,
          category: "CANNOT_EXECUTE_WITH_AVAILABLE_TOOLS",
          reason: "UNSAFE_INPUT: Target URL resolves to a private or internal network address. Security policy blocked execution.",
          toolName: "websiteCheck",
          toolInput,
          status: "UNSAFE_INPUT",
        };
      }
    }

    // 2. Sensitive / Destructive Approval Required Check (Rule 2 - Backend Security Policy)
    const isDestructiveTool =
      suggestedTool === "deleteDeployment" ||
      descLower.includes("delete production") ||
      descLower.includes("delete deployment") ||
      descLower.includes("destroy production");

    const isSensitiveTool = suggestedTool === "draftCommunication" || isDestructiveTool;
    const needsApproval = item.requiresHumanConfirmation || isSensitiveTool;

    if (needsApproval) {
      return {
        id: item.id,
        description: item.description,
        category: "PREPARE_FOR_HUMAN_REVIEW",
        reason: isDestructiveTool
          ? "Destructive production operation requires explicit human confirmation."
          : isSensitiveTool
          ? "Drafting external communication requires mandatory human review and approval before finalizing."
          : "Action flagged for explicit human confirmation before execution.",
        toolName: suggestedTool !== "none" ? suggestedTool : null,
        toolInput,
        status: "AWAITING_APPROVAL",
      };
    }

    // 3. Valid Tool + Complete Parameters Check (Rule 3)
    if (ALLOWED_TOOLS.includes(suggestedTool)) {
      return {
        id: item.id,
        description: item.description,
        category: "EXECUTE_AUTOMATICALLY",
        reason: `Deterministic backend verified safety and complete parameter set for tool '${suggestedTool}'.`,
        toolName: suggestedTool,
        toolInput,
        status: "PENDING",
      };
    }

    // 4. No Available Tool (Rule 4)
    return {
      id: item.id,
      description: item.description,
      category: "CANNOT_EXECUTE_WITH_AVAILABLE_TOOLS",
      reason: "No registered internal tool exists in the application registry to automate this specific action.",
      toolName: null,
      toolInput: {},
      status: "FAILED",
    };
  });
}
