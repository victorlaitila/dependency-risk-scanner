import {
  ACTIVE_NODE_OPACITY,
  BLAST_RADIUS_NODE_OPACITY,
  DEFAULT_EDGE_OPACITY,
  DIMMED_EDGE_OPACITY,
  DIMMED_NODE_OPACITY,
  GRAPH_HEIGHT,
  GRAPH_WIDTH,
  HIGHLIGHTED_EDGE_OPACITY,
} from "@/lib/constants";

export type AnalyzeNode = {
  id: string;
  version: string;
  impact: number;
  blastRadius: string[];
  vulnerabilities?: {
    count: number;
    hasCritical: boolean;
    details: VulnerabilityDetail[];
  };
};

export type VulnerabilitySeverity = "low" | "medium" | "high" | "critical";

export type VulnerabilityDetail = {
  id: string;
  severity: VulnerabilitySeverity;
  summary: string;
  affectedRange: string;
  fixedVersion: string | null;
  sourceUrl: string | null;
};

export type AnalyzeEdge = {
  from: string;
  to: string;
};

export type AnalyzeResponse = {
  nodes: AnalyzeNode[];
  edges: AnalyzeEdge[];
};

export type PositionedNode = AnalyzeNode & {
  x: number;
  y: number;
  radius: number;
  fill: string;
  opacity: number;
};

export type PositionedEdge = {
  from: AnalyzeEdge["from"];
  to: AnalyzeEdge["to"];
  x1: number;
  y1: number;
  x2: number;
  y2: number;
};

export type GraphLayout = {
  nodes: PositionedNode[];
  edges: PositionedEdge[];
  maxImpact: number;
};

export function getBlastRadiusSet(nodes: AnalyzeNode[], activeNodeId: string | null): Set<string> {
  if (!activeNodeId) {
    return new Set<string>();
  }

  const activeNode = nodes.find((node) => node.id === activeNodeId);

  return new Set(activeNode?.blastRadius ?? []);
}

export function nodeOpacityForHighlight(params: {
  nodeId: string;
  baseOpacity: number;
  activeNodeId: string | null;
  blastRadiusSet: Set<string>;
}): number {
  const {
    nodeId,
    baseOpacity,
    activeNodeId,
    blastRadiusSet,
  } = params;

  if (!activeNodeId) {
    return baseOpacity;
  }

  if (nodeId === activeNodeId) {
    return ACTIVE_NODE_OPACITY;
  }

  if (blastRadiusSet.has(nodeId)) {
    return BLAST_RADIUS_NODE_OPACITY;
  }

  return DIMMED_NODE_OPACITY;
}

