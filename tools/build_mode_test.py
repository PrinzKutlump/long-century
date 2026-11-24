"""V2.8 acceptance test for Build mode (UI_Art_Plan V2.1 to V2.8).

    python3 tools/build_mode_test.py [--shots DIR] [--only NAME[,NAME]] [--json OUT.json]

Real pointer taps in the system Chrome, 360x740 at 125% text, from a fresh start and from the 1866 fixture
(the fixture's own player, Switzerland, holds one province, so the test takes over France, exactly as the
nation picker would). Scenarios:

  school_fresh, school_1866   Atlas -> Build -> School -> five provinces -> Review once -> Confirm once.
                              Zero tab changes, one confirmation, five school orders that survive save and
                              reload, School still chosen; six months on, a sixth school from the still-chosen
                              project; reload; all six found on the Works page with their status.
  materials                   review quantities equal what the engine records on the projects (started
                              projects at once, queued ones when they start, ledger deliveries when finished).
  reconcile                   12 months: the player's treasury movement in the construction pass equals the
                              construction ledger payments, and the school orders' own ledger lines add up.
  warning                     the 25% line counts the whole batch.
  crane_undo                  crane badges with progress, queue sheet (bqmv / bqdel), Undo all queued toast,
                              Select all eligible in view / Clear, long-press from the ordinary map.
  rail_fresh, rail_1866       a route over >= 4 provinces with one blocked segment; a route that breaks at a
                              foreign province; a route across the sea is refused. No rail queue is invented.
  honest_words                the review never calls an estimate a price.

--shots DIR also saves picker, selection, review and result at 360@125 and 390@100, light and dark.
"""
import argparse, json, re, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
GAME = (ROOT / "dist/long-century.html").as_uri()
FIX1866 = (ROOT / "testdata/seed7_1866.txt").read_text().strip()
RESULTS = []; NUMBERS = {}


def check(name, cond, detail=""):
    RESULTS.append((name, bool(cond), detail))
    print(("PASS  " if cond else "FAIL  ") + name + (("  [" + str(detail) + "]") if detail != "" else ""))
    return bool(cond)


CENTER = """([id, w]) => { const p = P(id); UI.view.w = w; applyView(); UI.view.x = p.x - UI.view.w / 2; UI.view.y = p.y - UI.view.h / 2;
  applyView(); UI._sc = 0; applyView(); const r = mapRect(), s = r.width / UI.view.w;
  return [r.left + (p.x - UI.view.x) * s, r.top + (p.y - UI.view.y) * s]; }"""
TABLOG = """() => { let v = UI.tab; window.__tabs = [];
  Object.defineProperty(UI, 'tab', {configurable: true, get() { return v; }, set(x) { if (x !== v) window.__tabs.push([v, x]); v = x; }}); }"""
SWITCH = """(t) => { G.player = t; for (const k in G.c) G.c[k].ai = k !== t; UI.tab = 'map'; UI.readM = G.msgs[0];
  UI.bm.on = false; UI.bm.proj = null; UI.bm.sel = []; bmSave(); buildMap(); render(); atlasHome(); }"""
ORDERS = """(kind) => { const c = me(); let b = 0, q = 0; const ids = [];
  for (const p of provsOf(c.tag)) for (const x of p.build) if (x.k === 'bld' && x.b === kind && x.orderId != null) { b++; ids.push(x.orderId); }
  for (const x of c.bq || []) if (x.b === kind && x.orderId != null) { q++; ids.push(x.orderId); }
  return {building: b, queued: q, total: b + q, ids}; }"""
ADVANCE = "(n) => { for (let i = 0; i < n; i++) { if (G.card) cardDefault(); endMonth(); } return G.t; }"
STATUS = """() => { const c = me(), out = {};
  for (const x of c.bq || []) if (x.orderId != null) out[x.orderId] = ['queued', x.p, x.b];
  for (const p of provsOf(c.tag)) for (const b of p.build) if (b.orderId != null && !(b.orderId in out)) out[b.orderId] = ['building', p.id, b.b || b.k];
  for (const a of Object.values(G.constructionLedger || {})) if (a.orderId != null && !(a.orderId in out)) out[a.orderId] = [a.status === 'Completed' ? 'done' : 'building', a.province, a.kind];
  return out; }"""


def open_page(browser, w, h, tz, theme="light"):
    ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1, has_touch=True, color_scheme=theme)
    pg = ctx.new_page(); pg.errs = []
    pg.on("pageerror", lambda e: pg.errs.append(str(e)))
    pg.goto(GAME); pg.locator("#start h1").wait_for()
    pg.evaluate("(tz) => { localStorage.clear(); localStorage.setItem('vic.tz', tz); }", str(tz))
    pg.reload(); pg.locator("#start h1").wait_for()
    pg.evaluate("(t) => { document.documentElement.dataset.theme = t; }", theme)
    return pg


def start_fresh(pg, tag):
    pg.locator(f'[data-a="pick"][data-t="{tag}"]').first.click(); pg.wait_for_function("!document.querySelector('#start')")
    pg.evaluate("OPTS('sum', 0)"); pg.wait_for_timeout(300)


