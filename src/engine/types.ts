export interface InfraState {
  baseCapacity: number;
  railBonus: number;
  usageLoad: number;
  netInfra: number;
  marketAccess: number; // Strictly clamped [0.15, 1.00]
}

export interface TradeRoute {
  id: string;
  seller: string;
  buyer: string;
  good: string;
  until: number;
  rights: string[];
  volumeCap: number;
  tariffRate: number;
}

export interface MarketGoodState {
  good: string;
  basePrice: number;
  price: number;        // Strictly clamped [0.25x, 1.75x] basePrice
  prevPrice: number;
  supply: number;
  demand: number;
  tightness: number;
}

export interface InvestmentPoolState {
  balance: number;
  monthlyContribution: number;
  monthlySpent: number;
  reinvestEfficiency: number;
}

export interface PoliticsState {
  legitimacy: number;      // 0..100
  radicalismPct: number;   // 0..100
  loyalismPct: number;     // 0..100
  enactingLaw: string | null;
  enactmentProgress: number;
}

export interface TechState {
  activeId: string | null;
  progress: number;
  queue: string[];
  monthlyGain: number;
}

export interface CausalCause {
  label: string;
  delta: string;
  tone: "good" | "bad" | "neutral";
}

export interface CausalBreakdown {
  title: string;
  value: string;
  subtitle: string;
  causes: CausalCause[];
  note: string;
  action?: [string, string];
}

export interface CalendarDateState {
  t: number;
  startYear: number;
  year: number;
  month: number; // 1..12
  day: number;   // 1..31
  monthIndex: number; // 0..11
  monthName: string;
  dateLabel: string;
}

export interface InitialEngineStateOptions {
  countryTag?: string;
  countryName?: string;
  startingTreasury?: number;
  startYear?: number;
  t?: number;
}

export interface InitialEngineState extends CalendarDateState {
  countryTag: string;
  countryName: string;
  startingTreasury: number;
  treasury: number;
  netMonthlyBalance: number;
}

export interface State extends InitialEngineState {
  rank: number;
  rankIndex: number;
  prestige: number;
}

export interface EngineProvinceState {
  id: string;
  n: string;
  o: string | null;
  ctl: string | null;
  infra: InfraState;
  _causes?: string[];
}

export interface EngineCountryState {
  tag: string;
  n: string;
  tr: number;
  startingTreasury?: number;
  inv: number;
  access: number;
  investmentPool: InvestmentPoolState;
  politics: PoliticsState;
  techState: TechState;
}

export interface EngineGameState {
  t: number;
  startYear?: number;
  marketGoods: Record<string, MarketGoodState>;
  tradeRoutes: TradeRoute[];
  c: Record<string, EngineCountryState>;
  prov: Record<string, EngineProvinceState>;
  _playerState?: InitialEngineState | null;
}
