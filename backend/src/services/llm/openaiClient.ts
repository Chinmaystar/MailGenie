import OpenAI from "openai";
import { config } from "../../config.js";

let client: OpenAI | null = null;

/**
 * Shared OpenAI-compatible client. Any provider that speaks the OpenAI API
 * (OpenAI, Azure-compatible gateways, OpenRouter, Ollama, etc.) can be used by
 * setting LLM_BASE_URL — the rest of the app never talks to a vendor directly.
 */
export function getOpenAIClient(): OpenAI {
  if (!client) {
    if (!config.llmApiKey) {
      throw new Error(
        "LLM_API_KEY is not set. Add it to your .env file to use the LLM/embeddings features.",
      );
    }
    client = new OpenAI({
      apiKey: config.llmApiKey,
      baseURL: config.llmBaseUrl,
    });
  }
  return client;
}