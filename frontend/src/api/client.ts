import type {
  Campaign,
  CampaignDetail,
  GenerationState,
  Health,
  ImportResult,
  KnowledgeInfo,
  Prospect,
  SendState,
} from "../types";

const BASE = "/api";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: options.body instanceof FormData ? undefined : { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<Health>("/health"),

  listCampaigns: () => request<{ campaigns: Campaign[] }>("/campaigns"),
  createCampaign: (input: { name: string; project_description: string }) =>
    request<{ campaign: Campaign }>("/campaigns", {
      method: "POST",
      body: JSON.stringify(input),
    }),
  getCampaign: (id: number) => request<CampaignDetail>(`/campaigns/${id}`),
  deleteCampaign: (id: number) =>
    request<{ ok: boolean }>(`/campaigns/${id}`, { method: "DELETE" }),

  importProspects: (id: number, body: { text?: string }, file?: File) => {
    if (file) {
      const form = new FormData();
      form.append("file", file);
      return request<ImportResult>(`/campaigns/${id}/prospects/import`, {
        method: "POST",
        body: form,
      });
    }
    return request<ImportResult>(`/campaigns/${id}/prospects/import`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  addProspect: (
    id: number,
    input: { name: string; email: string; company: string; project_description?: string },
  ) =>
    request<{ id: number }>(`/campaigns/${id}/prospects`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  updateProspect: (
    id: number,
    patch: Partial<Omit<Prospect, "approved">> & { approved?: boolean },
  ) =>
    request<{ prospect: Prospect }>(`/prospects/${id}`, {
      method: "PATCH",
      body: JSON.stringify(patch),
    }),
  deleteProspect: (id: number) =>
    request<{ ok: boolean }>(`/prospects/${id}`, { method: "DELETE" }),

  generate: (id: number) =>
    request<{ started: boolean; state?: GenerationState }>(`/campaigns/${id}/generate`, {
      method: "POST",
    }),
  send: (id: number, opts: { retryFailed?: boolean } = {}) =>
    request<{ started: boolean; state?: SendState }>(`/campaigns/${id}/send`, {
      method: "POST",
      body: JSON.stringify({ confirm: true, ...opts }),
    }),

  resendProspect: (id: number) =>
    request<{ ok: boolean; prospect: Prospect }>(`/prospects/${id}/resend`, {
      method: "POST",
    }),

  knowledge: () => request<KnowledgeInfo>("/knowledge"),
  reloadKnowledge: () => request<{ ok: boolean }>("/knowledge/reload", { method: "POST" }),
};