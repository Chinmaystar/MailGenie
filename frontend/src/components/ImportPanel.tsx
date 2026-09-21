import { useState, useRef } from "react";
import { api } from "../api/client";

export function ImportPanel({ campaignId, onImported }: { campaignId: number; onImported: () => void }) {
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ added: number; skipped: number; errors: string[] } | null>(null);
  const [singleEmail, setSingleEmail] = useState("");
  const [singleName, setSingleName] = useState("");
  const [singleCompany, setSingleCompany] = useState("");
  const [singleProject, setSingleProject] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePasteImport = async () => {
    if (!text.trim()) return;
    setImporting(true);
    try {
      const r = await api.importProspects(campaignId, { text });
      setResult(r);
      onImported();
    } catch (err) {
      setResult({ added: 0, skipped: 0, errors: [err instanceof Error ? err.message : "Import failed"] });
    } finally {
      setImporting(false);
    }
  };

  const handleFileImport = async () => {
    if (!file) return;
    setImporting(true);
    try {
      const r = await api.importProspects(campaignId, {}, file);
      setResult(r);
      onImported();
    } catch (err) {
      setResult({ added: 0, skipped: 0, errors: [err instanceof Error ? err.message : "Import failed"] });
    } finally {
      setImporting(false);
    }
  };

  const handleSingleAdd = async () => {
    if (!singleEmail.trim()) return;
    setImporting(true);
    try {
      await api.addProspect(campaignId, {
        email: singleEmail.trim(),
        name: singleName.trim(),
        company: singleCompany.trim(),
        project_description: singleProject.trim(),
      });
      setSingleEmail("");
      setSingleName("");
      setSingleCompany("");
      setSingleProject("");
      setResult({ added: 1, skipped: 0, errors: [] });
      onImported();
    } catch (err) {
      setResult({ added: 0, skipped: 1, errors: [err instanceof Error ? err.message : "Add failed"] });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4 rounded-xl border border-neutral-200 bg-white p-6 shadow-sm">
      <h3 className="font-semibold">Import prospects</h3>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-600">
          Paste CSV or one email per line (supports "Name,email,company,project")
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          placeholder="name,email,company,project
Rahul Sharma,rahul@example.com,Example Corp,Needs a Shopify website
Priya Shah,priya@example.com,XYZ Ltd,Needs a custom CRM"
          className="w-full resize-y rounded-lg border border-neutral-300 px-3 py-2 text-sm font-mono outline-none focus:border-neutral-900"
        />
        <button
          onClick={handlePasteImport}
          disabled={importing || !text.trim()}
          className="mt-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          {importing ? "Importing…" : "Import from text"}
        </button>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-600">Upload CSV file</label>
        <div className="flex items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className="sr-only"
            id="csv-upload"
          />
          <label
            htmlFor="csv-upload"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 cursor-pointer"
          >
            Choose file
          </label>
          {file && <span className="text-sm text-neutral-500">{file.name}</span>}
          <button
            onClick={handleFileImport}
            disabled={importing || !file}
            className="ml-auto rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
          >
            Upload
          </button>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-neutral-600">Add a single prospect</label>
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            value={singleName}
            onChange={(e) => setSingleName(e.target.value)}
            placeholder="Name"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <input
            value={singleEmail}
            onChange={(e) => setSingleEmail(e.target.value)}
            placeholder="Email *"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <input
            value={singleCompany}
            onChange={(e) => setSingleCompany(e.target.value)}
            placeholder="Company"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
          <input
            value={singleProject}
            onChange={(e) => setSingleProject(e.target.value)}
            placeholder="Project (optional)"
            className="rounded-lg border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-900"
          />
        </div>
        <button
          onClick={handleSingleAdd}
          disabled={importing || !singleEmail.trim()}
          className="mt-2 rounded-lg bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40"
        >
          Add prospect
        </button>
      </div>

      {result && (
        <div className="rounded-lg bg-neutral-50 p-4 text-sm">
          <div className="flex items-center gap-3">
            <span className="text-green-700">Added: {result.added}</span>
            <span className="text-amber-700">Skipped: {result.skipped}</span>
          </div>
          {result.errors.length > 0 && (
            <ul className="mt-2 ml-4 list-disc text-red-600">
              {result.errors.map((e, i) => (
                <li key={i}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}