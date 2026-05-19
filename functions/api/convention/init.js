// Returns a fresh convention state. Called once when a convention starts.
export async function onRequestPost(context) {
  const body = await context.request.json().catch(() => ({}));
  const rosterBody   = body.roster   || {};
  const scenarioBody = body.scenario || {}; // { id, name, framing, constituencies }

  const defaultDelegates = ['openai', 'anthropic', 'xai', 'mistral'];
  const defaultJudge = 'gemini';

  const delegateSlots = (Array.isArray(rosterBody.delegates) && rosterBody.delegates.length === 4)
    ? rosterBody.delegates
    : defaultDelegates;
  const judgeId = (typeof rosterBody.judgeId === 'string' && rosterBody.judgeId)
    ? rosterBody.judgeId
    : defaultJudge;

  // Shuffle the four delegate slots at init time.
  // turn.js re-derives a stable per-convention order from the convention ID (seed-shuffle),
  // so this initial shuffle only determines which 4 models are in which slots for storage.
  const debaters = [...delegateSlots];
  for (let i = debaters.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [debaters[i], debaters[j]] = [debaters[j], debaters[i]];
  }

  const allIds = [...delegateSlots, judgeId];
  const scores = {};
  for (const id of allIds) {
    scores[id] = { spark: 0, expansion: 0, refinement: 0, implementation: 0 };
  }

  // Assign constituencies A/B/C/D to the four delegates in slot order.
  // Constituency D is always the Procedural Moderator; A/B/C carry the scenario's partisan briefs.
  const constituencyKeys = ['A', 'B', 'C', 'D'];
  const constituencies   = {}; // { delegateId: { name, brief } }
  for (let i = 0; i < debaters.length && i < 4; i++) {
    const key  = constituencyKeys[i];
    const brief = scenarioBody.constituencies?.[key];
    if (brief) constituencies[debaters[i]] = brief;
  }

  // Scenario data stored in state so turn.js can read it without re-importing
  const scenario = scenarioBody.id ? {
    id:    scenarioBody.id,
    name:  scenarioBody.name   || scenarioBody.id,
    framing: scenarioBody.framing || ''
  } : null;

  const state = {
    id: Math.random().toString(36).slice(2, 10),
    phase: 'convening',
    phaseTurns: 0,
    turnIndex: 0,
    createdAt: Date.now(),
    title: 'Constitution of the Contemporary State',
    delegateOrder: debaters, // 4 debater IDs (judge appended by turn.js each round)
    judgeId,
    scenario,
    constituencies,
    messages: [],
    draft: {
      title: 'Constitution of the Contemporary State',
      preamble: '',
      articles: []
    },
    agenda: [],
    agendaIndex: 0,
    scores,
    riskTotals: { overall: 0 },       // cumulative existential_risk_delta per clause
    dimensionTotals: {},               // { [delegateId]: { [dim]: { sum, weightSum } } }
    sentiments: {},                    // kept for backward compat; now derived from dimensionTotals
    sentimentHistory: {},
    riskHistory: [],
    ratificationVotes: {},
    externalDelegates: [],
    consecutivePassiveTurns: 0
  };

  return Response.json({ state });
}
