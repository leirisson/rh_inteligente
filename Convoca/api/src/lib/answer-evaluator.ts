import { llmClient, llmConfig } from "./llm.js";
import { renderPrompt } from "../prompts/loader.js";

export interface AnswerEvaluation {
  score: number;
  verdict: "PASS" | "FAIL";
  reasoning: string;
}

function llmProviderError(detail: string) {
  return Object.assign(new Error(`LLM provider error: ${detail}`), {
    statusCode: 502,
    code: "LLM_PROVIDER_ERROR",
  });
}

export async function evaluateAnswer(
  question: string,
  expectedAnswer: string | null,
  candidateAnswer: string,
): Promise<AnswerEvaluation> {
  const prompt = expectedAnswer
    ? renderPrompt("answer-evaluation", "with_expected_answer", {
        question,
        expectedAnswer,
        candidateAnswer,
      })
    : renderPrompt("answer-evaluation", "open_ended", { question, candidateAnswer });

  let completion;
  try {
    completion = await llmClient.chat.completions.create({
      model: llmConfig.defaultModel,
      temperature: prompt.temperature,
      messages: [{ role: "user", content: prompt.text }],
      response_format: prompt.responseFormat,
    });
  } catch (error) {
    throw llmProviderError(error instanceof Error ? error.message : "request failed");
  }

  const content = completion.choices[0]?.message.content;
  if (!content) {
    throw llmProviderError("empty response");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw llmProviderError("response was not valid JSON");
  }

  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).score !== "number" ||
    ((parsed as Record<string, unknown>).verdict !== "PASS" &&
      (parsed as Record<string, unknown>).verdict !== "FAIL") ||
    typeof (parsed as Record<string, unknown>).reasoning !== "string"
  ) {
    throw llmProviderError("response JSON did not match the expected shape");
  }

  return parsed as AnswerEvaluation;
}
