"""V2c.8 layout check: open every sheet and modal and assert that nothing is misaligned.

    python3 tools/layout_check.py [--only NAME[,NAME]] [--sizes 360x740@125,390x844@100] [--themes light,dark] [--shots DIR] [-v]

Screens: month summary, decision card, ask sheet, Build review (and its result), Works board in its three views,
the Orders view, and the province sheet at its three heights. Each is opened at 360x740 at 125% text and 390x844
at 100% text, in light and dark, and three things are asserted inside it:

  1. no element wider than its container or the viewport (sideways scrollers such as the grid are exempt, but the
     page itself must never scroll sideways);
  2. no clipped text (scrollWidth > clientWidth on any element that holds text; hidden vertical overflow too);
  3. every control (button, select, input, link, role=button or checkbox) at least 44 px by 44 px.

The exit code is 1 on any violation, so run_tests.js can fail the build. Uses the system Chrome through Playwright.
"""
import argparse, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "dist/long-century.html").as_uri()
FIX1866 = (ROOT / "testdata/seed7_1866.txt").read_text().strip()
SIZES = {"360x740@125": (360, 740, 1.25), "390x844@100": (390, 844, 1.0)}

AUDIT = """(scopeSel) => {
  const root = document.querySelector(scopeSel); if (!root) return {missing: true, v: []};
  const vw = document.documentElement.clientWidth, v = [];
  const vis = e => { const r = e.getBoundingClientRect(), cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const scroller = e => { const cs = getComputedStyle(e); return /(auto|scroll)/.test(cs.overflowX) && e.scrollWidth > e.clientWidth + 1; };
  const inScroller = e => { for (let p = e.parentElement; p && p !== root.parentElement; p = p.parentElement) if (scroller(p)) return true; return false; };
  const desc = e => e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\\s+/).slice(0, 3).join('.') : '') + ' "' + (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 28) + '"';
  const all = [root, ...root.querySelectorAll('*')];
  for (const e of all) {
    if (e.closest('svg') && e.tagName.toLowerCase() !== 'svg') continue;
    if (!vis(e)) continue;
    const cs = getComputedStyle(e), r = e.getBoundingClientRect(), tag = e.tagName.toLowerCase();
    // an ancestor that clips (overflow hidden/auto in y) and is scrolled away: skip elements entirely outside the root's box vertically
    const rr = root.getBoundingClientRect();
    const abs = cs.position === 'fixed' || cs.position === 'absolute';
    // 1. width
    if (!abs && !inScroller(e)) {
      if (r.right > vw + 1 || r.left < -1) v.push(['off-screen', desc(e), Math.round(r.left) + '..' + Math.round(r.right) + ' of ' + vw]);
      const p = e.parentElement;
      if (p && e !== root && getComputedStyle(p).display !== 'inline' && p.clientWidth > 0 && r.width > p.clientWidth + 1 && !scroller(p) && tag !== 'svg') v.push(['wider than its container', desc(e), Math.round(r.width) + ' > ' + p.clientWidth]);
    }
    // 2. clipped text
    const own = [...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
    if (own && cs.display !== 'inline' && !['input', 'textarea', 'select', 'option'].includes(tag) && !scroller(e)) {
      if (e.scrollWidth > e.clientWidth + 1 && e.clientWidth > 0) v.push(['clipped text', desc(e), e.scrollWidth + ' > ' + e.clientWidth]);
      if (/hidden|clip/.test(cs.overflowY) && e.scrollHeight > e.clientHeight + 1 && e.clientHeight > 0) v.push(['text cut off vertically', desc(e), e.scrollHeight + ' > ' + e.clientHeight]);
    }
    // 3. controls
    if (e.matches('button, select, input:not([type=hidden]), a[href], [role=button], [role=checkbox], summary, textarea') && !inScroller(e) || (e.matches('button, [role=checkbox]') && inScroller(e)))
      if (r.height < 43.5 || r.width < 43.5) v.push(['control under 44 px', desc(e), Math.round(r.width) + 'x' + Math.round(r.height)]);
  }
  const pg = document.querySelector('#page');
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) v.push(['page scrolls sideways', 'html', document.documentElement.scrollWidth + ' > ' + document.documentElement.clientWidth]);
  if (pg && pg.classList.contains('open') && pg.scrollWidth > pg.clientWidth + 1) v.push(['page scrolls sideways', '#page', pg.scrollWidth + ' > ' + pg.clientWidth]);
  return {missing: false, v};
}"""

