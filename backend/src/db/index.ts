import fs from "node:fs";
import Database from "better-sqlite3";
import { dataDir, dbFile } from "../config.js";

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbFile);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS campaigns (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    project_description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'draft',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS prospects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id INTEGER NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    email TEXT NOT NULL,
    company TEXT NOT NULL DEFAULT '',
    project_description TEXT NOT NULL DEFAULT '',
    status TEXT NOT NULL DEFAULT 'pending',
    generated_subject TEXT,
    generated_body TEXT,
    approved INTEGER NOT NULL DEFAULT 0,
    sent_at TEXT,
    error TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (campaign_id) REFERENCES campaigns(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_prospects_campaign ON prospects(campaign_id);
  CREATE UNIQUE INDEX IF NOT EXISTS idx_prospects_campaign_email
    ON prospects(campaign_id, lower(email));
`);

export type CampaignRow = {
  id: number;
  name: string;
  project_description: string;
  status: string;
  created_at: string;
};

export type ProspectRow = {
  id: number;
  campaign_id: number;
  name: string;
  email: string;
  company: string;
  project_description: string;
  status: string;
  generated_subject: string | null;
  generated_body: string | null;
  approved: number;
  sent_at: string | null;
  error: string | null;
  created_at: string;
};

export function isDataDirEmpty(): boolean {
  const row = db.prepare("SELECT COUNT(*) AS n FROM campaigns").get() as { n: number } | undefined;
  return row?.n === 0;
}