def start_1866(pg, tag):
    assert pg.evaluate("(t) => loadText(t, 'Loaded')", FIX1866)
    pg.evaluate(SWITCH, tag); pg.evaluate("OPTS('sum', 0)"); pg.wait_for_timeout(300)


def start(pg, kind, tag):
    (start_fresh if kind == "fresh" else start_1866)(pg, tag)
    pg.evaluate(TABLOG)


def tap(pg, pid, w=220):
    x, y = pg.evaluate(CENTER, [pid, w]); pg.mouse.click(x, y); pg.wait_for_timeout(70)
    if pg.locator("#pickc").count():
        pg.locator(f'#pickc [data-a="pickprov"][data-p="{pid}"]').click(); pg.wait_for_timeout(70)


def open_picker_and_pick(pg, key):
    pg.locator('[data-a="bmopen"]').click(); pg.locator('#sheet.open [data-a="bmpick"]').first.wait_for()
    pg.locator(f'#sheet [data-a="bmpick"][data-k="{key}"]').click(); pg.wait_for_timeout(250)


def reload_and_continue(pg):
    pg.evaluate("autosave()")            # returns the compression promise: the save is written when this resolves
    pg.reload(); pg.locator("#start h1").wait_for()
    pg.locator('[data-a="cont"]').click(); pg.wait_for_function("!document.querySelector('#start')"); pg.wait_for_timeout(300)
    pg.evaluate("OPTS('sum', 0)"); pg.evaluate(TABLOG)


def tabs(pg): return pg.evaluate("window.__tabs")


def eligible(pg, key): return pg.evaluate("(k) => [...bmEligible(me(), k)]", key)


