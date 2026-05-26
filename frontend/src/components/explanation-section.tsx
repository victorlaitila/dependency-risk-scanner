import { Loader, AlertCircle } from "lucide-react";
import { strings } from "@/lib/strings";

interface ExplanationSectionProps {
  isLoading: boolean;
  error: string | null;
  explanation: string | null;
  whyThisMatters?: string;
}

export const ExplanationSection = ({
  isLoading,
  error,
  explanation,
  whyThisMatters,
}: ExplanationSectionProps) => {
  return (
    <section className="rounded-lg border border-input bg-background p-4 shadow-sm">
      {isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader className="h-4 w-4 animate-spin" />
          {strings.aiExplanationPanel.loading}
        </div>
      )}
      {error && (
        <div className="flex items-start gap-2 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-destructive" />
          <p className="text-destructive">{error}</p>
        </div>
      )}
      {explanation && !isLoading && (
        <div className="space-y-3">
          <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
          {whyThisMatters && (
            <div className="border-t border-input pt-3">
              <p className="mb-1 text-xs font-medium text-foreground">{strings.aiExplanationPanel.whyThisMattersTitle}</p>
              <p className="text-xs italic leading-relaxed text-muted-foreground">{whyThisMatters}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
