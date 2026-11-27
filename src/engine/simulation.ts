import type {
  CausalBreakdown,
  CausalCause,
  TradeRoute,
} from "./types";

function computeCapitalDistances(tag: string, capId: string): Map<string, number> {
  const dist = new Map<string, number>();
  if (!capId || !G.prov[capId]) return dist;
  const queue: string[] = [capId];
  dist.set(capId, 0);
  let head = 0;
  while (head < queue.length) {
    const cur = queue[head++];
    const d = dist.get(cur) || 0;
    const neighbors = (ADJ && ADJ[cur]) || [];
    for (const nxt of neighbors) {
      if (dist.has(nxt)) continue;
      const np = G.prov[nxt];
      if (!np || np.waste || np.o !== tag || np.ctl !== tag) continue;
      dist.set(nxt, d + 1);
      queue.push(nxt);
    }
    const curProv = G.prov[cur];
    if (curProv && curProv.sea && SEAADJ && SEAADJ[cur]) {
      for (const [sn] of SEAADJ[cur]) {
        if (dist.has(sn)) continue;
        const sp = G.prov[sn];
        if (!sp || sp.waste || sp.o !== tag || sp.ctl !== tag) continue;
        dist.set(sn, d + 2);
        queue.push(sn);
      }
    }
  }
  return dist;
}

function stepInfrastructureAndAccess(_warm?: boolean): void {
  const distByTag: Record<string, Map<string, number>> = {};
  for (const tag of Object.keys(G.c)) {
    const c = G.c[tag];
    if (!c || !c.alive) continue;
    distByTag[tag] = computeCapitalDistances(tag, c.cap);
  }

  const accSum: Record<string, { w: number; s: number }> = {};

  for (const p of G.plist) {
    if (p.waste || !p.o || !G.c[p.o]?.alive) {
      if (!p.infra) {
        p.infra = {
          baseCapacity: 0,
          railBonus: 0,
          usageLoad: 0,
          netInfra: 0,
          marketAccess: 1,
        };
      }
      continue;
    }
    const c = G.c[p.o];
    const causes: string[] = [];
    const baseCap = Math.round(
      (TERRAIN[p.t]?.sup || 6) * 2 +
        Math.min(28, Math.sqrt(Math.max(1, p.pop || 0)) * 0.65) +
        (p.sea ? 4 : 0) +
        (p.id === c.cap ? 8 : 0)
    );
    const railBonus =
      (p.rail || 0) * 14 +
      (typeof bxl === "function" ? bxl(p, "depot") * 10 + bxl(p, "harbour") * 6 : 0);
    const facLv = Array.isArray(p.factories)
      ? p.factories.reduce((s: number, f: any) => s + Math.max(0, f.lv || 0), 0)
      : 0;
    const usageLoad =
      Math.round((facLv * 3.5 + (p.mine ? 3 : 0) + Math.min(20, (p.pop || 0) / 450)) * 100) / 100;
    const supplyCap = baseCap + railBonus;
    const netInfra = Math.round((supplyCap - usageLoad) * 100) / 100;

    let infraRatio = 1;
    if (netInfra < 0 && usageLoad > 0) {
      infraRatio = clamp(supplyCap / usageLoad, 0.35, 1);
      causes.push("Infra deficit (" + netInfra.toFixed(0) + "): " + Math.round(infraRatio * 100) + "%");
    }

    const hops = distByTag[p.o]?.get(p.id);
    let distMult = 1;
    if (hops == null) {
      distMult = 0.65;
      causes.push("Cut from capital corridor (×0.65)");
    } else if (hops > 3) {
      distMult = Math.max(0.7, 1 - (hops - 3) * 0.03);
      if (distMult < 0.96) causes.push("Distance (" + hops + " hops): ×" + distMult.toFixed(2));
    }

    let occPenalty = 1;
    if (p.ctl && p.ctl !== p.o) {
      occPenalty = 0.55;
      causes.push("Enemy occupation (×0.55)");
    }

    const blkShare = c.blk && c.blk.share > 0 ? c.blk.share : 0;
    const blkMult = blkShare > 0 ? (p.sea ? 1 - blkShare * 0.75 : 1 - blkShare * 0.3) : 1;
    if (blkShare > 0.02) causes.push("Maritime blockade (" + Math.round(blkShare * 100) + "% ports)");

    const rawAccess = infraRatio * distMult * occPenalty * blkMult;
    const marketAccess = clamp(r2(rawAccess), 0.15, 1);
    if (!causes.length) causes.push("Full network & corridor throughput (100%)");

    p.infra = {
      baseCapacity: baseCap,
      railBonus,
      usageLoad,
      netInfra,
      marketAccess,
    };
    p._causes = causes;

    const weight = Math.max(1, p.pop || 1);
    const bucket = (accSum[p.o] ||= { w: 0, s: 0 });
    bucket.w += weight;
    bucket.s += marketAccess * weight;
  }

  for (const tag of Object.keys(G.c)) {
    const c = G.c[tag];
    if (!c || !c.alive) continue;
    const b = accSum[tag];
    const provAvg = b && b.w > 0 ? b.s / b.w : 1;
    const blkShare = c.blk && c.blk.share > 0 ? c.blk.share : 0;
    const seaFactor = blkShare > 0 ? 1 - blkShare * 0.85 : 1;
    c.access = clamp(r2(Math.min(provAvg, seaFactor)), 0.15, 1);
  }
}

