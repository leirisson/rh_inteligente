import { config } from "../config/index";

export interface LLMConfig {
  baseURL: string;
  apiKey: string;
  defaultModel: string;
  defaultHeaders: Record<string, string>;
}

export const llmConfig: LLMConfig = {
  baseURL: config.OPENROUTER_BASE_URL,
  apiKey: config.OPENROUTER_API_KEY,
  defaultModel: config.OPENROUTER_DEFAULT_MODEL,
  defaultHeaders: {
    "HTTP-Referer": "https://convoca.app",
    "X-Title": "Convoca",
  },
};

// When Spec 08 (LangGraph agent) is implemented, instantiate the client like this:
//
// import OpenAI from "openai";
// export const llmClient = new OpenAI({
//   baseURL: llmConfig.baseURL,
//   apiKey: llmConfig.apiKey,
//   defaultHeaders: llmConfig.defaultHeaders,
// });