RESET = """() => { document.querySelectorAll('#modal [data-a=close]').forEach(e => e.click()); closeModal && closeModal(); closeSheet(); const c = document.querySelector('#card'); if (c) { UI.cardHide = 1; c.remove(); }
  UI.bm.on = false; UI.bm.proj = null; wbClear(); UI.tab = 'map'; render(); const t = document.querySelector('#ticker'); if (t) t.style.display = 'none'; const f = document.querySelector('#tkf'); if (f) f.hidden = true; }"""


COVER = """(first) => {
  const pg = document.querySelector('#page'), board = document.querySelector('#wbboard'), v = [];
  if (!board) return v;
  const sel = '#wbboard button, #wbboard select, #wbboard input, #wbboard h3, #wbboard .wb-strip';
  const desc = e => e.tagName.toLowerCase() + (typeof e.className === 'string' && e.className ? '.' + e.className.trim().split(/\\s+/)[0] : '') + ' "' + (e.textContent || '').trim().replace(/\\s+/g, ' ').slice(0, 24) + '"';
  const sticky = e => { for (let p = e; p && p !== pg; p = p.parentElement) { const ps = getComputedStyle(p).position; if (ps === 'sticky' || ps === 'fixed') return true; } return false; };
  const covered = e => { const r = e.getBoundingClientRect(); if (r.width < 1 || r.height < 1 || r.left >= innerWidth || r.right <= 0) return false;
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); return !(el && (el === e || e.contains(el) || el.contains(e))); };
  if (first) {
    pg.scrollTop = 0;
    const chip = board.querySelector('.wb-chip'), st = board.querySelector('.wb-strip');
    if (st && st.getBoundingClientRect().top > 200) v.push(['board not on first screen', 'status strip', Math.round(st.getBoundingClientRect().top) + ' > 200']);
    if (chip && chip.getBoundingClientRect().top > 330) v.push(['board not on first screen', 'first building chip', Math.round(chip.getBoundingClientRect().top) + ' > 330']);
  }
  const t = document.querySelector('#tkf'); if (t) t.hidden = false;
  const els = [...document.querySelectorAll(sel)].filter(e => !sticky(e) && e.getBoundingClientRect().width > 0);
  const pr = () => pg.getBoundingClientRect();
  // at the top, anything that is on screen must be uncovered
  pg.scrollTop = 0;
  const bar = board.querySelector('.wb-bar'), bn = document.querySelector('.bnav'), barTop = Math.min(bar ? bar.getBoundingClientRect().top : innerHeight, bn ? bn.getBoundingClientRect().top : innerHeight);
  for (const e of els) { const r = e.getBoundingClientRect(); if (r.top >= pr().top && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth && r.top + r.height / 2 < barTop - 2 && covered(e)) { const o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); v.push(['covered at the top', desc(e), 'by ' + (o ? desc(o) : 'nothing')]); } }
  // every control and heading can be scrolled to a place where nothing covers it
  let n = 0;
  for (const e of els) { if (n++ > 500) break; e.scrollIntoView({block: 'center'}); if (covered(e)) { e.scrollIntoView({block: 'start'}); if (covered(e)) { const r = e.getBoundingClientRect(), o = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); v.push(['cannot be scrolled clear of sticky elements', desc(e), 'by ' + (o ? desc(o) : 'nothing') + ' at ' + Math.round(r.left) + ',' + Math.round(r.top)]); } } }
  pg.scrollTop = pg.scrollHeight;
  for (const e of els.slice(-6)) { const r = e.getBoundingClientRect(); if (r.top >= pr().top && r.bottom <= innerHeight && covered(e)) v.push(['covered at the bottom', desc(e), '']); }
  pg.scrollTop = 0; return v;
}"""