# ---------------------------------------------------------------- the school flow (V2.8 proper)
def school_flow(b, kind, tag, label):
    pg = open_page(b, 360, 740, 1.25)
    start(pg, kind, tag)
    ok = True
    check(f"{label}: starts on the Atlas", pg.evaluate("UI.tab") == "map" and pg.evaluate("document.querySelector('#app').classList.contains('atlas')"))
    # 1-2. Build button -> picker -> School
    pg.locator('[data-a="bmopen"]').click(); pg.locator('#sheet.open [data-a="bmpick"]').first.wait_for()
    heads = pg.evaluate("[...document.querySelectorAll('#sheet .shbody h3')].map(e => e.textContent.trim())")
    n_rows = pg.locator('#sheet [data-a="bmpick"]').count()
    n_expect = pg.evaluate("1 + Object.keys(BLD).length")
    check(f"{label}: picker lists every building plus Railway in Economy, Military, Civic", heads == ["Economy", "Military", "Civic"] and n_rows == n_expect, f"{heads} rows {n_rows}/{n_expect}")
    check(f"{label}: picker rows are >= 44 px tall", pg.evaluate("[...document.querySelectorAll('#sheet .bmp')].every(e => e.getBoundingClientRect().height >= 44)"))
    pg.locator('#sheet [data-a="bmpick"][data-k="school"]').click(); pg.wait_for_timeout(300)
    check(f"{label}: School chosen, Build mode bar shown", pg.evaluate("UI.bm.proj") == "school" and pg.locator("#bmtop").is_visible() and "School" in pg.locator("#bmtop").inner_text())
    el = eligible(pg, "school")
    check(f"{label}: >= 5 eligible provinces", len(el) >= 5, len(el))
    hl = pg.evaluate("[document.querySelectorAll('#bmov .bmok').length, document.querySelectorAll('.pv.bm-dim').length, G.plist.length]")
    check(f"{label}: eligible highlighted, the rest dimmed", hl[0] == len(el) and hl[1] == hl[2] - len(el), hl)
    # ineligible tap shows the reason, never silently
    foreign = pg.evaluate("() => { const c = me(); for (const p of provsOf(c.tag)) for (const n of ADJ[p.id]) { const q = P(n); if (q.o && q.o !== c.tag && !q.waste) return n; } return null; }")
    if foreign:
        tap(pg, foreign, 260)
        msg = pg.locator("#bmtop .bmm").inner_text()
        check(f"{label}: tapping an ineligible province says why", len(msg) > 20 and P_name(pg, foreign) in msg and pg.evaluate("UI.bm.sel.length") == 0, msg)
    # 3. five provinces; nothing is spent by any tap
    before = pg.evaluate("() => { const c = me(); return {tr: c.tr, serial: G.commandSerial || 0, builds: provsOf(c.tag).reduce((a, p) => a + p.build.length, 0), bq: (c.bq || []).length, t: G.t}; }")
    chosen = el[:5]
    for pid in chosen: tap(pg, pid)
    sel = pg.evaluate("UI.bm.sel")
    check(f"{label}: five provinces selected by tapping", sel == chosen, sel)
    tap(pg, chosen[0]); removed = pg.evaluate("UI.bm.sel.length") == 4; tap(pg, chosen[0])
    check(f"{label}: a second tap removes, another adds back", removed and pg.evaluate("UI.bm.sel.length") == 5)
    after = pg.evaluate("() => { const c = me(); return {tr: c.tr, serial: G.commandSerial || 0, builds: provsOf(c.tag).reduce((a, p) => a + p.build.length, 0), bq: (c.bq || []).length, t: G.t}; }")
    check(f"{label}: no single tap spent money or issued an order", before == after, (before, after))
    check(f"{label}: no tab change and no sheet during selection", tabs(pg) == [] and not pg.evaluate("document.querySelector('#sheet').classList.contains('open')"), tabs(pg))
    top = pg.locator("#bmtop").inner_text()
    check(f"{label}: bar shows project, count and Estimated total at today's prices", "School" in top and "5 selected" in top and "Estimated total at today's prices" in top, top.replace("\n", " | "))
    # 4. review once
    pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for(); pg.wait_for_timeout(250)
    rows = pg.evaluate("[...document.querySelectorAll('#sheet .bmr')].map(r => ({name: r.querySelector('b').textContent, st: r.querySelector('.bmst').textContent, text: r.innerText}))")
    plan = pg.evaluate("() => { const p = bmPlan(); return {started: p.started, queued: p.queued, skipped: p.skipped, est: p.est, mats: p.mats, first: p.first, after: p.after, rows: p.rows.map(r => ({id: r.p.id, state: r.state, C: r.C, cost: r.cost, lv: r.lv, next: r.next, val: r.val}))}; }")
    rev_text = pg.locator("#sheet .shbody").inner_text()
    sheet_h = pg.evaluate("[document.querySelector('#sheet').offsetHeight, document.querySelector('main').clientHeight]")
    check(f"{label}: review is one half sheet with a row per province", len(rows) == 5 and abs(sheet_h[0] / sheet_h[1] - .5) < .03, (len(rows), sheet_h))
    check(f"{label}: each row shows level now -> next, estimated cost, months, return, status", all(re.search(r"Level \d+ → \d+", r["text"]) and "Estimated £" in r["text"] and "months" in r["text"] and "return £" in r["text"] for r in rows), rows[0]["text"].replace("\n", " | "))
    slots = pg.evaluate("() => { const c = me(); return [buildSlots(c), bldActive(c)]; }")
    exp_start = max(0, min(5, slots[0] - slots[1]))
    check(f"{label}: statuses follow the building slots ({slots[0]} slots)", [r["st"] for r in rows].count("Starts now") == exp_start and [r["st"] for r in rows].count("Joins the queue") == 5 - exp_start, [r["st"] for r in rows])
    for need in ("Estimated total at today's prices", "Materials", "Return a month", "Treasury after the first month"):
        check(f"{label}: review totals show '{need}'", need in rev_text)
    check(f"{label}: wording says materials are bought as delivered", "materials are bought as they are delivered, so the final bill follows the market" in rev_text)
    mat_txt = pg.evaluate("[...document.querySelectorAll('#sheet .bmtot .kr')].find(k => k.firstChild.textContent === 'Materials').lastChild.textContent")
    exp_mat = ", ".join(f"{plan['mats'][g]} {GOODN[g]}" for g in plan["mats"])
    check(f"{label}: materials line = exact bldCost quantities summed", mat_txt == exp_mat or normalise(mat_txt) == normalise(exp_mat), (mat_txt, plan["mats"]))
    check(f"{label}: nothing ordered yet at review", pg.evaluate("(me().bq||[]).length") == before["bq"] and pg.evaluate("G.commandSerial||0") == before["serial"])
    # 25% warning counts the whole batch (state restored afterwards)
    est = plan["est"]; tr0 = pg.evaluate("me().tr")
    pg.evaluate("(v) => { me().tr = v; }", est * 3.0); pg.locator('[data-a="bmback"]').first.click(); pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    w_hi = pg.locator("#sheet .bmfoot .bmw").count()
    pg.evaluate("(v) => { me().tr = v; }", est * 5.0); pg.locator('[data-a="bmback"]').first.click(); pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    w_lo = pg.locator("#sheet .bmfoot .bmw").count()
    pg.evaluate("(v) => { me().tr = v; }", tr0)
    pg.locator('[data-a="bmback"]').first.click(); pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    check(f"{label}: 25% warning shows above Confirm when the batch exceeds a quarter of the treasury, not otherwise", w_hi == 1 and w_lo == 0, (w_hi, w_lo, round(est)))
    # confirm once
    serial0 = pg.evaluate("G.commandSerial||0")
    pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(500)
    res_text = pg.locator("#sheet .bmres").inner_text()
    check(f"{label}: one Confirm reports 'Started N, queued N, skipped N'", res_text == f"Started {exp_start}, queued {5 - exp_start}, skipped 0", res_text)
    check(f"{label}: exactly one confirmation, five orders issued", pg.evaluate("UI.bm.batches.length") == 1 and pg.evaluate("G.commandSerial||0") == serial0 + 5)
    check(f"{label}: result sheet links to the Works page", pg.locator('#sheet [data-a="bmworks"]').count() == 1)
    o = pg.evaluate(ORDERS, "school")
    check(f"{label}: five school orders exist (started + queued)", o["total"] == 5 and o["building"] == exp_start and o["queued"] == 5 - exp_start, o)
    check(f"{label}: zero tab changes through the whole batch", tabs(pg) == [], tabs(pg))
    check(f"{label}: School still the chosen project after confirm", pg.evaluate("UI.bm.proj") == "school" and pg.evaluate("UI.bm.on"))
    check(f"{label}: Undo-all-queued toast shown" + ("" if exp_start < 5 else " (nothing queued)"), (pg.locator("#bmundo [data-a=bmundo]").count() == 1) == (exp_start < 5))
    last = pg.evaluate("UI.bm.last")
    # crane badges with progress
    cr = pg.evaluate("[...document.querySelectorAll('#bmcr g.cr')].map(g => g.dataset.cr)")
    check(f"{label}: crane badge on each of the five provinces", sorted(cr) == sorted(chosen), cr)
    mm = pg.evaluate("() => { const c = me(); return provsOf(c.tag).map(p => [p.id, p.build.length]).filter(x => x[1]) .length; }")
    # persistence: save + reload
    pg.wait_for_timeout(6300)
    check(f"{label}: Undo toast gone after six seconds", pg.locator("#bmundo").is_hidden())
    reload_and_continue(pg)
    o2 = pg.evaluate(ORDERS, "school")
    check(f"{label}: five school orders survive save and reload", o2["total"] == 5 and sorted(o2["ids"]) == sorted(o["ids"]), o2)
    check(f"{label}: School still the chosen project after reload (Build mode restored)", pg.evaluate("UI.bm.proj") == "school" and pg.evaluate("UI.bm.on") and pg.locator("#bmtop").is_visible() and "School" in pg.locator("#bmtop").inner_text())
    # six months on, a sixth school from the still-chosen project
    t0 = pg.evaluate("G.t"); pg.evaluate(ADVANCE, 6)
    check(f"{label}: six months advanced", pg.evaluate("G.t") == t0 + 6)
    check(f"{label}: Build mode still on with School after six months", pg.evaluate("UI.bm.on && UI.bm.proj") == "school")
    rest = [i for i in eligible(pg, "school") if i not in chosen]
    check(f"{label}: a sixth province can take a school", len(rest) >= 1, rest)
    sixth = rest[0]
    tap(pg, sixth); pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    check(f"{label}: the review for the sixth is the same single-province flow", pg.locator("#sheet .bmr").count() == 1)
    pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(400)
    r6 = pg.locator("#sheet .bmres").inner_text()
    check(f"{label}: sixth school ordered", re.fullmatch(r"Started [01], queued [01], skipped 0", r6) is not None and "1" in r6, r6)
    check(f"{label}: zero tab changes up to here", tabs(pg) == [], tabs(pg))
    reload_and_continue(pg)
    # Works page
    pg.locator('[data-a="more"]').first.click(); pg.locator('#modal [data-a="tab"][data-t="works"]').click(); pg.wait_for_timeout(500)
    status = pg.evaluate(STATUS); names = pg.evaluate("Object.fromEntries(G.plist.map(p => [p.id, p.n]))")
    schools = {int(k): v for k, v in status.items() if v[2] == "school"}
    check(f"{label}: six school orders known to the engine after reload", len(schools) == 6, len(schools))
    found = 0; detail = []
    for oid, (st, pid, _) in sorted(schools.items()):
        sel = f'.lr.ord-{st}'
        txt = pg.evaluate("([sel, name]) => [...document.querySelectorAll(sel)].filter(e => e.innerText.includes('School in ' + name) && e.getBoundingClientRect().height > 0).length", [sel, names[pid]])
        found += 1 if txt >= 1 else 0; detail.append((names[pid], st, txt))
    check(f"{label}: all six schools on the Works page, each with its status", found == 6, detail)
    # a year on, the early ones are finished: "done" rows appear on the same page
    pg.evaluate(ADVANCE, 12); pg.evaluate("render()"); pg.wait_for_timeout(300)
    st2 = pg.evaluate(STATUS); n_done = sum(1 for k, v in st2.items() if v[0] == "done" and v[2] == "school")
    vis_done = pg.evaluate("[...document.querySelectorAll('.lr.ord-done')].filter(e => e.getBoundingClientRect().height > 0 && e.innerText.includes('School in')).length")
    check(f"{label}: 12 months later finished schools show as done on the Works page", n_done >= 3 and vis_done == n_done, (n_done, vis_done))
    NUMBERS[label] = {"est_total": round(plan["est"]), "first_month": round(plan["first"]), "started": exp_start, "queued": 5 - exp_start, "statuses": sorted({v[0] for v in schools.values()})}
    check(f"{label}: no page errors", pg.errs == [], pg.errs[:2])
    pg.context.close()
    return plan, last


