import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, ChevronUp, HelpCircle, Search, ArrowUp, ArrowDown } from "lucide-react";
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
import { strings } from "@/lib/strings";
import { getSeverityClassName } from "@/lib/severity-styles";

type SortColumn = "impact" | "impactScore" | "vulnerabilities" | null;
type SortDirection = "asc" | "desc";

type RiskTableCardProps = {
  sortedNodes: AnalyzeNode[];
  activeNodeId: string | null;
  onHighlightClick: (nodeId: string) => void;
};

const sortComparators: Record<Exclude<SortColumn, null>, (a: AnalyzeNode, b: AnalyzeNode) => number> = {
  impact: (a: AnalyzeNode, b: AnalyzeNode): number => {
    return a.impact - b.impact;
  },
  impactScore: (a: AnalyzeNode, b: AnalyzeNode): number => {
    return a.impact - b.impact;
  },
  vulnerabilities: (a: AnalyzeNode, b: AnalyzeNode): number => {
    const countDiff = (a.vulnerabilities?.count ?? 0) - (b.vulnerabilities?.count ?? 0);
    if (countDiff !== 0) return countDiff;
    // Tiebreaker: critical vulnerabilities first
    const aCritical = a.vulnerabilities?.hasCritical ? 1 : 0;
    const bCritical = b.vulnerabilities?.hasCritical ? 1 : 0;
    return bCritical - aCritical;
  },
};

const RiskTableCard = ({
  sortedNodes,
  activeNodeId,
  onHighlightClick,
}: RiskTableCardProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const handleSortColumnClick = (column: SortColumn) => {
    if (sortColumn === column) {
      // Cycle: desc -> asc -> unsorted
      if (sortDirection === "desc") {
        setSortDirection("asc");
      } else {
        setSortColumn(null);
      }
    } else {
      // New column, start with descending
      setSortColumn(column);
      setSortDirection("desc");
    }
  };

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 320);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const handleScrollToTableTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const filteredAndSortedNodes = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    let filtered = normalizedQuery
      ? sortedNodes.filter((node) => node.id.toLowerCase().includes(normalizedQuery))
      : sortedNodes;

    // Apply sorting if a column is selected
    if (sortColumn && sortColumn in sortComparators) {
      const compareFn = sortComparators[sortColumn];
      filtered = [...filtered].sort((a, b) => {
        const result = compareFn(a, b);
        return sortDirection === "desc" ? -result : result;
      });
    }

    return filtered;
  }, [sortedNodes, searchQuery, sortColumn, sortDirection]);

  const showNoMatches = sortedNodes.length > 0 && filteredAndSortedNodes.length === 0;

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column) return null;
    return sortDirection === "desc" ? (
      <ArrowDown className="h-3 w-3 ml-1" aria-label="Sorted descending" />
    ) : (
      <ArrowUp className="h-3 w-3 ml-1" aria-label="Sorted ascending" />
    );
  };

  const renderSortableHeader = (
    column: SortColumn,
    label: string,
    tooltip: string,
  ) => (
    <button
      type="button"
      onClick={() => handleSortColumnClick(column)}
      className="flex items-center gap-1.5 hover:text-foreground transition-colors text-left"
    >
      {label}
      <Tooltip content={tooltip}>
        <HelpCircle className="h-4 w-4 cursor-help text-red-500/60 hover:text-red-500/80 flex-shrink-0" />
      </Tooltip>
      {renderSortIndicator(column)}
    </button>
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-destructive" />
          <CardTitle className="text-sm font-medium">{strings.riskTableCard.title}</CardTitle>
        </div>
        <p className="text-sm text-muted-foreground">{strings.riskTableCard.description}</p>
        <p className="text-xs text-muted-foreground">{strings.riskTableCard.rankingNote}</p>
      </CardHeader>
      <CardContent>
        {sortedNodes.length > 0 && (
          <div className="mb-3 mt-2 relative">
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder={strings.riskTableCard.searchPlaceholder}
              aria-label={strings.riskTableCard.searchAriaLabel}
              className="h-9 w-full rounded-md border border-input bg-muted/50 px-3 pr-9 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            />
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        )}
        <Table className="table-fixed min-w-[880px]">
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">{strings.riskTableCard.headers.package}</TableHead>
              <TableHead className="w-[100px]">{strings.riskTableCard.headers.version}</TableHead>
              <TableHead className="w-[90px]">
                {renderSortableHeader("impact", strings.riskTableCard.headers.risk, strings.riskTableCard.headers.riskTooltip)}
              </TableHead>
              <TableHead className="w-[140px]">
                {renderSortableHeader("impactScore", strings.riskTableCard.headers.reason, strings.riskTableCard.headers.reasonTooltip)}
              </TableHead>
              <TableHead className="w-[120px]">
                {renderSortableHeader("vulnerabilities", strings.riskTableCard.headers.vulnerabilities, strings.riskTableCard.headers.vulnerabilitiesTooltip)}
              </TableHead>
              <TableHead className="w-[100px] text-right">
                <div className="flex items-center justify-end gap-1.5">
                  {strings.riskTableCard.headers.highlight}
                  <Tooltip content={strings.riskTableCard.headers.highlightTooltip}>
                    <HelpCircle className="h-4 w-4 cursor-help text-red-500/60 hover:text-red-500/80" />
                  </Tooltip>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedNodes.length === 0 ? (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                  {strings.riskTableCard.emptyTable}
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedNodes.map((node) => (
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
                    {node.impact.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {node.vulnerabilities?.count ? (
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-sm font-medium ${
                          node.vulnerabilities?.hasCritical ? getSeverityClassName("critical") : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        <span className="rounded-full bg-background/20 px-1.5 py-0.5 text-xs font-semibold tabular-nums text-current">
                          {node.vulnerabilities.count}
                        </span>
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">{strings.riskTableCard.vulnerabilitiesNone}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      type="button"
                      onClick={() => onHighlightClick(node.id)}
                      aria-label={`${strings.riskTableCard.highlightAriaLabelPrefix}${node.id}`}
                      aria-pressed={activeNodeId === node.id}
                      className={`inline-flex items-center rounded-md border px-2 py-1 text-xs transition-colors ${
                        activeNodeId === node.id
                          ? "border-foreground bg-foreground text-background"
                          : "border-input text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {strings.riskTableCard.headers.highlight}
                    </button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
          {showNoMatches && (
            <div className="mt-3 flex h-24 items-center justify-center">
              <p className="px-4 text-center text-sm text-muted-foreground">{strings.riskTableCard.noMatches}</p>
            </div>
          )}

        {sortedNodes.length > 0 && showScrollTop && (
          <button
            type="button"
            onClick={handleScrollToTableTop}
            aria-label={strings.riskTableCard.scrollToTopAriaLabel}
            className="fixed bottom-6 left-1/2 z-40 inline-flex h-10 w-10 -translate-x-1/2 items-center justify-center rounded-full border border-white/20 bg-background/70 text-muted-foreground shadow-lg shadow-black/10 backdrop-blur-md transition-colors hover:bg-background/90 hover:text-foreground"
          >
            <ChevronUp className="h-4 w-4" />
          </button>
        )}
      </CardContent>
    </Card>
  );
};

export default RiskTableCard;