def screens():
    """(name, opener js, scope selector). Openers run in the page after RESET."""
    S = []
    S.append(("month_summary", """() => { OPTS('sum', 1); const s = snap(); endMonth(); }""", "#modal"))
    S.append(("decision_card", """() => { UI.cardHide = 0; if (!G.card) { for (let i = 0; i < 400 && !G.card; i++) endMonth(); } drawCard(); }""", "#card"))
    S.append(("ask_sheet", """() => { const c = me(), p = wbEval().provs.find(p => wbEval().by[p.id].school.st === 'can'); bldAsk(p, 'school'); }""", "#modal"))
    S.append(("ask_sheet_queue", """() => { const c = me(), p = wbEval().provs.find(p => wbEval().by[p.id].hosp.st === 'can'); const s = buildSlots; bldAsk(p, 'hosp'); }""", "#modal"))
    S.append(("build_review", """() => { const ev = wbEval(); for (const p of ev.provs.slice(0, 12)) { for (const k of ['school', 'hosp', 'fort']) if (ev.by[p.id][k].st === 'can') wbAdd(k, p.id); } for (const p of ev.provs.slice(0, 3)) if (ev.by[p.id].rail.st === 'can') wbAdd('rail', p.id);
        UI.tab = 'map'; render(); bmReview(); }""", "#sheet"))
    S.append(("build_review_warn", """() => { const ev = wbEval(); for (const p of ev.provs) { for (const k of ['school', 'hosp']) if (ev.by[p.id][k].st === 'can') wbAdd(k, p.id); } me().tr = 1500; UI.tab = 'map'; render(); bmReview(); }""", "#sheet"))
    S.append(("build_result", """() => { const ev = wbEval(); for (const p of ev.provs.slice(0, 12)) for (const k of ['school', 'hosp']) if (ev.by[p.id][k].st === 'can') wbAdd(k, p.id);
        UI.tab = 'map'; render(); bmReview(); bmConfirm(); }""", "#sheet"))
    S.append(("build_picker", """() => { UI.tab = 'map'; render(); bmPicker(); }""", "#sheet"))
    for v, nm in (("bld", "works_by_building"), ("prov", "works_by_province"), ("grid", "works_grid"), ("ord", "works_orders")):
        S.append((nm, """(v) => { const ev = wbEval(); OPTS('wbv', v); UI.wb.view = v; for (const p of ev.provs.slice(0, 4)) for (const k of ['school', 'hosp']) if (ev.by[p.id][k].st === 'can') wbAdd(k, p.id);
            UI.wb.open = {}; ACT.tab({t: 'works'}); }""", "#wbboard", v))
    S.append(("works_open", """() => { OPTS('wbv', 'bld'); UI.wb.view = 'bld'; toast('You lead France. January 1866.'); ACT.tab({t: 'works'}); }""", "#wbboard"))
    S.append(("works_by_building_tools", """() => { OPTS('wbv', 'bld'); UI.wb.view = 'bld'; UI.wb.cur = 'rail'; UI.wb.msg = 'Ticked 3 projects for the free slots, best payback first, adding £4.2k.'; ACT.tab({t: 'works'}); }""", "#wbboard"))
    S.append(("works_grid_page2", """() => { OPTS('wbv', 'grid'); UI.wb.view = 'grid'; ACT.tab({t: 'works'}); const g = document.querySelector('.wb-gscroll'); if (g) g.scrollLeft = g.clientWidth; }""", "#wbboard"))
    for k in ("peek", "half", "full"):
        S.append((f"province_sheet_{k}", """(k) => { UI.tab = 'map'; render(); centerOn(P(me().cap), 380, .5); UI.shH = k; pickProv(me().cap); shSet(k); }""", "#sheet", k))
    return S


def run_screen(pg, sc, verbose):
    name, js, scope = sc[:3]; arg = sc[3] if len(sc) > 3 else None
    pg.evaluate(RESET)
    # a ledger and a queue so that the Orders view and the sheets have something real to show
    pg.evaluate(js, arg) if arg is not None else pg.evaluate(js)
    pg.wait_for_timeout(350)
    pg.evaluate("() => { const t = document.querySelector('#ticker'); if (t) t.style.display = 'none'; const f = document.querySelector('#tkf'); if (f) f.hidden = true; }")
    res = pg.evaluate(AUDIT, scope)
    if name.startswith("works_") and scope == "#wbboard" and not res.get("missing"):
        res["v"] += pg.evaluate(COVER, name == "works_open")
    return res


