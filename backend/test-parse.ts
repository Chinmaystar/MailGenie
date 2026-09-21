function parseEmailJson(text: string) {
  const cleaned = text.trim().replace(/^```(?:json)?|```$/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(cleaned.slice(start, end + 1));
    const subject = String(parsed.subject ?? '').trim();
    const body = String(parsed.body ?? '').trim();
    if (!subject || !body) return null;
    return { subject, body };
  } catch {
    return null;
  }
}

// This is what the API actually returns - with escaped newlines
const content = `{"subject": "Shopify + Razorpay + Shiprocket for ABC", "body": "Hi Rahul,\\n\\nSaw ABC's requirement for a Shopify store with Razorpay and Shiprocket integration.\\n\\nWe handle exactly this kind of work at Kelvor — Shopify builds with payment and shipping integrations like Razorpay and Shiprocket. You'd work directly with our senior engineers, no account managers in between, and we ship incrementally so you see progress early.\\n\\nIf you're still evaluating teams for this, happy to walk through the requirements and share how we'd approach it.\\n\\nBest,\\nKelvor Team"}`;

console.log('Parsed:', parseEmailJson(content));

// Test with markdown wrapper
const withMarkdown = '```json\n' + content + '\n```';
console.log('With markdown:', parseEmailJson(withMarkdown));

// Test with extra text
const withExtra = 'Here is the email:\n' + content + '\nThanks!';
console.log('With extra text:', parseEmailJson(withExtra));