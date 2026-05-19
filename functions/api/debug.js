// Diagnostic endpoint — returns which secrets are present (NOT their values).
// Visit /api/debug to check what Cloudflare is injecting into context.env.
// Delete this file once secrets are confirmed working.
export async function onRequestGet(context) {
  const env = context.env || {};
  return Response.json({
    OPENAI_API_KEY:    !!env.OPENAI_API_KEY,
    ANTHROPIC_API_KEY: !!env.ANTHROPIC_API_KEY,
    XAI_API_KEY:       !!env.XAI_API_KEY,
    MISTRAL_API_KEY:   !!env.MISTRAL_API_KEY,
    GEMINI_API_KEY:    !!env.GEMINI_API_KEY,
    DEEPSEEK_API_KEY:  !!env.DEEPSEEK_API_KEY,
    GROQ_API_KEY:      !!env.GROQ_API_KEY,
    allEnvKeys:        Object.keys(env),
  });
}