function syncTradeRoutesFromLegacy(): TradeRoute[] {
  const routes: TradeRoute[] = Array.isArray(G.tradeRoutes) ? G.tradeRoutes.slice() : [];
  const valid: TradeRoute[] = [];
  const byBuyerGood = new Set<string>();

  for (const r of routes) {
    if (!r || !r.seller || !r.buyer || !r.good || r.until <= G.t) continue;
    const key = r.buyer + "|" + r.seller + "|" + r.good;
    if (byBuyerGood.has(key)) continue;
    byBuyerGood.add(key);
    valid.push(r);
  }

  for (const tag of Object.keys(G.c).sort()) {
    const c = G.c[tag];
    const cr = c?.commercialRoute;
    if (!c?.alive || !cr || !cr.seller || !cr.good || cr.until <= G.t) continue;
    const key = tag + "|" + cr.seller + "|" + cr.good;
    if (!byBuyerGood.has(key)) {
      byBuyerGood.add(key);
      valid.push({
        id: "tr-" + tag + "-" + cr.seller + "-" + cr.good,
        seller: cr.seller,
        buyer: tag,
        good: cr.good,
        until: cr.until,
        rights: Array.isArray(cr.rights) ? cr.rights.slice() : ["trade"],
        volumeCap: 20,
        tariffRate: 0,
      });
    } else {
      const match = valid.find((x) => x.buyer === tag && x.seller === cr.seller && x.good === cr.good);
      if (match && cr.until > match.until) match.until = cr.until;
    }
  }

  G.tradeRoutes = valid;
  return valid;
}

function stepTradeRoutesAndTariffs(
  supply: Record<string, Record<string, number>>,
  demand: Record<string, Record<string, number>>,
  exports: Record<string, Record<string, number>>,
  imports: Record<string, Record<string, number>>,
  warm?: boolean
): any[] {
  const routes = syncTradeRoutesFromLegacy();
  const receipts: any[] = [];
  if (warm) return receipts;

  for (const route of routes) {
    const buyer = G.c[route.buyer];
    const seller = G.c[route.seller];
    if (
      !buyer?.alive ||
      !seller?.alive ||
      !supply[buyer.tag] ||
      !supply[seller.tag] ||
      route.until <= G.t ||
      atWarWith(buyer, seller)
    ) {
      continue;
    }
    const depots = sum(provsOf(buyer.tag), (p) => (p.ctl === buyer.tag ? bxl(p, "depot") : 0));
    if (!depots) continue;
    const g = route.good;
    const a = seller.tag;
    const b = buyer.tag;
    const sellerAcc = Math.max(0.15, seller.access ?? 1);
    const buyerAcc = Math.max(0.15, buyer.access ?? 1);
    const surplus = Math.max(0, (supply[a][g] || 0) * sellerAcc - (demand[a][g] || 0) - (exports[a][g] || 0));
    const shortage = Math.max(0, (demand[b][g] || 0) - (supply[b][g] || 0) * buyerAcc - (imports[b][g] || 0));
    const price = G.price[g] || GOODS[g]?.p || 1;
    const serviceRate = price * 0.05;
    const capPerDepot = route.volumeCap > 0 ? route.volumeCap : 20;
    const quantity = Math.min(
      surplus,
      shortage,
      capPerDepot * depots * buyerAcc,
      Math.max(0, buyer.tr) / Math.max(serviceRate, 1e-9)
    );
    if (quantity <= 0) continue;
    exports[a][g] = (exports[a][g] || 0) + quantity;
    imports[b][g] = (imports[b][g] || 0) + quantity;
    const fee = quantity * serviceRate;
    buyer.tr -= fee;
    seller.tr += fee;
    receipts.push({ seller: a, buyer: b, good: g, quantity, value: quantity * price, fee });
  }
  return receipts;
}