export function edgeOpacityForHighlight(params: {
  edge: PositionedEdge;
  activeNodeId: string | null;
  blastRadiusSet: Set<string>;
}): number {
  const {
    edge,
    activeNodeId,
    blastRadiusSet,
  } = params;

  if (!activeNodeId) {
    return DEFAULT_EDGE_OPACITY;
  }

  const highlightedNodeIds = new Set<string>(blastRadiusSet);
  highlightedNodeIds.add(activeNodeId);

  return highlightedNodeIds.has(edge.from) && highlightedNodeIds.has(edge.to)
    ? HIGHLIGHTED_EDGE_OPACITY
    : DIMMED_EDGE_OPACITY;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function impactColor(impact: number, maxImpact: number): string {
  if (maxImpact <= 0) {
    return "rgb(156, 163, 175)";
  }

  const ratio = Math.pow(clamp(impact / maxImpact, 0, 1), 0.7);
  const gray = [148, 163, 184];
  const red = [220, 38, 38];
  const r = Math.round(gray[0] + (red[0] - gray[0]) * ratio);
  const g = Math.round(gray[1] + (red[1] - gray[1]) * ratio);
  const b = Math.round(gray[2] + (red[2] - gray[2]) * ratio);

  return `rgb(${r}, ${g}, ${b})`;
}

export function impactRadius(impact: number, maxImpact: number): number {
  if (maxImpact <= 0) {
    return 7;
  }

  const ratio = Math.sqrt(clamp(impact / maxImpact, 0, 1));

  return 6 + ratio * 14;
}

export function impactOpacity(impact: number, maxImpact: number): number {
  if (maxImpact <= 0) {
    return 0.35;
  }

  const ratio = Math.pow(clamp(impact / maxImpact, 0, 1), 0.85);

  return 0.22 + ratio * 0.78;
}

export function buildGraphLayout(nodes: AnalyzeNode[], edges: AnalyzeEdge[]): GraphLayout {
  if (nodes.length === 0) {
    return { nodes: [], edges: [], maxImpact: 0 };
  }

  const nodeById = new Map(nodes.map((node) => [node.id, node]));
  const maxImpact = Math.max(...nodes.map((node) => node.impact), 0);
  const radiusById = new Map<string, number>();
  const positions = new Map<string, { x: number; y: number; vx: number; vy: number }>();
  const angleStep = (Math.PI * 2) / nodes.length;
  const centerX = GRAPH_WIDTH / 2;
  const centerY = GRAPH_HEIGHT / 2;
  const baseRadius = Math.min(GRAPH_WIDTH, GRAPH_HEIGHT) / 2 - 24;

  nodes.forEach((node, index) => {
    const radius = impactRadius(node.impact, maxImpact);
    radiusById.set(node.id, radius);
    positions.set(node.id, {
      x: centerX + Math.cos(index * angleStep) * baseRadius * 0.7,
      y: centerY + Math.sin(index * angleStep) * baseRadius * 0.7,
      vx: 0,
      vy: 0,
    });
  });

  for (let iteration = 0; iteration < 180; iteration += 1) {
    for (let leftIndex = 0; leftIndex < nodes.length; leftIndex += 1) {
      const left = positions.get(nodes[leftIndex].id);

      if (!left) {
        continue;
      }

      for (let rightIndex = leftIndex + 1; rightIndex < nodes.length; rightIndex += 1) {
        const right = positions.get(nodes[rightIndex].id);

        if (!right) {
          continue;
        }

        const dx = right.x - left.x;
        const dy = right.y - left.y;
        const distance = Math.max(Math.hypot(dx, dy), 1);
        const force = 900 / (distance * distance);
        const fx = (dx / distance) * force;
        const fy = (dy / distance) * force;

        left.vx -= fx;
        left.vy -= fy;
        right.vx += fx;
        right.vy += fy;
      }
    }

    for (const edge of edges) {
      const source = positions.get(edge.from);
      const target = positions.get(edge.to);

      if (!source || !target) {
        continue;
      }

      const dx = target.x - source.x;
      const dy = target.y - source.y;
      const distance = Math.max(Math.hypot(dx, dy), 1);
      const force = (distance - 90) * 0.03;
      const fx = (dx / distance) * force;
      const fy = (dy / distance) * force;

      source.vx += fx;
      source.vy += fy;
      target.vx -= fx;
      target.vy -= fy;
    }

    for (const [id, point] of positions.entries()) {
      const dx = centerX - point.x;
      const dy = centerY - point.y;

      point.vx += dx * 0.002;
      point.vy += dy * 0.002;
      point.vx *= 0.85;
      point.vy *= 0.85;
      point.x = clamp(point.x + point.vx, 24, GRAPH_WIDTH - 24);
      point.y = clamp(point.y + point.vy, 24, GRAPH_HEIGHT - 24);
      positions.set(id, point);
    }
  }

  const positionedNodes = nodes.map((node) => {
    const point = positions.get(node.id);

    return {
      ...node,
      x: point?.x ?? centerX,
      y: point?.y ?? centerY,
      radius: radiusById.get(node.id) ?? 8,
      fill: impactColor(node.impact, maxImpact),
      opacity: impactOpacity(node.impact, maxImpact),
    };
  });

  const positionedEdges = edges
    .map((edge) => {
      const source = positions.get(edge.from);
      const target = positions.get(edge.to);

      if (!source || !target || !nodeById.has(edge.from) || !nodeById.has(edge.to)) {
        return null;
      }

      return {
        from: edge.from,
        to: edge.to,
        x1: source.x,
        y1: source.y,
        x2: target.x,
        y2: target.y,
      };
    })
    .filter((edge): edge is PositionedEdge => edge !== null);

  return {
    nodes: positionedNodes,
    edges: positionedEdges,
    maxImpact,
  };
}

export function riskLevel(impact: number): string {
  if (impact >= 5) {
    return "High";
  }

  if (impact >= 2) {
    return "Medium";
  }

  return "Low";
}

export function riskBadgeClassName(impact: number): string {
  if (impact >= 5) {
    return "bg-red-600 text-white";
  }

  if (impact >= 2) {
    return "bg-amber-500 text-white";
  }

  return "bg-emerald-600 text-white";
}