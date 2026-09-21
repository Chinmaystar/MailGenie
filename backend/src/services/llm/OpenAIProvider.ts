import { config } from "../../config.js";
import type { GenerateParams, LLMProvider } from "./LLMProvider.js";

function isOfficialOpenAI(): boolean {
  return !config.llmBaseUrl || config.llmBaseUrl.includes("api.openai.com");
}

async function fetchCompletion(params: GenerateParams): Promise<string> {
  const res = await fetch(config.llmBaseUrl + "/chat/completions", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + config.llmApiKey,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:" + config.port,
      "X-Title": "Kelvor Outreach",
    },
    body: JSON.stringify({
      model: config.llmModel,
      temperature: params.temperature ?? 0.6,
      max_tokens: params.maxTokens ?? 1400,
      messages: [
        { role: "system", content: params.system },
        { role: "user", content: params.user },
      ],
    }),
  });

  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    const msg = data.error?.message ?? JSON.stringify(data);
    throw new Error("LLM request failed: " + msg);
  }
  return data.choices?.[0]?.message?.content ?? "";
}

export class OpenAIProvider implements LLMProvider {
  readonly name = `llm:${config.llmModel}`;

  async generateText(params: GenerateParams): Promise<string> {
    if (isOfficialOpenAI()) {
      const { getOpenAIClient } = await import("./openaiClient.js");
      const client = getOpenAIClient();
      const res = await client.chat.completions.create({
        model: config.llmModel,
        temperature: params.temperature ?? 0.6,
        max_tokens: params.maxTokens ?? 1400,
        messages: [
          { role: "system", content: params.system },
          { role: "user", content: params.user },
        ],
      });
      return res.choices[0]?.message?.content ?? "";
    }
    return fetchCompletion(params);
  }
}

export function getLLMProvider(): LLMProvider {
  return new OpenAIProvider();
}