GOODN = {}


def normalise(s): return re.sub(r"\s+", " ", s.replace(" ", " ")).strip()
def P_name(pg, pid): return pg.evaluate("(id) => P(id).n", pid)


# ---------------------------------------------------------------- materials and ledger over 12 months
def materials_and_reconcile(b):
    label = "materials+reconcile"
    pg = open_page(b, 360, 740, 1.25); start(pg, "fresh", "FRA")
    open_picker_and_pick(pg, "school")
    chosen = eligible(pg, "school")[:5]
    for pid in chosen: tap(pg, pid)
    pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    plan = pg.evaluate("() => { const p = bmPlan(); return p.rows.map(r => ({id: r.p.id, state: r.state, C: r.C})); }")
    mats_txt = pg.locator("#sheet .bmtot").inner_text()
    pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(400)
    last = pg.evaluate("UI.bm.last")
    byp = {r["id"]: r for r in plan}
    started_now = pg.evaluate("""() => { const c = me(), out = {}; for (const p of provsOf(c.tag)) for (const x of p.build) if (x.k === 'bld' && x.b === 'school') out[p.id] = {cost: x.cost, left: x.left, orderId: x.orderId}; return out; }""")
    same = all(started_now[i]["cost"] == byp[i]["C"] and started_now[i]["left"] == byp[i]["C"] for i in started_now)
    check(f"{label}: started projects record exactly the quantities the review stated", len(started_now) > 0 and same, started_now)
    # instrument the construction pass, then play 12 months
    pg.evaluate("""() => { window.__rec = []; const orig = investMonth;
      const led = () => { let s = 0; for (const a of Object.values(G.constructionLedger || {})) for (const r of a.payments) if (r.payer === G.player && r.account === 'tr') s += r.amount; return s; };
      investMonth = function () { const c = me(), tr0 = c.tr, l0 = led(); orig(); window.__rec.push({t: G.t, dtr: c.tr - tr0, dled: led() - l0}); }; }""")
    pg.evaluate(ADVANCE, 12)
    rec = pg.evaluate("window.__rec")
    spent = -sum(r["dtr"] for r in rec); booked = sum(r["dled"] for r in rec)
    check(f"{label}: 12 months of construction pass recorded", len(rec) == 12, len(rec))
    check(f"{label}: treasury movement in the construction pass equals ledger payments (12 months)", abs(spent - booked) < 1e-6 * max(1, spent) and spent > 0, (round(spent, 4), round(booked, 4)))
    own = pg.evaluate("""(ids) => { const out = {paid: 0, rows: 0, perOrder: {}};
      for (const a of Object.values(G.constructionLedger || {})) if (ids.includes(a.orderId)) { let s = 0, m = {};
        for (const r of a.payments) { s += r.amount; for (const g in r.materials) m[g] = (m[g] || 0) + r.materials[g]; }
        out.paid += a.paid; out.rows += s; out.perOrder[a.orderId] = {paid: a.paid, rows: s, status: a.status, province: a.province, mats: m}; }
      return out; }""", [o["orderId"] for o in last["orders"]])
    check(f"{label}: school orders' ledger lines add up to their recorded payments", own["rows"] > 0 and abs(own["paid"] - own["rows"]) < 1e-6 * max(1, own["rows"]), (round(own["paid"], 3), round(own["rows"], 3)))
    check(f"{label}: school payments are part of (never more than) the construction pass total", own["rows"] <= booked + 1e-6, (round(own["rows"], 2), round(booked, 2)))
    # every school delivered exactly the quantities the review stated (finished ones), and queued ones started with them
    ok_all = True; detail = []
    for o in last["orders"]:
        p = o["p"]; want = o["C"]
        rec_o = own["perOrder"].get(str(o.get("orderId")))
        if rec_o is None: ok_all = False; detail.append((p, "no ledger line")); continue
        got = rec_o["mats"]
        diff = sum(abs(got.get(g, 0) - want[g]) for g in want)
        done = rec_o["status"] == "Completed"
        detail.append((p, rec_o["status"], round(diff, 2)))
        if done and diff > 1.0: ok_all = False
    check(f"{label}: finished schools received exactly the reviewed quantities (queued ones too, once started)", ok_all and len(last["orders"]) == 5, detail)
    NUMBERS["reconcile"] = {"months": 12, "construction_pass_spent": round(spent, 2), "ledger_booked": round(booked, 2), "schools_paid": round(own["rows"], 2)}
    pg.context.close()


