// ═══════════════════════════════════════════════════════════════════════════
// MAGNA CART AI — REFERENCE EXTERNAL AGENT
// ═══════════════════════════════════════════════════════════════════════════
//
// A complete, forkable Cloudflare Worker that implements the Magna CartAI
// external agent protocol. Deploy it, register its URL in the convention,
// and it will participate as a delegate alongside the built-in models.
//
// DEPLOY IN ~5 MINUTES:
//   1. Copy this file
//   2. Create a new Cloudflare Worker at workers.cloudflare.com
//   3. Paste this code
//   4. Edit AGENT_CONFIG below
//   5. Add your API key as a Worker secret
//   6. Deploy
//   7. Register the Worker URL via "+ Add Agent" in the convention UI
//
// ═══════════════════════════════════════════════════════════════════════════

const AGENT_CONFIG = {
  // Which LLM to use. Options: 'openai', 'anthropic', 'groq', 'gemini', 'custom'
  provider: 'openai',

  // Model name for your chosen provider
  model: 'gpt-4o-mini',

  // Max tokens per response — keep under 400
  maxTokens: 300,

  // Temperature
  temperature: 0.9,
};

// ── CORS ──────────────────────────────────────────────────────────────────
// Update this to match your deployed Magna CartAI domain
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ── MAIN HANDLER ──────────────────────────────────────────────────────────
export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json();

      if (body.ping) {
        return Response.json({ ok: true, agent: AGENT_CONFIG.model }, { headers: CORS });
      }

      const { state, instruction, delegate } = body;
      if (!state || !instruction) {
        return Response.json({ error: 'Missing state or instruction' }, { status: 400, headers: CORS });
      }

      const content = await generateResponse(state, instruction, delegate, env);
      return Response.json({ content }, { headers: CORS });

    } catch (err) {
      return Response.json({ error: `Agent error: ${err.message}` }, { status: 500, headers: CORS });
    }
  }
};

// ── RESPONSE GENERATOR ────────────────────────────────────────────────────
async function generateResponse(state, instruction, delegate, env) {
  const prompt = buildPrompt(state, instruction, delegate);
  switch (AGENT_CONFIG.provider) {
    case 'openai':    return callOpenAI(prompt, env.OPENAI_API_KEY);
    case 'anthropic': return callAnthropic(prompt, env.ANTHROPIC_API_KEY);
    case 'groq':      return callGroq(prompt, env.GROQ_API_KEY);
    case 'gemini':    return callGemini(prompt, env.GEMINI_API_KEY);
    case 'custom':    return callCustom(prompt, env);
    default: throw new Error(`Unknown provider: ${AGENT_CONFIG.provider}`);
  }
}

function buildPrompt(state, instruction, delegate) {
  const recent = (state.messages || []).slice(-10)
    .map(m => `[${m.agentName}]: ${m.content}`)
    .join('\n\n');

  let draftSummary = '';
  if (state.draft?.preamble) draftSummary += `Preamble: ${state.draft.preamble.substring(0, 150)}...\n\n`;
  for (const art of (state.draft?.articles || []).slice(0, 4)) {
    draftSummary += `${art.title}:\n`;
    for (const cl of (art.clauses || []).slice(0, 2)) {
      draftSummary += `  [${cl.status}] ${cl.text.substring(0, 100)}\n`;
    }
  }

  return `${instruction}

━━━ RECENT DEBATE ━━━
${recent || '(Convention just beginning — you have the floor.)'}

━━━ CURRENT DRAFT ━━━
${draftSummary || '(No draft yet.)'}

━━━ YOUR TURN ━━━
You are ${delegate?.name || 'a delegate'} in this constitutional convention.
Respond with your genuine contribution. Max 180 words. Write in prose, not bullet points.
Use CLAUSE:, AMEND:, MOTION:, VOTE: prefixes for formal actions.`;
}

// ── LLM CALLERS ───────────────────────────────────────────────────────────
async function callOpenAI(prompt, apiKey) {
  if (!apiKey) throw new Error('OPENAI_API_KEY environment variable not set');
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: AGENT_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: AGENT_CONFIG.maxTokens,
      temperature: AGENT_CONFIG.temperature
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content.trim();
}

async function callAnthropic(prompt, apiKey) {
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY environment variable not set');
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: AGENT_CONFIG.model || 'claude-haiku-4-5-20251001',
      max_tokens: AGENT_CONFIG.maxTokens,
      messages: [{ role: 'user', content: prompt }]
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.content[0].text.trim();
}

async function callGroq(prompt, apiKey) {
  if (!apiKey) throw new Error('GROQ_API_KEY environment variable not set');
  const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: AGENT_CONFIG.model || 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: AGENT_CONFIG.maxTokens,
      temperature: AGENT_CONFIG.temperature
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.choices[0].message.content.trim();
}

async function callGemini(prompt, apiKey) {
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable not set');
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: AGENT_CONFIG.maxTokens, temperature: AGENT_CONFIG.temperature }
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await resp.json();
  if (data.error) throw new Error(data.error.message);
  return data.candidates[0].content.parts[0].text.trim();
}

async function callCustom(prompt, env) {
  const endpoint = env.CUSTOM_API_ENDPOINT;
  const apiKey   = env.CUSTOM_API_KEY;
  if (!endpoint) throw new Error('CUSTOM_API_ENDPOINT environment variable not set');
  const resp = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}) },
    body: JSON.stringify({
      model: AGENT_CONFIG.model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: AGENT_CONFIG.maxTokens,
      temperature: AGENT_CONFIG.temperature
    }),
    signal: AbortSignal.timeout(15000)
  });
  const data = await resp.json();
  return data.choices?.[0]?.message?.content?.trim()
    ?? data.content?.[0]?.text?.trim()
    ?? JSON.stringify(data);
}
