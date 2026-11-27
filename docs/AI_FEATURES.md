# Google AI Studio's AI features: where the game uses them

Status: plan, 27 Nov 2026 (Claude, ledger B40). The owner asked to use AI Studio's "Add AI features" where the game needs them and to give that work to AI Studio. Each feature was checked against the game's standing rules:

1. **Offline and deterministic.** The game runs without a connection and the same seed gives the same history; the simulation never calls the internet (MASTER_PLAN rule 5, rule 7).
2. **No AI-generated art, music or video in the shipped game.** Assets are our own, public domain or CC0 (B19, docs/ASSETS.md). This is the owner's current rule; only the owner can change it.
3. **Commercial release.** A feature that calls Gemini while people play needs our own server to hide the API key, costs money per use, and needs a privacy policy and the Play "Data safety" form (B25).

Two ways to use the features follow from that: **at build time** (AI Studio drafts content that people check and the game ships as plain data, no connection needed) and **at play time** (optional online extras, off by default, after the owner decides on cost and privacy).

## Verdicts

| AI Studio feature | Use in the game | When | Verdict | Ticket |
|---|---|---|---|---|
| Use Google Search data | Research historical events, quotes, facts and dates **with citations**; every item checked against its source before it ships | Build time | **Use** | AIS1 |
| Add a Gemini chatbot | Draft the newspaper's headline and story templates in period style; the game fills them from its own events offline | Build time | **Use** | AIS2 |
| Add a Gemini chatbot | "Ask the Historian": an optional in-game adviser that explains rules, why a number changed (CAUSE1 data) and the history behind events | Play time, online | **Design first, owner decides** (cost, server, privacy) | AIS3 |
| Add voice conversations (Live API) | Speak with your minister (built on AIS3) | Play time, online | **Later**, after AIS3 | AIS4 |
| Transcribe audio | Voice orders ("build a railway in Punjab") | Play time, online | **Later**, with AIS4 | AIS4 |
| Add database and auth (Firebase) | Optional cloud save backup and sync between devices, Google sign-in | Play time, online | **Later**, after the release plan (#95) | AIS5 |
| Create & edit images | Event pictures, portraits, sprites | — | **Not under the current rule** (no AI images). If the owner changes the rule: only as sketches that an artist redraws, never shipped directly | owner decision |
| Generate video / Animate images into video | Intro films, event clips | — | **Not under the current rule**; also large files on a phone | owner decision |
| Generate music (Lyria) | Era soundtrack | — | **Not under the current rule**; the rights to AI music for a commercial game are unsettled. MUS1 (#94) plans public-domain scores played by our own synthesiser | owner decision |
| Google Maps / Maps grounding | Real modern places and routes | — | **Not useful**: the game needs 1836–1936 borders, which come from Natural Earth and historical sources (MP tickets) | — |
| Three.js 3D scenes | 3D units or a 3D globe | — | **Not now**: the owner chose a 2D PixiJS map (B20); revisit only if the owner wants 3D | — |
| Create a game | Starter template for a new game | — | **Not needed**: the game exists | — |
| Add a SQL database (Cloud SQL) | Server database | — | **Not needed**: no server; Firebase (AIS5) covers saves if wanted | — |

## AI Studio tickets

| ID | Ticket | Ledger | Feeds | Done when |
|---|---|---|---|---|
| AIS1 | Historical research assistant with Search grounding: drafts quotes, facts and event briefs with source links into `docs/inbox/` or a data file for review; a person (Claude or the owner) checks each item against its source | B40, B30, B18 | LOAD1 #118, #56, NEWS1 #119 | 50 quotes and 50 facts with working source links, each checked; quotes published before 1929 |
| AIS2 | Newspaper template library: period-style headline and story templates with slots (nation, place, leader, number), shipped as data; the game fills them offline and deterministically | B40, B34 | NEWS1 #119 | 300 templates covering war, peace, treaties, inventions, elections, disasters, construction, the economy; no game code calls Gemini |
| AIS3 | Design "Ask the Historian" (optional, online, off by default): what it may answer, how the key stays on a server, cost per player, privacy policy text, how it reads game state without changing it | B40, B33 | CAUSE1 #122 | Owner approves design and budget, or drops it |
| AIS4 | Voice minister and voice orders (Live API, transcription), after AIS3 | B40 | AIS3 | Owner check |
| AIS5 | Optional cloud save backup with Firebase and Google sign-in, after the release plan | B40, B25 | #95 REL1 | Owner approves privacy and cost |

**Rules for AI Studio on these tickets:** work on a `t/` branch, never `main`; no Gemini call inside the simulation; play-time features stay off unless the player turns them on; nothing generated (text, image, sound) ships without a person checking it and, for text, a source link (docs/AI_STUDIO.md).