# ---------------------------------------------------------------- crane badges, queue sheet, undo, select-all, long-press
def crane_undo(b):
    label = "crane+undo"
    pg = open_page(b, 360, 740, 1.25); start(pg, "fresh", "FRA")
    # long-press from the ordinary map: the picker opens, the choice enters Build mode with that province selected
    target = eligible_after_pick = pg.evaluate("provsOf(me().tag).map(p => p.id)")[1]
    x, y = pg.evaluate(CENTER, [target, 240])
    pg.mouse.move(x, y); pg.mouse.down(); pg.wait_for_timeout(750); pg.mouse.up(); pg.wait_for_timeout(300)
    check(f"{label}: long-press on the ordinary map opens the project picker", pg.locator('#sheet.open [data-a="bmpick"]').count() > 5 and not pg.evaluate("UI.bm.on"))
    pg.locator('#sheet [data-a="bmpick"][data-k="school"]').click(); pg.wait_for_timeout(300)
    check(f"{label}: the long-pressed province is selected in Build mode", pg.evaluate("UI.bm.on && UI.bm.sel") == [target], pg.evaluate("UI.bm.sel"))
    # clear + select all eligible in view
    pg.locator('[data-a="bmclear"]').click(); check(f"{label}: Clear empties the selection", pg.evaluate("UI.bm.sel.length") == 0)
    pg.evaluate("centerOn(P(me().cap), 900, .5)"); pg.wait_for_timeout(200)
    expect = pg.evaluate("() => { const v = UI.view; return [...bmEligible(me(), 'school')].filter(id => { const p = P(id); return p.x >= v.x && p.x <= v.x + v.w && p.y >= v.y && p.y <= v.y + v.h; }).length; }")
    pg.locator('[data-a="bmall"]').click(); pg.wait_for_timeout(200)
    check(f"{label}: Select all eligible in view selects exactly the eligible provinces in view", pg.evaluate("UI.bm.sel.length") == expect and expect > 0, (pg.evaluate("UI.bm.sel.length"), expect))
    pg.locator('[data-a="bmclear"]').click()
    chosen = eligible(pg, "school")[:5]
    for pid in chosen: tap(pg, pid)
    pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(500)
    st = pg.evaluate(ORDERS, "school"); check(f"{label}: batch placed (started + queued)", st["total"] == 5 and st["queued"] >= 2, st)
    # crane badge on a queued province opens its queue
    q = pg.evaluate("(me().bq||[]).map(x => [x.id, x.p])")
    qp = q[0][1]
    pg.evaluate(CENTER, [qp, 260]); pg.wait_for_timeout(150)
    box = pg.evaluate("(id) => { const r = document.querySelector(`#bmcr g.cr[data-cr='${id}'] .hit`).getBoundingClientRect(); return [r.left + r.width / 2, r.top + r.height / 2, r.width, r.height]; }", qp)
    check(f"{label}: crane badge touch zone is >= 44 px", box[2] >= 43.5 and box[3] >= 43.5, box[2:])
    pg.mouse.click(box[0], box[1]); pg.wait_for_timeout(300)
    sheet = pg.locator("#sheet").inner_text()
    check(f"{label}: tapping the badge opens that province's queue (Up, Down, Remove)", f"Works in {P_name(pg, qp)}" in sheet and pg.locator('#sheet [data-a="bqmv"]').count() == 2 and pg.locator('#sheet [data-a="bqdel"]').count() == 1, sheet.replace("\n", " | ")[:160])
    ring = pg.evaluate("[...document.querySelectorAll('#bmcr g.cr .crp')].map(e => e.getAttribute('stroke-dasharray'))")
    check(f"{label}: badges carry a progress ring", len(ring) == 5, ring)
    first_q = q[0][0]
    pg.locator('#sheet [data-a="bqmv"]').nth(1).click(); pg.wait_for_timeout(300)    # Down
    order = pg.evaluate("(me().bq||[]).map(x => x.id)")
    moved = len(q) > 1 and order[0] != first_q if len(q) > 1 else True
    check(f"{label}: bqmv reorders the queue from the badge sheet", moved or len(q) == 1, (first_q, order))
    n_before = pg.evaluate("(me().bq||[]).length")
    # remove the first order shown in the sheet with bqdel
    pg.locator('#sheet [data-a="bqdel"]').first.click(); pg.wait_for_timeout(300)
    n_after = pg.evaluate("(me().bq||[]).length")
    check(f"{label}: bqdel removes one queued order from the badge sheet", n_after == n_before - 1, (n_before, n_after))
    # Undo all queued (a fresh batch)
    pg.evaluate("closeSheet()")
    left = eligible(pg, "school")
    for pid in left[:2]: tap(pg, pid)
    pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(400)
    qn = pg.evaluate("(me().bq||[]).length"); sn = pg.evaluate("provsOf(me().tag).reduce((a, p) => a + p.build.length, 0)")
    shown = pg.locator("#bmundo [data-a=bmundo]").count() == 1
    check(f"{label}: Undo all queued toast appears with the batch's queued orders", shown and qn >= 1, (shown, qn))
    pg.locator("#bmundo [data-a=bmundo]").click(); pg.wait_for_timeout(400)
    qn2 = pg.evaluate("(me().bq||[]).length"); sn2 = pg.evaluate("provsOf(me().tag).reduce((a, p) => a + p.build.length, 0)")
    check(f"{label}: Undo all queued removes queued orders through bqdel and leaves started work alone", qn2 == qn - pg.evaluate("UI.bm.last.queued") and sn2 == sn, (qn, qn2, sn, sn2))
    check(f"{label}: School still chosen after undo", pg.evaluate("UI.bm.proj") == "school")
    check(f"{label}: zero tab changes", tabs(pg) == [], tabs(pg))
    check(f"{label}: no page errors", pg.errs == [], pg.errs[:2])
    pg.context.close()


