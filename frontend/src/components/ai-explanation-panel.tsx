import { useEffect, useState } from "react";
import { Loader, AlertCircle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { explainPackage } from "@/lib/api";
import { strings } from "@/lib/strings";

interface AIExplanationPanelProps {
  packageName: string | null;
  version: string | null;
  impactScore: number | null;
  dependentsCount: number;
  depth: number;
}

export const AIExplanationPanel = ({
  packageName,
  version,
  impactScore,
  dependentsCount,
  depth,
}: AIExplanationPanelProps) => {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      </CardContent>
    </Card>
  );
};
