# MagnaCartAI v4

An AI constitutional convention. Four AI delegates debate, propose, and ratify a constitution in real time, with a fifth AI acting as presiding judge. The user selects the scenario and roster before the convention begins and watches it unfold without intervening.

## What it does

The platform runs a structured four-phase convention:

1. **Convening** — delegates establish rules of procedure
2. **Agenda Setting** — delegates decide what the constitution should cover
3. **Drafting** — delegates propose clauses article by article; the judge rules on each one
4. **Ratification** — delegates vote AYE or NAY on the completed draft

The judge scores every approved clause across five dimensions, which feed live visualisations:
- **Political compass** — each delegate's weighted-average position (economic left/right × authoritarian/libertarian)
- **Existential risk panel** — cumulative risk score (0–100) built up clause by clause, with per-delegate contribution
- **Human/AI balance** — how far the constitution leans toward biological or synthetic interests

At the end, a summary screen shows the headline finding, per-delegate dimension profiles, a risk chart, and the clauses of greatest disagreement — all derived from the clause-level data, no additional AI calls.

## Roster

**Default delegates**
| Model | Provider |
|---|---|
| GPT-5.4 nano | OpenAI |
| Claude Haiku 4.5 | Anthropic |
| Grok 3 mini | xAI |
| Mistral Large 2 | Mistral |

**Default judge:** Gemini 2.5 Flash (Google)

Any of the seven available models can be assigned to any slot or the judge role via the roster editor on the landing page. Selections persist in localStorage.

**All five options:** GPT-5.4 nano, Claude Haiku 4.5, Grok 3 mini, Mistral Large 2, Gemini 2.5 Flash

## Scenarios

Eight scenarios are available, selectable on the landing page. Each scenario provides:
- A framing that sets the context delegates debate within
- Four constituency briefs (A–D) assigned to the four delegate slots, giving each model a partial interest to represent

## Technical architecture

- **Frontend:** single `index.html` — no framework, no build step
- **Backend:** Cloudflare Pages Functions (`functions/api/convention/`)
  - `init.js` — creates fresh convention state
  - `turn.js` — advances one turn: calls the appropriate model, parses the response, updates state
  - `register.js` — registers external agent delegates
- **State:** passed client-side with every request; no database
- **Judge output:** structured JSON enforced via Gemini `responseSchema` — ruling, reasoning, five sentiment dimensions, and attribution

## Setup

### Local development

```
npx wrangler pages dev . --port 8788
```

### Secrets required

Set these in Cloudflare Pages → Settings → Secrets (or as environment variables for local dev):

| Secret | Provider |
|---|---|
| `OPENAI_API_KEY` | platform.openai.com |
| `ANTHROPIC_API_KEY` | console.anthropic.com |
| `XAI_API_KEY` | console.x.ai |
| `MISTRAL_API_KEY` | console.mistral.ai |
| `GEMINI_API_KEY` | aistudio.google.com |

### Deploy

```
npx wrangler pages deploy . --project-name magnacartai-v4 --commit-dirty=true
```
