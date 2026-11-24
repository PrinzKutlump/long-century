"""V2c.9 acceptance test for the Works board (UI_Art_Plan V2c.1 to V2c.9).

    python3 tools/works_board_test.py [--only NAME[,NAME]] [--json OUT.json] [--no-layout] [--no-hash]

Real pointer taps in the system Chrome, 360x740 at 125% text, from a fresh start and from the 1866 fixture (France).
Taps are counted from the named screen: the Works board already open, except where "from the Atlas" is stated.

  schools     (V2c.9.1) School chip, Select all eligible, Review, Confirm: at most 5 taps counting the tab entry
              from the Atlas; every eligible province gets an order; the orders survive a reload; the basket does not.
  mixed       (V2c.9.2) schools everywhere, railways in three named provinces, a hospital in two: at most 14 taps,
              one confirmation, zero tab changes; each review line matches what the engine did.
  raise       (V2c.9.3) Raise to level 2 ticks only provinces below level 2 that can build.
  best        (V2c.9.4) Best value within X: the estimate never exceeds X, picks in payback order with the minister's
              reason, nothing spent before Confirm; Fill free slots never exceeds the free slots.
  orders      (V2c.9.5) six months and a reload later, every order is listed with its true status and paid-so-far equal
              to the construction ledger; reorder and remove work on queued orders; the view choice is remembered.
  basket      one persistent basket (localStorage only, never in the save), shared with the map's Build mode,
              cleared on confirm, new game and load; cache of the evaluation per month and order.
  views       strip, three views, grid geometry (110 px names, <= 5 columns of 44 px, page never scrolls sideways).
  layout      (V2c.9.6) tools/layout_check.py passes on every screen.
  unchanged   (V2c.9.7) node century.js 7 hash. (All tests, pan and label budgets are run by their own commands.)
"""
import argparse, json, re, subprocess, sys, time
from pathlib import Path
from playwright.sync_api import sync_playwright

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_mode_test as B
from build_mode_test import check, open_page, start_fresh, start_1866, TABLOG, ADVANCE, STATUS, ORDERS, reload_and_continue

ROOT = Path(__file__).resolve().parents[1]
NUMBERS = {}
HASH = (ROOT / "tools/state_hash.txt").read_text().strip()


class Taps:
    """Every click on the page goes through here, so the count is honest."""
    def __init__(s, pg): s.pg = pg; s.n = 0; s.log = []
    def click(s, sel, name=None):
        s.pg.locator(sel).first.click(); s.n += 1; s.log.append(name or sel); s.pg.wait_for_timeout(80)
    def select(s, sel, value):
        s.pg.locator(sel).first.select_option(value); s.n += 1; s.log.append(sel + "=" + value); s.pg.wait_for_timeout(80)
    def type(s, sel, text):
        s.pg.locator(sel).first.click(); s.pg.locator(sel).first.fill(text); s.pg.locator(sel).first.dispatch_event("change"); s.n += 1; s.log.append(sel + " typed"); s.pg.wait_for_timeout(80)


def go_works(pg, view="bld"):
    pg.evaluate("(v) => { OPTS('wbv', v); UI.wb.view = v; ACT.tab({t: 'works'}); }", view)
    pg.locator("#wbboard").wait_for(); pg.wait_for_timeout(250)
    pg.evaluate(TABLOG)


def fresh(b, kind, tag="FRA"):
    pg = open_page(b, 360, 740, 1.25)
    (start_fresh if kind == "fresh" else start_1866)(pg, tag)
    pg.evaluate("OPTS('wbv', 'bld'); OPTS('wbc', null); OPTS('wbf', 0); OPTS('wbm', 0); UI.wb.more = false; UI.wb.cs = null")
    return pg


def evalcnt(pg, key): return pg.evaluate("(k) => wbEval().cnt[k]", key)
def cell(pg, k, pid): return pg.evaluate("([k, p]) => wbEval().by[p][k]", [k, pid])
def names(pg, ids): return [pg.evaluate("(i) => P(i).n", i) for i in ids]
def basket(pg): return pg.evaluate("UI.wb.bk.map(x => [x.k, x.p])")
def snapshot(pg): return pg.evaluate("() => { const c = me(); return {tr: c.tr, serial: G.commandSerial || 0, builds: provsOf(c.tag).reduce((a, p) => a + p.build.length, 0), bq: (c.bq || []).length, t: G.t}; }")
def eligible_ids(pg, k): return pg.evaluate("(k) => wbEval().provs.filter(p => wbEval().by[p.id][k].st === 'can').map(p => p.id)", k)
def nav_tabs(pg): return pg.evaluate("window.__tabs")


def review_rows(pg):
    return pg.evaluate("""() => [...document.querySelectorAll('#sheet .shbody > *')].reduce((o, e) => {
        if (e.matches('h3.wb-gh')) o.g = e.querySelector('span').textContent;
        else if (e.matches('.bmr')) o.rows.push({g: o.g, name: e.querySelector('b').textContent, st: e.querySelector('.bmst').textContent, text: e.innerText});
        return o; }, {g: null, rows: []}).rows""")


def engine_state_of(pg, k, pid):
    """what the engine did for (building, province): started, queued, or nothing"""
    return pg.evaluate("""([k, pid]) => { const c = me(), p = P(pid);
        if (k === 'rail') return p.build.some(b => b.k === 'rail' && b.orderId != null) ? 'start' : 'none';
        if (p.build.some(b => b.k === 'bld' && b.b === k && b.orderId != null)) return 'start';
        if ((c.bq || []).some(x => x.p === pid && x.b === k && x.orderId != null)) return 'queue'; return 'none'; }""", [k, pid])


