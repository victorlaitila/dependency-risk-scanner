import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpDown } from "lucide-react";
import { isMockMode } from "@/lib/api";
import { strings } from "@/lib/strings";
import {
  type GraphLayout,
  type PositionedEdge,
} from "@/lib/dependency-risk-scanner";
import { GRAPH_HEIGHT, GRAPH_WIDTH } from "@/lib/constants";

type DependencyGraphCardProps = {
  graphLayout: GraphLayout;
  getEdgeOpacity: (edge: PositionedEdge) => number;
  getNodeOpacity: (nodeId: string, baseOpacity: number) => number;
  activeNodeId: string | null;
  highlightedCount: number;
};

const DependencyGraphCard = ({
  graphLayout,
  getEdgeOpacity,
  getNodeOpacity,
  activeNodeId,
  highlightedCount,
}: DependencyGraphCardProps) => {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium">{strings.dependencyGraphCard.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{strings.dependencyGraphCard.description}</p>
        {graphLayout.nodes.length > 0 && isMockMode() && (
          <p className="text-sm text-muted-foreground">
            <span className="text-red-600">{strings.dependencyGraphCard.mockModeNotePrefix}</span>{" "}
            {strings.dependencyGraphCard.mockModeNote} {strings.dependencyGraphCard.mockModeNoteSuffix}{" "}
            <a
              href="https://github.com/victorlaitila/dependency-risk-scanner"
              target="_blank"
              rel="noreferrer"
              className="underline hover:text-foreground"
            >
              {strings.dependencyGraphCard.sourceCodeLink}
            </a>
            .
          </p>
        )}
        <br />
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-red-600" />
            {strings.dependencyGraphCard.higherImpact}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-slate-400" />
            {strings.dependencyGraphCard.lowerImpact}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full border border-foreground/50" />
            {strings.dependencyGraphCard.largerNode}
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-80 items-center justify-center rounded-md border border-input bg-muted/30">
          {graphLayout.nodes.length === 0 ? (
            <div className="flex flex-col items-center gap-3">
              <TrendingUpDown className="h-12 w-12 text-red-600/40" />
              <p className="px-4 text-center text-sm text-muted-foreground">
                {strings.dependencyGraphCard.emptyState}
              </p>
            </div>
          ) : (
            <svg
              aria-label="Dependency graph"
              className="h-full w-full"
              viewBox={`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`}
              preserveAspectRatio="xMidYMid meet"
            >
              {graphLayout.edges.map((edge) => (
                <line
                  key={`${edge.from}-${edge.to}`}
                  x1={edge.x1}
                  y1={edge.y1}
                  x2={edge.x2}
                  y2={edge.y2}
                  stroke="rgb(148, 163, 184)"
                  strokeWidth="1"
                  strokeOpacity={getEdgeOpacity(edge)}
                />
              ))}
              {graphLayout.nodes.map((node) => (
                <circle
                  key={node.id}
                  cx={node.x}
                  cy={node.y}
                  r={node.radius}
                  fill={node.fill}
                  opacity={getNodeOpacity(node.id, node.opacity)}
                />
              ))}
            </svg>
          )}
      </div>
        {activeNodeId && (
          <p className="mt-3 text-xs text-muted-foreground">
            {strings.dependencyGraphCard.selectionPrefix} <span className="font-mono text-foreground">{activeNodeId}</span>, {strings.dependencyGraphCard.selectionSuffix} {highlightedCount}
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default DependencyGraphCard;