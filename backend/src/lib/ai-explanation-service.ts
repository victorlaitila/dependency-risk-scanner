import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from "./ai-explanation-prompts.js";
import { DEFAULT_HUGGINGFACE_MODEL_ID, MAX_EXPLANATION_LENGTH } from "./constants.js";
import type { VulnerabilitySeverity } from "./analyze-lockfile.js";

export interface ExplanationRequest {
  name: string;
  version: string;
  impactScore: number;
  dependentsCount: number;
  depth: number;
  vulnerabilityCount: number;
  hasCriticalVulnerabilities: boolean;
  highestSeverity: VulnerabilitySeverity;
}

export interface ExplanationResponse {
  explanation: string;
}

function generateFallbackExplanation(): string {
  return "An AI-generated explanation is currently unavailable for this package.";
}

function formatExplanation(rawText: string): string {
  const normalized = rawText.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= MAX_EXPLANATION_LENGTH) {
    return normalized;
  }

  const sentences = normalized.match(/[^.!?]+[.!?]+/g)?.map((sentence) => sentence.trim()) ?? [];
  if (sentences.length > 0) {
    let combined = "";
    for (const sentence of sentences) {
      const candidate = combined ? `${combined} ${sentence}` : sentence;
      if (candidate.length > MAX_EXPLANATION_LENGTH) {
        break;
      }
      combined = candidate;
    }

    if (combined) {
      return combined;
    }
  }

  const truncated = normalized.slice(0, Math.max(0, MAX_EXPLANATION_LENGTH - 3));
  const lastSpace = truncated.lastIndexOf(" ");
  const safeEnd = lastSpace > 0 ? lastSpace : truncated.length;
  return `${truncated.slice(0, safeEnd).trimEnd()}...`;
}

export async function getExplanation(req: ExplanationRequest): Promise<ExplanationResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return {
      explanation: generateFallbackExplanation(),
    };
  }

  try {
    const userPrompt = USER_PROMPT_TEMPLATE(
      req.name,
      req.version,
      req.impactScore,
      req.dependentsCount,
      req.depth,
      req.vulnerabilityCount,
      req.hasCriticalVulnerabilities,
      req.highestSeverity,
    );
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: DEFAULT_HUGGINGFACE_MODEL_ID,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: userPrompt,
          },
        ],
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.warn(
        `HuggingFace API error: ${response.status} (${response.statusText}) for model ${DEFAULT_HUGGINGFACE_MODEL_ID}. Response body: ${errorBody || "<empty>"}. Falling back to deterministic explanation.`,
      );
      return {
        explanation: generateFallbackExplanation(),
      };
    }

    const data = (await response.json()) as
      | { choices?: Array<{ message?: { content?: string } }> }
      | Array<{ generated_text?: string; summary_text?: string; text?: string }>;

    const generatedText = Array.isArray(data)
      ? data[0]?.generated_text ?? data[0]?.summary_text ?? data[0]?.text
      : data.choices?.[0]?.message?.content;

    if (!generatedText) {
      return {
        explanation: generateFallbackExplanation(),
      };
    }

    return {
      explanation: formatExplanation(generatedText),
    };
  } catch (error) {
    console.warn(`AI explanation error: ${error instanceof Error ? error.message : String(error)}. Using fallback.`);
  }

  return {
    explanation: generateFallbackExplanation(),
  };
}