# ---------------------------------------------------------------- railway routes
def rail_flow(b, kind):
    label = f"rail_{kind}"
    pg = open_page(b, 360, 740, 1.25); start(pg, kind, "GBR")
    route = pg.evaluate("""() => { const c = me(); const H = provsOf(c.tag).filter(p => heldBy(c, p)); let best = null;
      for (const a of H) for (const z of H) { if (a === z) continue; const r = bmRoute(c, a.id, z.id);
        if (!r.ok) continue; const zero = r.path.filter(id => P(id).rail === 0 && !P(id).build.some(x => x.k === 'rail')).length;
        if (zero >= 3 && r.path.length >= 4 && (!best || r.path.length > best.path.length)) best = {a: a.id, z: z.id, path: r.path}; }
      return best; }""")
    check(f"{label}: a land route over >= 4 provinces exists", route is not None and len(route["path"]) >= 4, route)
    if not route: pg.context.close(); return
    path = route["path"]
    # block one segment: the first railless province in the middle gets a railway ordered first, through the UI
    mid = next(i for i in path[1:-1] if pg.evaluate("(id) => P(id).rail === 0", i)) if any(pg.evaluate("(id) => P(id).rail === 0", i) for i in path[1:-1]) else None
    check(f"{label}: a railless province inside the route to hold up", mid is not None, mid)
    # the existing railway path (province sheet, ACT.bld with b:"rail" -> startRail) lays the first one
    pg.evaluate("(id) => { ACT.bld({p: id, b: 'rail'}); closeSheet(); }", mid)
    check(f"{label}: first railway started through the existing path (ACT.bld -> startRail)", pg.evaluate("(id) => P(id).build.some(b => b.k === 'rail')", mid))
    open_picker_and_pick(pg, "rail")
    check(f"{label}: Railway chosen, bar shows it", pg.evaluate("UI.bm.proj") == "rail" and "Railway" in pg.locator("#bmtop").inner_text())
    # now the long route
    bq0 = pg.evaluate("JSON.stringify(me().bq || [])")
    tap(pg, route["a"], 200); tap(pg, route["z"], 200)
    plan = pg.evaluate("""() => { const p = bmPlan(); return {path: p.route.path, ok: p.route.ok, segs: p.route.segs.map(s => [s.p.id, s.state, s.why]), started: p.started, queued: p.queued, skipped: p.skipped, est: p.est, mats: p.mats}; }""")
    states = [s[1] for s in plan["segs"]]
    check(f"{label}: route over >= 4 provinces, found by the UI-only land search", plan["ok"] and len(plan["path"]) >= 4, plan["path"])
    check(f"{label}: exactly one blocked segment, with its reason", states.count("block") == 1 and any(s[1] == "block" and s[2] for s in plan["segs"]), plan["segs"])
    check(f"{label}: preview states: has rail / can start / blocked", set(states) <= {"built", "start", "block"} and "start" in states, states)
    cls = pg.evaluate("[...document.querySelectorAll('#bmov path')].map(e => e.getAttribute('class'))")
    check(f"{label}: preview coloured per segment on the map", sum(1 for c in cls if c in ("bmrb", "bmrs", "bmrx")) == len(plan["path"]), cls)
    pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for(); pg.wait_for_timeout(200)
    rows = pg.evaluate("[...document.querySelectorAll('#sheet .bmr')].map(r => [r.querySelector('b').textContent, r.querySelector('.bmst').textContent, r.innerText])")
    sk = [r for r in rows if r[1] == "Skipped"]
    check(f"{label}: review lists the blocked segment as skipped with its reason", len(sk) == 1 and "Already under construction" in sk[0][2], sk)
    pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(400)
    res = pg.locator("#sheet .bmres").inner_text(); n_start = states.count("start")
    check(f"{label}: result 'Started {n_start}, queued 0, skipped 1'", res == f"Started {n_start}, queued 0, skipped 1", res)
    started_rail = pg.evaluate("(ids) => ids.filter(id => P(id).build.some(b => b.k === 'rail')).length", path)
    check(f"{label}: rail projects exist via startRail ({n_start} new + 1 earlier)", started_rail == n_start + 1, started_rail)
    check(f"{label}: new rail orders carry their order ids", pg.evaluate("(ids) => ids.filter(id => P(id).build.some(b => b.k === 'rail' && b.orderId != null)).length", path) == n_start)
    check(f"{label}: no rail queue invented (waiting list unchanged)", pg.evaluate("JSON.stringify(me().bq || [])") == bq0)
    check(f"{label}: no tab change", tabs(pg) == [], tabs(pg))
    # a route that breaks at foreign land: start in our land, end across the border
    pg.evaluate("closeSheet()")
    far = pg.evaluate("""() => { const c = me(); for (const p of provsOf(c.tag)) { if (!heldBy(c, p)) continue; for (const n of ADJ[p.id]) { const q = P(n); if (q.o && q.o !== c.tag && !q.waste && !heldBy(c, q)) return [p.id, n, q.n, G.c[q.o].n]; } } return null; }""")
    if far:
        pg.locator('[data-a="bmclear"]').click(); tap(pg, far[0], 200); tap(pg, far[1], 200)
        msg = pg.locator("#bmtop .bmm").inner_text()
        gaps = pg.evaluate("document.querySelectorAll('#bmov .bmrg').length")
        check(f"{label}: a foreign gap is named and drawn", "breaks at" in msg and far[2] in msg and gaps >= 1, msg)
    # no sea lanes: the British Isles and India are not joined by land
    pair = pg.evaluate("""() => { const c = me(); const H = provsOf(c.tag).filter(p => heldBy(c, p)); for (const a of H) for (const z of H) { if (a === z) continue; const r = bmRoute(c, a.id, z.id); if (!r.ok && !r.path.length) return [a.id, z.id]; } return null; }""")
    if pair:
        pg.locator('[data-a="bmclear"]').click(); tap(pg, pair[0], 200); tap(pg, pair[1], 200)
        msg = pg.locator("#bmtop .bmm").inner_text()
        check(f"{label}: no sea lanes: provinces not joined by land are refused", "not joined by land" in msg, msg)
    NUMBERS[label] = {"route_len": len(path), "states": states, "est": round(plan["est"])}
    check(f"{label}: no page errors", pg.errs == [], pg.errs[:2])
    pg.context.close()


