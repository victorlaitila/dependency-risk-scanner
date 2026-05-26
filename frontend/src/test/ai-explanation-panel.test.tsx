import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { AIExplanationPanel } from "../components/ai-explanation-panel";
import type { VulnerabilityDetail } from "@/lib/dependency-risk-scanner";

describe("AIExplanationPanel", () => {
  beforeEach(() => {
    vi.stubEnv("VITE_USE_MOCK_API", "false");
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllEnvs();
  });

  it("does not render when no package is selected", () => {
    const { container } = render(
      <AIExplanationPanel
        packageName={null}
        version={null}
        impactScore={null}
        dependentsCount={0}
        depth={0}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it("requests explanation on mount when package is selected", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ explanation: "This is a risky package." }),
    });

    const vulnerabilities: { count: number; hasCritical: boolean; details: VulnerabilityDetail[] } = {
      count: 2,
      hasCritical: true,
      details: [
        {
          id: "TEST-1",
          severity: "medium",
          summary: "Test advisory.",
          affectedRange: ">= 4.17.0, < 4.17.21",
          fixedVersion: "4.17.21",
          sourceUrl: "https://example.com/advisories/test-1",
        },
        {
          id: "TEST-2",
          severity: "critical",
          summary: "Test advisory.",
          affectedRange: ">= 4.17.20, < 4.17.21",
          fixedVersion: "4.17.21",
          sourceUrl: "https://example.com/advisories/test-2",
        },
      ],
    };

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="lodash"
        version="4.17.21"
        impactScore={45}
        dependentsCount={5}
        depth={3}
        vulnerabilities={vulnerabilities}
      />,
    );

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "lodash",
          version: "4.17.21",
          impactScore: 45,
          dependentsCount: 5,
          depth: 3,
          vulnerabilityCount: 2,
          hasCriticalVulnerabilities: true,
          highestSeverity: "critical",
        }),
      });
    });
  });

  it("displays loading state while fetching", () => {
    const fetchMock = vi.fn(() => new Promise(() => {}));

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="lodash"
        version="4.17.21"
        impactScore={45}
        dependentsCount={5}
        depth={3}
      />,
    );

    expect(screen.getByText("Analyzing dependency impact...")).toBeInTheDocument();
    expect(screen.queryByText(/Why This Matters/i)).not.toBeInTheDocument();
  });

  it("displays explanation on successful fetch", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ explanation: "This is a risky package because of high impact." }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="lodash"
        version="4.17.21"
        impactScore={45}
        dependentsCount={5}
        depth={3}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("This is a risky package because of high impact.")).toBeInTheDocument();
    });
  });

  it("displays error message on fetch failure", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="lodash"
        version="4.17.21"
        impactScore={45}
        dependentsCount={5}
        depth={3}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Could not load explanation. Please try again later.")).toBeInTheDocument();
    });
  });

  it("handles network errors gracefully", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new Error("Network error"));

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="lodash"
        version="4.17.21"
        impactScore={45}
        dependentsCount={5}
        depth={3}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Could not load explanation. Please try again later.")).toBeInTheDocument();
    });
  });

  it("uses demo mode placeholder explanation when enabled", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "true");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="react"
        version="18.3.1"
        impactScore={6.8}
        dependentsCount={9}
        depth={0}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText(/react 18\.3\.1 has a relative structural impact score of 7/i)).toBeInTheDocument();
      expect(screen.getByText(/no critical issues are present/i)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  it("displays 'Why This Matters' section for high impact packages", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ explanation: "This is a risky package." }),
    });

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="lodash"
        version="4.17.21"
        impactScore={5.5}
        dependentsCount={5}
        depth={3}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Why This Matters")).toBeInTheDocument();
      expect(screen.getByText(/structurally central to the project/)).toBeInTheDocument();
    });
  });

  it("displays 'Why This Matters' with critical vulnerabilities context", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ explanation: "This is a risky package." }),
    });

    const vulnerabilities: { count: number; hasCritical: boolean; details: VulnerabilityDetail[] } = {
      count: 1,
      hasCritical: true,
      details: [
        {
          id: "TEST-1",
          severity: "critical",
          summary: "Critical advisory.",
          affectedRange: ">= 1.0.0, < 2.0.0",
          fixedVersion: "2.0.0",
          sourceUrl: "https://example.com/advisories/test-1",
        },
      ],
    };

    vi.stubGlobal("fetch", fetchMock);

    render(
      <AIExplanationPanel
        packageName="express"
        version="4.18.0"
        impactScore={5.5}
        dependentsCount={10}
        depth={1}
        vulnerabilities={vulnerabilities}
      />,
    );

    await waitFor(() => {
      expect(screen.getByText("Why This Matters")).toBeInTheDocument();
      expect(screen.getByText(/both structurally central and affected by critical vulnerabilities/)).toBeInTheDocument();
    });
  });
});
