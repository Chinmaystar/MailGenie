export type GenerateParams = {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
};

export interface LLMProvider {
  readonly name: string;
  /** Generate a single completion as plain text. */
  generateText(params: GenerateParams): Promise<string>;
}