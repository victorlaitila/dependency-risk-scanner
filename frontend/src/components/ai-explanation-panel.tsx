import { useEffect, useState } from "react";
import { Loader, AlertCircle, Lightbulb, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { explainPackage } from "@/lib/api";
import { strings } from "@/lib/strings";
import type { VulnerabilityDetail, VulnerabilitySeverity } from "@/lib/dependency-risk-scanner";

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

  const severityLabels: Record<VulnerabilitySeverity, string> = strings.riskTableCard.severityLevels;

  const getSeverityClassName = (severity: VulnerabilitySeverity) => {
    if (severity === "critical") {
      return "bg-red-600 text-white";
    }

    if (severity === "high") {
      return "bg-orange-200 text-orange-900";
    }

    if (severity === "medium") {
      return "bg-amber-200 text-amber-900";
    }

    return "bg-slate-200 text-slate-800";
  };

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
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            {strings.aiExplanationPanel.loading}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-destructive">{error}</p>
          </div>
        )}
        {explanation && !isLoading && (
          <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{explanation}</p>
        )}
        {vulnerabilities && vulnerabilities.length > 0 && !isLoading && (
          <div className="mt-4 space-y-4 border-t border-input pt-4">
            <h3 className="flex items-center gap-2 text-sm font-medium text-foreground">
              <ShieldAlert className="h-4 w-4 text-rose-500 dark:text-rose-400" />
              {strings.riskTableCard.vulnerabilityDetailsTitle}
            </h3>
            <div className="space-y-4">
              {vulnerabilities.map((vulnerability, index) => (
                <section key={vulnerability.id} className={index > 0 ? "space-y-3 pt-4" : "space-y-3"}>
                  {index > 0 && <div className="border-t border-dashed border-input" />}
                  <dl className="grid gap-3 text-sm">
                    <div>
                      <dt className="font-medium text-foreground">
                        {strings.riskTableCard.advisoryIdLabel}
                      </dt>
                      <dd className="mt-1 break-words font-mono text-muted-foreground">
                        {vulnerability.id}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">
                        {strings.riskTableCard.summaryLabel}
                      </dt>
                      <dd className="mt-1 break-words text-muted-foreground">
                        {vulnerability.summary || strings.riskTableCard.summaryUnavailable}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">
                        {strings.riskTableCard.severityLabel}
                      </dt>
                      <dd className="mt-1">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getSeverityClassName(vulnerability.severity)}`}
                        >
                          {severityLabels[vulnerability.severity]}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">
                        {strings.riskTableCard.affectedRangeLabel}
                      </dt>
                      <dd className="mt-1 break-words text-muted-foreground">
                        {vulnerability.affectedRange || strings.riskTableCard.valueUnavailable}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">
                        {strings.riskTableCard.fixedVersionLabel}
                      </dt>
                      <dd className="mt-1 break-words text-muted-foreground">
                        {vulnerability.fixedVersion ?? strings.riskTableCard.valueUnavailable}
                      </dd>
                    </div>
                    <div>
                      <dt className="font-medium text-foreground">{strings.riskTableCard.sourceLabel}</dt>
                      <dd className="mt-1 break-words text-muted-foreground">
                        {vulnerability.sourceUrl ? (
                          <a
                            href={vulnerability.sourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="underline underline-offset-2 hover:text-foreground"
                          >
                            {vulnerability.sourceUrl}
                          </a>
                        ) : (
                          strings.riskTableCard.sourceUnavailable
                        )}
                      </dd>
                    </div>
                  </dl>
                </section>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
