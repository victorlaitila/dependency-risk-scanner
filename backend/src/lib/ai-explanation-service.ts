import { SYSTEM_PROMPT, USER_PROMPT_TEMPLATE } from "./ai-explanation-prompts.js";

const DEFAULT_HUGGINGFACE_MODEL_ID = "openai/gpt-oss-120b:fastest";
const MAX_EXPLANATION_LENGTH = 260;

export interface ExplanationRequest {
  name: string;
  version: string;
  impactScore: number;
  dependentsCount: number;
  depth: number;
}

export interface ExplanationResponse {
  explanation: string;
}

function generateFallbackExplanation(req: ExplanationRequest): string {
  const factors: string[] = [];

  if (req.impactScore > 50) {
    factors.push("high impact score");
  } else if (req.impactScore > 20) {
    factors.push("moderate impact score");
  }

  if (req.dependentsCount > 10) {
    factors.push("many packages depend on it");
  } else if (req.dependentsCount > 0) {
    factors.push("several packages depend on it");
  }

  if (req.depth > 5) {
    factors.push("significant depth in the dependency tree");
  } else if (req.depth > 2) {
    factors.push("moderate depth in the dependency tree");
  }

  if (factors.length === 0) {
    return `${req.name} is a low-impact dependency with minimal dependent packages, suggesting reduced structural risk in your dependency graph.`;
  }

  return `${req.name} presents structural risk factors including: ${factors.join(", ")}. Changes to this package could affect multiple downstream packages.`;
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

  const truncated = normalized.slice(0, MAX_EXPLANATION_LENGTH);
  const lastSpace = truncated.lastIndexOf(" ");
  const safeEnd = lastSpace > 0 ? lastSpace : truncated.length;
  return `${truncated.slice(0, safeEnd).trimEnd()}...`;
}

export async function getExplanation(req: ExplanationRequest): Promise<ExplanationResponse> {
  const apiKey = process.env.HUGGINGFACE_API_KEY;
  if (!apiKey) {
    return {
      explanation: generateFallbackExplanation(req),
    };
  }

  try {
    const modelId = process.env.HUGGINGFACE_MODEL_ID?.trim() || DEFAULT_HUGGINGFACE_MODEL_ID;
    const userPrompt = USER_PROMPT_TEMPLATE(req.name, req.version, req.impactScore, req.dependentsCount, req.depth);
    const response = await fetch("https://router.huggingface.co/v1/chat/completions", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      method: "POST",
      body: JSON.stringify({
        model: modelId,
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
        `HuggingFace API error: ${response.status} (${response.statusText}) for model ${modelId}. Response body: ${errorBody || "<empty>"}. Falling back to deterministic explanation.`,
      );
      return {
        explanation: generateFallbackExplanation(req),
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
        explanation: generateFallbackExplanation(req),
      };
    }

    return {
      explanation: formatExplanation(generatedText),
    };
  } catch (error) {
    console.warn(`AI explanation error: ${error instanceof Error ? error.message : String(error)}. Using fallback.`);
  }

  return {
    explanation: generateFallbackExplanation(req),
  };
}