function stepDynamicMarketPrices(
  TS: Record<string, number>,
  TD: Record<string, number>,
  _warm?: boolean
): void {
  if (!G.tight) G.tight = {};
  if (!G.marketGoods) G.marketGoods = {};

  for (const g of GK) {
    const s = TS[g] || 0;
    const d = TD[g] || 0;
    const base = GOODS[g]?.p || 1;
    const minP = base * 0.25;
    const maxP = base * 1.75;
    G.pricePrev[g] = clamp(G.price[g] || base, minP, maxP);
    if (s + d > 0) {
      const ex = clamp((d - s) / Math.max(s, d), -1, 1);
      let fl = minP;
      const R = RECIPE[g];
      if (R) {
        let ci = 0;
        for (const x in R.I) ci += R.I[x] * (G.price[x] || GOODS[x]?.p || 1);
        fl = clamp(Math.max(fl, (1.02 * ci) / Math.max(0.01, R.O)), minP, maxP);
      }
      G.price[g] = clamp(G.price[g] * (1 + 0.04 * ex), fl, maxP);
      G.tight[g] = (G.tight[g] || 1) * 0.9 + 0.1 * (s > 0 ? d / s : 1.5);
    } else {
      G.price[g] = clamp(G.price[g] || base, minP, maxP);
    }
    G.marketGoods[g] = {
      good: g,
      basePrice: base,
      price: G.price[g],
      prevPrice: G.pricePrev[g],
      supply: s,
      demand: d,
      tightness: G.tight[g] || 1,
    };
  }
}

function stepInvestmentPoolSync(spentByTag?: Record<string, number>): void {
  for (const tag of Object.keys(G.c)) {
    const c = G.c[tag];
    if (!c || !c.alive) continue;
    const eff = typeof creditInvestmentFactor === "function" ? creditInvestmentFactor(c) : 1;
    const contrib = Number.isFinite(c.capPool) ? c.capPool : 0;
    const spent = spentByTag && Number.isFinite(spentByTag[tag]) ? spentByTag[tag] : 0;
    c.investmentPool = {
      balance: Number.isFinite(c.inv) ? c.inv : 0,
      monthlyContribution: contrib,
      monthlySpent: spent,
      reinvestEfficiency: clamp(eff, 0.2, 2),
    };
  }
}

function stepConstructionQueue(warm?: boolean): void {
  if (warm) return;
  for (const tag of Object.keys(G.c)) {
    const c = G.c[tag];
    if (!c || !c.alive) continue;
    if (c.bq && typeof bqMonth === "function") bqMonth(c);
  }
  G._bqDoneMonth = G.t;
  const invBefore: Record<string, number> = {};
  for (const tag of Object.keys(G.c)) {
    const c = G.c[tag];
    if (c && c.alive) invBefore[tag] = c.inv || 0;
  }
  investMonth();
  const spentByTag: Record<string, number> = {};
  for (const tag of Object.keys(G.c)) {
    const c = G.c[tag];
    if (!c || !c.alive) continue;
    spentByTag[tag] = Math.max(0, (invBefore[tag] || 0) - (c.inv || 0));
  }
  for (const p of G.plist) {
    if (!p.build || !p.build.length) continue;
    for (const b of p.build) {
      if (b && b.left && typeof costOf === "function") {
        const tot = Object.values(costOf(b)).reduce((s: number, x: number) => s + (x || 0), 0);
        const rem = Object.values(b.left as Record<string, number>).reduce(
          (s: number, x: number) => s + Math.max(0, x || 0),
          0
        );
        b.requiredPoints = Math.max(1, Math.round(tot));
        b.progressPoints = Math.max(0, Math.round(tot - rem));
      }
    }
  }
  stepInvestmentPoolSync(spentByTag);
}