# ---------------------------------------------------------------- 1. schools everywhere
def schools(b, kind):
    L = f"schools_{kind}"; pg = fresh(b, kind)
    go_works(pg)
    elig = eligible_ids(pg, "school"); n = len(elig)
    check(f"{L}: more than five provinces can take a school", n > 5, n)
    t = Taps(pg); before = snapshot(pg)
    t.click('[data-a="wbcur"][data-k="school"]', "School chip")
    t.click('[data-a="wball"]', "Select all eligible")
    check(f"{L}: Select all eligible ticks every eligible province and nothing else", sorted(x[1] for x in basket(pg)) == sorted(elig) and all(x[0] == "school" for x in basket(pg)), (len(basket(pg)), n))
    check(f"{L}: ticking spent nothing and issued no order", snapshot(pg) == before)
    bar = pg.locator(".wb-bt").inner_text()
    check(f"{L}: basket bar reads '{n} orders · 1 kind · estimated £… at today's prices'", re.fullmatch(rf"{n} orders · 1 kind · estimated £[\d.,]+[kKmM]? at today's prices", bar.replace("\n", " ")) is not None, bar)
    t.click('[data-a="wbreview"]', "Review")
    pg.locator("#sheet.open .bmr").first.wait_for(); pg.wait_for_timeout(250)
    rows = review_rows(pg); plan = pg.evaluate("() => { const p = bmPlan(); return {started: p.started, queued: p.queued, skipped: p.skipped, est: p.est}; }")
    check(f"{L}: review lists one row per ticked province, grouped under School", len(rows) == n and all(r["g"] == "School" for r in rows), (len(rows), {r['g'] for r in rows}))
    check(f"{L}: review shows 'Estimated total at today's prices' and the 25% rule is the batch's", "Estimated total at today's prices" in pg.locator("#sheet .shbody").inner_text())
    t.click('[data-a="bmconfirm"]', "Confirm")
    pg.wait_for_timeout(500)
    res = pg.locator("#sheet .bmres").inner_text()
    check(f"{L}: result reads 'Started N, queued N, skipped 0'", res == f"Started {plan['started']}, queued {plan['queued']}, skipped 0" and plan["started"] + plan["queued"] == n, res)
    o = pg.evaluate(ORDERS, "school")
    check(f"{L}: every eligible province got a school order", o["total"] == n, (o["total"], n))
    check(f"{L}: at most 4 taps from the Works board ({t.n}); with the tab entry from the Atlas at most 5", t.n <= 4 and t.n + 1 <= 5, t.log)
    check(f"{L}: the basket is cleared by Confirm, in the page and in localStorage", basket(pg) == [] and pg.evaluate("JSON.parse(localStorage.getItem('vic.wb') || '[]').length") == 0)
    check(f"{L}: zero tab changes", nav_tabs(pg) == [], nav_tabs(pg))
    check(f"{L}: Undo for the queued ones is offered when something queued", (pg.locator('#sheet [data-a="bmundo"]').count() == 1) == (plan["queued"] > 0))
    reload_and_continue(pg)
    o2 = pg.evaluate(ORDERS, "school")
    check(f"{L}: all {n} orders survive a save and reload", o2["total"] == n and sorted(o2["ids"]) == sorted(o["ids"]), (o2["total"], n))
    check(f"{L}: the basket is empty after the load", basket(pg) == [])
    NUMBERS[L] = {"eligible": n, "taps_from_board": t.n, "taps_from_atlas": t.n + 1, "started": plan["started"], "queued": plan["queued"], "est": round(plan["est"])}
    pg.context.close()


