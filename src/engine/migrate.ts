import type {
  InfraState,
  InvestmentPoolState,
  MarketGoodState,
  PoliticsState,
  TechState,
  TradeRoute,
} from "./types";

const PRICE_MIN_MULT = 0.25;
const PRICE_MAX_MULT = 1.75;
const SHORTAGE_FLOOR = 0.15;
const MARKET_ACCESS_FLOOR = 0.15;

function clampPriceToBand(g: string, val: number): number {
  const base = GOODS[g]?.p || 1;
  const raw = Number.isFinite(val) ? val : base;
  return clamp(raw, base * PRICE_MIN_MULT, base * PRICE_MAX_MULT);
}

function defaultInfraForProvince(p: ProvinceRecord): InfraState {
  const existing = p.infra as Partial<InfraState> | undefined;
  const baseCap =
    existing && Number.isFinite(existing.baseCapacity)
      ? (existing.baseCapacity as number)
      : Math.round(
          (TERRAIN[p.t]?.sup || 6) * 2 +
            Math.min(28, Math.sqrt(Math.max(1, p.pop || 0)) * 0.65) +
            (p.sea ? 4 : 0)
        );
  const railBonus =
    existing && Number.isFinite(existing.railBonus)
      ? (existing.railBonus as number)
      : (p.rail || 0) * 14 +
        (typeof bxl === "function" ? bxl(p, "depot") * 10 + bxl(p, "harbour") * 6 : 0);
  const facLv = Array.isArray(p.factories)
    ? p.factories.reduce((s: number, f: any) => s + Math.max(0, f.lv || 0), 0)
    : 0;
  const usageLoad =
    existing && Number.isFinite(existing.usageLoad)
      ? (existing.usageLoad as number)
      : Math.round((facLv * 3.5 + (p.mine ? 3 : 0) + Math.min(20, (p.pop || 0) / 450)) * 100) / 100;
  const netInfra =
    existing && Number.isFinite(existing.netInfra)
      ? (existing.netInfra as number)
      : Math.round((baseCap + railBonus - usageLoad) * 100) / 100;
  const access =
    existing && Number.isFinite(existing.marketAccess)
      ? clamp(existing.marketAccess as number, MARKET_ACCESS_FLOOR, 1)
      : 1;
  return {
    baseCapacity: baseCap,
    railBonus,
    usageLoad,
    netInfra,
    marketAccess: access,
  };
}

function hydrateProvince(p: ProvinceRecord): void {
  if (!p) return;
  if (!p.infra || typeof p.infra !== "object") {
    p.infra = defaultInfraForProvince(p);
  } else {
    p.infra.marketAccess = clamp(
      Number.isFinite(p.infra.marketAccess) ? p.infra.marketAccess : 1,
      MARKET_ACCESS_FLOOR,
      1
    );
  }
  if (Array.isArray(p.build)) {
    for (const b of p.build) {
      if (b && b.left && typeof costOf === "function") {
        const tot = Object.values(costOf(b)).reduce((s: number, x: number) => s + (x || 0), 0);
        const rem = Object.values(b.left as Record<string, number>).reduce(
          (s: number, x: number) => s + Math.max(0, x || 0),
          0
        );
        if (b.requiredPoints == null) b.requiredPoints = Math.max(1, Math.round(tot));
        if (b.progressPoints == null) b.progressPoints = Math.max(0, Math.round(tot - rem));
      }
    }
  }
}

