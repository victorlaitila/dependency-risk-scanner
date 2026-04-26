export type GraphNode = {
  id: string;
  version: string;
  impact: number;
  blastRadius: string[];
};

export type GraphEdge = {
  from: string;
  to: string;
};

export type AnalyzeResult = {
  nodes: GraphNode[];
  edges: GraphEdge[];
};

type DependencyTree = Record<string, { dependencies?: DependencyTree }>;

type PackageEntry = {
  version?: string;
  dependencies?: Record<string, unknown>;
};

type PackageLockFile = {
  dependencies?: DependencyTree;
  packages?: Record<string, PackageEntry>;
};

type MutableGraph = {
  adjacency: Map<string, Set<string>>;
  depthByNode: Map<string, number>;
  versionByNode: Map<string, string>;
};

function ensureNode(graph: MutableGraph, node: string): void {
  if (!graph.adjacency.has(node)) {
    graph.adjacency.set(node, new Set<string>());
  }
}

function setMinDepth(depthByNode: Map<string, number>, node: string, depth: number): void {
  const current = depthByNode.get(node);

  if (current === undefined || depth < current) {
    depthByNode.set(node, depth);
  }
}

function setVersion(versionByNode: Map<string, string>, node: string, version: string | undefined): void {
  if (!version) {
    return;
  }

  if (!versionByNode.has(node)) {
    versionByNode.set(node, version);
  }
}

function packageNameFromPath(path: string): string | null {
  if (!path.includes("node_modules/")) {
    return null;
  }

  const segments = path.split("/");
  const index = segments.lastIndexOf("node_modules");

  if (index < 0 || index + 1 >= segments.length) {
    return null;
  }

  let name = segments[index + 1];

  if (name.startsWith("@") && index + 2 < segments.length) {
    name = `${name}/${segments[index + 2]}`;
  }

  return name || null;
}

function packageDepthFromPath(path: string): number {
  if (!path.includes("node_modules/")) {
    return 0;
  }

  const matches = path.match(/node_modules\//g);
  return Math.max((matches?.length ?? 1) - 1, 0);
}

function addEdge(graph: MutableGraph, from: string, to: string): void {
  ensureNode(graph, from);
  ensureNode(graph, to);
  graph.adjacency.get(from)?.add(to);
}

function walkDependencyTree(
  dependencies: DependencyTree | undefined,
  graph: MutableGraph,
  depth: number,
): void {
  if (!dependencies) {
    return;
  }

  for (const [name, entry] of Object.entries(dependencies)) {
    ensureNode(graph, name);
    setMinDepth(graph.depthByNode, name, depth);

    for (const childName of Object.keys(entry.dependencies ?? {})) {
      addEdge(graph, name, childName);
    }

    walkDependencyTree(entry.dependencies, graph, depth + 1);
  }
}

export function parsePackageLockJson(source: string): PackageLockFile {
  return JSON.parse(source) as PackageLockFile;
}

export function buildDependencyGraph(lockfile: PackageLockFile): MutableGraph {
  const graph: MutableGraph = {
    adjacency: new Map<string, Set<string>>(),
    depthByNode: new Map<string, number>(),
    versionByNode: new Map<string, string>(),
  };

  for (const [path, entry] of Object.entries(lockfile.packages ?? {})) {
    const from = packageNameFromPath(path);

    if (!from) {
      continue;
    }

    const depth = packageDepthFromPath(path);
    ensureNode(graph, from);
    setMinDepth(graph.depthByNode, from, depth);
    setVersion(graph.versionByNode, from, entry.version);

    for (const to of Object.keys(entry.dependencies ?? {})) {
      addEdge(graph, from, to);
    }
  }

  walkDependencyTree(lockfile.dependencies, graph, 0);

  return graph;
}

function downstreamCount(adjacency: Map<string, Set<string>>, start: string): number {
  const visited = new Set<string>();
  const stack = [...(adjacency.get(start) ?? [])];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const next of adjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        stack.push(next);
      }
    }
  }

  return visited.size;
}

function buildReverseAdjacency(adjacency: Map<string, Set<string>>): Map<string, Set<string>> {
  const reverse = new Map<string, Set<string>>();

  for (const node of adjacency.keys()) {
    reverse.set(node, new Set<string>());
  }

  for (const [from, targets] of adjacency.entries()) {
    for (const to of targets) {
      if (!reverse.has(to)) {
        reverse.set(to, new Set<string>());
      }
      reverse.get(to)?.add(from);
    }
  }

  return reverse;
}

function transitiveDependents(reverseAdjacency: Map<string, Set<string>>, start: string): string[] {
  const visited = new Set<string>();
  const stack = [...(reverseAdjacency.get(start) ?? [])];

  while (stack.length > 0) {
    const current = stack.pop();

    if (!current || visited.has(current)) {
      continue;
    }

    visited.add(current);

    for (const next of reverseAdjacency.get(current) ?? []) {
      if (!visited.has(next)) {
        stack.push(next);
      }
    }
  }

  return Array.from(visited).sort((left, right) => left.localeCompare(right));
}

export function computeImpactScores(graph: MutableGraph): AnalyzeResult {
  const edgeMap = new Map<string, GraphEdge>();
  const reverseAdjacency = buildReverseAdjacency(graph.adjacency);

  for (const [from, targets] of graph.adjacency.entries()) {
    for (const to of targets) {
      const key = `${from}->${to}`;
      edgeMap.set(key, { from, to });
    }
  }

  const nodes: GraphNode[] = Array.from(graph.adjacency.keys())
    .sort((left, right) => left.localeCompare(right))
    .map((id) => {
      const depth = graph.depthByNode.get(id) ?? 0;
      const downstream = downstreamCount(graph.adjacency, id);

      return {
        id,
        version: graph.versionByNode.get(id) ?? "",
        impact: downstream / (depth + 1),
        blastRadius: transitiveDependents(reverseAdjacency, id),
      };
    });

  const edges = Array.from(edgeMap.values()).sort((left, right) => {
    const byFrom = left.from.localeCompare(right.from);
    if (byFrom !== 0) {
      return byFrom;
    }

    return left.to.localeCompare(right.to);
  });

  return { nodes, edges };
}

export function analyzePackageLock(source: string): AnalyzeResult {
  const lockfile = parsePackageLockJson(source);
  const graph = buildDependencyGraph(lockfile);

  return computeImpactScores(graph);
}
