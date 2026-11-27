import type {
  CalendarDateState,
  InitialEngineState,
  InitialEngineStateOptions,
} from "./types";

export const ENGINE_START_YEAR = 1836;
export const ENGINE_MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
] as const;

export const DAYS_IN_MONTH = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31] as const;

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year: number, monthIndex: number): number {
  if (monthIndex === 1 && isLeapYear(year)) return 29;
  return DAYS_IN_MONTH[monthIndex] || 30;
}

export function getCalendarDateState(
  totalDays: number = 0,
  startYear: number = ENGINE_START_YEAR
): CalendarDateState {
  const safeDays = Number.isFinite(totalDays) ? Math.max(0, Math.floor(totalDays)) : 0;
  const baseYear = Number.isFinite(startYear) ? Math.floor(startYear) : ENGINE_START_YEAR;
  let year = baseYear;
  let remainingDays = safeDays;

  while (true) {
    const daysInThisYear = isLeapYear(year) ? 366 : 365;
    if (remainingDays >= daysInThisYear) {
      remainingDays -= daysInThisYear;
      year++;
    } else {
      break;
    }
  }

  let monthIndex = 0;
  for (let m = 0; m < 12; m++) {
    const dim = getDaysInMonth(year, m);
    if (remainingDays >= dim) {
      remainingDays -= dim;
      monthIndex++;
    } else {
      break;
    }
  }

  const day = remainingDays + 1;
  const month = monthIndex + 1;
  const monthName = ENGINE_MONTH_NAMES[monthIndex] || "January";

  return {
    t: safeDays,
    startYear: baseYear,
    year,
    month,
    day,
    monthIndex,
    monthName,
    dateLabel: `${day} ${monthName} ${year}`,
  };
}

export function createInitialEngineState(
  options: InitialEngineStateOptions = {}
): InitialEngineState {
  const startYear = Number.isFinite(options.startYear)
    ? Math.floor(options.startYear as number)
    : ENGINE_START_YEAR;
  const tick = Number.isFinite(options.t) ? Math.max(0, Math.floor(options.t as number)) : 0;
  const cal = getCalendarDateState(tick, startYear);

  const worldNats =
    typeof WORLD !== "undefined" && WORLD && Array.isArray(WORLD.nats)
      ? WORLD.nats
      : null;
  const fallbackNat = worldNats && worldNats.length ? worldNats[0] : null;
  const tag =
    (options.countryTag && String(options.countryTag).trim()) ||
    (fallbackNat && fallbackNat.tag) ||
    "GBR";
  const natDef = worldNats ? worldNats.find((n: any) => n.tag === tag) : null;
  const countryName =
    (options.countryName && String(options.countryName).trim()) ||
    (natDef && natDef.n) ||
    "United Kingdom";

  const rawTreasury =
    options.startingTreasury !== undefined && Number.isFinite(options.startingTreasury)
      ? Math.max(0, Number(options.startingTreasury))
      : 1000;

  return {
    countryTag: tag,
    countryName,
    startingTreasury: rawTreasury,
    treasury: rawTreasury,
    netMonthlyBalance: 0,
    ...cal,
  };
}

export function syncInitialEngineState(
  g: any = typeof G !== "undefined" ? G : null,
  playerTag?: string | null
): any {
  if (!g || !g.c) return g;
  if (!Number.isFinite(g.startYear)) g.startYear = ENGINE_START_YEAR;

  const cal = getCalendarDateState(g.t || 0, g.startYear);

  for (const tag of Object.keys(g.c)) {
    const c = g.c[tag];
    if (!c) continue;
    if (!Number.isFinite(c.startingTreasury) || (g.t === 0 && (!Number.isFinite(c.startingTreasury) || c.startingTreasury === 0))) {
      c.startingTreasury = Number.isFinite(c.tr) ? c.tr : 0;
    }
  }

  const activeTag =
    playerTag !== undefined ? playerTag : typeof g.player === "string" ? g.player : null;
  const c = activeTag && g.c[activeTag] ? g.c[activeTag] : null;

  if (c) {
    g._playerState = {
      countryTag: c.tag,
      countryName: String(c.n || c.tag),
      startingTreasury: Number.isFinite(c.startingTreasury) ? c.startingTreasury : c.tr || 0,
      treasury: Number.isFinite(c.tr) ? c.tr : 0,
      netMonthlyBalance: Number.isFinite(c.stat?.net) ? c.stat.net : 0,
      ...cal,
    };
  } else {
    g._playerState = null;
  }

  return g;
}

export function getPlayerEngineState(
  g: any = typeof G !== "undefined" ? G : null
): InitialEngineState | null {
  if (!g || !g.c) return null;
  syncInitialEngineState(g);
  return (g._playerState as InitialEngineState) || null;
}

export function setStartingTreasury(
  g: any,
  amount: number,
  tag?: string | null
): number {
  const targetGame = g || (typeof G !== "undefined" ? G : null);
  const safeAmount = Number.isFinite(amount) ? Math.max(0, Number(amount)) : 0;
  const targetTag = tag || targetGame?.player;
  const country = targetTag && targetGame?.c ? targetGame.c[targetTag] : null;
  if (!country) return safeAmount;
  country.startingTreasury = safeAmount;
  country.tr = safeAmount;
  syncInitialEngineState(targetGame, targetTag);
  return safeAmount;
}

export function renameCountryState(
  g: any,
  countryName: string,
  tag?: string | null
): string {
  const targetGame = g || (typeof G !== "undefined" ? G : null);
  const cleanName = String(countryName || "").trim();
  const targetTag = tag || targetGame?.player;
  const country = targetTag && targetGame?.c ? targetGame.c[targetTag] : null;
  if (!country) return cleanName;
  if (cleanName) country.n = cleanName;
  syncInitialEngineState(targetGame, targetTag);
  return String(country.n || "");
}

export function advanceEngineDate(
  state: InitialEngineState,
  months: number = 1
): InitialEngineState {
  const delta = Number.isFinite(months) ? Math.max(0, Math.floor(months)) : 1;
  const nextCal = getCalendarDateState(state.t + delta, state.startYear);
  return {
    ...state,
    ...nextCal,
  };
}

export function advanceGameMonth(
  g: any = typeof G !== "undefined" ? G : null
): number {
  if (!g) return 0;
  g.t = (g.t || 0) + 1;
  syncInitialEngineState(g);
  return g.t;
}

