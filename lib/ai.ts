import { anthropic } from "./anthropic";

export interface FeedbackAnalysisResult {
  sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL";
  sentimentScore: number; // Scale from -1.0 to 1.0
  themes: string[];
  summary: string;
}

function heuristicAnalysis(content: string): FeedbackAnalysisResult {
  const lower = content.toLowerCase();
  const positives = [
    "good",
    "great",
    "love",
    "excellent",
    "fast",
    "easy",
    "helpful",
    "amazing",
    "smooth",
    "works",
    "perfect",
    "happy",
  ];
  const negatives = [
    "bad",
    "slow",
    "broken",
    "issue",
    "error",
    "poor",
    "terrible",
    "hate",
    "frustrated",
    "annoying",
    "refund",
    "bug",
    "delay",
    "confusing",
  ];

  const positiveCount = positives.filter((term) => lower.includes(term)).length;
  const negativeCount = negatives.filter((term) => lower.includes(term)).length;

  let sentiment: "POSITIVE" | "NEGATIVE" | "NEUTRAL" = "NEUTRAL";
  let sentimentScore = 0;

  if (positiveCount > negativeCount) {
    sentiment = "POSITIVE";
    sentimentScore = Math.min(0.95, 0.2 + positiveCount * 0.2);
  } else if (negativeCount > positiveCount) {
    sentiment = "NEGATIVE";
    sentimentScore = Math.max(-0.95, -0.2 - negativeCount * 0.2);
  }

  const themes = [
    positiveCount > negativeCount ? "Experience" : negativeCount > positiveCount ? "Pain Point" : "General",
    lower.includes("price") || lower.includes("billing") ? "Billing" : undefined,
    lower.includes("speed") || lower.includes("slow") || lower.includes("performance") ? "Performance" : undefined,
  ].filter(Boolean) as string[];

  const summary = content.trim().slice(0, 120) || "Customer feedback provided.";

  return {
    sentiment,
    sentimentScore,
    themes: themes.length > 0 ? themes : ["General"],
    summary,
  };
}

export async function analyzeFeedback(content: string): Promise<FeedbackAnalysisResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY?.trim();
  if (!apiKey || apiKey.includes("your-anthropic-api-key") || apiKey === "demo") {
    return heuristicAnalysis(content);
  }

  const prompt = `Analyze the following customer feedback entry and extract insights.
Return ONLY a valid JSON object matching this schema (do not wrap in markdown or backticks):
{
  "sentiment": "POSITIVE" | "NEGATIVE" | "NEUTRAL",
  "sentimentScore": number (between -1.0 and 1.0),
  "themes": string[] (up to 3 concise tags, e.g. ["UI/UX", "Billing", "Performance"]),
  "summary": string (one concise sentence summarizing the main point)
}

Customer Feedback:
"${content}"`;

  try {
    const response = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const textOutput = response.content[0].type === "text" ? response.content[0].text : "";

    const parsed: FeedbackAnalysisResult = JSON.parse(textOutput);
    return parsed;
  } catch (error) {
    console.error("Claude analysis failed; using heuristic fallback.", error);
    return heuristicAnalysis(content);
  }
}