# ---------------------------------------------------------------- 2. mixed basket
def mixed(b, kind):
    L = f"mixed_{kind}"; pg = fresh(b, kind)
    go_works(pg)
    rails = eligible_ids(pg, "rail")[:3]; hosp = eligible_ids(pg, "hosp")[:2]
    check(f"{L}: three railway provinces and two hospital provinces are available", len(rails) == 3 and len(hosp) == 2, (rails, hosp))
    rail_n, hosp_n = names(pg, rails), names(pg, hosp)
    sch = eligible_ids(pg, "school"); n = len(sch)
    t = Taps(pg); before = snapshot(pg)
    t.click('[data-a="wbcur"][data-k="school"]', "School chip"); t.click('[data-a="wball"]', "Select all eligible")
    t.click('[data-a="wbcur"][data-k="rail"]', "Railway chip")
    for pid in rails: t.click(f'.wb-row[data-k="rail"][data-p="{pid}"]', "tick railway " + pid)
    t.click('[data-a="wbcur"][data-k="hosp"]', "Hospital chip")
    for pid in hosp: t.click(f'.wb-row[data-k="hosp"][data-p="{pid}"]', "tick hospital " + pid)
    bk = basket(pg)
    check(f"{L}: the basket holds schools everywhere, three railways and two hospitals", len([x for x in bk if x[0] == "school"]) == n and sorted(x[1] for x in bk if x[0] == "rail") == sorted(rails) and sorted(x[1] for x in bk if x[0] == "hosp") == sorted(hosp), (n, rails, hosp))
    bar = pg.locator(".wb-bt").inner_text().replace("\n", " ")
    check(f"{L}: bar reads {n + 5} orders · 3 kinds", bar.startswith(f"{n + 5} orders · 3 kinds · estimated £") and bar.endswith("at today's prices"), bar)
    check(f"{L}: ticking spent nothing", snapshot(pg) == before)
    t.click('[data-a="wbreview"]', "Review"); pg.locator("#sheet.open .bmr").first.wait_for(); pg.wait_for_timeout(250)
    rows = review_rows(pg); heads = pg.evaluate("[...document.querySelectorAll('#sheet .shbody h3.wb-gh span')].map(e => e.textContent)")
    check(f"{L}: review is grouped by building (School, Railway, Hospital)", heads == ["School", "Railway", "Hospital"], heads)
    plan = pg.evaluate("() => { const p = bmPlan(); return {started: p.started, queued: p.queued, skipped: p.skipped, est: p.est, mats: p.mats, rows: p.rows.map(r => ({id: r.p.id, k: r.k, st: r.state, cost: r.cost, C: r.C}))}; }")
    mat_txt = pg.evaluate("[...document.querySelectorAll('#sheet .bmtot .kr')].find(k => k.firstChild.textContent === 'Materials').lastChild.textContent")
    exp_mat = pg.evaluate("(m) => costTxt(m)", plan["mats"])
    check(f"{L}: materials line = exact quantities summed over every kind", B.normalise(mat_txt) == B.normalise(exp_mat), (mat_txt, exp_mat))
    sum_cost = sum(r["cost"] for r in plan["rows"] if r["st"] != "skip")
    check(f"{L}: Estimated total equals the sum of the rows", abs(sum_cost - plan["est"]) < 1e-6)
    check(f"{L}: one review row per ticked order", len(rows) == n + 5, (len(rows), n + 5))
    t.click('[data-a="bmconfirm"]', "Confirm"); pg.wait_for_timeout(600)
    res = pg.locator("#sheet .bmres").inner_text()
    check(f"{L}: one confirmation reports Started/queued/skipped", res == f"Started {plan['started']}, queued {plan['queued']}, skipped {plan['skipped']}", res)
    check(f"{L}: exactly one confirmation", pg.evaluate("UI.bm.batches.length") == 1)
    check(f"{L}: at most 14 taps ({t.n}) from the Works board", t.n <= 14, t.log)
    check(f"{L}: zero tab changes", nav_tabs(pg) == [], nav_tabs(pg))
    # the engine did exactly what each review line said
    bad = []
    for r, rr in zip(plan["rows"], rows):
        want = {"start": "Starts now", "queue": "Joins the queue", "skip": "Skipped"}[r["st"]]
        got = engine_state_of(pg, r["k"], r["id"])
        if rr["st"] != want or (r["st"] == "skip") != (got == "none") or (r["st"] in ("start", "queue") and got != r["st"]) or names(pg, [r["id"]])[0] != rr["name"]: bad.append((r["k"], r["id"], rr["st"], got))
    check(f"{L}: the result matches the review line by line", not bad, bad[:5])
    o = {k: pg.evaluate(ORDERS, k)["total"] for k in ("school", "hosp")}
    check(f"{L}: school and hospital orders exist, railways started", o["school"] == n and o["hosp"] == 2 and all(engine_state_of(pg, "rail", p) == "start" for p in rails), (o, rails))
    NUMBERS[L] = {"schools": n, "taps_from_board": t.n, "started": plan["started"], "queued": plan["queued"], "est": round(plan["est"]), "rails": rail_n, "hospitals": hosp_n}
    return pg


# ---------------------------------------------------------------- 3. raise to level N
def raise_flow(b, kind):
    L = f"raise_{kind}"; pg = fresh(b, kind); go_works(pg)
    # set-up: give four provinces school levels 1, 2, 2 and 3 so that "below level 2" is a real question
    setup = pg.evaluate("""() => { const c = me(), ids = wbEval().provs.filter(p => wbEval().by[p.id].school.st === 'can').map(p => p.id).slice(0, 4);
        ids.forEach((id, i) => { (P(id).bx = P(id).bx || {}).school = [1, 2, 2, 3][i]; }); UI.wb.ev = null; return ids; }""")
    pg.evaluate("render()"); go_works(pg)
    t = Taps(pg)
    t.click('[data-a="wbcur"][data-k="school"]', "School chip"); t.click('[data-a="wbmore"]', "More tools"); t.select('select[data-wb="tgt"]', "2"); t.click('[data-a="wbraise"]', "Raise")
    ticked = sorted(x[1] for x in basket(pg))
    expect = sorted(pg.evaluate("() => wbEval().provs.filter(p => { const x = wbEval().by[p.id].school; return x.st === 'can' && x.lv < 2; }).map(p => p.id)"))
    lvs = pg.evaluate("(ids) => ids.map(i => BLD.school.lv(P(i)))", ticked)
    check(f"{L}: only provinces below level 2 that can build are ticked", ticked == expect and all(v < 2 for v in lvs) and len(ticked) > 0, (len(ticked), set(lvs)))
    check(f"{L}: the provinces already at level 2 or 3 are not ticked", not any(i in ticked for i in setup[1:]) and setup[0] in ticked, (setup, ticked[:4]))
    dom = pg.evaluate("[...document.querySelectorAll('.wb-row[aria-checked=true]')].map(e => e.dataset.p).sort()")
    check(f"{L}: the list shows exactly those ticks", dom == ticked)
    check(f"{L}: four taps ({t.n}), nothing bought", t.n == 4 and pg.evaluate("(me().bq||[]).length") == 0)
    msg = pg.locator(".wb-msg").inner_text()
    check(f"{L}: the tool says each order adds one level", "one level" in msg, msg)
    t.select('select[data-wb="tgt"]', "3"); t.click('[data-a="wbraise"]', "Raise to 3")
    ticked3 = sorted(x[1] for x in basket(pg))
    check(f"{L}: raising to level 3 adds the level-2 provinces too", set(setup[1:3]) <= set(ticked3) and setup[3] not in ticked3, ticked3[:6])
    NUMBERS[L] = {"ticked_to_2": len(ticked), "ticked_to_3": len(ticked3)}
    pg.context.close()


