# Google AI Studio's AI features: where the game uses them

Status: plan, 27 Nov 2026 (Claude, ledger B40), **revised the same day after three owner decisions: online features are encouraged but the game must still work fully offline (B41); AI-made art is allowed (B42); revenue comes from ads and similar (B43).** The owner asked to use AI Studio's "Add AI features" where the game needs them and to give that work to AI Studio. Each feature was checked against the game's standing rules:

1. **Offline first, online welcome.** Every part of the game works without a connection, and the same seed gives the same history, so the simulation itself never calls the internet. Online extras sit on top and degrade gracefully (B41).
2. **AI-made art, music and video are allowed** (B42), each reviewed by a person and recorded in docs/ASSETS.md with tool, prompt and date.
3. **Commercial release with ads** (B43). A feature that calls Gemini while people play needs our own server to hide the API key and costs money per use; ads and online features need a privacy policy, a consent screen and the Play "Data safety" form (B25). Online features are encouraged because ad and purchase revenue depends on them.

Two ways to use the features follow from that: **at build time** (AI Studio drafts content that people check and the game ships as plain data, no connection needed) and **at play time** (online extras, encouraged, each with an offline fallback).

## Verdicts

| AI Studio feature | Use in the game | When | Verdict | Ticket |
|---|---|---|---|---|
| Use Google Search data | Research historical events, quotes, facts and dates **with citations**; every item checked against its source before it ships | Build time | **Use** | AIS1 |
| Add a Gemini chatbot | Draft the newspaper's headline and story templates in period style; the game fills them from its own events offline | Build time | **Use** | AIS2 |
| Add a Gemini chatbot | "Ask the Historian": an in-game adviser that explains rules, why a number changed (CAUSE1 data) and the history behind events | Play time, online | **Use**, design first (server, cost per player, privacy); offline it falls back to the built-in explanations | AIS3 |
| Add voice conversations (Live API) | Speak with your minister (built on AIS3) | Play time, online | **Use**, after AIS3 | AIS4 |
| Transcribe audio | Voice orders ("build a railway in Punjab") through the normal command path | Play time, online | **Use**, with AIS4 | AIS4 |
| Add database and auth (Firebase) | Cloud save backup and sync between devices, Google sign-in; also the base for purchases and ad-free status | Play time, online | **Use**; local saves stay the default offline | AIS5 |
| Create & edit images | Loading-screen backgrounds, event pictures, period-style portraits of historical figures, unit and building sprites, map scenes | Build time | **Use** (B42): generated in AI Studio, reviewed, shipped as files; one consistent style guide; no fake photographs, no living people, no named living artists | AIS6 |
| Generate video / Animate images into video | Short intro film, event cinematics (wars declared, unification, great works opened) | Build time; large clips streamed online, small ones shipped | **Use** (B42), kept short; the game plays the same without them | AIS8 |
| Generate music (Lyria) | Era and mood soundtrack | Build time | **Use** (B42), reviewed; alongside or instead of the synthesised public-domain tunes in MUS1 (#94) | AIS7 |
| Google Maps / Maps grounding | Real modern places and routes | — | **Not useful**: the game needs 1836–1936 borders, which come from Natural Earth and historical sources (MP tickets) | — |
| Three.js 3D scenes | 3D units or a 3D globe | — | **Not now**: the owner chose a 2D PixiJS map (B20); revisit only if the owner wants 3D | — |
| Create a game | Starter template for a new game | — | **Not needed**: the game exists | — |
| Add a SQL database (Cloud SQL) | Server database | — | **Not needed**: no server; Firebase (AIS5) covers saves if wanted | — |

## AI Studio tickets

| ID | Ticket | Ledger | Feeds | Done when |
|---|---|---|---|---|
| AIS1 | Historical research assistant with Search grounding: drafts quotes, facts and event briefs with source links into `docs/inbox/` or a data file for review; a person (Claude or the owner) checks each item against its source | B40, B30, B18 | LOAD1 #118, #56, NEWS1 #119 | 50 quotes and 50 facts with working source links, each checked; quotes published before 1929 |
| AIS2 | Newspaper template library: period-style headline and story templates with slots (nation, place, leader, number), shipped as data; the game fills them offline and deterministically | B40, B34 | NEWS1 #119 | 300 templates covering war, peace, treaties, inventions, elections, disasters, construction, the economy; no game code calls Gemini |
| AIS3 | Design "Ask the Historian" (online, offline fallback): what it may answer, how the key stays on a server, cost per player, privacy policy text, how it reads game state without changing it | B40, B41, B33 | CAUSE1 #122 | Owner approves design and budget |
| AIS4 | Voice minister and voice orders (Live API, transcription), after AIS3 | B40 | AIS3 | Owner check |
| AIS5 | Cloud save backup with Firebase and Google sign-in; base for purchases and ad-free status | B40, B41, B43 | #95 REL1, REV2 | Save round-trip identical; works offline |
| AIS6 | AI art pipeline: style guide, then loading backgrounds, event pictures, portraits, unit and building sprites | B42, B27, B30 | LOAD1 #118, MED1 #93, MAP2-MAP3 | Style guide approved; first 20 pictures and one sprite sheet reviewed and in the manifest |
| AIS7 | AI music: era and mood soundtrack with Lyria | B42, A26 | MUS1 #94 | 3 tracks per era reviewed; volume and mute; pause in background |
| AIS8 | AI video: intro film and short event cinematics | B42, B29 | LOAD1, NEWS1 | Intro under 30 s; game identical without video |

### Revenue (B43), suggested for any agent

| ID | Ticket | Ledger | Done when |
|---|---|---|---|
| REV1 | Revenue design: which ads where (for example a rewarded ad for a small bonus, an ad between sessions, never during a decision), ad-free purchase, extra scenarios or cosmetic packs; how the Settings cheat fits; what works offline | B43 | Owner approves the model |
| REV2 | Ads and purchases in the Android app: AdMob through Capacitor, Google Play Billing for ad-free and packs, offline fallback | B43, B41 | Test ads and a test purchase work on the A56 |
| REV3 | Consent and privacy: consent screen (Google UMP) where the law needs it, privacy policy, Play Data safety and AI-content answers | B43, B25 | Consent shown in the EU test region; policy published |


**Rules for AI Studio on these tickets:** work on a `t/` branch, never `main`; no Gemini call inside the simulation; the game must work fully offline, online features add to it; nothing generated (text, image, sound, video) ships without a person checking it, text with a source link and media with its prompt in docs/ASSETS.md (docs/AI_STUDIO.md).
