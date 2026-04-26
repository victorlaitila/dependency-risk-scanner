import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUpDown } from "lucide-react";
import {
  type GraphLayout,
  type PositionedEdge,
} from "@/lib/dependency-risk-scanner";
import { GRAPH_HEIGHT, GRAPH_WIDTH } from "@/lib/constants";

type DependencyGraphCardProps = {
  graphLayout: GraphLayout;
  getEdgeOpacity: (edge: PositionedEdge) => number;
  getNodeOpacity: (nodeId: string, baseOpacity: number) => number;
};

const DependencyGraphCard = ({
  graphLayout,
  getEdgeOpacity,
  getNodeOpacity,
}: DependencyGraphCardProps) => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-sm font-medium">Dependency Graph</CardTitle>
      <p className="text-sm text-muted-foreground">
        Visual representation of your dependency tree
      </p>
    </CardHeader>
    <CardContent>
      <div className="flex h-80 items-center justify-center rounded-md border border-input bg-muted/30">
        {graphLayout.nodes.length === 0 ? (
          <div className="flex flex-col items-center gap-3">
            <TrendingUpDown className="h-12 w-12 text-red-600/40" />
            <p className="px-4 text-center text-sm text-muted-foreground">
              Graph visualization will render here after analysis
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
    </CardContent>
  </Card>
);

export default DependencyGraphCard;