CHIPS_JS = r"""() => {
  const pg = document.querySelector('#page'), q = s => document.querySelector(s), R = e => e.getBoundingClientRect(), v = [];
  const row = q('.wb-chiprow'), chips = [...document.querySelectorAll('.wb-chiprow .wb-chip')], F = (k, d) => v.push([k, d]);
  pg.scrollTop = 0;
  if (!row) return ['no chip row'];
  if (chips.length !== 26) F('chip count', chips.length + ' != 26');
  const tops = new Set(chips.map(c => Math.round(R(c).top))); if (tops.size !== 1) F('chips are not on one line', [...tops].join(','));
  if (row.scrollWidth <= row.clientWidth + 1) F('chip row does not scroll sideways', row.scrollWidth + ' <= ' + row.clientWidth);
  if (!/(auto|scroll)/.test(getComputedStyle(row).overflowX)) F('chip row overflow-x', getComputedStyle(row).overflowX);
  if (R(row).height > 64) F('chip row taller than one line', Math.round(R(row).height));
  for (const c of chips) { if (R(c).height < 43.5) F('chip under 44 px tall', c.textContent.trim() + ' ' + Math.round(R(c).height)); if (!c.querySelector('svg') || !c.querySelector('.wb-n') || !c.querySelector('span').textContent.trim()) F('chip lacks icon, name or count', c.textContent.trim()); }
  const labs = [...row.querySelectorAll('.wb-gl')].map(e => e.textContent.trim()).join(','); if (labs !== 'Military,Economy,People,Culture,Railway') F('group divider labels', labs);
  const on = row.querySelector('.wb-chip.on'); if (!on || on.dataset.k !== 'school') F('School chip is not selected', on && on.dataset.k);
  else { const a = R(on), b = R(row); if (a.left < b.left - 1 || a.right > b.right + 1) F('selected chip not scrolled into view', Math.round(a.left) + '..' + Math.round(a.right) + ' in ' + Math.round(b.left) + '..' + Math.round(b.right)); }
  const d = q('.wb-desc'), t = q('.wb-tools'), all = q('[data-a=wball]'), more = q('[data-a=wbmore]');
  if (!d || R(d).top < R(row).bottom - 1 || R(d).height > 60) F('description missing, above the chips, or over two lines', d && Math.round(R(d).height));
  if (!all || !more || !/^Select all eligible \(\d+\)$/.test(all.textContent.trim()) || !/^More tools/.test(more.textContent.trim())) F('tool row buttons', (all && all.textContent) + ' | ' + (more && more.textContent));
  else { if (Math.abs(R(all).top - R(more).top) > 1) F('bulk tools are not one row', Math.round(R(all).top) + ' vs ' + Math.round(R(more).top)); if (R(all).height < 43.5 || R(more).height < 43.5) F('tool button under 44 px', Math.round(R(all).height) + ',' + Math.round(R(more).height)); if (R(t).height > 70) F('tool row not compact', Math.round(R(t).height)); }
  for (const s of ['[data-a=wbraise]', '[data-a=wbbest]', 'select[data-wb=tgt]', 'input[data-wb=cap]', '[data-a=wbfill]']) if (q(s)) F('collapsed tool is visible', s);
  const first = q('.wb-row'); if (!first) F('no province row', '');
  else { const r = R(first); if (r.top > 600) F('first province row below 600 px', Math.round(r.top)); if (r.bottom > innerHeight) F('first province row cut by the viewport', Math.round(r.bottom));
    const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!(el && first.contains(el))) F('first province row is covered', el && el.className); }
  if (document.documentElement.scrollWidth > document.documentElement.clientWidth + 1) F('page scrolls sideways', document.documentElement.scrollWidth);
  if (pg.scrollWidth > pg.clientWidth + 1) F('#page scrolls sideways', pg.scrollWidth);
  if (q('#wbboard').scrollWidth > q('#wbboard').clientWidth + 1) F('board scrolls sideways', q('#wbboard').scrollWidth);
  return v;
}"""

CHIPS_BASKET_JS = """() => {
  const pg = document.querySelector('#page'), first = document.querySelector('.wb-row'), bar = document.querySelector('.wb-bar'), v = [];
  pg.scrollTop = 0; const r = first.getBoundingClientRect(), b = bar.getBoundingClientRect(), n = document.querySelector('.bnav');
  if (!(first.getAttribute('aria-checked') === 'true')) v.push(['first row not ticked by Select all eligible', '']);
  if (r.top > 600) v.push(['first province row below 600 px with a full basket', Math.round(r.top)]);
  for (const [nm, e] of [['basket bar', bar], ['bottom nav', n]]) { if (!e) continue; const q = e.getBoundingClientRect(); if (q.width > 0 && q.top < r.bottom && q.bottom > r.top) v.push(['first province row covered by the ' + nm, Math.round(q.top) + ' < ' + Math.round(r.bottom)]); }
  const el = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2); if (!(el && first.contains(el))) v.push(['first province row is covered (basket)', el && el.className]);
  return v;
}"""


