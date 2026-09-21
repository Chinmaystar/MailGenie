import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import type { Chunk } from "./types.js";

const MAX_CHARS = 700;
const MIN_CHARS = 120;

/**
 * A very small, dependency-free paragraph packer.
 * Markdown files are split on blank lines, then greedily merged into chunks of
 * roughly MAX_CHARS characters so each chunk is a coherent unit of context.
 */
function chunkDocument(source: string, text: string): Chunk[] {
  const blocks = text
    .split(/\n\s*\n/)
    .map((b) => b.trim())
    .filter(Boolean);

  const chunks: string[] = [];
  let current = "";

  const flush = () => {
    if (current.trim()) chunks.push(current.trim());
    current = "";
  };

  for (const block of blocks) {
    if (current && current.length + block.length + 2 > MAX_CHARS) flush();
    current = current ? `${current}\n\n${block}` : block;
    // Very long blocks (e.g. long lists) get hard-split.
    while (current.length > MAX_CHARS * 2) {
      chunks.push(current.slice(0, MAX_CHARS));
      current = current.slice(MAX_CHARS);
    }
  }
  flush();

  // Drop tiny fragments unless they are the only content.
  const useful = chunks.length > 1 ? chunks.filter((c) => c.length >= MIN_CHARS) : chunks;

  return useful.map((content, index) => {
    const heading = content.match(/^#{1,6}\s+(.+)$/m)?.[1]?.trim();
    const id = createHash("sha1").update(`${source}:${index}:${content}`).digest("hex").slice(0, 12);
    return {
      id,
      source,
      title: heading ?? path.basename(source),
      content,
    };
  });
}

export function loadKnowledge(knowledgeDir: string): Chunk[] {
  if (!fs.existsSync(knowledgeDir)) return [];

  const files = fs
    .readdirSync(knowledgeDir)
    .filter((f) => /\.(md|markdown|txt)$/i.test(f))
    .sort();

  const chunks: Chunk[] = [];
  for (const file of files) {
    const fullPath = path.join(knowledgeDir, file);
    const text = fs.readFileSync(fullPath, "utf8");
    chunks.push(...chunkDocument(`knowledge/${file}`, text));
  }
  return chunks;
}