import { useEffect, useState } from "react";
import { Loader, AlertCircle, Lightbulb } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AIExplanationPanelProps {
  packageName: string | null;
  version: string | null;
  impactScore: number | null;
  dependentsCount: number;
  depth: number;
  apiBaseUrl: string;
}

export const AIExplanationPanel = ({
  packageName,
  version,
  impactScore,
  dependentsCount,
  depth,
  apiBaseUrl,
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
        const response = await fetch(`${apiBaseUrl}/explain`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: packageName,
            version,
            impactScore,
            dependentsCount,
            depth,
          }),
        });

        if (!response.ok) {
          setError("Failed to generate explanation");
          return;
        }

        const data = (await response.json()) as { explanation: string };
        setExplanation(data.explanation);
      } catch {
        setError("Could not load explanation");
      } finally {
        setIsLoading(false);
      }
    };

    fetchExplanation();
  }, [packageName, version, impactScore, dependentsCount, depth, apiBaseUrl]);

  if (!packageName) {
    return null;
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Lightbulb className="h-4 w-4 text-amber-500 dark:text-amber-400" />
          AI Risk Explanation
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader className="h-4 w-4 animate-spin" />
            Analyzing package...
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
            <p className="text-destructive">{error}</p>
          </div>
        )}
        {explanation && !isLoading && (
          <p className="text-sm text-foreground leading-relaxed">{explanation}</p>
        )}
      </CardContent>
    </Card>
  );
};
