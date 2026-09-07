const DEFAULT_MODEL = "claude-sonnet-4-6";

type AnthropicTextBlock = {
  type: "text";
  text: string;
};

type AnthropicMessageResponse = {
  content: AnthropicTextBlock[];
};

function buildSessionSummaryPrompt(timeline: string): string {
  return `You are helping a non-technical product owner understand one recorded user session on their web app.

Write a 2-3 sentence plain-language summary of WHAT happened in this session.

Rules:
- Factual only. Describe actions and page path, not emotions, goals, or intent.
- Do not speculate about why the user did something or how they felt.
- Do not invent pages, clicks, or searches that are not in the timeline.
- Use cautious wording only if the timeline itself is incomplete; otherwise stay concrete.
- Base your answer only on the timeline below.
- Respond with the summary text only (no JSON, no markdown, no title).

Session timeline:
${timeline}`;
}

export async function generateSessionSummaryFromTimeline(
  timeline: string,
): Promise<string> {
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
      max_tokens: 300,
      messages: [
        {
          role: "user",
          content: buildSessionSummaryPrompt(timeline),
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
  const text = textBlock?.text?.trim();

  if (!text) {
    throw new Error("Anthropic API returned an empty response.");
  }

  return text;
}