function hydrateCountry(c: CountryRecord): void {
  if (!c) return;
  c.access = clamp(Number.isFinite(c.access) ? (c.access as number) : 1, MARKET_ACCESS_FLOOR, 1);

  const invBal = Number.isFinite(c.inv) ? c.inv : 0;
  const curPool = c.investmentPool as Partial<InvestmentPoolState> | undefined;
  c.investmentPool = {
    balance: curPool && Number.isFinite(curPool.balance) ? (curPool.balance as number) : invBal,
    monthlyContribution:
      curPool && Number.isFinite(curPool.monthlyContribution)
        ? (curPool.monthlyContribution as number)
        : Number.isFinite(c.capPool)
        ? c.capPool
        : 0,
    monthlySpent:
      curPool && Number.isFinite(curPool.monthlySpent) ? (curPool.monthlySpent as number) : 0,
    reinvestEfficiency:
      curPool && Number.isFinite(curPool.reinvestEfficiency)
        ? (curPool.reinvestEfficiency as number)
        : 1,
  };

  const curPol = c.politics as Partial<PoliticsState> | undefined;
  c.politics = {
    legitimacy:
      curPol && Number.isFinite(curPol.legitimacy)
        ? clamp(curPol.legitimacy as number, 0, 100)
        : c.gov === "abs"
        ? 75
        : 65,
    radicalismPct:
      curPol && Number.isFinite(curPol.radicalismPct)
        ? clamp(curPol.radicalismPct as number, 0, 100)
        : 10,
    loyalismPct:
      curPol && Number.isFinite(curPol.loyalismPct)
        ? clamp(curPol.loyalismPct as number, 0, 100)
        : 15,
    enactingLaw: curPol && curPol.enactingLaw ? curPol.enactingLaw : null,
    enactmentProgress:
      curPol && Number.isFinite(curPol.enactmentProgress) ? (curPol.enactmentProgress as number) : 0,
  };

  const curTech = c.techState as Partial<TechState> | undefined;
  c.techState = {
    activeId: curTech && curTech.activeId !== undefined ? curTech.activeId : c.res || null,
    progress: curTech && Number.isFinite(curTech.progress) ? (curTech.progress as number) : c.rp || 0,
    queue: Array.isArray(curTech?.queue)
      ? curTech!.queue.slice()
      : Array.isArray(c.resQ)
      ? c.resQ.slice()
      : [],
    monthlyGain:
      curTech && Number.isFinite(curTech.monthlyGain) ? (curTech.monthlyGain as number) : 0,
  };
}

function migrateGameState(g: any): any {
  if (!g || !g.prov || !g.c) return g;

  g.plist = Array.isArray(g.plist) && g.plist.length ? g.plist : WORLD.provs.map((w: any) => g.prov[w.id]);

  // Clamp market prices strictly to [0.25x, 1.75x] and hydrate marketGoods cleanly.
  if (!g.marketGoods || typeof g.marketGoods !== "object") g.marketGoods = {};
  for (const k of GK) {
    const base = GOODS[k]?.p || 1;
    const p = clampPriceToBand(k, g.price?.[k] ?? base);
    const prev = clampPriceToBand(k, g.pricePrev?.[k] ?? p);
    if (g.price) g.price[k] = p;
    if (g.pricePrev) g.pricePrev[k] = prev;
    const existing = g.marketGoods[k] as Partial<MarketGoodState> | undefined;
    g.marketGoods[k] = {
      good: k,
      basePrice: base,
      price: p,
      prevPrice: prev,
      supply: existing && Number.isFinite(existing.supply) ? (existing.supply as number) : 0,
      demand: existing && Number.isFinite(existing.demand) ? (existing.demand as number) : 0,
      tightness:
        existing && Number.isFinite(existing.tightness)
          ? (existing.tightness as number)
          : g.tight && Number.isFinite(g.tight[k])
          ? g.tight[k]
          : 1,
    };
  }

  for (const p of g.plist) hydrateProvince(p);
  for (const tag of Object.keys(g.c)) hydrateCountry(g.c[tag]);

  // Hydrate multi-route G.tradeRoutes from legacy c.commercialRoute if absent.
  if (!Array.isArray(g.tradeRoutes)) {
    const routes: TradeRoute[] = [];
    for (const tag of Object.keys(g.c).sort()) {
      const cn = g.c[tag];
      const cr = cn?.commercialRoute;
      if (cn?.alive && cr && cr.seller && cr.good && cr.until > g.t) {
        routes.push({
          id: "tr-" + tag + "-" + cr.seller + "-" + cr.good,
          seller: cr.seller,
          buyer: tag,
          good: cr.good,
          until: cr.until,
          rights: Array.isArray(cr.rights) ? cr.rights.slice() : ["trade"],
          volumeCap: 20,
          tariffRate: 0,
        });
      }
    }
    g.tradeRoutes = routes;
  }

  if (typeof syncInitialEngineState === "function") {
    syncInitialEngineState(g);
  }
  return g;
}
