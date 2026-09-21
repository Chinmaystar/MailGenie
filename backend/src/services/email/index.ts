import { config } from "../../config.js";
import type { EmailProvider } from "./EmailProvider.js";
import { NoopEmailProvider } from "./EmailProvider.js";
import { ResendEmailProvider } from "./ResendProvider.js";

let cached: EmailProvider | null = null;

export function getEmailProvider(): EmailProvider {
  if (cached) return cached;
  if (config.resendApiKey) {
    cached = new ResendEmailProvider();
  } else {
    cached = new NoopEmailProvider();
  }
  return cached;
}