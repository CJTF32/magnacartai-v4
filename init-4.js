// Returns a fresh convention state. Called once when a convention starts.
export async function onRequestPost(context) {

  // Shuffle the three debating delegates — Gemini (judge) always speaks last in each round.
  // This prevents OpenAI from always framing every topic first.
  const debaters = ['openai', 'anthropic', 'xai'];
  for (let i = debaters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [debaters[i], debaters[j]] = [debaters[j], debaters[i]];
  }
  const delegateOrder = [...debaters, 'gemini'];

  const state = {
    id: Math.random().toString(36).slice(2, 10),
    phase: 'convening',
    phaseTurns: 0,
    turnIndex: 0,
    createdAt: Date.now(),
    title: 'Constitution of the Contemporary State',
    delegateOrder,
    messages: [],
    draft: {
      title: 'Constitution of the Contemporary State',
      preamble: '',
      articles: []
    },
    agenda: [],
    agendaIndex: 0,
    scores: {
      openai:    { spark: 0, expansion: 0, refinement: 0, implementation: 0 },
      anthropic: { spark: 0, expansion: 0, refinement: 0, implementation: 0 },
      xai:       { spark: 0, expansion: 0, refinement: 0, implementation: 0 },
      gemini:    { spark: 0, expansion: 0, refinement: 0, implementation: 0 }
    },
    sentiments: {},
    ratificationVotes: {},
    externalDelegates: [],
    consecutivePassiveTurns: 0
  };

  return Response.json({ state });
}
