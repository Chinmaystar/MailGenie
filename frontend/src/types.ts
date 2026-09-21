export type ProspectStatus = "pending" | "generated" | "approved" | "sent" | "failed";

export type CampaignCounts = {
  total: number;
  pending: number;
  generated: number;
  approved: number;
  sent: number;
  failed: number;
};

export type Campaign = {
  id: number;
  name: string;
  project_description: string;
  status: string;
  created_at: string;
  counts: CampaignCounts;
};

export type Prospect = {
  id: number;
  campaign_id: number;
  name: string;
  email: string;
  company: string;
  project_description: string;
  status: ProspectStatus;
  generated_subject: string | null;
  generated_body: string | null;
  approved: number;
  sent_at: string | null;
  error: string | null;
  created_at: string;
};

export type GenerationState = {
  running: boolean;
  processed: number;
  total: number;
  succeeded: number;
  failed: number;
  error?: string;
  startedAt: string;
};

export type SendState = {
  running: boolean;
  approvedTotal: number;
  sent: number;
  failed: number;
  skipped: number;
  error?: string;
  startedAt: string;
};

export type CampaignDetail = {
  campaign: Campaign;
  prospects: Prospect[];
  generationState?: GenerationState;
  sendState?: SendState;
};

export type Health = {
  ok: boolean;
  ragProvider: string;
  llmConfigured: boolean;
  emailConfigured: boolean;
  sendDelayMs: number;
};

export type ImportResult = {
  added: number;
  skipped: number;
  errors: string[];
};

export type KnowledgeInfo = {
  chunks: number;
  docs: { file: string; size: number }[];
};