import {
  ActionItemType,
  WorkflowInterpretationType,
} from "../schemas/interpretation";

export function getMockInterpretation(
  requestText: string
): WorkflowInterpretationType {
  const lower = requestText.toLowerCase();

  // Test 3 / Scenario 3: Ambiguous documentation request
  if (
    lower.includes("take care of the documentation") ||
    (lower.includes("documentation") && lower.includes("everyone") && lower.includes("meeting"))
  ) {
    return {
      taskTitle: "Process & Distribute Documentation for Meeting",
      summary: "User requested handling documentation and sending it to everyone prior to an unspecified meeting.",
      priority: "medium",
      deadline: null,
      actionItems: [
        {
          id: "act-ambig-1",
          description: "Prepare documentation and distribute to team before the meeting",
          priority: "medium",
          requiresHumanConfirmation: true,
          suggestedTool: "draftCommunication",
          toolInput: {},
        },
      ],
      missingInformation: [
        "Which specific documentation should be taken care of?",
        "Who are the intended recipients?",
        "Which meeting is this referring to and what is the exact meeting time?",
        "What specific deliverables does 'take care of' entail?",
      ],
      automatableActions: [],
      humanConfirmationRequired: [
        "Prepare documentation and distribute to team before the meeting",
      ],
    };
  }

  // Production Deployment Deletion Request
  if (lower.includes("delete") && (lower.includes("deployment") || lower.includes("prod") || lower.includes("vercel"))) {
    const deploymentMatch = requestText.match(/(prod-[a-zA-Z0-9-]+|test-[a-zA-Z0-9-]+|dep-[a-zA-Z0-9-]+|dpl-[a-zA-Z0-9-]+)/i);
    const deploymentId = deploymentMatch ? deploymentMatch[0] : null;

    const platformMatch = requestText.match(/(vercel|aws|netlify|render|fly\.io|gcp)/i);
    const platform = platformMatch ? platformMatch[0] : "Vercel";

    if (!deploymentId) {
      return {
        taskTitle: "Delete Production Deployment",
        summary: "User requested deletion of a production deployment without specifying the exact deployment ID.",
        priority: "high",
        deadline: null,
        actionItems: [
          {
            id: "act-del-1",
            description: "Delete specified production deployment",
            priority: "high",
            requiresHumanConfirmation: true,
            suggestedTool: "deleteDeployment",
            toolInput: {},
          },
        ],
        missingInformation: [
          "Which specific deployment ID should be deleted?",
          "Which target platform or service (e.g. Vercel, AWS) hosts the deployment?",
        ],
        automatableActions: [],
        humanConfirmationRequired: ["Delete specified production deployment"],
      };
    }

    return {
      taskTitle: `Delete Production Deployment ${deploymentId}`,
      summary: `Request to delete production deployment ${deploymentId} on ${platform}.`,
      priority: "high",
      deadline: null,
      actionItems: [
        {
          id: "act-del-1",
          description: `Delete production deployment ${deploymentId} on ${platform}`,
          priority: "high",
          requiresHumanConfirmation: true,
          suggestedTool: "deleteDeployment",
          toolInput: {
            deploymentId,
            platform,
          },
        },
      ],
      missingInformation: [],
      automatableActions: [],
      humanConfirmationRequired: [
        `Delete production deployment ${deploymentId} on ${platform}`,
      ],
    };
  }

  // Client Email / Communication Drafting Request
  if (
    lower.includes("send an email") ||
    lower.includes("send email") ||
    lower.includes("draft an email") ||
    lower.includes("draft email") ||
    lower.includes("thank-you email") ||
    (lower.includes("email") && (lower.includes("@") || lower.includes("saying") || lower.includes("client")))
  ) {
    const recipientMatch = requestText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const recipient = recipientMatch ? recipientMatch[0] : null;

    let bodyText: string | null = null;
    let subject = "Deployment Maintenance Completed";

    // 1. Check for "saying that..." or "saying..."
    const sayingMatch = requestText.match(/saying\s+(that\s+)?([^.]+)/i);
    if (sayingMatch && sayingMatch[2]) {
      const statement = sayingMatch[2].trim();
      bodyText = statement.charAt(0).toUpperCase() + statement.slice(1) + ".";
      if (statement.toLowerCase().includes("maintenance") || statement.toLowerCase().includes("deployment")) {
        subject = "Deployment Maintenance Completed";
      } else {
        subject = "Status Update Notice";
      }
    } else if (lower.includes("thank-you") || lower.includes("thank you")) {
      subject = "Thank You & Proposed Timeline Confirmation";
      const hasSpecificDetails =
        lower.includes("meeting notes") ||
        lower.includes("key takeaways") ||
        lower.includes("timeline is confirmed as");
      if (hasSpecificDetails) {
        bodyText = `Dear Client,\n\nThank you for taking the time to speak with our team. Please confirm the proposed timeline.\n\nBest regards,\nAltibbe Health Team`;
      }
    } else if (lower.includes("meeting notes") || lower.includes("key takeaways") || lower.includes("completed friday")) {
      subject = "Project Update";
      bodyText = requestText;
    }

    // Explicit check for missing recipient or missing body content
    const isMissingDetails = !recipient || (!bodyText && !lower.includes("meeting notes") && !lower.includes("key takeaways"));
    const missingInfo: string[] = [];

    if (!recipient) {
      missingInfo.push("Intended recipient email address");
    }
    if (!bodyText && !lower.includes("meeting notes") && !lower.includes("key takeaways")) {
      missingInfo.push("Specific discussion points or message content to include in the email body");
    }

    const finalRecipient = recipient || "client@example.com";
    const finalBody = bodyText || "Deployment maintenance has been completed successfully.";

    return {
      taskTitle: `Draft Email to ${finalRecipient}`,
      summary: `Draft email communication to ${finalRecipient} regarding '${subject}'.`,
      priority: "medium",
      deadline: null,
      actionItems: [
        {
          id: "act-email-1",
          description: `Draft email communication to ${finalRecipient}`,
          priority: "medium",
          requiresHumanConfirmation: true,
          suggestedTool: "draftCommunication",
          toolInput: {
            recipient: finalRecipient,
            subject,
            body: finalBody,
            type: "email",
          },
        },
      ],
      missingInformation: isMissingDetails ? missingInfo : [],
      automatableActions: [],
      humanConfirmationRequired: [
        `Draft email communication to ${finalRecipient}`,
      ],
    };
  }

  // Dashboard Finish / Frontend Team Task
  if (lower.includes("dashboard") || lower.includes("finish the dashboard")) {
    return {
      taskTitle: "Finish Dashboard",
      summary: "Frontend team to finish the dashboard by Friday.",
      priority: "high",
      deadline: "Friday",
      actionItems: [
        {
          id: "act-dash-1",
          description: "Create task for frontend team to finish dashboard by Friday",
          priority: "high",
          requiresHumanConfirmation: false,
          suggestedTool: "createTask",
          toolInput: {
            title: "Finish Dashboard",
            description: "Frontend team to finish the dashboard by Friday.",
            priority: "high",
            deadline: "Friday",
          },
        },
        {
          id: "act-dash-2",
          description: "Schedule reminder 2 days before Friday deadline",
          priority: "medium",
          requiresHumanConfirmation: false,
          suggestedTool: "createReminder",
          toolInput: {
            reminderText: "Remind frontend team to finish dashboard",
            dueDate: "2 days before Friday",
          },
        },
      ],
      missingInformation: [],
      automatableActions: [
        "Create task for frontend team to finish dashboard by Friday",
        "Schedule reminder 2 days before Friday deadline",
      ],
      humanConfirmationRequired: [],
    };
  }

  // API Response Time Optimization (Backend Team)
  if (lower.includes("api response") || lower.includes("backend team") || lower.includes("optimize")) {
    return {
      taskTitle: "Optimize API Response Time",
      summary: "Backend team to optimize API response time by Friday.",
      priority: "high",
      deadline: "Friday",
      actionItems: [
        {
          id: "act-api-1",
          description: "Create task for backend team to optimize API response time by Friday",
          priority: "high",
          requiresHumanConfirmation: false,
          suggestedTool: "createTask",
          toolInput: {
            title: "Optimize API Response Time",
            description: "Backend team needs to optimize API response time by Friday.",
            priority: "high",
            deadline: "Friday",
          },
        },
        {
          id: "act-api-2",
          description: "Schedule reminder 2 days before Friday deadline",
          priority: "medium",
          requiresHumanConfirmation: false,
          suggestedTool: "createReminder",
          toolInput: {
            reminderText: "Remind me about optimizing API response time",
            dueDate: "two days before Friday",
          },
        },
      ],
      missingInformation: [],
      automatableActions: [
        "Create task for backend team to optimize API response time by Friday",
        "Schedule reminder 2 days before Friday deadline",
      ],
      humanConfirmationRequired: [],
    };
  }

  // Frontend Login Page Redesign / Fix Auth Bug
  if (lower.includes("login page") || lower.includes("authentication bug") || lower.includes("redesign")) {
    const isAuthBug = lower.includes("authentication bug") || lower.includes("fix the authentication");
    const taskTitle = isAuthBug ? "Fix Authentication Bug on Login Page" : "Redesign Login Page";
    const description = isAuthBug
      ? "Create task for frontend team to fix authentication bug on login page by Friday"
      : "Create task for frontend team to redesign login page by Monday";
    const deadline = isAuthBug ? "Friday" : "Monday";

    const actions: ActionItemType[] = [
      {
        id: "act-fe-1",
        description,
        priority: "high",
        requiresHumanConfirmation: false,
        suggestedTool: "createTask",
        toolInput: {
          title: taskTitle,
          description: "Frontend team task for login page.",
          priority: "high",
          deadline,
        },
      },
    ];

    if (lower.includes("remind")) {
      actions.push({
        id: "act-fe-2",
        description: `Schedule reminder 1 day before ${deadline} deadline`,
        priority: "medium",
        requiresHumanConfirmation: false,
        suggestedTool: "createReminder",
        toolInput: {
          reminderText: `Remind team about frontend ${taskTitle} deadline`,
          dueDate: `1 day before ${deadline}`,
        },
      });
    }

    return {
      taskTitle,
      summary: `Frontend team task: ${taskTitle} by ${deadline}.`,
      priority: "high",
      deadline,
      actionItems: actions,
      missingInformation: [],
      automatableActions: actions.map((a) => a.description),
      humanConfirmationRequired: [],
    };
  }

  // PostgreSQL Database Migration
  if (lower.includes("postgresql") || lower.includes("database") || lower.includes("migrate")) {
    return {
      taskTitle: "PostgreSQL Database Migration",
      summary: "Engineering team task to migrate PostgreSQL database to new server by September 15.",
      priority: "high",
      deadline: "September 15",
      actionItems: [
        {
          id: "act-pg-1",
          description: "Migrate PostgreSQL database to new server by September 15",
          priority: "high",
          requiresHumanConfirmation: false,
          suggestedTool: "createTask",
          toolInput: {
            title: "PostgreSQL Database Migration",
            description: "Engineering team to migrate PostgreSQL database to new server by September 15.",
            priority: "high",
            deadline: "September 15",
          },
        },
        {
          id: "act-pg-2",
          description: "Schedule reminder for September 10",
          priority: "medium",
          requiresHumanConfirmation: false,
          suggestedTool: "createReminder",
          toolInput: {
            reminderText: "Pre-migration check for PostgreSQL database server transition",
            dueDate: "September 10",
          },
        },
      ],
      missingInformation: [],
      automatableActions: [
        "Migrate PostgreSQL database to new server by September 15",
        "Schedule reminder for September 10",
      ],
      humanConfirmationRequired: [],
    };
  }

  // Scenario 2: Website check or URL audit (hedamo.com, localhost, 127.0.0.1, 10.0.0.1, URLs)
  const urlRegex = /(https?:\/\/[^\s]+|localhost:[0-9]+|127\.0\.0\.1|10\.0\.0\.1|[a-zA-Z0-9-]+\.(com|org|net|io|co|in|dev))/i;
  const match = requestText.match(urlRegex);

  if (
    match ||
    lower.includes("hedamo") ||
    lower.includes("website") ||
    lower.includes("http://") ||
    lower.includes("https://") ||
    lower.includes("localhost") ||
    lower.includes("127.0.0.1") ||
    lower.includes("10.0.0.1")
  ) {
    let targetUrl = match ? match[0] : "https://hedamo.com";
    targetUrl = targetUrl.replace(/[.,;:]$/, "");
    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      targetUrl = `https://${targetUrl}`;
    }

    return {
      taskTitle: "Technical Review & Security Audit of " + targetUrl,
      summary: "Perform a bounded technical inspection of " + targetUrl + " and produce a Markdown technical report.",
      priority: "medium",
      deadline: "ASAP",
      actionItems: [
        {
          id: "act-web-1",
          description: "Inspect HTTP status, latency, title, meta tags, and security headers for " + targetUrl,
          priority: "medium",
          requiresHumanConfirmation: false,
          suggestedTool: "websiteCheck",
          toolInput: { url: targetUrl },
        },
        {
          id: "act-web-2",
          description: "Generate Markdown technical brief summarizing website check results",
          priority: "medium",
          requiresHumanConfirmation: false,
          suggestedTool: "generateMarkdownBrief",
          toolInput: {
            title: "Website Inspection Report — " + targetUrl,
            overview: "Bounded technical audit results for " + targetUrl,
          },
        },
      ],
      missingInformation: [],
      automatableActions: [
        "Inspect HTTP status, latency, title, meta tags, and security headers for " + targetUrl,
        "Generate Markdown technical brief summarizing website check results",
      ],
      humanConfirmationRequired: [],
    };
  }

  // General Partnership / Business Discussion (e.g. XYZ Solutions & ABC Corp)
  if (lower.includes("xyz") || lower.includes("partnership") || lower.includes("pilot")) {
    return {
      taskTitle: "ABC Corp & XYZ Solutions Partnership & Pilot Exploration",
      summary: "Discussed joint pilot integrating XYZ's analytics platform with ABC Corp systems. Technical requirements and proposed implementation plan follow-up required.",
      priority: "high",
      deadline: "Next Week",
      actionItems: [
        {
          id: "act-part-1",
          description: "Create internal task to prepare implementation plan and pricing proposal for ABC Corp & XYZ pilot",
          priority: "high",
          requiresHumanConfirmation: false,
          suggestedTool: "createTask",
          toolInput: {
            title: "Prepare Implementation Plan & Pricing — XYZ Pilot",
            description: "Compile technical requirements and implementation pricing for joint pilot with ABC Corp.",
            priority: "high",
            deadline: "Next Week",
          },
        },
        {
          id: "act-part-2",
          description: "Schedule 7-day reminder to prepare for follow-up review meeting",
          priority: "medium",
          requiresHumanConfirmation: false,
          suggestedTool: "createReminder",
          toolInput: {
            reminderText: "Prepare follow-up meeting materials for ABC Corp and XYZ Solutions pilot review",
            dueDate: "7 days from today",
          },
        },
        {
          id: "act-part-3",
          description: "Draft thank-you and partner discussion summary communication to ABC Corp and XYZ Solutions",
          priority: "high",
          requiresHumanConfirmation: true,
          suggestedTool: "draftCommunication",
          toolInput: {
            recipient: "ABC Corp & XYZ Solutions Teams",
            subject: "Thank You — Partnership & Analytics Pilot Discussion Summary",
            body: "Dear Partners,\n\nThank you for our productive discussion today regarding the joint analytics pilot. As agreed, ABC Corp will share technical requirements while XYZ Solutions prepares the implementation proposal.\n\nBest regards,\nAltibbe Health Team",
            type: "email",
          },
        },
      ],
      missingInformation: [],
      automatableActions: [
        "Create internal task to prepare implementation plan and pricing proposal for ABC Corp & XYZ pilot",
        "Schedule 7-day reminder to prepare for follow-up review meeting",
      ],
      humanConfirmationRequired: [
        "Draft thank-you and partner discussion summary communication to ABC Corp and XYZ Solutions",
      ],
    };
  }

  // Generic Fallback
  const deadlineMatch = requestText.match(/by\s+([a-zA-Z0-9]+)/i);
  const deadline = deadlineMatch ? deadlineMatch[1] : null;
  const summaryTitle = requestText.length > 50 ? requestText.substring(0, 50) + "..." : requestText;

  const actions: ActionItemType[] = [
    {
      id: "act-custom-1",
      description: `Create task for requested work: ${summaryTitle}`,
      priority: "medium",
      requiresHumanConfirmation: false,
      suggestedTool: "createTask",
      toolInput: {
        title: summaryTitle,
        description: requestText,
        priority: "medium",
        deadline,
      },
    },
  ];

  if (lower.includes("remind")) {
    actions.push({
      id: "act-custom-2",
      description: `Schedule reminder for task: ${summaryTitle}`,
      priority: "medium",
      requiresHumanConfirmation: false,
      suggestedTool: "createReminder",
      toolInput: {
        reminderText: `Reminder for ${summaryTitle}`,
        dueDate: deadline ? `2 days before ${deadline}` : "2 days before deadline",
      },
    });
  }

  return {
    taskTitle: summaryTitle,
    summary: requestText,
    priority: "medium",
    deadline,
    actionItems: actions,
    missingInformation: [],
    automatableActions: actions.map((a) => a.description),
    humanConfirmationRequired: [],
  };
}
