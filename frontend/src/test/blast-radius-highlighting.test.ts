import { describe, expect, it } from "vitest";
import {
  edgeOpacityForHighlight,
  getBlastRadiusSet,
  nodeOpacityForHighlight,
  type AnalyzeNode,
  type PositionedEdge,
} from "@/lib/dependency-risk-scanner";

const nodes: AnalyzeNode[] = [
  { id: "selected", version: "1.0.0", impact: 4, blastRadius: ["parent-a", "parent-b"] },
  { id: "parent-a", version: "1.0.0", impact: 2, blastRadius: [] },
  { id: "parent-b", version: "1.0.0", impact: 2, blastRadius: [] },
  { id: "unrelated", version: "1.0.0", impact: 1, blastRadius: [] },
];

describe("blast radius highlighting helpers", () => {
  it("identifies transitive blast radius nodes for the active package", () => {
    const blastRadiusSet = getBlastRadiusSet(nodes, "selected");

    expect(blastRadiusSet.has("parent-a")).toBe(true);
    expect(blastRadiusSet.has("parent-b")).toBe(true);
    expect(blastRadiusSet.has("unrelated")).toBe(false);
  });

  it("assigns opacity by selected vs blast radius vs unrelated", () => {
    const blastRadiusSet = getBlastRadiusSet(nodes, "selected");

    expect(
      nodeOpacityForHighlight({
        nodeId: "selected",
        baseOpacity: 0.4,
        activeNodeId: "selected",
        blastRadiusSet,
      }),
    ).toBe(1);

    expect(
      nodeOpacityForHighlight({
        nodeId: "parent-a",
        baseOpacity: 0.4,
        activeNodeId: "selected",
        blastRadiusSet,
      }),
    ).toBe(0.65);

    expect(
      nodeOpacityForHighlight({
        nodeId: "unrelated",
        baseOpacity: 0.4,
        activeNodeId: "selected",
        blastRadiusSet,
      }),
    ).toBe(0.12);
  });

  it("emphasizes edges only when both nodes are highlighted", () => {
    const blastRadiusSet = getBlastRadiusSet(nodes, "selected");
    const highlightedEdge: PositionedEdge = {
      from: "selected",
      to: "parent-a",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
    };
    const unrelatedEdge: PositionedEdge = {
      from: "selected",
      to: "unrelated",
      x1: 0,
      y1: 0,
      x2: 1,
      y2: 1,
    };

    expect(
      edgeOpacityForHighlight({
        edge: highlightedEdge,
        activeNodeId: "selected",
        blastRadiusSet,
      }),
    ).toBe(0.55);

    expect(
      edgeOpacityForHighlight({
        edge: unrelatedEdge,
        activeNodeId: "selected",
        blastRadiusSet,
      }),
    ).toBe(0.08);
  });
});
