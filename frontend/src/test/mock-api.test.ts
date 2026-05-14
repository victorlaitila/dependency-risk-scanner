import { afterEach, describe, expect, it, vi } from "vitest";
import { mockExplainPackage } from "@/lib/mock-api";

describe("mockExplainPackage", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("returns package-first structural explanations for non-vulnerable packages", async () => {
    vi.useFakeTimers();

    const promise = mockExplainPackage({
      name: "react",
      version: "18.3.1",
      impactScore: 6.8,
      dependentsCount: 9,
      depth: 0,
      vulnerabilityCount: 0,
      hasCriticalVulnerabilities: false,
      highestSeverity: "none",
    });

    await vi.advanceTimersByTimeAsync(250);
    const result = await promise;

    expect(result.explanation).toContain("react 18.3.1 has a relative structural impact score of 7");
    expect(result.explanation).toContain("9 direct dependents");
    expect(result.explanation).toContain("no critical issues are present");

  });

  it("includes vulnerability context and combined risk language", async () => {
    vi.useFakeTimers();

    const promise = mockExplainPackage({
      name: "axios",
      version: "1.7.2",
      impactScore: 2.7,
      dependentsCount: 2,
      depth: 2,
      vulnerabilityCount: 1,
      hasCriticalVulnerabilities: false,
      highestSeverity: "high",
    });

    await vi.advanceTimersByTimeAsync(250);
    const result = await promise;

    expect(result.explanation).toContain("axios 1.7.2 has a relative structural impact score of 3");
    expect(result.explanation).toContain("1 known vulnerability with high severity is present");
    expect(result.explanation).toContain("2 direct dependents");

  });
});