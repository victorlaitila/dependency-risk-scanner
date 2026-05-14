import { describe, expect, it, vi } from "vitest";
import { getExplanation, type ExplanationRequest } from "../lib/ai-explanation-service.js";

const FALLBACK_EXPLANATION = "An AI-generated explanation is currently unavailable for this package.";

describe("ai-explanation-service", () => {
  it("returns fallback when no API key set", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "lodash",
      version: "4.17.21",
      impactScore: 45,
      dependentsCount: 5,
      depth: 3,
      vulnerabilityCount: 0,
      hasCriticalVulnerabilities: false,
      highestSeverity: "none",
    };

    const result = await getExplanation(req);

    expect(result.explanation).toBe(FALLBACK_EXPLANATION);
  });

  it("generates low-impact fallback", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "minimal",
      version: "1.0.0",
      impactScore: 5,
      dependentsCount: 0,
      depth: 1,
      vulnerabilityCount: 0,
      hasCriticalVulnerabilities: false,
      highestSeverity: "none",
    };

    const result = await getExplanation(req);

    expect(result.explanation).toBe(FALLBACK_EXPLANATION);
  });

  it("generates high-impact fallback", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "critical",
      version: "2.0.0",
      impactScore: 75,
      dependentsCount: 25,
      depth: 6,
      vulnerabilityCount: 2,
      hasCriticalVulnerabilities: true,
      highestSeverity: "critical",
    };

    const result = await getExplanation(req);

    expect(result.explanation).toBe(FALLBACK_EXPLANATION);
  });

  it("includes package name in fallback explanation", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "");

    const req: ExplanationRequest = {
      name: "express",
      version: "4.18.0",
      impactScore: 30,
      dependentsCount: 3,
      depth: 2,
      vulnerabilityCount: 1,
      hasCriticalVulnerabilities: false,
      highestSeverity: "medium",
    };

    const result = await getExplanation(req);

    expect(result.explanation).toBe(FALLBACK_EXPLANATION);
  });

  it("returns fallback on fetch error", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockRejectedValueOnce(new Error("Network error"));

    const req: ExplanationRequest = {
      name: "test-pkg",
      version: "1.0.0",
      impactScore: 20,
      dependentsCount: 2,
      depth: 2,
      vulnerabilityCount: 1,
      hasCriticalVulnerabilities: false,
      highestSeverity: "high",
    };

    const result = await getExplanation(req);

    expect(result.explanation).toBe(FALLBACK_EXPLANATION);
  });

  it("returns fallback on API error response", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "Service unavailable" }), {
        status: 503,
      }),
    );

    const req: ExplanationRequest = {
      name: "test-pkg",
      version: "1.0.0",
      impactScore: 20,
      dependentsCount: 2,
      depth: 2,
      vulnerabilityCount: 1,
      hasCriticalVulnerabilities: false,
      highestSeverity: "high",
    };

    const result = await getExplanation(req);

    expect(result.explanation).toBe(FALLBACK_EXPLANATION);;
  });

  it("includes vulnerability metadata in the prompt", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            generated_text: "One. Two. Three.",
          },
        ]),
        { status: 200 },
      ),
    );

    vi.stubGlobal("fetch", fetchMock);

    const req: ExplanationRequest = {
      name: "prompt-test",
      version: "1.2.3",
      impactScore: 21,
      dependentsCount: 7,
      depth: 4,
      vulnerabilityCount: 3,
      hasCriticalVulnerabilities: true,
      highestSeverity: "critical",
    };

    await getExplanation(req);

    const [, requestInit] = fetchMock.mock.calls[0];
    const body = JSON.parse(String(requestInit?.body)) as { messages: Array<{ content?: string }> };

    expect(body.messages[1].content).toContain("single compact paragraph");
    expect(body.messages[1].content).toContain("Do not use headings");
    expect(body.messages[1].content).toContain("Vulnerability count: 3");
    expect(body.messages[1].content).toContain("Has critical vulnerabilities: true");
    expect(body.messages[1].content).toContain("Highest severity: critical");
  });

  it("normalizes successful AI responses to a single paragraph", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(
        JSON.stringify([
          {
            generated_text: "One.\n\nTwo.\n\nThree.",
          },
        ]),
        { status: 200 },
      ),
    );

    const req: ExplanationRequest = {
      name: "test-pkg",
      version: "1.0.0",
      impactScore: 20,
      dependentsCount: 2,
      depth: 2,
      vulnerabilityCount: 1,
      hasCriticalVulnerabilities: false,
      highestSeverity: "high",
    };

    const result = await getExplanation(req);

    expect(result.explanation).toBe("One. Two. Three.");
  });

  it("truncates successful AI response to 350 characters", async () => {
    vi.stubEnv("HUGGINGFACE_API_KEY", "test-key");
    const longText = "a".repeat(500);
    const mockResponse = [
      {
        generated_text: `${longText}`,
      },
    ];

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce(
      new Response(JSON.stringify(mockResponse), {
        status: 200,
      }),
    );

    const req: ExplanationRequest = {
      name: "test-pkg",
      version: "1.0.0",
      impactScore: 20,
      dependentsCount: 2,
      depth: 2,
      vulnerabilityCount: 1,
      hasCriticalVulnerabilities: false,
      highestSeverity: "high",
    };

    const result = await getExplanation(req);

    expect(result.explanation.length).toBeLessThanOrEqual(350);
  });
});
