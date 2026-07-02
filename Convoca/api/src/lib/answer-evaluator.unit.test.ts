import { describe, it, expect, vi, afterEach } from "vitest";

const { createMock } = vi.hoisted(() => ({ createMock: vi.fn() }));

vi.mock("./llm.js", () => ({
  llmClient: { chat: { completions: { create: createMock } } },
  llmConfig: { defaultModel: "test-model" },
}));

import { evaluateAnswer } from "./answer-evaluator.js";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockCompletion(content: string) {
  createMock.mockResolvedValue({ choices: [{ message: { content } }] });
}

describe("evaluateAnswer", () => {
  it("returns the parsed evaluation from a well-formed LLM response", async () => {
    mockCompletion(JSON.stringify({ score: 0.9, verdict: "PASS", reasoning: "Strong match" }));

    const result = await evaluateAnswer(
      "Why do you want this role?",
      "Passion for the domain",
      "I love this field",
    );

    expect(result).toEqual({ score: 0.9, verdict: "PASS", reasoning: "Strong match" });
  });

  it("throws a 502 LLM_PROVIDER_ERROR when the API call fails", async () => {
    createMock.mockRejectedValue(new Error("network down"));

    await expect(evaluateAnswer("Q", null, "A")).rejects.toMatchObject({
      statusCode: 502,
      code: "LLM_PROVIDER_ERROR",
    });
  });

  it("throws a 502 LLM_PROVIDER_ERROR when the response has no content", async () => {
    createMock.mockResolvedValue({ choices: [{ message: { content: null } }] });

    await expect(evaluateAnswer("Q", null, "A")).rejects.toMatchObject({
      statusCode: 502,
      code: "LLM_PROVIDER_ERROR",
    });
  });

  it("throws a 502 LLM_PROVIDER_ERROR when the response is not valid JSON", async () => {
    mockCompletion("not json");

    await expect(evaluateAnswer("Q", null, "A")).rejects.toMatchObject({
      statusCode: 502,
      code: "LLM_PROVIDER_ERROR",
    });
  });

  it("throws a 502 LLM_PROVIDER_ERROR when the response JSON has the wrong shape", async () => {
    mockCompletion(JSON.stringify({ foo: "bar" }));

    await expect(evaluateAnswer("Q", null, "A")).rejects.toMatchObject({
      statusCode: 502,
      code: "LLM_PROVIDER_ERROR",
    });
  });
});
