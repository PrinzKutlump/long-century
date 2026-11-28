# Assets

Every shipped asset: file, source, licence, author.

- data/raw/geo/ne_{10m,50m}_{coastline,land,lakes,rivers_lake_centerlines,admin_0_countries,admin_1_states_provinces}.geojson, data/raw/geo/ne_10m_populated_places.geojson | Natural Earth vector, github.com/nvkelso/natural-earth-vector at commit ca96624a56bd078437bca8184e78163e5039ad19 (fetched by the geodata workflow, clipped to lat -60..80) | public domain | Natural Earth contributors
- data/raw/geo/ohm_admin_{1836-01-01,1866-01-01,1900-01-01,1914-01-01}.geojson | OpenHistoricalMap Overpass API, admin_level 2 and 4 boundaries, features with a non-CC0 license tag dropped (see data/raw/geo/SOURCES.md) | CC0 | OpenHistoricalMap contributors

Geodata above is tracked by the geodata workflow; files under assets/ are covered by the checker below.

## Free-licence rules for pictures, audio and other assets (2026-11-25, AI art added 2026-11-27)

Owner rule (2026-11-25): pictures, audio and other assets must be free of licence strings. Only these kinds are allowed in this repo:

| Kind | Meaning | Needs |
|---|---|---|
| `original` | Made by us in code or by hand (SVG borders, CSS paper, WebAudio sounds, tunes played by our synth from public-domain notes). Dedicated CC0. | nothing |
| `CC0` | Creator or museum waived rights (Creative Commons Zero). | source URL, author, retrieved date |
| `PD` | Public domain by age or by government author. | source URL, rights line, retrieved date |
| `OFL` | Fonts only, under the SIL Open Font License 1.1 (owner decision 28 Nov 2026, ledger B63), for example IM Fell, Playfair, Cormorant or Libre Caslon from Google Fonts. Ship the font's OFL.txt beside it; never sell the font file alone; keep the original font name only if unmodified. | source URL, author, retrieved date, OFL.txt in the same folder |
| `AI` | Made with an AI tool (owner decision 27 Nov 2026, ledger B42), for example Gemini image, video or music generation in AI Studio. A person reviews each file before it ships. | tool and model, prompt, created date, reviewed_by; the tool's terms must allow commercial use |

Never allowed (OFL is allowed for font files only, nothing else): CC BY, CC BY-SA, CC BY-NC, ND, "free for personal use", AI output from a tool whose terms forbid commercial use, prompts that name a living artist or copy a known artwork, character or brand, anything with a visible brand, and portraits of living people. Historical figures may be shown, as period-style illustration, never as a fake photograph. If an item needs credit, it is out.

AI art notes: AI-made pictures and music may not be protected by copyright, so others could reuse them; keep the prompt and the date so their origin is on record, and prefer AI output that a person has edited or composed into a larger piece. Google Play asks about AI-generated content in its policy forms (REL1 #95).

## Order of preference
1. **Make it ourselves** (kind `original`). Old-book borders, paper grain, seals, rules and flourishes are SVG and CSS. Cues and music are WebAudio. This costs no bytes of licence risk and almost no file size.
2. **Public-domain tunes, our own playing.** A composition whose composer died more than 70 years ago is free; our synthesized performance is ours. Candidates (check the composer's death year and use a public-domain score, never a modern recording): La Marseillaise, Ode to Joy, Radetzky March, Rule, Britannia!, God Save the Tsar, Mazurek Dabrowskiego. Anthems with live political weight stay out unless the nation is playable and the tune is period-correct.
3. **Museum and library images** (kind `CC0` or `PD`), chosen per item.

## Vetted sources (what the owner or an agent with network access may download from)
- **The Met, Open Access.** Images with the Open Access icon are CC0: any use, including commercial, no credit needed. Check the icon on each item; works without it are not covered.
- **Library of Congress, Free to Use and Reuse sets.** Curated prints and photographs the Library believes are public domain, with no known copyright, or cleared for public use. Privacy and publicity rights can still apply; keep the credit line in the manifest.
- **Freesound with the licence filter set to Creative Commons 0.** CC0 sounds need no credit. Skip any item whose description asks for credit anyway.
- **Also commonly CC0 or public domain, but not yet checked by us:** Smithsonian Open Access, Rijksmuseum, NYPL digital collections, Wikimedia Commons (each file page names its own licence), OpenGameArt and Kenney (CC0 filter). Read the rights line on every item before adding it.

The build workspace cannot reach these sites (network is limited to package registries and GitHub), so the owner or a networked agent downloads, resizes and commits the files; the checker below decides whether they may stay.

## Size budget
`dist/long-century.html` is capped at 1.8 MB by `test_art_budget.js`. Images: WebP, at most 60 KB each, at most 400 KB in total. Audio: prefer synthesis; any recorded file at most 80 KB (mono Opus or OGG). Larger items load on demand, never inline.

## How an asset gets in
1. Put the file under `assets/` (for example `assets/img/great-works/pantheon.webp`).
2. Add a row to `docs/assets.json`: `path`, `kind`, `license`, `author`, `source_url`, `retrieved`, `sha256`, `note` (what it is used for, ticket number).
3. Run `python3 tools/assets_check.py`. It fails on a file with no row, a row with no file, a wrong hash, a disallowed licence, a missing source for CC0 or PD items, or a total above the budget. CI runs it in the quick tier.
4. `original` items made in code (`src/*.js`) need no file; list them in the manifest with `path: "src/ui_audio.js"` so they are counted as ours.

## Where the assets are wanted
- Ticket #43: great-work and city background pictures.
- Ticket #41: old-book borders, paper, seals (all `original`).
- Ticket #44: era sounds and music (synthesis first).
