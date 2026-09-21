import Papa from "papaparse";
import { addProspect } from "../../db/repositories/prospects.js";
import { countProspects } from "../../db/repositories/prospects.js";
import { isValidEmail } from "../../utils/validate.js";

export type ImportResult = {
  added: number;
  skipped: number;
  errors: string[];
};

type ProspectInput = {
  name: string;
  email: string;
  company: string;
  project_description: string;
};

function normalize(record: Record<string, string>): ProspectInput {
  const pick = (...keys: string[]) => {
    for (const k of keys) {
      const v = record[k];
      if (v !== undefined && v !== null && String(v).trim() !== "") return String(v).trim();
    }
    return "";
  };

  let name = pick("name", "Name", "first name", "First Name", "full_name");
  const emailValue = pick("email", "Email", "EMAIL", "email_id", "email address", "Email Address");
  const company = pick("company", "Company", "organization", "org", "Organization");
  const project = pick(
    "project",
    "Project",
    "project_description",
    "Project Description",
    "requirement",
    "notes",
  );

  if (!name) {
    const email = emailValue;
    const local = email.includes("@") ? email.split("@")[0] ?? "" : email;
    name = local
      .replace(/[._-]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim();
  }

  return { name, email: emailValue, company, project_description: project };
}

export function importProspectsFromCSV(
  campaignId: number,
  csvText: string,
  campaignDescription: string,
): ImportResult {
  const result: ImportResult = { added: 0, skipped: 0, errors: [] };

  const parsed = Papa.parse<Record<string, string>>(csvText.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  for (const row of parsed.data) {
    if (!row || !row.email?.trim()) continue;
    const input = normalize(row);

    if (!isValidEmail(input.email)) {
      result.skipped += 1;
      result.errors.push(`invalid email skipped: ${input.email}`);
      continue;
    }
    const res = addProspect({
      campaignId,
      email: input.email,
      name: input.name,
      company: input.company,
      project_description: input.project_description || campaignDescription,
    });
    if (res.ok) {
      result.added += 1;
    } else {
      result.skipped += 1;
      result.errors.push(res.error);
    }
  }

  return result;
}

/**
 * Accept a plain pasted blob: lines of emails, "Name <email>", or
 * small name,email,company rows. CSV files handled separately.
 */
export function importProspectsFromText(
  campaignId: number,
  text: string,
  campaignDescription: string,
): ImportResult {
  const result: ImportResult = { added: 0, skipped: 0, errors: [] };
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    if (line.includes(",")) {
      const cols = line.split(",").map((c) => c.trim());
      const foundIndex = cols.findIndex((c) => isValidEmail(c));
      let res;
      if (foundIndex >= 0) {
        const email = cols[foundIndex];
        const name = cols[foundIndex - 1] ?? cols[0] ?? "";
        const company = cols[foundIndex + 1] ?? "";
        const project = cols[foundIndex + 2] ?? "";
        res = addProspect({
          campaignId,
          email,
          name: name !== email ? name : "",
          company,
          project_description: project || campaignDescription,
        });
      } else {
        result.skipped += 1;
        result.errors.push(`no valid email in line: ${line}`);
        continue;
      }
      if (res.ok) result.added += 1;
      else {
        result.skipped += 1;
        result.errors.push(res.error);
      }
      continue;
    }

    // Not a comma separated line.
    const emailMatch = line.match(/([^\s<>@]+@[^\s<>@]+\.[^\s<>@]+)/i);
    if (!emailMatch) {
      result.skipped += 1;
      result.errors.push(`no email found in line: ${line}`);
      continue;
    }
    const email = emailMatch[1];
    if (!isValidEmail(email)) {
      result.skipped += 1;
      result.errors.push(`invalid email skipped: ${email}`);
      continue;
    }
    let name = line.replace(emailMatch[1], "").replace(/[<>]/g, "").trim();
    if (!name) {
      const local = email.split("@")[0] ?? "";
      name = local.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
    }
    const res = addProspect({
      campaignId,
      email,
      name,
      company: "",
      project_description: campaignDescription,
    });
    if (res.ok) result.added += 1;
    else {
      result.skipped += 1;
      result.errors.push(res.error);
    }
  }

  return result;
}

export { countProspects };