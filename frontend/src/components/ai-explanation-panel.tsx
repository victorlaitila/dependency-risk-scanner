import { useEffect, useRef, useState } from "react";
import { Lightbulb, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { explainPackage } from "@/lib/api";
import { strings } from "@/lib/strings";
import { getSeverityDotClassName } from "@/lib/severity-styles";
import { generateWhyThisMatters } from "@/lib/why-this-matters";
import { ExplanationSection } from "@/components/explanation-section";
import { AdvisoryDetailCard } from "@/components/advisory-detail-card";
import type { AnalyzeNode, VulnerabilitySeverity, VulnerabilityDetail } from "@/lib/dependency-risk-scanner";

const SEVERITY_RANK: Record<VulnerabilitySeverity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

const EMPTY_VULNERABILITIES: VulnerabilityDetail[] = [];

interface AIExplanationPanelProps {
  packageName: string | null;
  version: string | null;
  impactScore: number | null;
  dependentsCount: number;
  depth: number;
  vulnerabilities?: AnalyzeNode["vulnerabilities"] | null;
}

function getHighestSeverity(vulnerabilities: VulnerabilityDetail[]): VulnerabilitySeverity | "none" {
  if (vulnerabilities.length === 0) {
    return "none";
  }

  return vulnerabilities.reduce<VulnerabilitySeverity>((highest, vulnerability) => {
    return SEVERITY_RANK[vulnerability.severity] > SEVERITY_RANK[highest] ? vulnerability.severity : highest;
  }, vulnerabilities[0].severity);
}

export const AIExplanationPanel = ({
  packageName,
  version,
  impactScore,
  dependentsCount,
  depth,
  vulnerabilities,
}: AIExplanationPanelProps) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAdvisoryId, setSelectedAdvisoryId] = useState<string | null>(null);
  const explanationRequestIdRef = useRef(0);
  const vulnerabilityDetails = vulnerabilities?.details ?? EMPTY_VULNERABILITIES;
  const vulnerabilityCount = vulnerabilities?.count ?? 0;
  const hasCriticalVulnerabilities = vulnerabilities?.hasCritical ?? false;
  const highestSeverity = getHighestSeverity(vulnerabilityDetails);

  useEffect(() => {
    if (!packageName || impactScore === null || version === null) {
      explanationRequestIdRef.current += 1;
      setExplanation(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    explanationRequestIdRef.current += 1;
    const requestId = explanationRequestIdRef.current;
    let disposed = false;

    const fetchExplanation = async () => {
      setIsLoading(true);
      setError(null);
      setExplanation(null);

      try {
        const data = await explainPackage({
          name: packageName,
          version,
          impactScore,
          dependentsCount,
          depth,
          vulnerabilityCount,
          hasCriticalVulnerabilities,
          highestSeverity,
        });

        if (!disposed && requestId === explanationRequestIdRef.current) {
          setExplanation(data.explanation);
        }
      } catch {
        if (!disposed && requestId === explanationRequestIdRef.current) {
          setError("Could not load explanation. Please try again later.");
        }
      } finally {
        if (!disposed && requestId === explanationRequestIdRef.current) {
          setIsLoading(false);
        }
      }
    };

    fetchExplanation();

    return () => {
      disposed = true;
    };
  }, [packageName, version, impactScore, dependentsCount, depth, vulnerabilityCount, hasCriticalVulnerabilities, highestSeverity]);

  useEffect(() => {
    if (vulnerabilityDetails.length === 0) {
      setSelectedAdvisoryId(null);
      return;
    }

    // If there is exactly one advisory, show its details directly.
    // If multiple, default to the first advisory selected
    setSelectedAdvisoryId(vulnerabilityDetails[0].id);
  }, [vulnerabilityDetails]);

  if (!packageName) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          {strings.aiExplanationPanel.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground opacity-90">
          {strings.aiExplanationPanel.structuralSectionHelper}
        </p>

        <ExplanationSection
          isLoading={isLoading}
          error={error}
          explanation={explanation}
          whyThisMatters={impactScore !== null ? generateWhyThisMatters(impactScore, hasCriticalVulnerabilities, strings.aiExplanationPanel.whyThisMatters) : undefined}
        />

        {vulnerabilityDetails.length > 0 && !isLoading && (
          <section className="space-y-3 border-t border-input pt-4">
            <div className="flex items-center gap-1.5">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                {strings.aiExplanationPanel.securitySectionTitle}
              </h3>
              <div className="text-sm text-muted-foreground">- {vulnerabilityCount} found</div>
            </div>
            <p className="text-xs text-muted-foreground opacity-90">{strings.aiExplanationPanel.securitySectionHelper}</p>

            {/* Compact selectable list when multiple advisories exist */}
            {vulnerabilityDetails.length > 1 ? (
              <div className="space-y-2">
                {vulnerabilityDetails.map((vuln) => (
                  <button
                    key={vuln.id}
                    type="button"
                    onClick={() => setSelectedAdvisoryId(vuln.id)}
                    aria-pressed={selectedAdvisoryId === vuln.id}
                    className={`flex w-full items-start justify-between rounded-md px-3 py-2 text-left hover:bg-muted/50 ${
                      selectedAdvisoryId === vuln.id ? "bg-muted/60" : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-sm font-medium text-foreground break-words">{vuln.id}</p>
                      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{vuln.summary || strings.riskTableCard.summaryUnavailable}</p>
                    </div>
                    <div className="relative mr-2 flex-shrink-0 self-center">
                      <span className={`inline-block h-3 w-3 rounded-full ${getSeverityDotClassName(vuln.severity)}`} aria-hidden="true" />
                    </div>
                  </button>
                ))}
              </div>
            ) : null}

            {/* Details panel for the selected advisory (or single advisory) */}
            <div className="mt-4">
              {vulnerabilityDetails.map((vuln) => {
                const show = selectedAdvisoryId === vuln.id || vulnerabilityDetails.length === 1;
                if (!show) return null;

                return <AdvisoryDetailCard key={vuln.id} vulnerability={vuln} />;
              })}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
};