def chips_screen(b, theme, verbose, shots):
    """V2c chips: France, fresh start, 360x740 at 125%: one swipe row, tapping School, first province row on the first screen."""
    import build_mode_test as BM
    pg = BM.open_page(b, 360, 740, 1.25, theme); BM.start_fresh(pg, "FRA")
    pg.evaluate("OPTS('wbv', 'bld'); OPTS('wbc', null); OPTS('wbm', 0); UI.wb.more = false; UI.wb.cs = null; UI.wb.cur = null")
    pg.locator('[data-a="tab"][data-t="works"]').first.click(); pg.locator("#wbboard").wait_for(); pg.wait_for_timeout(300)
    pg.evaluate("() => { const t = document.querySelector('#ticker'); if (t) t.style.display = 'none'; const f = document.querySelector('#tkf'); if (f) f.hidden = true; }")
    pg.locator('[data-a="wbcur"][data-k="school"]').click(); pg.wait_for_timeout(250)
    out = []
    out += [("works_building_school", k, d) for k, d in pg.evaluate(CHIPS_JS)]
    res = pg.evaluate(AUDIT, "#wbboard")
    out += [("works_building_school", k, d + " " + i) for k, d, i in res["v"]]
    if shots: Path(shots).mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(Path(shots) / f"works_building_school_360x740_125_{theme}.png"))
    # remembered: swipe to the far end, change view and come back; the row keeps its place, and the selection survives a reload
    pg.evaluate("() => { const r = document.querySelector('.wb-chiprow'); r.scrollLeft += 40; }"); pg.wait_for_timeout(150)
    sl = pg.evaluate("document.querySelector('.wb-chiprow').scrollLeft")
    pg.locator('[data-a="wbview"][data-v="prov"]').click(); pg.wait_for_timeout(150); pg.locator('[data-a="wbview"][data-v="bld"]').click(); pg.wait_for_timeout(200)
    sl2 = pg.evaluate("document.querySelector('.wb-chiprow').scrollLeft")
    if abs(sl - sl2) > 2 or sl < 20: out.append(("works_building_school", "chip row position not remembered", f"{sl} -> {sl2}"))
    pg.locator('[data-a="wbcur"][data-k="school"]').click(); pg.wait_for_timeout(150)
    pg.evaluate("() => { const r = document.querySelector('.wb-chiprow'); r.scrollLeft = 0; }")
    pg.evaluate("() => { UI.wb.cs = null; render(); }"); pg.wait_for_timeout(250)
    ok = pg.evaluate("() => { const r = document.querySelector('.wb-chiprow').getBoundingClientRect(), a = document.querySelector('.wb-chip.on').getBoundingClientRect(); return a.left >= r.left - 1 && a.right <= r.right + 1; }")
    if not ok: out.append(("works_building_school", "selected chip not scrolled into view after a redraw", ""))
    # a full basket: Select all eligible, the bar sticks to the bottom and must not cover the first row
    pg.locator('[data-a="wball"]').click(); pg.wait_for_timeout(250)
    out += [("works_building_school_basket", k, str(d)) for k, d in pg.evaluate(CHIPS_BASKET_JS)]
    out += [("works_building_school_basket", k, d + " " + i) for k, d, i in pg.evaluate(AUDIT, "#wbboard")["v"]]
    # more tools: opens in place, a second tap folds it again
    pg.locator('[data-a="wbmore"]').click(); pg.wait_for_timeout(150)
    if not pg.evaluate("!!document.querySelector('[data-a=wbraise]') && !!document.querySelector('[data-a=wbbest]') && !!document.querySelector('[data-a=wbfill]')"): out.append(("works_building_school_more", "More tools does not reveal Raise, Best value, Fill", ""))
    out += [("works_building_school_more", k, d + " " + i) for k, d, i in pg.evaluate(AUDIT, "#wbboard")["v"]]
    pg.locator('[data-a="wbmore"]').click(); pg.wait_for_timeout(100)
    if pg.evaluate("!!document.querySelector('[data-a=wbraise]')"): out.append(("works_building_school_more", "More tools does not fold again", ""))
    errs = list(pg.errs); pg.context.close()
    return out, errs


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--only"); ap.add_argument("--sizes", default=",".join(SIZES)); ap.add_argument("--themes", default="light,dark")
    ap.add_argument("--shots"); ap.add_argument("-v", action="store_true"); ap.add_argument("--max", type=int, default=6, help="violations listed per screen")
    a = ap.parse_args(); only = set(a.only.split(",")) if a.only else None
    fails = 0; checked = 0; t0 = time.time()
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        for sz in a.sizes.split(","):
            w, h, tz = SIZES[sz]
            for theme in a.themes.split(","):
                ctx = b.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, has_touch=True, color_scheme=theme)
                pg = ctx.new_page(); errs = []; pg.on("pageerror", lambda e: errs.append(str(e)))
                pg.goto(GAME); pg.locator("#start h1").wait_for()
                pg.evaluate("(tz) => { localStorage.clear(); localStorage.setItem('vic.tz', tz); }", str(tz)); pg.reload(); pg.locator("#start h1").wait_for()
                pg.evaluate("(t) => { document.documentElement.dataset.theme = t; }", theme)
                assert pg.evaluate("(t) => loadText(t, 'Loaded')", FIX1866)
                pg.evaluate("() => { G.player = 'FRA'; for (const k in G.c) G.c[k].ai = k !== 'FRA'; UI.tab = 'map'; UI.readM = G.msgs[0]; buildMap(); render(); atlasHome(); OPTS('sum', 0); }")
                pg.wait_for_timeout(300)
                # some orders in the ledger and the queue, so that Orders and the sheets are not empty
                pg.evaluate("""() => { const ev = wbEval(); let n = 0; for (const p of ev.provs) for (const k of ['school', 'hosp', 'fort', 'barracks']) if (n < 8 && ev.by[p.id][k].st === 'can') { wbAdd(k, p.id); n++; }
                    wbAdd('rail', ev.provs.find(p => ev.by[p.id].rail.st === 'can').id); UI.tab = 'map'; bmReview(); bmConfirm(); closeSheet(); for (let i = 0; i < 2; i++) endMonth(); }""")
                for sc in screens():
                    if only and sc[0] not in only: continue
                    res = run_screen(pg, sc, a.v)
                    tag = f"{sc[0]} @ {sz} {theme}"; checked += 1
                    if a.shots:
                        Path(a.shots).mkdir(parents=True, exist_ok=True); pg.screenshot(path=str(Path(a.shots) / f"{sc[0]}_{sz.replace('@', '_')}_{theme}.png"))
                    if res.get("missing"): fails += 1; print(f"FAIL  {tag}: the screen did not open"); continue
                    if res["v"]:
                        fails += 1; print(f"FAIL  {tag}: {len(res['v'])} violation(s)")
                        seen = set(); n = 0
                        for kind, d, info in res["v"]:
                            if (kind, d) in seen: continue
                            seen.add((kind, d)); n += 1
                            if n <= a.max: print(f"        {kind}: {d}  [{info}]")
                    elif a.v: print(f"PASS  {tag}")
                if errs: fails += 1; print("FAIL  page errors:", errs[:3])
                ctx.close()
        for theme in a.themes.split(","):
            if "360x740@125" not in a.sizes.split(",") or (only and "works_building_school" not in only): continue
            res, errs = chips_screen(b, theme, a.v, a.shots); checked += 1; tag = f"works_building_school @ 360x740@125 {theme}"
            if res or errs:
                fails += 1; print(f"FAIL  {tag}: {len(res) + len(errs)} violation(s)")
                for n_, k, d in res[:a.max]: print(f"        {n_}: {k}  [{d}]")
                if errs: print("        page errors:", errs[:3])
            elif a.v: print(f"PASS  {tag}")
        b.close()
    print(f"\n{checked - fails if fails <= checked else 0} of {checked} screens clean, {fails} failed ({time.time() - t0:.0f}s)")
    raise SystemExit(1 if fails else 0)


if __name__ == "__main__": main()
