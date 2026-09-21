export type SendEmailParams = {
  to: string;
  subject: string;
  html?: string;
  text: string;
};

export type SendEmailResult = {
  success: boolean;
  messageId?: string;
  error?: string;
};

export interface EmailProvider {
  readonly name: string;
  sendEmail(params: SendEmailParams): Promise<SendEmailResult>;
}

/**
 * A no-op provider used when RESEND_API_KEY is missing so the rest of the app
 * (import, generate, review, approve) keeps working in local dev.
 */
export class NoopEmailProvider implements EmailProvider {
  readonly name = "noop";
  async sendEmail(params: SendEmailParams): Promise<SendEmailResult> {
    console.warn(
      `[email] RESEND_API_KEY not set — would have sent to ${params.to} with subject "${params.subject}"`,
    );
    return { success: false, error: "RESEND_API_KEY not configured" };
  }
}