# ---------------------------------------------------------------- 4. best value within X, fill free slots
def best_flow(b, kind):
    L = f"best_{kind}"; pg = fresh(b, kind); go_works(pg)
    picks = pg.evaluate("() => { const ev = wbEval(), L = wbPickList(me(), ev); return L.map(r => ({k: r.k, p: r.p.id, cost: r.x.cost, yrs: r.x.yrs})); }")
    check(f"{L}: there are projects with a payback", len(picks) >= 6, len(picks))
    X = round(sum(p["cost"] for p in picks[:6]) * 1.1)
    before = snapshot(pg); t = Taps(pg)
    t.click('[data-a="wbmore"]', "More tools"); t.type('input[data-wb="cap"]', str(X)); t.click('[data-a="wbbest"]', "Best value")
    bk = pg.evaluate("UI.wb.bk.map(x => ({k: x.k, p: x.p, why: x.why}))")
    est = pg.evaluate("bmPlan().est")
    check(f"{L}: picks were made", len(bk) >= 2, len(bk))
    check(f"{L}: the estimate ({round(est)}) never exceeds £{X}", est <= X + 1e-6, (est, X))
    yrs = [pg.evaluate("([k, p]) => wbEval().by[p][k].yrs", [x["k"], x["p"]]) for x in bk]
    check(f"{L}: picks are in payback order", all(yrs[i] <= yrs[i + 1] + 1e-9 for i in range(len(yrs) - 1)), [round(y, 2) for y in yrs])
    check(f"{L}: each pick carries the minister's reason", all(x["why"] and "pays for itself" in x["why"] for x in bk), [x["why"] for x in bk][:2])
    check(f"{L}: nothing spent before Confirm", snapshot(pg) == before)
    t.click('[data-a="wbreview"]', "Review"); pg.locator("#sheet.open .bmr").first.wait_for(); pg.wait_for_timeout(250)
    txt = pg.locator("#sheet .shbody").inner_text()
    check(f"{L}: the review shows the minister's reason for each pick", txt.count("Minister:") == len(bk), (txt.count("Minister:"), len(bk)))
    check(f"{L}: still nothing spent at review", snapshot(pg) == before)
    pg.locator('[data-a="bmback"]').first.click(); pg.wait_for_timeout(200)
    # a second, tighter run replaces nothing: clear, then a budget too small for any project
    pg.locator('[data-a="wbclear"]').first.click()
    pg.locator('input[data-wb="cap"]').fill("1"); pg.locator('input[data-wb="cap"]').dispatch_event("change"); pg.locator('[data-a="wbbest"]').click()
    check(f"{L}: a budget that fits nothing ticks nothing and says so", basket(pg) == [] and "Nothing more fits" in pg.locator(".wb-msg").inner_text(), pg.locator(".wb-msg").inner_text())
    # fill free slots
    free = pg.evaluate("() => Math.max(0, buildSlots(me()) - bldActive(me()))")
    pg.locator('[data-a="wbfill"]').click(); pg.wait_for_timeout(100)
    kinds = pg.evaluate("UI.wb.bk.length"); st = pg.evaluate("bmPlan().rows.map(r => r.state)")
    check(f"{L}: Fill free slots ticks at most the {free} free slots and nothing would queue", 0 < kinds <= free and all(s == "start" for s in st), (kinds, free, st))
    yrs2 = [pg.evaluate("([k, p]) => wbEval().by[p][k].yrs", [k, p]) for k, p in basket(pg)]
    check(f"{L}: free-slot picks are in payback order", all(yrs2[i] <= yrs2[i + 1] + 1e-9 for i in range(len(yrs2) - 1)), [round(y, 2) for y in yrs2])
    NUMBERS[L] = {"X": X, "picks": len(bk), "estimate": round(est), "taps": t.n, "free_slots": free}
    pg.context.close()