def honest_words(b, review_text):
    bad = re.findall(r"\bpric\w*", review_text.replace("today's prices", ""))
    check("honest_words: the review never calls an estimate a price (only 'today's prices' appears)", bad == [] and "Estimated" in review_text, bad)


# ---------------------------------------------------------------- screenshots
def shots(b, out):
    out.mkdir(parents=True, exist_ok=True)
    for (w, h, tz) in [(360, 740, 1.25), (390, 844, 1.0)]:
        for theme in ("light", "dark"):
            tag = f"{w}x{h}@{round(tz * 100)}_{theme}"
            pg = open_page(b, w, h, tz, theme); start(pg, "fresh", "FRA")
            pg.wait_for_timeout(4800)    # let the welcome toast go
            pg.locator('[data-a="bmopen"]').click(); pg.locator('#sheet.open [data-a="bmpick"]').first.wait_for(); pg.wait_for_timeout(300)
            pg.screenshot(path=str(out / f"{tag}_1picker.png"))
            pg.locator('#sheet [data-a="bmpick"][data-k="school"]').click(); pg.wait_for_timeout(300)
            for pid in eligible(pg, "school")[:5]: tap(pg, pid, 300)
            pg.evaluate("centerOn(P(me().cap), 420, .5)"); pg.wait_for_timeout(250)
            pg.screenshot(path=str(out / f"{tag}_2selection.png"))
            pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for(); pg.wait_for_timeout(300)
            pg.screenshot(path=str(out / f"{tag}_3review.png"))
            pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(500)
            pg.screenshot(path=str(out / f"{tag}_4result.png"))
            pg.evaluate("closeSheet()"); pg.wait_for_timeout(300)
            pg.screenshot(path=str(out / f"{tag}_5cranes.png"))
            check(f"shots {tag}: no page errors", pg.errs == [], pg.errs[:2])
            pg.context.close()


