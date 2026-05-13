import { strings } from "@/lib/strings";
import { getSeverityClassName } from "@/lib/severity-styles";
import type { VulnerabilityDetail, VulnerabilitySeverity } from "@/lib/dependency-risk-scanner";

interface AdvisoryDetailCardProps {
  vulnerability: VulnerabilityDetail;
}

export const AdvisoryDetailCard = ({ vulnerability }: AdvisoryDetailCardProps) => {
  const severityLabels: Record<VulnerabilitySeverity, string> = strings.riskTableCard.severityLevels;

  return (
    <article className="rounded-lg border border-input bg-background p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-foreground">{vulnerability.id}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            {vulnerability.summary || strings.riskTableCard.summaryUnavailable}
          </p>
        </div>
        <div className="ml-6 flex-shrink-0">
          <span
            className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getSeverityClassName(
              vulnerability.severity,
            )}`}
          >
            {severityLabels[vulnerability.severity]}
          </span>
        </div>
      </div>

      <div className="mt-4 grid gap-3 text-sm">
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

        <div>
          <dt className="font-medium text-foreground">{strings.riskTableCard.advisoryIdLabel}</dt>
          <dd className="mt-1 break-words font-mono text-muted-foreground">{vulnerability.id}</dd>
        </div>

        <div>
          <dt className="font-medium text-foreground">{strings.riskTableCard.affectedRangeLabel}</dt>
          <dd className="mt-1 break-words text-muted-foreground">
            {vulnerability.affectedRange || strings.riskTableCard.valueUnavailable}
          </dd>
        </div>

        <div>
          <dt className="font-medium text-foreground">{strings.riskTableCard.fixedVersionLabel}</dt>
          <dd className="mt-1 break-words text-muted-foreground">
            {vulnerability.fixedVersion ?? strings.riskTableCard.valueUnavailable}
          </dd>
        </div>
      </div>
    </article>
  );
};
