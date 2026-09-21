import { db, type ProspectRow } from "../index.js";

export type { ProspectRow };

export function listProspects(campaignId: number): ProspectRow[] {
  return db
    .prepare("SELECT * FROM prospects WHERE campaign_id = ? ORDER BY id ASC")
    .all(campaignId) as ProspectRow[];
}

export function getProspect(id: number): ProspectRow | undefined {
  return db.prepare("SELECT * FROM prospects WHERE id = ?").get(id) as ProspectRow | undefined;
}

export function addProspect(input: {
  campaignId: number;
  name?: string;
  email: string;
  company?: string;
  project_description?: string;
}): { ok: true; id: number } | { ok: false; error: string } {
  try {
    const info = db
      .prepare(
        `INSERT INTO prospects (campaign_id, name, email, company, project_description)
         VALUES (?, ?, ?, ?, ?)`,
      )
      .run(
        input.campaignId,
        input.name ?? "",
        input.email,
        input.company ?? "",
        input.project_description ?? "",
      );
    return { ok: true, id: Number(info.lastInsertRowid) };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      return { ok: false, error: `duplicate email: ${input.email}` };
    }
    return { ok: false, error: msg };
  }
}

export function updateProspect(
  id: number,
  patch: {
    name?: string;
    email?: string;
    company?: string;
    project_description?: string;
    generated_subject?: string | null;
    generated_body?: string | null;
    approved?: boolean;
    status?: string;
    error?: string | null;
  },
): { ok: true } | { ok: false; error: string } {
  try {
    const current = getProspect(id);
    if (!current) return { ok: false, error: "prospect not found" };

    const next = {
      name: patch.name ?? current.name,
      email: patch.email ?? current.email,
      company: patch.company ?? current.company,
      project_description:
        patch.project_description ?? current.project_description,
      generated_subject:
        patch.generated_subject !== undefined
          ? patch.generated_subject
          : current.generated_subject,
      generated_body:
        patch.generated_body !== undefined
          ? patch.generated_body
          : current.generated_body,
      approved:
        patch.approved !== undefined
          ? patch.approved
            ? 1
            : 0
          : current.approved,
      status: patch.status ?? current.status,
      error: patch.error !== undefined ? patch.error : current.error,
    };

    db.prepare(
      `UPDATE prospects SET
         name = ?, email = ?, company = ?, project_description = ?,
         generated_subject = ?, generated_body = ?, approved = ?,
         status = ?, error = ?
       WHERE id = ?`,
    ).run(
      next.name,
      next.email,
      next.company,
      next.project_description,
      next.generated_subject,
      next.generated_body,
      next.approved,
      next.status,
      next.error,
      id,
    );
    return { ok: true };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes("UNIQUE")) {
      return { ok: false, error: "duplicate email in this campaign" };
    }
    return { ok: false, error: msg };
  }
}

export function markSent(id: number): void {
  db.prepare("UPDATE prospects SET sent_at = datetime('now') WHERE id = ?").run(id);
}

export function deleteProspect(id: number): void {
  db.prepare("DELETE FROM prospects WHERE id = ?").run(id);
}

export function countProspects(campaignId: number, status?: string): number {
  const row = status
    ? db
        .prepare("SELECT COUNT(*) AS n FROM prospects WHERE campaign_id = ? AND status = ?")
        .get(campaignId, status)
    : db.prepare("SELECT COUNT(*) AS n FROM prospects WHERE campaign_id = ?").get(campaignId);
  return (row as { n: number }).n;
}