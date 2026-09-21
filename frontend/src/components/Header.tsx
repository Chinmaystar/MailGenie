import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Health } from "../types";

type Config = {
  label: string;
  ok: boolean;
  hint: string;
};

export default function Header({ onHome }: { onHome: () => void }) {
  const [health, setHealth] = useState<Health | null>(null);

  useEffect(() => {
    api.health().then(setHealth).catch(() => setHealth(null));
  }, []);

  const items: Config[] = [
    health
      ? {
          label: `RAG: ${health.ragProvider}`,
          ok: true,
          hint: "local knowledge index",
        }
      : { label: "RAG: …", ok: false, hint: "backend unreachable" },
    health
      ? {
          label: `LLM ${health.llmConfigured ? "ready" : "missing key"}`,
          ok: health.llmConfigured,
          hint: "LLM_API_KEY in .env",
        }
      : { label: "LLM: …", ok: false, hint: "backend unreachable" },
    health
      ? {
          label: `Email ${health.emailConfigured ? "ready" : "not configured"}`,
          ok: health.emailConfigured,
          hint: "RESEND_API_KEY + FROM_EMAIL in .env",
        }
      : { label: "Email: …", ok: false, hint: "backend unreachable" },
  ];

  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-4">
        <button
          onClick={onHome}
          className="flex items-center gap-2 text-lg font-semibold tracking-tight"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-neutral-900 text-sm text-white">
            K
          </span>
          Kelvor Outreach
        </button>
        <div className="flex flex-wrap items-center gap-2">
          {items.map((item) => (
            <span
              key={item.label}
              title={item.hint}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${
                item.ok
                  ? "border-green-200 bg-green-50 text-green-700"
                  : "border-amber-200 bg-amber-50 text-amber-700"
              }`}
            >
              {item.label}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}