function updatePhaseOneMirrors(): void {
  for (const tag of Object.keys(G.c)) {
    const c = G.c[tag];
    if (!c || !c.alive) continue;
    let milW = 0;
    let popW = 0;
    for (const p of provsOf(tag)) {
      for (const q of p.pops) {
        milW += (q.mil || 0) * (q.n || 0);
        popW += q.n || 0;
      }
    }
    const avgMil = popW > 0 ? milW / popW : 0;
    if (!c.politics || typeof c.politics !== "object") {
      c.politics = {
        legitimacy: 65,
        radicalismPct: 10,
        loyalismPct: 15,
        enactingLaw: null,
        enactmentProgress: 0,
      };
    }
    c.politics.radicalismPct = Math.round(clamp(avgMil * 10, 0, 100) * 10) / 10;
    c.techState = {
      activeId: c.res || null,
      progress: c.rp || 0,
      queue: Array.isArray(c.resQ) ? c.resQ.slice() : [],
      monthlyGain: c.techState?.monthlyGain || 0,
    };
  }
  if (typeof syncInitialEngineState === "function") {
    syncInitialEngineState(G);
  }
}

function runMonthlyTick(): void {
  if (G.card && (typeof UI === "undefined" || !G.player || G.c[G.player]?.ai)) {
    cardDefault();
  }
  purgeWars();
  // 1. Infrastructure & Market Access
  stepInfrastructureAndAccess(false);
  // 2–6. Production, Input Shortages, Trade Routes & Tariffs, Dynamic Market Prices, Wages/Taxes/Investment Pool & Construction Queue
  econMonth(false);
  // 7–10. Needs/SoL/Militancy, Politics/Events/Decisions, Research/Modernization, Diplomacy/War
  socMonth();
  researchMonth();
  modMonth();
  polMonth();
  eventsMonth();
  gwMonth();
  decMonth();
  diploMonth();
  if (G.c.GBR?.indiaConcessionUntil > G.t) {
    for (const p of governedIndia(G.c.GBR)) {
      for (const group of p.pops) group.mil = Math.max(0, group.mil - 0.1);
    }
  }
  if (G.t % 6 === 0) {
    for (const tag in G.c) {
      const c = G.c[tag];
      if (!c.alive) continue;
      let r = 0;
      for (const t in c.rel) {
        if (c.rel[t] < -30 && G.c[t]?.alive) {
          r = Math.max(r, sum(G.armies.filter((a: any) => a.o === t && !a.naval && !a.reb), strength));
        }
      }
      c.rivalStr = r;
    }
  }
  thMonth();
  for (const tag in G.c) {
    const c = G.c[tag];
    if (c.alive && c.ai) {
      aiNavy(c);
      aiMob(c);
      if (G.t % 2 === 0) aiRecruit(c);
      aiBld(c);
    }
  }
  armyMonth();
  aiMonth();
  progMonth();
  if (G.t % 12 === 6) acceptCultures();
  if (G.t % 12 === 0) histYear();
  stepInfrastructureAndAccess(true);
  updatePhaseOneMirrors();
  roundHouseholdState();
  G.t++;
}