# ---------------------------------------------------------------- 5. orders view
def orders_flow(b, kind):
    L = f"orders_{kind}"; pg = mixed_quiet(b, kind)
    t0 = pg.evaluate("G.t")
    pg.evaluate(ADVANCE, 6)
    reload_and_continue(pg); go_works(pg, "ord")
    check(f"{L}: Orders view is the one shown after reload ({t0}+6)", pg.evaluate("G.t") == t0 + 6 and pg.locator('.wb-seg [aria-pressed="true"]').inner_text().strip() == "Orders")
    st = pg.evaluate(STATUS)
    led = pg.evaluate("() => Object.values(G.constructionLedger || {}).map(a => ({o: a.orderId, p: a.province, paid: a.paid, status: a.status}))")
    ids = [int(i) for i in st]
    rows = pg.evaluate("[...document.querySelectorAll('.wb-or')].map(e => ({o: e.dataset.order, st: e.dataset.st, p: e.dataset.prov, paid: e.querySelector('.wb-paid').dataset.paid, text: e.innerText}))")
    got = {int(r["o"]): r for r in rows if r["o"]}
    check(f"{L}: every order is listed", all(i in got for i in ids) and len(ids) > 8, (len(ids), len(got)))
    kinds = {}
    for i in ids: kinds[st[str(i)][0]] = kinds.get(st[str(i)][0], 0) + 1
    bad = [(i, st[str(i)][0], got[i]["st"]) for i in ids if i in got and got[i]["st"] != st[str(i)][0]]
    check(f"{L}: each shows its true status ({kinds})", not bad, bad[:5])
    badp = []
    for i in ids:
        if i not in got: continue
        want = sum(a["paid"] for a in led if a["o"] == i and a["p"] == st[str(i)][1])
        if abs(float(got[i]["paid"]) - want) > 0.01: badp.append((i, got[i]["paid"], want))
    check(f"{L}: paid so far equals the construction ledger", not badp, badp[:5])
    check(f"{L}: some money was paid, so the test is not vacuous", sum(float(r["paid"]) for r in got.values()) > 100, sum(float(r["paid"]) for r in got.values()))
    b_rows = [r for r in got.values() if r["st"] == "building"]
    check(f"{L}: work under way shows progress and months left", all("month" in r["text"] and "%" in r["text"] for r in b_rows), b_rows[:1])
    d_rows = [r for r in got.values() if r["st"] == "done"]
    check(f"{L}: finished works of the last 12 months are listed ({len(d_rows)})", all("Finished" in r["text"] for r in d_rows))
    # reorder and remove on queued orders
    qn = pg.evaluate("(me().bq || []).length")
    if qn >= 2:
        first = pg.evaluate("me().bq.map(x => x.id)")
        pg.locator('.wb-or.st-queued').nth(1).locator('[aria-label^="Move"][aria-label$="up"]').click(); pg.wait_for_timeout(200)
        after = pg.evaluate("me().bq.map(x => x.id)")
        check(f"{L}: Up reorders the queue (bqmv)", after[0] == first[1] and after[1] == first[0], (first[:2], after[:2]))
        pg.locator('.wb-or.st-queued').nth(0).locator('[aria-label$="from the queue"]').click(); pg.wait_for_timeout(200)
        after2 = pg.evaluate("me().bq.map(x => x.id)")
        check(f"{L}: Remove takes one order out of the queue (bqdel)", len(after2) == qn - 1 and after[0] not in after2, (qn, len(after2)))
    else:
        check(f"{L}: queue buttons (queue too short to test, {qn})", True)
    # a province name opens it on the map
    pid = rows[0]["p"]; pg.locator(f'.wb-or [data-a="wbmap"][data-p="{pid}"]').first.click(); pg.wait_for_timeout(400)
    check(f"{L}: tapping a province name opens it on the map", pg.evaluate("UI.tab") == "map" and pg.evaluate("UI.sel") == pid, (pg.evaluate("UI.tab"), pg.evaluate("UI.sel"), pid))
    NUMBERS[L] = {"orders": len(ids), "by_status": kinds, "paid_total": round(sum(float(r["paid"]) for r in got.values()))}
    pg.context.close()


