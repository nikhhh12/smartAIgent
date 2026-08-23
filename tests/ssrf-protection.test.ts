import { describe, it, expect } from "vitest";
import { isPrivateOrInternalHost } from "../src/lib/planner";

describe("SSRF Security Protection Bounds", () => {
  it("detects and blocks localhost, 127.0.0.1, and private IP ranges", () => {
    expect(isPrivateOrInternalHost("http://localhost:3000")).toBe(true);
    expect(isPrivateOrInternalHost("http://127.0.0.1/admin")).toBe(true);
    expect(isPrivateOrInternalHost("http://10.0.0.5")).toBe(true);
    expect(isPrivateOrInternalHost("http://192.168.1.1")).toBe(true);
    expect(isPrivateOrInternalHost("http://172.20.0.1")).toBe(true);
    expect(isPrivateOrInternalHost("http://169.254.169.254")).toBe(true);
  });

  it("permits valid public HTTPS domains", () => {
    expect(isPrivateOrInternalHost("https://hedamo.com")).toBe(false);
    expect(isPrivateOrInternalHost("https://google.com")).toBe(false);
  });
});
