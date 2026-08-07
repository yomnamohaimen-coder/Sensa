import { serializeReportInsightContext } from "@/lib/ai/prepare-report-insight-context";
import type {
  GeneratedReportInsights,
  ReportInsightContext,
} from "@/lib/ai/types";

const DEFAULT_MODEL = "claude-sonnet-4-20250514";

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicMessageResponse = {
  content: AnthropicTextBlock[];
};

function buildInsightPrompt(context: ReportInsightContext): string {
  const dataSummary = serializeReportInsightContext(context);

  return `You are helping a non-technical product owner understand user behavior on their web app.

Analyze the report data below and respond with JSON only (no markdown fences).

Rules:
- Write in plain, concise language for a product owner (not a data analyst).
- summary: exactly one sentence describing the overall pattern in the data.
- anomaly: one sentence flagging a single unusual or notable metric (e.g. high drop-off at a funnel step, unusually high bounce rate). Use null if nothing clearly stands out.
- recommendation: one specific, actionable suggestion tied to the data.
- Reason cautiously. Use words like "likely", "may indicate", or "could suggest" for causal claims.
- Do not state causes with certainty — heatmap/click data is not available yet, so avoid definitive UX root-cause claims.
- Base your answer only on the data provided.

Report data:
${dataSummary}

Respond with this JSON shape:
{
  "summary": "string",
  "anomaly": "string or null",
  "recommendation": "string"
}`;
}

function extractJsonObject(text: string): GeneratedReportInsights {
  const trimmed = text.trim();
  const jsonText =
    trimmed.startsWith("```") ?
      trimmed.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "")
    : trimmed;

  const parsed = JSON.parse(jsonText) as {
    summary?: unknown;
    anomaly?: unknown;
    recommendation?: unknown;
  };

  if (typeof parsed.summary !== "string" || !parsed.summary.trim()) {
    throw new Error("AI response missing a valid summary.");
  }

  if (typeof parsed.recommendation !== "string" || !parsed.recommendation.trim()) {
    throw new Error("AI response missing a valid recommendation.");
  }

  const anomaly =
    typeof parsed.anomaly === "string" && parsed.anomaly.trim()
      ? parsed.anomaly.trim()
      : null;

  return {
    summary: parsed.summary.trim(),
    anomaly,
    recommendation: parsed.recommendation.trim(),
  };
}

export async function generateReportInsights(
  context: ReportInsightContext,
): Promise<GeneratedReportInsights> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error(
      "ANTHROPIC_API_KEY is not configured. Add it to .env.local and restart the dev server.",
    );
  }

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.ANTHROPIC_MODEL ?? DEFAULT_MODEL,
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: buildInsightPrompt(context),
        },
      ],
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(
      `Anthropic API request failed (${response.status}): ${errorBody}`,
    );
  }

  const data = (await response.json()) as AnthropicMessageResponse;
  const textBlock = data.content.find((block) => block.type === "text");

  if (!textBlock?.text) {
    throw new Error("Anthropic API returned an empty response.");
  }

  return extractJsonObject(textBlock.text);
}
