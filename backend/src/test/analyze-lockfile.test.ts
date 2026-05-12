import { afterEach, describe, expect, it, vi } from "vitest";
import {
  analyzePackageLock,
  analyzePackageLockWithVulns,
  buildDependencyGraph,
  computeImpactScores,
  parsePackageLockJson,
} from "../lib/analyze-lockfile.js";

const sampleLockfileJson = JSON.stringify({
  name: "sample",
  lockfileVersion: 2,
  packages: {
    "": {
      dependencies: {
        a: "1.0.0",
      },
    },
    "node_modules/a": {
      version: "1.0.0",
      dependencies: {
        b: "1.0.0",
        c: "1.0.0",
      },
    },
    "node_modules/a/node_modules/b": {
      version: "1.1.0",
      dependencies: {
        d: "1.0.0",
      },
    },
    "node_modules/a/node_modules/c": {
      version: "1.2.0",
      dependencies: {
        d: "1.0.0",
      },
    },
    "node_modules/a/node_modules/b/node_modules/d": {
      version: "2.0.0",
    },
  },
});

describe("parsePackageLockJson", () => {
  it("parses package-lock json", () => {
    const parsed = parsePackageLockJson(sampleLockfileJson);

    expect(parsed.packages).toBeDefined();
    expect(parsed.packages?.["node_modules/a"]).toBeDefined();
  });
});

describe("buildDependencyGraph", () => {
  it("builds directed edges from dependency declarations", () => {
    const parsed = parsePackageLockJson(sampleLockfileJson);
    const graph = buildDependencyGraph(parsed);

    expect(Array.from(graph.adjacency.get("a") ?? [])).toEqual(["b", "c"]);
    expect(Array.from(graph.adjacency.get("b") ?? [])).toEqual(["d"]);
    expect(Array.from(graph.adjacency.get("c") ?? [])).toEqual(["d"]);
    expect(graph.depthByNode.get("a")).toBe(0);
    expect(graph.depthByNode.get("d")).toBe(2);
    expect(graph.versionByNode.get("a")).toBe("1.0.0");
    expect(graph.versionByNode.get("b")).toBe("1.1.0");
    expect(graph.versionByNode.get("d")).toBe("2.0.0");
  });
});

describe("computeImpactScores", () => {
  it("calculates impact as downstream_count / (depth + 1)", () => {
    const parsed = parsePackageLockJson(sampleLockfileJson);
    const graph = buildDependencyGraph(parsed);
    const result = computeImpactScores(graph);

    const nodes = new Map(result.nodes.map((node: { id: string; impact: number }) => [node.id, node.impact]));
    const versions = new Map(result.nodes.map((node) => [node.id, node.version]));

    expect(nodes.get("a")).toBe(3);
    expect(nodes.get("b")).toBe(0.5);
    expect(nodes.get("c")).toBe(0.5);
    expect(nodes.get("d")).toBe(0);
    expect(versions.get("a")).toBe("1.0.0");
    expect(versions.get("b")).toBe("1.1.0");
    expect(versions.get("d")).toBe("2.0.0");
  });

  it("returns nodes and edges from analyzePackageLock", () => {
    const result = analyzePackageLock(sampleLockfileJson);

    expect(result.nodes.length).toBeGreaterThan(0);
    expect(result.edges).toContainEqual({ from: "a", to: "b" });
  });

  it("computes blast radius as transitive dependents", () => {
    const blastRadiusLockfileJson = JSON.stringify({
      name: "blast-radius",
      lockfileVersion: 2,
      packages: {
        "": { dependencies: { app: "1.0.0" } },
        "node_modules/app": {
          version: "1.0.0",
          dependencies: { "feature-a": "1.0.0", "feature-b": "1.0.0" },
        },
        "node_modules/app/node_modules/feature-a": {
          version: "1.0.0",
          dependencies: { core: "1.0.0" },
        },
        "node_modules/app/node_modules/feature-b": {
          version: "1.0.0",
          dependencies: { core: "1.0.0" },
        },
        "node_modules/app/node_modules/feature-a/node_modules/core": {
          version: "1.0.0",
        },
      },
    });

    const result = analyzePackageLock(blastRadiusLockfileJson);
    const nodeById = new Map(result.nodes.map((node) => [node.id, node]));

    expect(nodeById.get("core")?.blastRadius).toEqual(["app", "feature-a", "feature-b"]);
    expect(nodeById.get("feature-a")?.blastRadius).toEqual(["app"]);
    expect(nodeById.get("app")?.blastRadius).toEqual([]);
  });

  it("attaches structured vulnerability details when querying OSV", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        vulns: [
          {
            id: "GHSA-test-1234",
            summary: "Example advisory summary.",
            severity: [{ type: "CVSS_V3", score: 8.1 }],
            affected: [
              {
                ranges: [
                  {
                    type: "SEMVER",
                    events: [
                      { introduced: "1.0.0" },
                      { fixed: "1.0.1" },
                    ],
                  },
                ],
              },
            ],
            references: [{ type: "ADVISORY", url: "https://example.com/advisory" }],
          },
        ],
      }),
    });

    vi.stubGlobal("fetch", fetchMock);

    const result = await analyzePackageLockWithVulns(
      JSON.stringify({
        name: "sample",
        lockfileVersion: 2,
        packages: {
          "": { dependencies: { a: "1.0.0" } },
          "node_modules/a": {
            version: "1.0.0",
          },
        },
      }),
    );

    const node = result.nodes.find((item) => item.id === "a");

    expect(node?.vulnerabilities?.count).toBe(1);
    expect(node?.vulnerabilities?.hasCritical).toBe(false);
    expect(node?.vulnerabilities?.details[0]).toEqual({
      id: "GHSA-test-1234",
      severity: "high",
      summary: "Example advisory summary.",
      affectedRange: ">= 1.0.0, < 1.0.1",
      fixedVersion: "1.0.1",
      sourceUrl: "https://example.com/advisory",
    });

  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});