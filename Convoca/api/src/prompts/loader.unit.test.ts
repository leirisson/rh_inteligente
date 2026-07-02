import { describe, it, expect } from "vitest";
import { renderPrompt } from "./loader.js";

describe("renderPrompt", () => {
  it("interpolates variables into the with_expected_answer variant", () => {
    const prompt = renderPrompt("answer-evaluation", "with_expected_answer", {
      question: "Why do you want this role?",
      expectedAnswer: "Passion for the domain",
      candidateAnswer: "I love this field",
    });

    expect(prompt.text).toContain("Why do you want this role?");
    expect(prompt.text).toContain("Passion for the domain");
    expect(prompt.text).toContain("I love this field");
    expect(prompt.text).not.toContain("{{");
  });

  it("interpolates variables into the open_ended variant", () => {
    const prompt = renderPrompt("answer-evaluation", "open_ended", {
      question: "Tell me about yourself",
      candidateAnswer: "I'm a backend engineer",
    });

    expect(prompt.text).toContain("Tell me about yourself");
    expect(prompt.text).toContain("I'm a backend engineer");
    expect(prompt.text).not.toContain("{{");
  });

  it("returns a json_schema response format matching the prompt's output schema", () => {
    const prompt = renderPrompt("answer-evaluation", "open_ended", {
      question: "Q",
      candidateAnswer: "A",
    });

    expect(prompt.responseFormat.type).toBe("json_schema");
    expect(prompt.responseFormat.json_schema.name).toBe("answer_evaluation");
    expect(prompt.responseFormat.json_schema.strict).toBe(true);
    expect(prompt.responseFormat.json_schema.schema.type).toBe("object");
  });

  it("throws when a required variable is missing", () => {
    expect(() =>
      renderPrompt("answer-evaluation", "with_expected_answer", {
        question: "Q",
        candidateAnswer: "A",
      } as unknown as Record<string, string>),
    ).toThrow(/Missing prompt variable/);
  });

  it("throws for an unknown variant", () => {
    expect(() => renderPrompt("answer-evaluation", "nonexistent", {})).toThrow(/Unknown variant/);
  });
});
