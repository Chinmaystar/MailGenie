import { db, type CampaignRow } from "../index.js";

export type CampaignCounts = {
  total: number;
  pending: number;
  generated: number;
  approved: number;
  sent: number;
  failed: number;
};

export type CampaignSummary = CampaignRow & {
  project_description: string;
  counts: CampaignCounts;
};

export function createCampaign(name: string, projectDescription: string): CampaignRow {
  const info = db
    .prepare("INSERT INTO campaigns (name, project_description) VALUES (?, ?)")
    .run(name, projectDescription);
  return getCampaign(Number(info.lastInsertRowid))!;
}

export function getCampaign(id: number): CampaignRow | undefined {
  return db.prepare("SELECT * FROM campaigns WHERE id = ?").get(id) as CampaignRow | undefined;
}

export function updateCampaignStatus(id: number, status: string): void {
  db.prepare("UPDATE campaigns SET status = ? WHERE id = ?").run(status, id);
}

export function deleteCampaign(id: number): void {
  db.prepare("DELETE FROM campaigns WHERE id = ?").run(id);
}

export function listCampaigns(): CampaignSummary[] {
  const campaigns = db
    .prepare("SELECT * FROM campaigns ORDER BY created_at DESC, id DESC")
    .all() as CampaignRow[];
  return campaigns.map((c) => ({ ...c, counts: countsForCampaign(c.id) }));
}

export function getCampaignSummary(id: number): CampaignSummary | undefined {
  const c = getCampaign(id);
  if (!c) return undefined;
  return { ...c, counts: countsForCampaign(id) };
}

export function countsForCampaign(campaignId: number): CampaignCounts {
  const rows = db
    .prepare(
      `SELECT status, COUNT(*) AS n
       FROM prospects
       WHERE campaign_id = ?
       GROUP BY status`,
    )
    .all(campaignId) as Array<{ status: string; n: number }>;

  const counts: CampaignCounts = {
    total: 0,
    pending: 0,
    generated: 0,
    approved: 0,
    sent: 0,
    failed: 0,
  };

  // Recompute statuses so aggregate numbers are always accurate:
  // "approved" is derived from the approved flag, not persisted as a status
  // until the moment of sending.
  for (const row of rows) counts.total += row.n;
  counts.pending = rows.find((r) => r.status === "pending")?.n ?? 0;
  counts.generated = rows.find((r) => r.status === "generated")?.n ?? 0;
  counts.sent = rows.find((r) => r.status === "sent")?.n ?? 0;
  counts.failed = rows.find((r) => r.status === "failed")?.n ?? 0;
  counts.approved = (db
    .prepare(
      `SELECT COUNT(*) AS n FROM prospects
       WHERE campaign_id = ? AND approved = 1 AND status NOT IN ('sent', 'failed')`,
    )
    .get(campaignId) as { n: number } | undefined)?.n ?? 0;

  return counts;
}