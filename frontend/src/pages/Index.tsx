import { Package } from "lucide-react";
import { useMemo, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import DependencyGraphCard from "@/components/dependency-graph-card";
import RiskTableCard from "@/components/risk-table-card";
import UploadLockfileCard from "@/components/upload-lockfile-card";
import { AIExplanationPanel } from "@/components/ai-explanation-panel";
import { analyzeLockfile } from "@/lib/api";
import { strings } from "@/lib/strings";
import {
  buildGraphLayout,
  edgeOpacityForHighlight,
  getBlastRadiusSet,
  nodeOpacityForHighlight,
  type AnalyzeEdge,
  type AnalyzeNode,
  type PositionedEdge,
} from "@/lib/dependency-risk-scanner";

const Index = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [nodes, setNodes] = useState<AnalyzeNode[]>([]);
  const [edges, setEdges] = useState<AnalyzeEdge[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleZoneClick = () => fileInputRef.current?.click();

  const sortedNodes = useMemo(
    () => [...nodes].sort((left, right) => right.impact - left.impact),
    [nodes],
  );

  const graphLayout = useMemo(() => buildGraphLayout(nodes, edges), [nodes, edges]);
  const activeNodeId = selectedNodeId;
  const blastRadiusSet = useMemo(() => getBlastRadiusSet(nodes, activeNodeId), [nodes, activeNodeId]);

  const analyzeFile = async (file: File): Promise<void> => {
    setIsLoading(true);
    setError(null);
    setFileName(file.name);
    setSelectedNodeId(null);

    try {
      const data = await analyzeLockfile(file);

      setNodes(data.nodes ?? []);
      setEdges(data.edges ?? []);
    } catch {
      setNodes([]);
      setEdges([]);
      setError(strings.uploadLockfileCard.error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (file) {
      void analyzeFile(file);
      event.target.value = "";
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();

    const file = event.dataTransfer.files?.[0];

    if (file) {
      void analyzeFile(file);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleHighlightClick = (nodeId: string) => {
    setSelectedNodeId((currentId) => (currentId === nodeId ? null : nodeId));
  };

  const getNodeOpacity = (nodeId: string, baseOpacity: number) => {
    return nodeOpacityForHighlight({
      nodeId,
      baseOpacity,
      activeNodeId,
      blastRadiusSet,
    });
  };

  const getEdgeOpacity = (edge: PositionedEdge) => {
    return edgeOpacityForHighlight({
      edge,
      activeNodeId,
      blastRadiusSet,
    });
  };

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === activeNodeId),
    [nodes, activeNodeId],
  );

  const selectedNodeDepth = useMemo(() => {
    if (!activeNodeId || edges.length === 0) return 0;

    const visited = new Set<string>();
    const queue: Array<{ id: string; depth: number }> = [{ id: activeNodeId, depth: 0 }];
    let maxDepth = 0;

    while (queue.length > 0) {
      const { id, depth } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      maxDepth = Math.max(maxDepth, depth);

      const dependents = edges.filter((e) => e.to === id).map((e) => e.from);
      for (const dependent of dependents) {
        if (!visited.has(dependent)) {
          queue.push({ id: dependent, depth: depth + 1 });
        }
      }
    }

    return maxDepth;
  }, [activeNodeId, edges]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b px-6 py-4">
        <div className="mx-auto flex max-w-5xl items-center gap-2">
          <Package className="h-5 w-5 text-foreground text-red-600" />
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {strings.app.title}
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-6 px-6 py-8">
        <UploadLockfileCard
          fileInputRef={fileInputRef}
          isLoading={isLoading}
          fileName={fileName}
          error={error}
          onZoneClick={handleZoneClick}
          onFileInputChange={handleFileInputChange}
          onDrop={handleDrop}
        />
        <DependencyGraphCard
          graphLayout={graphLayout}
          getEdgeOpacity={getEdgeOpacity}
          getNodeOpacity={getNodeOpacity}
          activeNodeId={activeNodeId}
          highlightedCount={blastRadiusSet.size + (activeNodeId ? 1 : 0)}
        />
        {activeNodeId && (
          <AIExplanationPanel
            packageName={selectedNode?.id ?? null}
            version={selectedNode?.version ?? null}
            impactScore={selectedNode?.impact ?? null}
            dependentsCount={selectedNode?.blastRadius.length ?? 0}
            depth={selectedNodeDepth}
            vulnerabilities={selectedNode?.vulnerabilities?.details ?? null}
          />
        )}
        <RiskTableCard
          sortedNodes={sortedNodes}
          activeNodeId={activeNodeId}
          onHighlightClick={handleHighlightClick}
        />
      </main>
    </div>
  );
};

export default Index;