function computeCausalBreakdown(c: CountryRecord, kind: string, refId?: string): CausalBreakdown {
  if (kind === "price") {
    const g = refId && GOODS[refId] ? refId : "grain";
    const base = GOODS[g].p;
    const price = G.price[g] ?? base;
    const prev = G.pricePrev?.[g] ?? price;
    const mg = G.marketGoods?.[g];
    const ratio = price / base;
    const chg = prev > 0 ? (price / prev - 1) * 100 : 0;
    const fill = c.fill?.[g] ?? 1;
    const imp = c.impSh?.[g] ?? 0;
    const s = mg?.supply ?? 0;
    const d = mg?.demand ?? 0;
    const causes: CausalCause[] = [
      {
        label: "World supply vs demand",
        delta: `${Math.round(s).toLocaleString("en-US")} supplied / ${Math.round(d).toLocaleString("en-US")} needed`,
        tone: d > s * 1.03 ? "bad" : s > d * 1.03 ? "good" : "neutral",
      },
      {
        label: "Domestic fill & imports",
        delta: `${pct(fill)} filled · ${pct(imp)} imported`,
        tone: fill < 0.9 ? "bad" : "good",
      },
      {
        label: "Price band guardrail",
        delta: `£${(base * 0.25).toFixed(2)} – £${(base * 1.75).toFixed(2)} (0.25x–1.75x)`,
        tone: ratio >= 1.65 || ratio <= 0.35 ? "bad" : "neutral",
      },
    ];
    return {
      title: GOODS[g].n + " price",
      value: "£" + price.toFixed(2),
      subtitle: `${ratio >= 1 ? "+" : "−"}${Math.abs(Math.round((ratio - 1) * 100))}% vs 1836 (${chg >= 0 ? "+" : ""}${chg.toFixed(1)}% this month)`,
      causes,
      note: "World prices adjust smoothly toward balance each month and stay strictly bounded between 0.25x and 1.75x of the 1836 base price.",
      action: ["eco", "Open Economy"],
    };
  }

  if (kind === "access") {
    const p = refId && G.prov?.[refId] ? G.prov[refId] : G.prov?.[c.cap];
    if (p && p.infra) {
      const inf = p.infra;
      const net = inf.netInfra;
      const causes: CausalCause[] = [
        {
          label: "Infrastructure balance",
          delta: `Cap ${Math.round(inf.baseCapacity + inf.railBonus)} − Load ${Math.round(inf.usageLoad)} (${net >= 0 ? "+" : "−"}${Math.abs(Math.round(net))})`,
          tone: net < 0 ? "bad" : "good",
        },
        {
          label: "Corridor & control",
          delta: p.ctl !== p.o ? "Occupied by " + nameOf(p.ctl || "") : (p._causes && p._causes[0]) || "Connected to capital",
          tone: p.ctl !== p.o ? "bad" : "good",
        },
        {
          label: "Blockade & 15% floor",
          delta: `Ports blockaded ${pct(c.blk?.share || 0)} · min floor 15%`,
          tone: (c.blk?.share || 0) > 0.05 ? "bad" : "neutral",
        },
      ];
      return {
        title: p.n + " market access",
        value: pct(inf.marketAccess),
        subtitle: "Share of provincial output and trade able to clear without congestion.",
        causes,
        note: "Build railways or freight depots to expand capacity. Market access never drops below 15%, preventing total economic deadlocks.",
        action: ["works", "Open Works"],
      };
    }
    const acc = clamp(c.access ?? 1, 0.15, 1);
    return {
      title: "National market access",
      value: pct(acc),
      subtitle: "Population-weighted market access across your provinces.",
      causes: [
        { label: "Blockade pressure", delta: pct(c.blk?.share || 0) + " ports blockaded", tone: (c.blk?.share || 0) > 0.05 ? "bad" : "good" },
        { label: "Minimum access floor", delta: "15% guaranteed", tone: "neutral" },
      ],
      note: "Railways and naval escorts lift market access.",
      action: ["eco", "Open Economy"],
    };
  }

  // Default: "net" -> Treasury Balance causal breakdown
  const st = c.stat || {};
  const net = st.net || 0;
  const inc = (st.taxes || 0) + (st.tariffs || 0);
  const exp = (st.pay || 0) + (st.gov || 0) + (st.interest || 0);
  const causes: CausalCause[] = [
    {
      label: "Tax & tariff intake",
      delta: `+${money(inc)} (${pct(c.eff?.tax || 0)} collection)`,
      tone: "good",
    },
    {
      label: "Pay, supplies & debt interest",
      delta: `−${money(exp)} (interest ${money(st.interest || 0)})`,
      tone: exp > inc ? "bad" : "neutral",
    },
    {
      label: "Treasury & private investment",
      delta: `Cash ${moneyS(c.tr)} · Pool ${money(c.investmentPool?.balance ?? c.inv ?? 0)}`,
      tone: c.tr < 0 ? "bad" : "good",
    },
  ];
  return {
    title: "Treasury balance",
    value: (net < 0 ? "−" : "+") + money(Math.abs(net)) + "/mo",
    subtitle: "Monthly net state cash flow at current tax and spending sliders.",
    causes,
    note: `Spending: education ${pct(c.sp?.edu || 0)}, admin ${pct(c.sp?.adm || 0)}, social ${pct(c.sp?.soc || 0)}, military ${pct(c.sp?.mil || 0)}.`,
    action: ["nat", "Open the budget"],
  };
}