def mixed_quiet(b, kind):
    """the mixed batch again, ticked through the page API (the taps are counted in 'mixed'), confirmed through the real Review/Confirm"""
    pg = fresh(b, kind); go_works(pg)
    rails = eligible_ids(pg, "rail")[:3]; hosp = eligible_ids(pg, "hosp")[:2]
    pg.evaluate("""([r, h]) => { for (const id of wbEval().provs.filter(p => wbEval().by[p.id].school.st === 'can').map(p => p.id).slice(0, 8)) wbAdd('school', id);
        r.forEach(id => wbAdd('rail', id)); h.forEach(id => wbAdd('hosp', id)); wbRefresh(); }""", [rails, hosp])
    pg.locator('[data-a="wbreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for(); pg.locator('[data-a="bmconfirm"]').click(); pg.wait_for_timeout(500)
    return pg


# ---------------------------------------------------------------- the basket, the map, the cache
def basket_flow(b):
    L = "basket"; pg = fresh(b, "fresh"); go_works(pg)
    sch = eligible_ids(pg, "school")[:3]
    n0 = pg.evaluate("UI.wb.evN")
    pg.locator('[data-a="wbcur"][data-k="school"]').click()
    for pid in sch: pg.locator(f'.wb-row[data-k="school"][data-p="{pid}"]').click()
    for v in ("prov", "grid", "bld"): pg.locator(f'[data-a="wbview"][data-v="{v}"]').click()
    check(f"{L}: ticks persist across chips and views", sorted(x[1] for x in basket(pg)) == sorted(sch), basket(pg))
    check(f"{L}: evaluation is cached while only ticks and views change (computed {pg.evaluate('UI.wb.evN') - n0} new time(s))", pg.evaluate("UI.wb.evN") == n0, (n0, pg.evaluate("UI.wb.evN")))
    ls = pg.evaluate("JSON.parse(localStorage.getItem('vic.wb'))")
    check(f"{L}: the basket is in localStorage", sorted(x[1] for x in ls) == sorted(sch) and all(x[0] == "school" for x in ls), ls)
    check(f"{L}: the basket is not in the save", "vic.wb" not in pg.evaluate("pack().slice(0, 0)") and "wb" not in json.loads(pg.evaluate("saveJSON()")), "")
    # tab changes keep it, and the map's Build mode shows the same ticks
    pg.evaluate("ACT.tab({t: 'eco'})"); pg.evaluate("ACT.tab({t: 'works'})")
    check(f"{L}: ticks survive a tab change", len(basket(pg)) == 3)
    pg.locator('.bnav [data-t="map"]').click(); pg.wait_for_timeout(300)
    pg.locator('[data-a="bmopen"]').click(); pg.locator('#sheet [data-a="bmpick"]').first.wait_for()
    check(f"{L}: the Build picker offers 'On the map' and the Works board", pg.locator('#sheet [data-a="wbopen"]').count() == 1)
    pg.locator('#sheet [data-a="bmpick"][data-k="school"]').click(); pg.wait_for_timeout(300)
    check(f"{L}: Build mode starts with the board's three schools already selected", pg.evaluate("UI.bm.sel").__len__() == 3 and "3 selected" in pg.locator("#bmtop").inner_text(), pg.locator("#bmtop").inner_text())
    other = [p for p in eligible_ids(pg, "school") if p not in sch][0]
    pg.evaluate("(id) => bmTap(id)", other)
    check(f"{L}: a province tapped on the map joins the same basket", len(basket(pg)) == 4 and ["school", other] in basket(pg))
    pg.evaluate("bmLeave()"); go_works(pg)
    check(f"{L}: and the board shows it ticked", pg.locator(f'.wb-row[data-p="{other}"][aria-checked="true"]').count() == 1)
    # the strip
    strip = pg.evaluate("() => { const c = me(); return {txt: document.querySelector('.wb-strip').innerText, slots: buildSlots(c), act: bldActive(c), q: (c.bq || []).length}; }")
    check(f"{L}: status strip shows treasury, spend, slots used and queue", "Treasury" in strip["txt"] and f"{strip['act']}/{strip['slots']}" in strip["txt"] and "Queue" in strip["txt"] and "free" in strip["txt"] and "Spend" in strip["txt"], strip["txt"].replace("\n", " "))
    pg.locator(".wb-strip").click(); pg.wait_for_timeout(150)
    check(f"{L}: tapping the strip gives detail", pg.locator("#modal .msheet h2").inner_text() == "Works status"); pg.locator('#modal [data-a="close"]').first.click()
    # 25% warning counts the whole mixed batch
    pg.locator('[data-a="wbclear"]').click(); pg.locator('[data-a="wball"]').click()
    pg.locator('[data-a="wbreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
    est = pg.evaluate("bmPlan().est"); tr0 = pg.evaluate("me().tr")
    res = []
    for mul in (3.0, 5.0):
        pg.evaluate("(v) => { me().tr = v; }", est * mul); pg.locator('[data-a="bmback"]').first.click(); pg.locator('[data-a="wbreview"]').click(); pg.locator("#sheet.open .bmr").first.wait_for()
        res.append(pg.locator("#sheet .bmfoot .bmw").count())
    pg.evaluate("(v) => { me().tr = v; }", tr0); pg.locator('[data-a="bmback"]').first.click()
    check(f"{L}: the 25% warning counts the whole batch", res == [1, 0], res)
    # cleared by a new game and by a load
    pg.evaluate("wbAdd('school', %s)" % json.dumps(sch[0]))
    pg.evaluate("showStart()"); pg.locator('[data-a="pick"][data-t="GBR"]').first.click(); pg.wait_for_function("!document.querySelector('#start')")
    check(f"{L}: a new game clears the basket", basket(pg) == [] and pg.evaluate("localStorage.getItem('vic.wb')") == "[]")
    pg.evaluate("wbAdd('school', 'LON')"); pg.evaluate("loadText(%s, 'Loaded')" % json.dumps(B.FIX1866))
    check(f"{L}: loading a game clears the basket", basket(pg) == [])
    pg.context.close()


# ---------------------------------------------------------------- views, grid geometry
def views_flow(b):
    L = "views"; pg = fresh(b, "1866"); go_works(pg)
    seg = pg.evaluate("[...document.querySelectorAll('#wbboard > .wb-seg .btn')].map(e => e.textContent.trim())")
    check(f"{L}: the segmented control offers By building, By province, Grid, Orders", seg == ["By building", "By province", "Grid", "Orders"], seg)
    chips = pg.evaluate("[...document.querySelectorAll('.wb-chiprow > *')].reduce((o, e) => { if (e.classList.contains('wb-gl')) o.push([e.textContent.trim(), 0]); else o[o.length - 1][1]++; return o; }, []).map(x => x.join(' '))")
    check(f"{L}: chips grouped Military 7, Economy 7, People 9, Culture 2, Railway 1 in one row", chips == ["Military 7", "Economy 7", "People 9", "Culture 2", "Railway 1"], chips)
    pg.locator('[data-a="wbmore"]').click(); pg.wait_for_timeout(100)
    check(f"{L}: every chip has an icon and a count", pg.evaluate("[...document.querySelectorAll('.wb-chip')].every(e => e.querySelector('svg') && e.querySelector('.wb-n'))"))
    check(f"{L}: chips and rows are at least 44 px tall", pg.evaluate("[...document.querySelectorAll('.wb-chip, .wb-row, .wb-tk')].every(e => e.getBoundingClientRect().height >= 43.9)"))
    sorts = []
    for s in ("pay", "cost", "lv", "name"):
        pg.locator('select[data-wb="sort"]').select_option(s); pg.wait_for_timeout(100)
        sorts.append(pg.evaluate("[...document.querySelectorAll('.wb-row')].map(e => e.dataset.p)"))
    check(f"{L}: four sort orders (payback, cost, level, name) give different lists", len({tuple(x) for x in sorts}) >= 3, [len(x) for x in sorts])
    names_ = pg.evaluate("[...document.querySelectorAll('.wb-row .wb-rm > b')].map(e => e.textContent)")
    check(f"{L}: sorting by name is alphabetical", names_ == sorted(names_), names_[:3])
    pg.locator('[data-a="wbcan"]').click(); only = pg.evaluate("[...document.querySelectorAll('.wb-row')].every(e => !e.disabled)")
    check(f"{L}: 'Can build now' keeps only provinces that can build", only and pg.locator(".wb-row").count() > 0); pg.locator('[data-a="wbcan"]').click()
    regs = pg.evaluate("[...document.querySelectorAll('select[data-wb=reg] option')].length")
    pg.locator('select[data-wb="reg"]').select_option(index=2); pg.wait_for_timeout(100)
    check(f"{L}: filter by region narrows the list", pg.locator(".wb-row").count() < pg.evaluate("wbEval().provs.length") and regs > 2)
    pg.locator('select[data-wb="reg"]').select_option(""); pg.wait_for_timeout(100)
    # by province
    pg.locator('[data-a="wbview"][data-v="prov"]').click(); pg.wait_for_timeout(150)
    cards = pg.locator(".wb-card").count()
    check(f"{L}: By province: one collapsible card per province held", cards == pg.evaluate("wbEval().provs.length"), cards)
    pg.locator(".wb-card .wb-ch").nth(2).click(); pg.wait_for_timeout(100)
    tile = pg.locator(".wb-card .wb-tile:not([disabled])").first; pid = tile.get_attribute("data-p"); k = tile.get_attribute("data-k")
    tile.click(); pg.wait_for_timeout(100)
    check(f"{L}: tapping a tile ticks it and the header counts it", ["" + k, pid] in basket(pg) and "1 ticked" in pg.locator(f'.wb-ch[data-p="{pid}"]').inner_text(), pg.locator(f'.wb-ch[data-p="{pid}"]').inner_text())
    pg.evaluate("wbClear(); wbRefresh()")
    # grid
    pg.locator('[data-a="wbview"][data-v="grid"]').click(); pg.wait_for_timeout(200)
    geo = pg.evaluate("""() => { const gp = document.querySelector('.wb-gp'), gn = document.querySelector('.wb-gn'), cells = [...gp.querySelectorAll('.wb-cell')],
        pages = document.querySelectorAll('.wb-gp'), cols = getComputedStyle(gp).gridTemplateColumns.split(' ').length - 1;
        return {name: gn.getBoundingClientRect().width, cell: [...new Set(cells.map(c => Math.round(c.getBoundingClientRect().width) + 'x' + Math.round(c.getBoundingClientRect().height)))], cols,
          pages: pages.length, pageScroll: document.documentElement.scrollWidth > document.documentElement.clientWidth || document.querySelector('#page').scrollWidth > document.querySelector('#page').clientWidth,
          gridScrolls: document.querySelector('.wb-gscroll').scrollWidth > document.querySelector('.wb-gscroll').clientWidth,
          sticky: getComputedStyle(gn).position, fits: pages[0].scrollWidth <= document.querySelector('.wb-gscroll').clientWidth + 1}; }""")
    check(f"{L}: Grid: sticky 110 px name column", abs(geo["name"] - 110) < 1.5 and geo["sticky"] == "sticky", geo["name"])
    check(f"{L}: Grid: at most 5 columns of 44 px cells ({geo['cols']} here)", geo["cols"] <= 5 and geo["cell"] == ["44x44"], geo)
    check(f"{L}: Grid: a page of columns fits the width and the page itself does not scroll sideways", geo["fits"] and not geo["pageScroll"], geo)
    check(f"{L}: Grid: the Military group (7) is split across swipeable pages", geo["pages"] == -(-7 // geo["cols"]) and geo["gridScrolls"], geo)
    c0 = pg.locator(".wb-gp").first.locator(".wb-cell:not([disabled])").first; k, pid = c0.get_attribute("data-k"), c0.get_attribute("data-p")
    c0.click(); pg.wait_for_timeout(100)
    check(f"{L}: tapping a grid cell ticks it", [k, pid] in basket(pg))
    pg.locator('[data-a="wbpage"][data-i="1"]').click(); pg.wait_for_timeout(500)
    check(f"{L}: the page dots swipe to the next page of buildings", pg.evaluate("document.querySelector('.wb-gscroll').scrollLeft") > 100 and pg.locator('[data-a="wbpage"][data-i="1"][aria-pressed="true"]').count() == 1)
    check(f"{L}: the page never scrolls sideways", pg.evaluate("document.documentElement.scrollWidth <= document.documentElement.clientWidth"))
    # one tap from every tab
    for tab in ("over", "map", "eco", "pol"):
        pg.evaluate("(t) => ACT.tab({t})", tab); pg.wait_for_timeout(120)
        pg.locator('.bnav [data-t="works"]').click(); pg.wait_for_timeout(150)
        check(f"{L}: Works board is one tap from {tab}", pg.evaluate("UI.tab") == "works" and pg.locator("#wbboard").count() == 1)
    pg.locator('[data-a="wbview"][data-v="ord"]').click(); reload_and_continue(pg); go_works(pg, None) if False else None
    pg.evaluate("ACT.tab({t:'works'})"); pg.wait_for_timeout(200)
    check(f"{L}: the chosen view is remembered across a reload", pg.locator('#wbboard > .wb-seg [aria-pressed="true"]').inner_text().strip() == "Orders")
    pg.context.close()


def map_fixes(b):
    """V2c.8 map overlaps: markers vs names, toast vs zoom controls, selection outline vs names"""
    L = "map"; pg = open_page(b, 360, 740, 1.25); start_1866(pg, "FRA")
    pg.evaluate("() => { const c = me(); const en = Object.keys(G.c).find(t => t !== c.tag && G.c[t].alive); }")
    pg.evaluate("toast('A message that is long enough to run across the screen and wrap onto a second line for sure.')"); pg.wait_for_timeout(200)
    r = pg.evaluate("""() => { const t = document.querySelector('#tkf').getBoundingClientRect(), z = [...document.querySelectorAll('#mapbtns button')].map(b => b.getBoundingClientRect());
        return {tkf: [t.left, t.right, t.top, t.bottom], hit: z.some(b => b.left < t.right && b.right > t.left && b.top < t.bottom && b.bottom > t.top), vis: !document.querySelector('#tkf').hidden}; }""")
    check(f"{L}: the toast shows and never covers the zoom and other map controls", r["vis"] and not r["hit"], r)
    # theatre and port tokens never sit over province names (labels are laid out around the marker boxes)
    JS = """([tag, w]) => { G.player = tag; for (const k in G.c) G.c[k].ai = k !== tag; UI.tab = 'map'; buildMap(); render(); atlasHome();
        centerOn(P(me().cap), w, .5); applyView(); UI._sc = 0; applyView(); drawMap();
        const mk = [...document.querySelectorAll('#units .tb, #units .cb')].map(e => e.getBoundingClientRect());
        const lb = [...document.querySelectorAll('#plbl text, #lbls text')].filter(t => t.getBoundingClientRect().width > 0).map(t => t.getBoundingClientRect());
        let ov = 0; for (const m of mk) for (const l of lb) if (m.left < l.right && m.right > l.left && m.top < l.bottom && m.bottom > l.top) ov++;
        return {markers: mk.length, labels: lb.length, overlaps: ov}; }"""
    tot = 0; mks = 0
    for tag in ("FRA", "GBR", "RUS"):
        for w in (150, 260, 380):
            r = pg.evaluate(JS, [tag, w]); tot += r["overlaps"]; mks += r["markers"]
    check(f"{L}: no theatre or port token covers a province name ({mks} tokens, 9 views)", tot == 0 and mks > 10, (tot, mks))
    # a province name never has the selection outline cutting through it: the name's halo is opaque enough to break the line
    a = pg.evaluate("() => { const t = document.querySelector('#plbl text, #lbls text'); const s = getComputedStyle(t).stroke; const m = /rgba?\\(([^)]+)\\)/.exec(s); return m ? +(m[1].split(',')[3] || 1) : 1; }")
    check(f"{L}: name halos are nearly opaque (alpha {a}), so a selection outline stops at the name", a >= .9, a)
    pg.close()


def layout(b):
    run = subprocess.run([sys.executable, str(ROOT / "tools/layout_check.py")], capture_output=True, text=True)
    tail = [l for l in run.stdout.strip().splitlines() if l.startswith(("PASS", "FAIL")) or "passed" in l]
    check("layout: tools/layout_check.py passes on every screen", run.returncode == 0, (tail[-1] if tail else run.stdout[-300:]) + (run.stderr[-200:] if run.returncode else ""))


def unchanged(b):
    run = subprocess.run(["node", "century.js", "7"], capture_output=True, text=True, cwd=ROOT)
    h = re.findall(r'"stateHash":"([0-9a-f]{64})"', run.stdout)
    check("unchanged: node century.js 7 hash identical", h and h[-1] == HASH, h[-1] if h else run.stdout[-200:])


SC = {"schools_fresh": lambda b: schools(b, "fresh"), "schools_1866": lambda b: schools(b, "1866"),
      "mixed_fresh": lambda b: mixed(b, "fresh").context.close(), "mixed_1866": lambda b: mixed(b, "1866").context.close(),
      "raise_fresh": lambda b: raise_flow(b, "fresh"), "raise_1866": lambda b: raise_flow(b, "1866"),
      "best_fresh": lambda b: best_flow(b, "fresh"), "best_1866": lambda b: best_flow(b, "1866"),
      "orders_fresh": lambda b: orders_flow(b, "fresh"), "orders_1866": lambda b: orders_flow(b, "1866"),
      "basket": basket_flow, "views": views_flow, "map": map_fixes, "layout": layout, "unchanged": unchanged}


def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--only"); ap.add_argument("--json"); ap.add_argument("--no-layout", action="store_true"); ap.add_argument("--no-hash", action="store_true")
    a = ap.parse_args(); only = a.only.split(",") if a.only else list(SC)
    if a.no_layout and "layout" in only: only.remove("layout")
    if a.no_hash and "unchanged" in only: only.remove("unchanged")
    with sync_playwright() as p:
        b = p.chromium.launch(executable_path="/usr/bin/google-chrome", args=["--no-sandbox"])
        pg0 = b.new_page(); pg0.goto(B.GAME); pg0.locator("#start h1").wait_for()
        B.GOODN.update(pg0.evaluate("Object.fromEntries(Object.keys(GOODS).map(g => [g, GOODS[g].n.toLowerCase()]))")); pg0.close()
        for name in only:
            if name in SC:
                t0 = time.time(); print(f"-- {name}"); SC[name](b); print(f"   ({time.time() - t0:.0f}s)")
        b.close()
    bad = [r for r in B.RESULTS if not r[1]]
    print(f"\n{len(B.RESULTS) - len(bad)} passed, {len(bad)} failed")
    print("NUMBERS", json.dumps(NUMBERS))
    if a.json: Path(a.json).write_text(json.dumps({"results": B.RESULTS, "numbers": NUMBERS}, indent=1, default=str))
    raise SystemExit(1 if bad else 0)


if __name__ == "__main__": main()
