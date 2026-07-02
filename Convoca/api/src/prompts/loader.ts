import { readFileSync } from "node:fs";
import path from "node:path";

const promptsDir = __dirname;

interface PromptVariant {
  role: string;
  task: string;
  input_variables: string[];
  template: string;
}

interface PromptOutputSchema {
  name: string;
  strict: boolean;
  schema: Record<string, unknown>;
}

interface PromptDefinition {
  id: string;
  description: string;
  model_defaults?: { temperature?: number };
  variants: Record<string, PromptVariant>;
  output_schema: PromptOutputSchema;
}

const cache = new Map<string, PromptDefinition>();

function loadPromptDefinition(name: string): PromptDefinition {
  const cached = cache.get(name);
  if (cached) return cached;

  const filePath = path.join(promptsDir, `${name}.json`);
  const definition = JSON.parse(readFileSync(filePath, "utf-8")) as PromptDefinition;
  cache.set(name, definition);
  return definition;
}

function interpolate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (!(key in variables)) {
      throw new Error(`Missing prompt variable "${key}" for template`);
    }
    return variables[key];
  });
}

export interface RenderedPrompt {
  text: string;
  temperature?: number;
  responseFormat: {
    type: "json_schema";
    json_schema: { name: string; strict: boolean; schema: Record<string, unknown> };
  };
}

export function renderPrompt(
  promptName: string,
  variantName: string,
  variables: Record<string, string>,
): RenderedPrompt {
  const definition = loadPromptDefinition(promptName);
  const variant = definition.variants[variantName];
  if (!variant) {
    throw new Error(`Unknown variant "${variantName}" for prompt "${promptName}"`);
  }

  const body = interpolate(variant.template, variables);
  const text = `${variant.role} ${variant.task}\n\n${body}`;

  return {
    text,
    temperature: definition.model_defaults?.temperature,
    responseFormat: {
      type: "json_schema",
      json_schema: definition.output_schema,
    },
  };
}
