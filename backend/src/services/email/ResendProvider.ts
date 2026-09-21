import { Resend } from "resend";
import { config } from "../../config.js";
import type {
  EmailProvider,
  SendEmailParams,
  SendEmailResult,
} from "./EmailProvider.js";

export class ResendEmailProvider implements EmailProvider {
  readonly name = "resend";
  private client: Resend;

  constructor() {
    this.client = new Resend(config.resendApiKey);
  }

  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    if (!config.fromEmail) {
      return { success: false, error: "FROM_EMAIL not configured in .env" };
    }

    // Text-only by default: plain 1:1 emails land in Gmail Primary far more
    // reliably than HTML-formatted ones. Callers may still pass explicit HTML.
    const payload: Parameters<typeof this.client.emails.send>[0] = {
      from: `${config.fromName} <${config.fromEmail}>`,
      to: [params.to],
      subject: params.subject,
      text: params.text,
    };
    if (params.html) payload.html = params.html;

    const { data, error } = await this.client.emails.send(payload);

    if (error) {
      const raw =
        typeof (error as { message?: unknown }).message === "string"
          ? (error as { message: string }).message
          : JSON.stringify(error);
      const statusCode = (error as { statusCode?: number }).statusCode;
      if (statusCode === 403 || raw.includes("domain is not verified")) {
        return {
          success: false,
          error: `${raw} — verify your sending domain at resend.com/domains, or set FROM_EMAIL to onboarding@resend.dev for testing (test sender can only deliver to your own Resend account email).`,
        };
      }
      return { success: false, error: raw };
    }
    return { success: true, messageId: data?.id };
  }
}