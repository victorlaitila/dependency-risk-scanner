import { useEffect, useState } from "react";
import { Lightbulb, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { explainPackage } from "@/lib/api";
import { strings } from "@/lib/strings";
import { getSeverityDotClassName } from "@/lib/severity-styles";
import { ExplanationSection } from "@/components/explanation-section";
import { AdvisoryDetailCard } from "@/components/advisory-detail-card";
import type { VulnerabilityDetail } from "@/lib/dependency-risk-scanner";

interface AIExplanationPanelProps {
  packageName: string | null;
  version: string | null;
  impactScore: number | null;
  dependentsCount: number;
  depth: number;
  vulnerabilities?: VulnerabilityDetail[] | null;
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

  useEffect(() => {
    if (!packageName || impactScore === null || version === null) {
      setExplanation(null);
      setError(null);
      return;
    }

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
        });

        setExplanation(data.explanation);
      } catch {
        setError(strings.aiExplanationPanel.error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplanation();
  }, [packageName, version, impactScore, dependentsCount, depth]);

  useEffect(() => {
    if (!vulnerabilities || vulnerabilities.length === 0) {
      setSelectedAdvisoryId(null);
      return;
    }

    // If there is exactly one advisory, show its details directly.
    // If multiple, default to the first advisory selected
    setSelectedAdvisoryId(vulnerabilities[0].id);
  }, [vulnerabilities]);

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
      <CardContent className="space-y-6">
        <ExplanationSection
          title={strings.aiExplanationPanel.structuralSectionTitle}
          helperText={strings.aiExplanationPanel.structuralSectionHelper}
          isLoading={isLoading}
          error={error}
          explanation={explanation}
        />

        {vulnerabilities && vulnerabilities.length > 0 && !isLoading && (
          <section className="space-y-3 border-t border-input pt-4">
            <div className="flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
                <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
                {strings.aiExplanationPanel.securitySectionTitle}
              </h3>
              <div className="text-sm text-muted-foreground">{vulnerabilities.length} found</div>
            </div>
            <p className="relative -top-1 text-xs text-muted-foreground">{strings.aiExplanationPanel.securitySectionHelper}</p>

            {/* Compact selectable list when multiple advisories exist */}
            {vulnerabilities.length > 1 ? (
              <div className="space-y-2">
                {vulnerabilities.map((vuln) => (
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
              {vulnerabilities.map((vuln) => {
                const show = selectedAdvisoryId === vuln.id || vulnerabilities.length === 1;
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
