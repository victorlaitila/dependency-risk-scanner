import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import { AIExplanationPanel } from "../components/ai-explanation-panel";

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
      expect(fetchMock).toHaveBeenCalledWith("http://localhost:3001/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "lodash",
          version: "4.17.21",
          impactScore: 45,
          dependentsCount: 5,
          depth: 3,
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
      expect(screen.getByText("Could not load explanation")).toBeInTheDocument();
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
      expect(screen.getByText("Could not load explanation")).toBeInTheDocument();
    });
  });

  it("uses demo mode placeholder explanation when enabled", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "true");

    const fetchMock = vi.fn();
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
      expect(screen.getByText(/\[Mock Placeholder\]/i)).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
