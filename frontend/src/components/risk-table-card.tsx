import { AlertTriangle, HelpCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tooltip } from "@/components/ui/tooltip";
import {
  riskBadgeClassName,
  riskLevel,
  type AnalyzeNode,
} from "@/lib/dependency-risk-scanner";

type RiskTableCardProps = {
  sortedNodes: AnalyzeNode[];
  activeNodeId: string | null;
  onHighlightClick: (nodeId: string) => void;
};

const RiskTableCard = ({
  sortedNodes,
  activeNodeId,
  onHighlightClick,
}: RiskTableCardProps) => (
  <Card>
    <CardHeader className="pb-3">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 text-destructive" />
        <CardTitle className="text-sm font-medium">Top Impact Packages</CardTitle>
      </div>
      <p className="text-sm text-muted-foreground">
        Packages with the highest dependency impact in your graph
      </p>
    </CardHeader>
    <CardContent>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Package</TableHead>
            <TableHead className="w-[100px]">Version</TableHead>
            <TableHead className="w-[80px]">
              <div className="flex items-center gap-1.5">
                Risk
                <Tooltip content="Relative impact tier derived from dependency graph position and reach">
                  <HelpCircle className="h-4 w-4 cursor-help text-red-500/60 hover:text-red-500/80" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead>
              <div className="flex items-center gap-1.5">
                Reason
                <Tooltip content="Impact score estimates how many packages are affected if this package changes">
                  <HelpCircle className="h-4 w-4 cursor-help text-red-500/60 hover:text-red-500/80" />
                </Tooltip>
              </div>
            </TableHead>
            <TableHead className="w-[100px] text-right">
              <div className="flex items-center justify-end gap-1.5">
                Highlight
                <Tooltip content="Click to highlight this package and all packages that depend on it in the dependency graph">
                  <HelpCircle className="h-4 w-4 cursor-help text-red-500/60 hover:text-red-500/80" />
                </Tooltip>
              </div>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedNodes.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                Upload a package-lock.json to populate this table
              </TableCell>
            </TableRow>
          ) : (
            sortedNodes.map((node) => (
              <TableRow
                key={node.id}
                className={activeNodeId === node.id ? "bg-muted/50" : undefined}
              >
                <TableCell className="font-mono text-sm">{node.id}</TableCell>
                <TableCell className="font-mono text-sm text-muted-foreground">{node.version}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center justify-center rounded-md px-2.5 py-0.5 text-xs font-medium leading-5 ${riskBadgeClassName(node.impact)}`}
                  >
                    {riskLevel(node.impact)}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  Impact score: {node.impact.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <button
                    type="button"
                    onClick={() => onHighlightClick(node.id)}
                    aria-label={`Highlight ${node.id}`}
                    aria-pressed={activeNodeId === node.id}
                    className={`inline-flex items-center rounded-md border px-2 py-1 text-xs transition-colors ${
                      activeNodeId === node.id
                        ? "border-foreground bg-foreground text-background"
                        : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    Highlight
                  </button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </CardContent>
  </Card>
);

export default RiskTableCard;