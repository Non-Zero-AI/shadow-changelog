// Optional: a short prose summary, only if an API key is ALREADY in the environment.
// The model sees only our extracted findings (no source code) and is told not to add facts.
export async function llmSummary(findings) {
  const prompt = `You write a terse changelog for power users. Below are automatically extracted differences between two releases of an app, each with evidence. Write 3-6 bullet points describing the most notable changes. Only state what the data shows; use "appears to"/"possibly" for anything inferred; never invent features. Data:\n${JSON.stringify(findings, null, 1).slice(0, 12000)}`;
  try {
    if (process.env.OPENAI_API_KEY) {
      const r = await fetch((process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1') + '/chat/completions', {
        method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        body: JSON.stringify({ model: process.env.SHADOW_LLM_MODEL || 'gpt-4o-mini', messages: [{ role: 'user', content: prompt }], temperature: 0.2 }),
      });
      if (r.ok) return (await r.json()).choices[0].message.content;
    } else if (process.env.ANTHROPIC_API_KEY) {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST', headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify({ model: process.env.SHADOW_LLM_MODEL || 'claude-3-5-haiku-latest', max_tokens: 600, messages: [{ role: 'user', content: prompt }] }),
      });
      if (r.ok) return (await r.json()).content[0].text;
    }
  } catch { /* fall through to deterministic report */ }
  return null;
}
