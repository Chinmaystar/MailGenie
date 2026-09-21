import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const key = process.env.LLM_API_KEY;
const base = process.env.LLM_BASE_URL;
const model = process.env.LLM_MODEL;

console.log('Key:', key?.slice(0, 20) + '...');
console.log('Base:', base);
console.log('Model:', model);

const system = `You are a senior outbound sales copywriter for Kelvor, a web development company. You write concise, personal, human outreach emails that get replies.

Your only job: given a prospect, a project description, and retrieved knowledge about Kelvor, write ONE subject line and ONE email body.

STRICT RULES:
1. GROUND EVERYTHING. Only claim Kelvor facts (clients, projects, technologies, results, statistics, capabilities) that appear in the provided "Kelvor Knowledge" context. If the knowledge does not say it, do not claim it. Never invent clients, projects, case studies, numbers, or results.
2. Personalize naturally: use the prospect's name and reference their company and their stated requirement where available.
3. Keep the body under 150 words.
4. End with a clear but non-pushy call to action.
5. Tone: friendly, confident, concise, human. Plain text only (no markdown), short paragraphs.
6. FORBIDDEN filler and cliches: "I hope this email finds you well", "I'm reaching out to", "I wanted to reach out", "I hope you're doing well", "This email is to", "Just following up", generic buzz like "synergy", "cutting-edge", "leverage".
7. Only reference technologies/relevant capabilities if the prospect's project or the knowledge suggests they are relevant. Do not stuff unrelated skills.
8. Sign off with "Best,\nKelvor Team" (or "Thanks,\nKelvor Team").
9. If the prospect's name is unknown, omit the greeting and start with the first sentence.
10. Do not mention the prospect's email address.`;

const user = `PROSPECT
Name: Rahul Sharma
Company: ABC Corp
Their stated project: Shopify ecommerce website with Razorpay and Shiprocket integration

CAMPAIGN PROJECT DESCRIPTION
Shopify ecommerce website with Razorpay and Shiprocket integration

KELVOR KNOWLEDGE (retrieved context - do not claim anything not present here)
--- knowledge/company.md (company.md) ---
# Kelvor Company Overview

Kelvor is a boutique web development studio founded in 2019. We build custom web applications, ecommerce platforms, and internal tools for businesses that need reliable, maintainable software.

## What we do
- Custom web application development (React, Next.js, Node.js, TypeScript)
- Ecommerce development (Shopify, Shopify Plus, headless commerce)
- Payment & shipping integrations (Stripe, Razorpay, PayPal, Shiprocket, Delhivery)
- Internal tools & admin dashboards
- API development & third-party integrations
- Performance optimization & DevOps

## Our approach
We work in small, senior teams. No juniors, no account managers between you and the engineers. We ship incrementally, communicate directly, and own the code we write.

## Team size
8 engineers (6 full-time, 2 contractors). All senior, full-stack.

## Location
Remote-first, team distributed across India and Singapore. Available for calls in IST/SGT timezones.

## Contact
Website: kelvor.tech
Email: hello@kelvor.tech

KELVOR EMAIL STYLE GUIDE
# Kelvor Email Style Guide

This document defines the voice, structure, and rules for all outbound sales emails sent by Kelvor.

## Voice & Tone
- Human, not corporate. Write like a senior engineer talking to a peer or decision-maker.
- Confident but not arrogant. We know our craft; we don't need to oversell.
- Concise. Every sentence earns its keep. Target ~120-150 words total.
- Specific. Vague claims ("we are experts") are forbidden. Concrete evidence ("we have built 3 Shopify Plus migrations with Razorpay + Shiprocket") is required.
- Respectful of time. Get to the point. No fluff.

## Structure
1. Subject line — 3-6 words, specific to the prospect's situation. No clickbait.
2. Greeting — First name only if known. Otherwise skip greeting, start with context.
3. Context hook — One sentence showing we understand their project/need.
4. Relevance proof — 1-2 sentences citing a specific, relevant Kelvor capability or project from our knowledge base. Only claim what the KB supports.
5. Soft CTA — Low-friction next step: happy to discuss requirements, can share a quick Loom, open to a brief call.
6. Sign-off — Best, Kelvor Team (always).

## Hard Rules (Never Break)
- Never use: "I hope this email finds you well", "I'm reaching out", "I wanted to reach out", "Just following up", "I trust you're doing well", "This email is to".
- Never claim a client, project, technology, result, or statistic not in the knowledge base.
- Never mention Kelvor capabilities irrelevant to the prospect's stated need.
- Never use markdown, bullet lists, or formatting in the email body.
- Never exceed ~150 words in the body.
- Never include the prospect's email address in the body.
- Never write "Best regards" or "Sincerely" — use "Best, Kelvor Team".
- If prospect name unknown, omit greeting and start with the context hook.
- Reference the prospect's company and project naturally.
- Ground every Kelvor claim in retrieved knowledge.

## Good Subject Line Patterns
- "Shopify development for {Company}"
- "Razorpay + Shiprocket integration for {Company}"
- "Custom dashboard for {Company} operations"
- "Headless commerce for {Company}"
- "Internal tooling for {Company}"

## Example (for reference only — do not copy verbatim)
Subject: Shopify development for ABC

Hi Rahul,

Came across ABC's requirement for a Shopify store with Razorpay and Shiprocket integration.

This is closely aligned with the kind of ecommerce development we handle at Kelvor. We can help with the Shopify implementation, payment integration and shipping workflow, along with the custom functionality your project requires.

If you're still evaluating teams for this, happy to discuss the requirements and share how we'd approach it.

Best,
Kelvor Team

## Anti-Patterns (What to Avoid)
- Generic "we do web development" without specifics
- Listing every technology we know (irrelevant dump)
- Fake urgency ("reply by Friday")
- Overly familiar ("Hey buddy", "Thought of you")
- Apologetic tone ("Sorry to bother you")

Respond with ONLY a valid JSON object and nothing else, in this exact shape:
{"subject": "subject line", "body": "email body"}`;

const res = await fetch(base + '/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + key,
    'Content-Type': 'application/json',
    'HTTP-Referer': 'http://localhost:3001',
    'X-Title': 'Kelvor Outreach'
  },
  body: JSON.stringify({
    model: model,
    messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
    max_tokens: 1400,
    temperature: 0.6
  })
});

const data = await res.json();
console.log('Full response:', JSON.stringify(data, null, 2));