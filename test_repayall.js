"use strict";
/* A12: repay all loans. execCommand kind "repayall" pays min(debt, treasury) at once; refuses when nothing is owed or nothing can be paid.
 * Player (applyCampaignCommand) and AI (aiOrder) must follow the same rule. */
const assert = require("node:assert/strict");
const L = require("./tools/a0_lib");

let failed = 0;
const check = (ok, text) => { if (ok) console.log("ok   " + text); else { failed++; console.log("FAIL " + text); } };
const API_EXTRA = `;globalThis.API.X={execCommand,aiOrder,applyCampaignCommand,issueCampaignCommand,G:()=>G};`;
const fresh = (seat) => { const A = L.loadEngine(API_EXTRA); A.newGame(null, 7); A.getG().player = seat || null; return A; };
const setDebt = (A, tag, debt, tr) => { const c = A.getG().c[tag]; c.debt = debt; c.tr = tr; return c; };
const state = c => [c.debt, c.tr];

/* 1. full repay: treasury covers the debt */
{
 const A = fresh("GBR"), c = setDebt(A, "GBR", 400, 1000);
 const r = A.X.applyCampaignCommand({ ...A.X.issueCampaignCommand(), kind: "repayall" });
 check(r.ok && r.paid === 400, "full repay: accepted and pays the whole debt (paid " + r.paid + ")");
 check(c.debt === 0 && c.tr === 600, "full repay: debt 0, treasury 600 (got debt " + c.debt + ", tr " + c.tr + ")");
}

/* 2. partial repay: treasury is smaller than the debt */
{
 const A = fresh("GBR"), c = setDebt(A, "GBR", 400, 150);
 const r = A.X.applyCampaignCommand({ ...A.X.issueCampaignCommand(), kind: "repayall" });
 check(r.ok && r.paid === 150, "partial repay: pays the whole treasury (paid " + r.paid + ")");
 check(c.debt === 250 && c.tr === 0, "partial repay: debt 250, treasury 0 (got debt " + c.debt + ", tr " + c.tr + ")");
 check(/remains/.test(r.txt), "partial repay: message says what remains");
}

/* 3. refusal at zero debt changes nothing */
{
 const A = fresh("GBR"), c = setDebt(A, "GBR", 0, 500);
 const before = state(c);
 const r = A.X.applyCampaignCommand({ ...A.X.issueCampaignCommand(), kind: "repayall" });
 check(!r.ok && /owe nothing/.test(r.why), "zero debt: refused in plain English (" + r.why + ")");
 check(JSON.stringify(state(c)) === JSON.stringify(before), "zero debt: state unchanged");
}

/* 4. refusal with an empty treasury changes nothing */
{
 const A = fresh("GBR"), c = setDebt(A, "GBR", 300, 0);
 const r = A.X.applyCampaignCommand({ ...A.X.issueCampaignCommand(), kind: "repayall" });
 check(!r.ok && /treasury is empty/.test(r.why), "empty treasury: refused in plain English (" + r.why + ")");
 check(c.debt === 300 && c.tr === 0, "empty treasury: state unchanged");
}

/* 5. AI path through execCommand: same rule, same result as the human path */
{
 const human = fresh("GBR"), ai = fresh(null);
 setDebt(human, "GBR", 400, 1000);
 const ca = setDebt(ai, "GBR", 400, 1000);
 const rh = human.X.applyCampaignCommand({ ...human.X.issueCampaignCommand(), kind: "repayall" });
 const ra = ai.X.aiOrder(ca, { ...ai.X.issueCampaignCommand(), kind: "repayall" });
 check(rh.ok && ra.ok, "AI path: accepted by aiOrder as well as the human path");
 check(JSON.stringify(state(ca)) === JSON.stringify(state(human.getG().c.GBR)), "AI path: identical debt and treasury to the human path");
 const rz = ai.X.aiOrder(ca, { ...ai.X.issueCampaignCommand(), kind: "repayall" });
 check(!rz.ok, "AI path: second order refused at zero debt");
}

/* 6. other nations: the rule is the same for every tag */
{
 const A = fresh("GBR"), c = setDebt(A, "FRA", 90, 40);
 const r = A.X.execCommand("FRA", { ...A.X.issueCampaignCommand(), kind: "repayall" }, { auto: true });
 check(r.ok && c.debt === 50 && c.tr === 0, "other nation (FRA): same partial rule");
}

console.log(failed ? failed + " failed" : "all passed");
if (failed) process.exit(1);
