import { strings } from "@/lib/strings";
import { getSeverityClassName } from "@/lib/severity-styles";
import type { VulnerabilitySeverity, VulnerabilityDetail } from "@/lib/dependency-risk-scanner";

interface AdvisoryDetailCardProps {
  vulnerability: VulnerabilityDetail;
}

export const AdvisoryDetailCard = ({ vulnerability }: AdvisoryDetailCardProps) => {
  const severityLabels: Record<VulnerabilitySeverity, string> = strings.riskTableCard.severityLevels;

  return (
    <article className="relative rounded-lg border border-input bg-background p-4 shadow-sm">
      <div className="absolute top-4 right-4 flex-shrink-0">
        <span
          className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getSeverityClassName(
            vulnerability.severity,
          )}`}
        >
          {severityLabels[vulnerability.severity]}
        </span>
      </div>

      <div className="grid gap-3 text-sm">
        <div>
          <dt className="font-semibold text-foreground">{strings.riskTableCard.summaryLabel}</dt>
          <dd className="mt-1 break-words text-muted-foreground">{vulnerability.summary || strings.riskTableCard.summaryUnavailable}</dd>
        </div>

        <div>
          <dt className="font-semibold text-foreground">{strings.riskTableCard.advisoryIdLabel}</dt>
          <dd className="mt-1 break-words font-mono text-muted-foreground">{vulnerability.id}</dd>
        </div>

        <div>
          <dt className="font-semibold text-foreground">{strings.riskTableCard.sourceLabel}</dt>
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
          <dt className="font-semibold text-foreground">{strings.riskTableCard.affectedRangeLabel}</dt>
          <dd className="mt-1 break-words text-muted-foreground">
            {vulnerability.affectedRange || strings.riskTableCard.valueUnavailable}
          </dd>
        </div>

        <div>
          <dt className="font-semibold text-foreground">{strings.riskTableCard.fixedVersionLabel}</dt>
          <dd className="mt-1 break-words text-muted-foreground">
            {vulnerability.fixedVersion ?? strings.riskTableCard.valueUnavailable}
          </dd>
        </div>
      </div>
    </article>
  );
};
