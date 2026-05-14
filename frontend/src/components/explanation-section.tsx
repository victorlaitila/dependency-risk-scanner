import { Loader, AlertCircle } from "lucide-react";
import { strings } from "@/lib/strings";

interface ExplanationSectionProps {
  isLoading: boolean;
  error: string | null;
  explanation: string | null;
}

export const ExplanationSection = ({ isLoading, error, explanation }: ExplanationSectionProps) => {
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
        <p className="text-sm leading-relaxed text-muted-foreground">{explanation}</p>
      )}
    </section>
  );
};
