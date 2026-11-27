"use strict";
/* ================= DAY CLOCK, first step (DAY1 #105, ledger B24 B38 B52 B53 B39) =================
 * The world now moves one day per press of End Day. The engine still settles economy, politics and war once a month
 * (monthTick), on the last day of the month; DAY2-DAY7 move each system onto the daily clock. G.dom is the day of the month.
 * Headless runs (century.js, tests) never set G.dom, so the simulation and its state hash are unchanged. */
const DAY_MS = 80; /* ms per day while time runs (about 2.5 s per month); speeds come with DAY8 #112 */
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const leapYear = y => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
const daysIn = t => [31, leapYear(yearOf(t)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31].at(monthOf(t));
const dayOfMonth = () => Math.min(Math.max(1, G.dom || 1), daysIn(G.t));
const weekdayOf = (t, d) => WEEKDAYS.at(new Date(Date.UTC(yearOf(t), monthOf(t), d)).getUTCDay());
const dayDateStr = (t, d) => `${weekdayOf(t, d)} ${d} ${MONTHS[monthOf(t)]} ${yearOf(t)}`;
const dayDateShort = (t, d) => `${d} ${MONTHS[monthOf(t)].slice(0, 3)} ${yearOf(t)}`;

/* One short, true line for the ticker each day, drawn from the player's own state (no rng: rule 7). */
function dailyItems() {
  const c = me(), d = dayOfMonth(), left = daysIn(G.t) - d, out = [];
  if (d === 1) out.push(`${MONTHS[monthOf(G.t)]} ${yearOf(G.t)} begins.`);
  if (left <= 3) out.push(left === 0 ? "The month's accounts close tonight." : `${left} day${left === 1 ? "" : "s"} until the month's accounts close.`);
  for (const w of G.wars || []) {
    const ours = w.att.includes(c.tag) ? w.def : w.def.includes(c.tag) ? w.att : null;
    if (!ours) continue;
    const days = Math.max(1, Math.round((G.t - (w.start || 0)) * 30.4 + d));
    out.push(`Day ${days} of the war with ${ours.map(t => G.c[t]?.n || t).join(" and ")}.`);
  }
  for (const a of G.armies || []) {
    if (a.o !== c.tag || a.reb || !a.path || !a.path.length) continue;
    const from = P(a.loc), to = P(a.path.at(-1));
    if (from && to) out.push(`Our ${a.naval ? "fleet" : "army"} at ${from.n} is under way to ${to.n}.`);
  }
  for (const id in c.gw || {}) {
    const w = typeof GW !== "undefined" ? GW.find(x => x.id === id) : null, g = c.gw[id];
    if (w && g) out.push(`Works on ${w.n}: ${g.left} month${g.left === 1 ? "" : "s"} to go.`);
  }
  if (!out.length) out.push(`${dayDateStr(G.t, d)}: a quiet day in ${c.n}.`);
  return out;
}
function dailyTicker() {
  const items = dailyItems(), n = G.t * 31 + dayOfMonth();
  const line = items.at(n % items.length);
  UI.daily = [`${dayDateShort(G.t, dayOfMonth())}: ${line}`, ...(UI.daily || [])].slice(0, 31);
  toast(line);
}

/* End Day replaces End Month: the last day of a month runs the monthly settlement, then day 1 of the next month. */
function endDay(expectedMonth = G.t) {
  if (G.card || expectedMonth !== G.t || !G.player || !me()?.alive) { endMonth(expectedMonth); return; }
  const d = dayOfMonth();
  if (d < daysIn(G.t)) { G.dom = d + 1; drawTop(); if (UI.dayHold > 0) UI.dayHold--; else dailyTicker(); return; }
  const t0 = G.t;
  endMonth(expectedMonth);
  /* the month's own news keeps the ticker for two days before daily lines return */
  if (G.t !== t0) { G.dom = 1; UI.dayHold = 2; drawTop(); }
}
ACT.end = d => endDay(d?.month === undefined ? G.t : Number(d.month));

/* Time runs a day at a time. */
setPlay = function (v) {
  if (v && G && G.card) { UI.cardHide = 0; drawCard(); toast("A decree awaits your seal."); v = 0; }
  UI.play = v; if (!v) UI.advanceTo = null; clearInterval(UI.timer);
  if (v) UI.timer = setInterval(() => { if (document.hidden) return; endDay(); }, DAY_MS);
  if (G && G.player) drawTop();
};

/* The header shows the full date with its weekday, the day of the month and how far the month has run. */
{
  const base = drawTop;
  drawTop = function () {
    base.apply(this, arguments);
    const el = $("#hdr .month"); if (!el) return;
    const d = dayOfMonth(), n = daysIn(G.t), atlas = UI.tab === "map";
    el.id = "hdr-date";
    el.textContent = atlas ? dayDateShort(G.t, d) : dayDateStr(G.t, d);
    if (el.scrollWidth > el.clientWidth + 1) el.textContent = `${weekdayOf(G.t, d).slice(0, 3)} ${dayDateShort(G.t, d)}`;
    if (el.scrollWidth > el.clientWidth + 1) el.textContent = dayDateShort(G.t, d);
    el.setAttribute("aria-label", `${dayDateStr(G.t, d)}, day ${d} of ${n}`);
    const bar = document.createElement("span");
    bar.className = "mbar"; bar.setAttribute("aria-hidden", "true");
    bar.innerHTML = `<i style="width:${Math.round(100 * d / n)}%"></i>`;
    el.after(bar);
    const r = $("#hdr .rumi"); if (r) r.textContent = r.textContent.replace(/, month \d+$/, `, day ${d} of ${n}`);
    for (const b of document.querySelectorAll("#hdr button.end")) b.textContent = "End day";
  };
}