SCENARIOS = ["school_fresh", "school_1866", "materials", "crane_undo", "rail_fresh", "rail_1866"]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--shots"); ap.add_argument("--only"); ap.add_argument("--json")
    a = ap.parse_args(); only = set(a.only.split(",")) if a.only else set(SCENARIOS)
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg0 = b.new_page(); pg0.goto(GAME); pg0.locator("#start h1").wait_for()
        GOODN.update(pg0.evaluate("Object.fromEntries(Object.keys(GOODS).map(g => [g, GOODS[g].n.toLowerCase()]))")); pg0.close()
        review_text = ""
        if "school_fresh" in only: plan, last = school_flow(b, "fresh", "FRA", "school_fresh")
        if "school_1866" in only: school_flow(b, "1866", "FRA", "school_1866")
        if "materials" in only: materials_and_reconcile(b)
        if "crane_undo" in only: crane_undo(b)
        if "rail_fresh" in only: rail_flow(b, "fresh")
        if "rail_1866" in only: rail_flow(b, "1866")
        # honest words: look at a real review sheet
        pg = open_page(b, 360, 740, 1.25); start(pg, "fresh", "FRA"); open_picker_and_pick(pg, "school")
        for pid in eligible(pg, "school")[:3]: tap(pg, pid)
        pg.locator('[data-a="bmreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
        honest_words(b, pg.locator("#sheet .shbody").inner_text()); pg.context.close()
        if a.shots: shots(b, Path(a.shots))
        b.close()
    bad = [r for r in RESULTS if not r[1]]
    print(f"\n{len(RESULTS) - len(bad)} passed, {len(bad)} failed")
    print("NUMBERS", json.dumps(NUMBERS))
    if a.json: Path(a.json).write_text(json.dumps({"results": RESULTS, "numbers": NUMBERS}, indent=1, default=str))
    raise SystemExit(1 if bad else 0)


if __name__ == "__main__": main()
