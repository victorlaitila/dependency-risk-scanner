import { Loader, AlertCircle } from "lucide-react";
import { strings } from "@/lib/strings";

interface ExplanationSectionProps {
  title: string;
  helperText: string;
  isLoading: boolean;
  error: string | null;
  explanation: string | null;
}

export const ExplanationSection = ({ title, helperText, isLoading, error, explanation }: ExplanationSectionProps) => {
  return (
    <section className="rounded-lg border border-input bg-muted/30 p-4">
      <div className="mb-3 space-y-1">
        <h3 className="text-sm font-medium text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{helperText}</p>
      </div>
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
        <p className="whitespace-pre-line text-sm leading-relaxed text-foreground">{explanation}</p>
      )}
    </section>
  );
};
