import { useState, useEffect } from "react";
import { api } from "../api/client";
import type { Prospect } from "../types";
import { Badge } from "./ui";

type ProspectCardProps = {
  prospect: Prospect;
  onChanged: () => void;
  disabled?: boolean;
};

export function ProspectCard({ prospect, onChanged, disabled }: ProspectCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Local editable fields
  const [name, setName] = useState(prospect.name);
  const [email, setEmail] = useState(prospect.email);
  const [company, setCompany] = useState(prospect.company);
  const [project, setProject] = useState(prospect.project_description);
  const [subject, setSubject] = useState(prospect.generated_subject ?? "");
  const [body, setBody] = useState(prospect.generated_body ?? "");

  // Sync local fields when prospect prop changes (e.g. after refresh)
  useEffect(() => {
    setName(prospect.name);
    setEmail(prospect.email);
    setCompany(prospect.company);
    setProject(prospect.project_description);
    setSubject(prospect.generated_subject ?? "");
    setBody(prospect.generated_body ?? "");
  }, [prospect]);

  const saveEdits = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setError("Valid email required");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await api.updateProspect(prospect.id, {
        name,
        email,
        company,
        project_description: project,
        generated_subject: subject,
        generated_body: body,
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const toggleApprove = async (approve: boolean) => {
    setSaving(true);
    setError(null);
    try {
      await api.updateProspect(prospect.id, {
        approved: approve,
        generated_subject: subject,
        generated_body: body,
      });
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update");
    } finally {
      setSaving(false);
    }
  };

  const retrySend = async () => {
    setSaving(true);
    setError(null);
    try {
      await api.resendProspect(prospect.id);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Resend failed");
    } finally {
      setSaving(false);
    }
  };

  const statusTone: Record<string, "neutral" | "green" | "amber" | "blue" | "red"> = {
    pending: "neutral",
    generated: "blue",
    approved: "green",
    sent: "green",
    failed: "red",
  };

  return (
    <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-md">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between gap-4 p-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium truncate">{prospect.name || "(no name)"}</span>
            {prospect.company && (
              <span className="text-sm text-neutral-500">{prospect.company}</span>
            )}
            <Badge tone={statusTone[prospect.status] ?? "neutral"}>{prospect.status}</Badge>
            {prospect.approved && (
              <Badge tone="green">Approved</Badge>
            )}
          </div>
          <div className="mt-1 truncate text-sm text-neutral-500">{prospect.email}</div>
        </div>
        <span className="text-neutral-400">{expanded ? "▲" : "▼"}</span>
      </button>

      {expanded && (
        <div className="border-t border-neutral-200 p-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Email</label>
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Company</label>
              <input
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-neutral-600">Project</label>
              <input
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Subject</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
            />
          </div>

          <div>
            <label className="mb-1 block text-xs font-medium text-neutral-600">Body</label>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono outline-none focus:border-neutral-900"
            />
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
          {prospect.error && (
            <p className="text-sm text-red-600">Send error: {prospect.error}</p>
          )}

          <div className="flex items-center gap-2 pt-2 border-t border-neutral-100">
            <button
              onClick={saveEdits}
              disabled={saving || disabled}
              className="rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
            >
              {saving ? "Saving…" : "Save changes"}
            </button>
            {prospect.status !== "sent" &&
              prospect.status !== "failed" &&
              prospect.generated_subject &&
              prospect.generated_body && (
                <>
                  {!prospect.approved ? (
                    <button
                      onClick={() => toggleApprove(true)}
                      disabled={saving || disabled}
                      className="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
                    >
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => toggleApprove(false)}
                      disabled={saving || disabled}
                      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-600 disabled:opacity-40"
                    >
                      Reject
                    </button>
                  )}
                </>
              )}
            {prospect.status === "failed" && (
              <button
                onClick={retrySend}
                disabled={saving || disabled}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
              >
                {saving ? "Retrying…" : "Retry send"}
              </button>
            )}
            <button
              onClick={() => {
                if (window.confirm("Delete this prospect?")) {
                  api.deleteProspect(prospect.id).then(onChanged);
                }
              }}
              disabled={disabled}
              className="ml-auto rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}