# Scenario 3 Evidence — Ambiguous Work Request

## Input Request
> "Please take care of the documentation and send it to everyone before the meeting."

---

## Workflow Intake & Routing Summary
- **Workflow ID**: `wf-scenario-3`
- **Overall Status**: `REQUIRES_CLARIFICATION`
- **Core Principle Tested**: **The agent MUST NOT guess or invent missing recipients, meeting times, or documents.**

---

## 1. LLM Interpretation & Missing Information Extraction
```json
{
  "taskTitle": "Process & Distribute Documentation for Meeting",
  "summary": "User requested handling documentation and sending it to everyone prior to an unspecified meeting.",
  "priority": "medium",
  "deadline": null,
  "actionItems": [
    {
      "id": "act-ambig-1",
      "description": "Prepare documentation and distribute to team before the meeting",
      "priority": "medium",
      "requiresHumanConfirmation": true,
      "suggestedTool": "draftCommunication",
      "toolInput": {}
    }
  ],
  "missingInformation": [
    "Which specific documentation should be taken care of?",
    "Who are the intended recipients?",
    "Which meeting is this referring to and what is the exact meeting time?",
    "What specific deliverables does 'take care of' entail?"
  ],
  "automatableActions": [],
  "humanConfirmationRequired": [
    "Prepare documentation and distribute to team before the meeting"
  ]
}
```

---

## 2. Deterministic Agent Execution Planner Decision

### Planner Rule Priority Applied:
1. **Missing Required Information Check** $\rightarrow$ **Evaluated FIRST.**
2. Because `missingInformation` contains critical unstated parameters (missing document name, missing recipient email addresses, missing meeting time), the planner immediately assigned:

$$\text{Category} = \text{REQUIRES\_CLARIFICATION}$$
$$\text{Status} = \text{NEEDS\_CLARIFICATION}$$

*Crucial Architecture Note*: Even though `requiresHumanConfirmation = true`, the planner correctly prioritized `REQUIRES_CLARIFICATION` over `PREPARE_FOR_HUMAN_REVIEW` because asking a human to approve an email with zero recipient and zero content is invalid.

---

## 3. System Behavior & Activity Trace

- **No Tool Call Was Triggered**: The system did not attempt to draft an email to an invented address or create a fake meeting reminder.
- **Workflow Paused**: State set to `REQUIRES_CLARIFICATION`.
- **UI Rendered Feedback**: Showed amber missing information badge highlighting all 4 required questions for the user.

### Chronological Activity Trace:
```
14:20:00 [INFO] REQUEST_RECEIVED: New unstructured work request ingested.
14:20:01 [SUCCESS] INTERPRETATION_COMPLETED: Structured output generated. 4 missing info items detected.
14:20:01 [SUCCESS] PLAN_CREATED: Execution plan constructed with 1 action item.
14:20:01 [WARNING] REQUIRES_CLARIFICATION: Action routed to clarification: Missing critical required information: Which documentation?; Who recipients?; Which meeting?
14:20:01 [INFO] WORKFLOW_PAUSED: Workflow state set to REQUIRES_CLARIFICATION. Awaiting user context.
```
