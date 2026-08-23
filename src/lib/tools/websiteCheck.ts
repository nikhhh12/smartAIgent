import { isPrivateOrInternalHost } from "../planner";

export interface WebsiteCheckInput {
  url?: string;
}

export async function executeWebsiteCheck(
  workflowId: string,
  actionId: string,
  input: WebsiteCheckInput
) {
  let targetUrl = input.url || "https://hedamo.com";

  if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
    targetUrl = `https://${targetUrl}`;
  }

  // Security Gate 1: Require HTTPS
  if (targetUrl.startsWith("http://")) {
    targetUrl = targetUrl.replace("http://", "https://");
  }

  // Security Gate 2: SSRF check
  if (isPrivateOrInternalHost(targetUrl)) {
    throw new Error("UNSAFE_INPUT: Target URL resolves to a private or internal IP address.");
  }

  const startTime = Date.now();
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        "User-Agent": "Altibbe-SecurityCheck-Bot/1.0",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    // Check final URL redirect destination
    if (isPrivateOrInternalHost(res.url)) {
      throw new Error("UNSAFE_INPUT: Redirect destination resolves to a private IP space.");
    }

    const htmlText = await res.text();
    const truncatedHtml = htmlText.substring(0, 500000); // 500KB cap

    // Extract HTML <title>
    const titleMatch = truncatedHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "No title tag found";

    // Extract Meta Description
    const metaMatch = truncatedHtml.match(
      /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i
    );
    const metaDescription = metaMatch ? metaMatch[1].trim() : "No meta description found";

    // Security Headers Check
    const hsts = res.headers.get("strict-transport-security");
    const csp = res.headers.get("content-security-policy");
    const xFrame = res.headers.get("x-frame-options");

    return {
      url: targetUrl,
      status: "SUCCESS",
      httpStatus: res.status,
      statusText: res.statusText,
      responseTimeMs,
      title,
      metaDescription,
      securityHeaders: {
        strictTransportSecurity: hsts || "Missing",
        contentSecurityPolicy: csp ? "Present" : "Missing",
        xFrameOptions: xFrame || "Missing",
      },
      checksPerformed: [
        "HTTPS reachability check",
        "HTTP status code validation",
        "Response latency measurement",
        "Page title extraction",
        "Meta description analysis",
        "Security response headers audit (HSTS, CSP, X-Frame-Options)",
      ],
      checksNotImplemented: [
        "Full WCAG accessibility compliance audit",
        "Deep SEO link graph analysis",
        "JavaScript DOM runtime execution analysis",
        "Active vulnerability penetration testing",
      ],
      limitations: "Bounded HTTP inspection; static response analysis without client-side JS evaluation.",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Check failed: HTTP request timed out after 5000ms.");
    }
    throw error;
  }
}
