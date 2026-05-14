import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, afterEach, beforeEach } from "vitest";
import Index from "../pages/Index";

beforeEach(() => {
  vi.stubEnv("VITE_USE_MOCK_API", "false");
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("Index", () => {
  it("triggers API call on file upload", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/explain")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ explanation: "This is a risky package." }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          nodes: [{ id: "a", version: "1.0.0", impact: 3, blastRadius: [] }],
          edges: [{ from: "a", to: "b" }],
        }),
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<Index />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["{}"], "package-lock.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://localhost:3001/analyze",
        expect.objectContaining({ method: "POST" }),
      );
    });
  });

  it("updates UI with backend response", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/explain")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ explanation: "This is a risky package." }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          nodes: [
            { id: "pkg-a", version: "4.0.0", impact: 4, blastRadius: [] },
            { id: "pkg-b", version: "1.0.0", impact: 1, blastRadius: ["pkg-a"] },
          ],
          edges: [{ from: "pkg-a", to: "pkg-b" }],
        }),
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<Index />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["{}"], "package-lock.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Highlight pkg-a" })).toBeInTheDocument();
      expect(screen.getByText("4.0.0")).toBeInTheDocument();
      expect(screen.getByText("Impact score: 4.00")).toBeInTheDocument();
      expect(container.querySelectorAll("svg[aria-label='Dependency graph'] circle")).toHaveLength(2);
      expect(container.querySelectorAll("svg[aria-label='Dependency graph'] line")).toHaveLength(1);
    });
  });

  it("expands vulnerability details for a vulnerable package", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/explain")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ explanation: "This is a risky package." }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({
          nodes: [
            {
              id: "pkg-vuln",
              version: "1.0.0",
              impact: 4,
              blastRadius: [],
              vulnerabilities: {
                count: 1,
                hasCritical: true,
                details: [
                  {
                    id: "GHSA-test-1234",
                    severity: "critical",
                    summary: "Example advisory summary.",
                    affectedRange: ">= 1.0.0, < 1.0.1",
                    fixedVersion: "1.0.1",
                    sourceUrl: "https://example.com/advisory",
                  },
                ],
              },
            },
          ],
          edges: [],
        }),
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<Index />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["{}"], "package-lock.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });

    const highlightButton = await screen.findByRole("button", {
      name: "Highlight pkg-vuln",
    });

    fireEvent.click(highlightButton);

    expect(await screen.findByText("Dependency Impact & Security Context")).toBeInTheDocument();
    expect(screen.getByText("Known Vulnerabilities")).toBeInTheDocument();
    expect(screen.getByText("Advisory ID")).toBeInTheDocument();
    const matches = await screen.findAllByText("GHSA-test-1234");
    expect(matches.length).toBeGreaterThan(0);
    expect(screen.getByText("Critical")).toBeInTheDocument();
    expect(screen.getByText("Example advisory summary.")).toBeInTheDocument();
    expect(screen.getByText(/>= 1\.0\.0, < 1\.0\.1/)).toBeInTheDocument();
    expect(screen.getByText("1.0.1")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "https://example.com/advisory" })).toHaveAttribute(
      "href",
      "https://example.com/advisory",
    );
  });

  it("highlights the corresponding graph node on highlight button click", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/explain")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ explanation: "This is a risky package." }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          nodes: [
            { id: "pkg-a", version: "4.0.0", impact: 4, blastRadius: [] },
            { id: "pkg-b", version: "1.0.0", impact: 1, blastRadius: ["pkg-a"] },
          ],
          edges: [{ from: "pkg-a", to: "pkg-b" }],
        }),
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<Index />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["{}"], "package-lock.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Highlight pkg-b" })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole("button", { name: "Highlight pkg-b" }));

    const circles = container.querySelectorAll("svg[aria-label='Dependency graph'] circle");

    expect(circles[0].getAttribute("opacity")).toBe("0.65");
    expect(circles[1].getAttribute("opacity")).toBe("1");
  });

  it("keeps only one highlighted package active at a time", async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes("/explain")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({ explanation: "This is a risky package." }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          nodes: [
            { id: "pkg-a", version: "4.0.0", impact: 4, blastRadius: [] },
            { id: "pkg-b", version: "1.0.0", impact: 1, blastRadius: ["pkg-a"] },
          ],
          edges: [{ from: "pkg-a", to: "pkg-b" }],
        }),
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    render(<Index />);
    const input = document.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["{}"], "package-lock.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Highlight pkg-b" })).toBeInTheDocument();
    });

    const highlightA = screen.getByRole("button", { name: "Highlight pkg-a" });
    const highlightB = screen.getByRole("button", { name: "Highlight pkg-b" });

    fireEvent.click(highlightA);
    expect(highlightA).toHaveAttribute("aria-pressed", "true");
    expect(highlightB).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(highlightB);
    expect(highlightA).toHaveAttribute("aria-pressed", "false");
    expect(highlightB).toHaveAttribute("aria-pressed", "true");

    fireEvent.click(highlightB);
    expect(highlightA).toHaveAttribute("aria-pressed", "false");
    expect(highlightB).toHaveAttribute("aria-pressed", "false");
  });

  it("uses mock data in demo mode", async () => {
    vi.stubEnv("VITE_USE_MOCK_API", "true");

    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const { container } = render(<Index />);
    const input = container.querySelector("input[type='file']") as HTMLInputElement;
    const file = new File(["{}"], "package-lock.json", { type: "application/json" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/this live demo uses mock data/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Highlight react" })).toBeInTheDocument();
      expect(screen.getByText("18.3.1")).toBeInTheDocument();
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });
});
