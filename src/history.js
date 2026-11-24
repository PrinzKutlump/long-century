"use strict";

/* Dispatch dates are historical anchors. The decisions and their effects are game abstractions. */
const HISTORY_DISPATCHES = [];
const historicalAdvice = {
 wichale(country){
  const relations=country.rel.SAR||0;
  return relations>=10&&country.tr>=incOf(country)
   ? {option:0, reason:"Italy is a valued partner and the treasury has a reserve."}
   : {option:1, reason:"The cabinet values freedom of action more than closer ties on these terms."};
 }
};

function historyDispatch(id, year, month, tag, title, situation, history, options, eligible = () => true, span = 24) {
 const date = (year - 1836) * 12 + month - 1;
 const build = () => ({title, txt:situation, history, opts:options.map(([label, txt, effect], i) => ({
  k:String(i), label, txt,
  run() {
   const c = G.c[tag];
   if (c?.alive && eligible(c)) {
    effect(c);
    msg("politics", c.n + " · " + title + ": " + label + ".");
   } else {
    msg("politics", title + ": circumstances have changed and the decision no longer applies.");
   }
  }
 }))});
 HISTORY_DISPATCHES.push({id, year, tag, title, history, date, span, eligible, options});
 EVENTS.push({
  id, y:year, date, until:date+span, history, title,
  cond:() => alive(tag) && eligible(G.c[tag]),
  ch:{who:() => [tag], build},
  run() {
   const c = G.c[tag], decision = build();
   const advice=historicalAdvice[id]?.(c);
   const option=decision.opts[advice?.option??(c.tr<0?decision.opts.length-1:0)];
   option.run();
   if(advice)G.log.unshift({t:G.t,txt:c.n+" · "+option.label+". "+advice.reason});
  }
 });
}

function publicProgramme(months, prestige, research, militancy) {
 return c => {
  c.tr -= Math.round(incOf(c) * months);
  c.pres = Math.max(0, c.pres + prestige);
  c.rp += research;
  const capital = P(c.cap);
  if (capital?.o === c.tag) for (const q of capital.pops) q.mil = clamp(q.mil + militancy, 0, 10);
 };
}

function historicalRelations(other, change) {
 return c => {
  if (!alive(other)) return;
  c.rel[other] = clamp((c.rel[other] || 0) + change, -200, 200);
  G.c[other].rel[c.tag] = clamp((G.c[other].rel[c.tag] || 0) + change, -200, 200);
 };
}

const hd = historyDispatch;
const pp = publicProgramme;
const hr = historicalRelations;
const decisionTaken = (c, id) => (G.decDone?.[c.tag] || []).includes(id);

hd("chartism",1838,5,"GBR","The People's Charter","A mass movement demands a broader franchise and a more representative Parliament.",
 "The Charter was published in 1838. Parliament rejected the major Chartist petitions.",
 [["Hear the petitioners","Spend half a month’s revenue. Capital militancy falls by 1.",pp(.5,0,0,-1)],
  ["Reject the petition","Save the money. Capital militancy rises by 1.",pp(0,0,0,1)]]);

hd("belgianNeutrality",1839,4,"GBR","The Treaty of London","The powers are asked to recognize Belgian neutrality.",
 "The 1839 treaty recognized Belgian independence and neutrality.",
 [["Guarantee Belgium","Guarantee Belgian independence. Relations improve by 25.",c=>{
   c.guar = [...new Set([...(c.guar || []), "BEL"])];
   hr("BEL",25)(c);
  }],["Recognize without a guarantee","Improve relations by 10 with no guarantee.",hr("BEL",10)]],()=>alive("BEL"));

hd("tanzimatEdict",1839,11,"OTT","The Edict of Gülhane","Officials propose a programme of legal, fiscal and administrative reform.",
 "The 1839 edict inaugurated the Tanzimat reform era.",
 [["Back the reformers","Open the Tanzimat programme with momentum and the officials' support (the edict itself is a programme card on the Government page).",c=>{const s=c.prog&&c.prog.tanzimat;if(!s||s.done)return{ok:false,txt:"No programme to back."};s.momentum=clamp(s.momentum+10,0,100);s.support.bureaucrats=clamp((s.support.bureaucrats||50)+8,0,100);return{ok:true,txt:"The reformers have the Sultan's ear."};}],
  ["Defer implementation","Save the money. Lose 2 prestige.",pp(0,-2,0,0)]],c=>!!(c.prog&&c.prog.tanzimat&&c.prog.tanzimat.phase===0&&!c.prog.tanzimat.done));

hd("opiumCrisis",1839,6,"CHI","The Canton Trade Crisis","The Qing crackdown on the opium trade has brought a confrontation with Britain.",
 "The seizure and destruction of opium in 1839 preceded the First Opium War.",
 [["Hold to the prohibition","Relations with Britain fall by 30.",hr("GBR",-30)],
  ["Open trade talks","Relations with Britain rise by 15 at a cost of 2 prestige.",c=>{pp(0,-2,0,0)(c);hr("GBR",15)(c);}]],()=>alive("GBR"));

hd("oregon",1846,6,"USA","The Oregon Boundary","London and Washington can settle their overlapping claims by treaty.",
 "The 1846 Oregon Treaty extended the boundary along the 49th parallel to the Pacific region, with an exception for Vancouver Island.",
 [["Sign the compromise","British relations rise by 30.",hr("GBR",30)],
  ["Maintain the wider claim","Gain 2 prestige. British relations fall by 25.",c=>{pp(0,2,0,0)(c);hr("GBR",-25)(c);}]],()=>alive("GBR"));

hd("cornLawsDispatch",1846,6,"GBR","The Corn Laws","Parliament is divided over the duties on imported grain.",
 "Parliament enacted repeal in 1846, with duties phased out.",
 [["Repeal the Corn Laws","Switch to free trade and a 5% tariff. Workers are calmer and landowners more militant.",c=>takeDecision(c,"corn")],
  ["Keep tariff protection","Capital militancy rises by 0.5.",pp(0,0,0,.5)]],c=>!decisionTaken(c,"corn"));

hd("sonderbund",1847,11,"SWI","After the Sonderbund","The cantons must decide how to rebuild the confederation.",
 "The short Sonderbund War in 1847 preceded the Swiss federal constitution of 1848.",
 [["Fund federal institutions","Spend one month’s revenue. Gain 3 prestige and reduce capital militancy by 0.8.",pp(1,3,0,-.8)],
  ["Keep authority with the cantons","Preserve the treasury. Capital militancy rises by 0.5.",pp(0,0,0,.5)]]);

hd("secondRepublic",1848,2,"FRA","The February Revolution","The monarchy is losing its hold on Paris.",
 "Louis-Philippe abdicated in February 1848 and the Second Republic was proclaimed.",
 [["Proclaim a republic","Change government to a republic and reduce capital militancy by 1.",c=>{c.gov="dem";pp(0,0,0,-1)(c);}],
  ["Retain the crown","Keep the present government. Capital militancy rises by 1.5.",pp(0,0,0,1.5)]],c=>c.gov!=="dem");

hd("californiaGold",1849,1,"USA","California Gold Rush","The discovery of gold has drawn newcomers west. Settlements need public services.",
 "Gold was discovered at Sutter’s Mill in 1848. Large-scale migration followed in 1849.",
 [["Fund the new settlements","Spend one month’s revenue. Improve California's gold works where the map supports gold extraction.",c=>{
   pp(1,2,0,0)(c);const p=P("SFO");
   if(p?.o===c.tag && p.mine==="gold")p.minew=Math.min(3,(p.minew||0)+1);
  }],["Leave development to the prospectors","Keep the treasury intact.",pp(0,0,0,0)]],
 c=>provsOf(c.tag).some(p=>/California/i.test(p.n)));

hd("perry",1853,7,"JAP","Perry's Expedition","American ships demand access. The shogunate must decide whether to negotiate.",
 "Perry arrived in 1853. The Convention of Kanagawa followed in 1854.",
 [["Negotiate limited access","Improve American relations by 25 and gain 60 research progress.",c=>{hr("USA",25)(c);pp(0,0,60,0)(c);}],
  ["Refuse the demands","American relations fall by 25. Record the refusal for the next dispatch.",c=>{hr("USA",-25)(c);G.perryRefused=true;}]],()=>alive("USA"));

hd("perryReturn",1854,2,"JAP","The Return to Edo Bay","Washington renews pressure after the first demands were refused.",
 "Perry returned in 1854 and secured the Convention of Kanagawa.",
 [["Accept limited access","Improve American relations by 25. Lose 2 prestige.",c=>{hr("USA",25)(c);pp(0,-2,0,0)(c);}],
  ["Maintain the closed ports","American relations fall by a further 20.",hr("USA",-20)]],()=>alive("USA")&&G.perryRefused,30);

hd("kansasNebraska",1854,5,"USA","Kansas and Nebraska","Congress debates whether settlers should determine the status of slavery in new territories.",
 "The 1854 act repealed the Missouri Compromise restriction and intensified the sectional crisis.",
 [["Accept popular sovereignty","Capital militancy rises by 0.6.",pp(0,0,0,.6)],
  ["Oppose the bill","Lose 2 prestige. Capital militancy falls by 0.2.",pp(0,-2,0,-.2)]],c=>c.reforms.slavery<2);

hd("serfEmancipation",1861,3,"RUS","Emancipation of the Serfs","The crown must choose whether to fund the administrative work of rural reform.",
 "Alexander II promulgated emancipation in 1861. The terms imposed redemption payments and left many peasants with limited land.",
 [["Enact emancipation","Increase agricultural capacity by 10%. Peasants are calmer and nobles more militant.",c=>takeDecision(c,"serfs")],
  ["Leave settlement to landowners","Capital militancy rises by 0.8.",pp(0,0,0,.8)]],c=>!decisionTaken(c,"serfs"));

hd("selfStrengthening",1861,8,"CHI","Self-Strengthening","Officials seek funds for technical schools and industrial missions.",
 "The Self-Strengthening Movement began in the 1860s and pursued selective technological and industrial modernization.",
 [["Fund technical missions","Spend two months’ revenue for 160 research progress.",pp(2,0,160,0)],
  ["Keep funds in the provinces","Gain no research progress or expense.",pp(0,0,0,0)]]);

hd("ausgleich",1867,2,"AUS","The Austro-Hungarian Compromise","Hungarian leaders demand a constitutional settlement within the monarchy.",
 "The 1867 Compromise created the Dual Monarchy of Austria-Hungary.",
 [["Accept the Compromise","Accept Hungarian culture and reduce the militancy of Hungarian people by 1.",c=>{
  if(!c.acc.includes("hungarian"))c.acc.push("hungarian");
  for(const p of provsOf(c.tag))for(const q of p.pops)if(q.c==="hungarian")q.mil=Math.max(0,q.mil-1);
 }],["Retain central government","Gain 2 prestige. Capital militancy rises by 1.",pp(0,2,0,1)]],
 c=>provsOf(c.tag).some(p=>p.pops.some(q=>q.c==="hungarian")));

hd("iwakura",1871,12,"JAP","The Iwakura Mission","A delegation proposes studying institutions and industry overseas.",
 "The Iwakura Mission travelled to the United States and Europe between 1871 and 1873.",
 [["Send the delegation","Spend two months’ revenue. Gain 180 research progress and 3 prestige.",pp(2,3,180,0)],
  ["Focus on domestic reform","Reduce capital militancy by 0.3 without spending.",pp(0,0,0,-.3)]]);

hd("parisCommune",1871,3,"FRA","The Paris Commune","Conflict between the government and the capital threatens the new political order.",
 "The Paris Commune governed the capital for about two months in 1871 before being suppressed.",
 [["Negotiate with municipal leaders","Spend one month’s revenue. Capital militancy falls by 1.2.",pp(1,0,0,-1.2)],
  ["Refuse concessions","Lose 2 prestige. Capital militancy rises by 1.2.",pp(0,-2,0,1.2)]],
 c=>c.gov==="dem" || !!c.lastWar?.PRU);

hd("ottomanDebt",1875,10,"OTT","The Ottoman Debt Crisis","Servicing the debt is straining the treasury.",
 "The Ottoman government suspended full debt payments in 1875. The Public Debt Administration followed in 1881.",
 [["Fund a settlement","Spend two months’ revenue. Gain 3 prestige.",pp(2,3,0,0)],
  ["Suspend payments","Use the existing sovereign default rules.",c=>defaultDebt(c,true)]],c=>c.debt>incOf(c)*3);

hd("ottomanConstitution",1876,12,"OTT","The First Ottoman Constitution","Reformers ask the Sultan to establish a parliament.",
 "The constitution was promulgated in 1876. Parliament was suspended in 1878.",
 [["Promulgate the constitution","Move to constitutional monarchy and reduce capital militancy by 1.",c=>{c.gov="const";pp(0,2,0,-1)(c);}],
  ["Retain absolute rule","Capital militancy rises by 1.",pp(0,0,0,1)]],c=>c.gov==="abs");

hd("egyptDebt",1876,5,"EGY","Egypt's Public Debt","External creditors are pressing for supervision of Egyptian finances.",
 "International debt supervision was established in 1876.",
 [["Negotiate supervision","Improve British and French relations by 20 at a cost of 3 prestige.",c=>{hr("GBR",20)(c);hr("FRA",20)(c);pp(0,-3,0,0)(c);}],
  ["Resist supervision","Relations with both creditors fall by 20.",c=>{hr("GBR",-20)(c);hr("FRA",-20)(c);}]]);

hd("suezShares",1875,11,"GBR","Shares in the Suez Canal","Egypt's financial difficulties create an opportunity to buy into the canal company.",
 "Britain bought the Khedive's Suez Canal shares in 1875.",
 [["Buy the shares","Spend three months’ revenue for 8 prestige and 15 Egyptian relations. Canal ownership stays with its current owner.",c=>{pp(3,8,0,0)(c);hr("EGY",15)(c);}],
  ["Keep the funds","Preserve the treasury.",pp(0,0,0,0)]],()=>alive("EGY")&&!!G.gwDone?.suez);

hd("brazilAbolition",1888,5,"BRA","The Golden Law","Abolitionists press for an immediate end to slavery.",
 "Brazil abolished slavery in May 1888 with the Lei Áurea.",
 [["Abolish slavery","Set the slavery reform to full abolition and gain 5 prestige.",c=>{c.reforms.slavery=2;pp(0,5,0,0)(c);}],
  ["Delay the law","Capital militancy rises by 1.",pp(0,0,0,1)]],c=>c.reforms.slavery<2);

hd("brazilRepublic",1889,11,"BRA","Empire or Republic","Military and republican leaders challenge the monarchy.",
 "The Brazilian monarchy fell in November 1889, and a republic was proclaimed.",
 [["Accept the republic","Change to republican government and reduce capital militancy by 0.6.",c=>{c.gov="dem";pp(0,0,0,-.6)(c);}],
  ["Defend the monarchy","Keep the present government. Capital militancy rises by 1.",pp(0,0,0,1)]],c=>c.gov!=="dem");

hd("dreyfus",1894,12,"FRA","The Dreyfus Affair","The conviction of an army officer exposes deep divisions over justice and antisemitism.",
 "Alfred Dreyfus was convicted in 1894. His conviction was overturned in 1906.",
 [["Open an independent review","Spend half a month’s revenue and reduce capital militancy by 0.6.",pp(.5,0,0,-.6)],
  ["Uphold the military verdict","Lose 3 prestige and raise capital militancy by 0.6.",pp(0,-3,0,.6)]]);

hd("adwa",1896,3,"ETH","Ethiopian Sovereignty","A dispute over the terms of a treaty with Italy tests Ethiopia's international standing.",
 "Ethiopia defeated Italy at Adwa in 1896 and secured international recognition of its independence.",
 [["Fund diplomatic missions","Spend one month’s revenue. Gain 6 prestige.",pp(1,6,0,0)],
  ["Conserve resources","Preserve the treasury.",pp(0,0,0,0)]],()=>alive("SAR")&&G.c.SAR.formed==="ITA"&&G.regionalChoices?.wichale==="signed");

hd("fashoda",1898,9,"FRA","The Fashoda Crisis","British and French colonial claims have met on the Upper Nile.",
 "France withdrew from Fashoda rather than risk a war with Britain.",
 [["Seek a settlement","Improve British relations by 25 at a cost of 2 prestige.",c=>{hr("GBR",25)(c);pp(0,-2,0,0)(c);}],
  ["Maintain the claim","Gain 2 prestige. British relations fall by 30.",c=>{hr("GBR",-30)(c);pp(0,2,0,0)(c);}]],
 ()=>alive("GBR") && !atWarWith(G.c.GBR,G.c.FRA));

hd("russian1905",1905,10,"RUS","The October Manifesto","Strikes and unrest have placed constitutional reform on the agenda.",
 "Nicholas II issued the October Manifesto in 1905, promising civil liberties and a legislative Duma.",
 [["Promise a legislature","Move to constitutional monarchy. Capital militancy falls by 1.",c=>{c.gov="const";pp(0,0,0,-1)(c);}],
  ["Retain absolute rule","Capital militancy rises by 1.4.",pp(0,0,0,1.4)]],c=>c.gov==="abs");

hd("persianConstitution",1906,8,"PER","The Persian Constitution","Merchants, clerics and reformers press for an elected assembly.",
 "The shah granted a constitution in 1906, and the first Majles convened that year.",
 [["Recognize the assembly","Move to constitutional monarchy and reduce capital militancy by 0.8.",c=>{c.gov="const";pp(0,0,0,-.8)(c);}],
  ["Refuse the petition","Capital militancy rises by 1.2.",c=>{c.assemblyRefused=true;pp(0,0,0,1.2)(c);}]],c=>c.gov==="abs");

hd("youngTurks",1908,7,"OTT","The Young Turk Revolution","A movement of officers and reformers demands the restoration of parliamentary government.",
 "The Young Turk Revolution restored the Ottoman constitution in 1908.",
 [["Restore parliamentary government","Move to constitutional monarchy and reduce capital militancy by 1.2.",c=>{c.gov="const";pp(0,0,0,-1.2)(c);}],
  ["Reject the demand","Capital militancy rises by 1.5.",pp(0,0,0,1.5)]],c=>c.gov==="abs");

hd("mexicanRevolution",1910,11,"MEX","The Mexican Revolution","Opposition to the existing regime has grown over contested elections and land inequality.",
 "The 1910 revolt against Porfirio Díaz began a long revolutionary struggle.",
 [["Concede electoral reform","Increase franchise reform by one step, up to full reform. Capital militancy falls by 1.",c=>{c.reforms.vote=Math.min(3,(c.reforms.vote||0)+1);pp(0,0,0,-1)(c);}],
  ["Refuse concessions","Capital militancy rises by 1.5.",pp(0,0,0,1.5)]]);

hd("xinhai",1911,10,"CHI","The Xinhai Revolution","Revolutionaries challenge the Qing dynasty.",
 "The revolution began in 1911. The Qing emperor abdicated in February 1912.",
 [["Accept a republic","Change to republican government. Capital militancy falls by 1.",c=>{c.gov="dem";pp(0,0,0,-1)(c);}],
  ["Defend the dynasty","Keep the present government. Capital militancy rises by 1.5.",pp(0,0,0,1.5)]],c=>c.gov==="abs");

hd("texasAdmission",1845,3,"USA","Admission of Texas","Congress can admit an independent Texas to the Union.",
 "Texas entered the Union in December 1845. Mexico disputed the annexation and the border.",
 [["Offer statehood","Admit Texas and worsen relations with Mexico by 30.",c=>{transferProv(P("TEX"),c.tag);hr("MEX",-30)(c);}],
  ["Recognize an independent Texas","Improve Texan relations by 20.",hr("TEX",20)]],
 ()=>alive("TEX")&&P("TEX")?.o==="TEX"&&provsOf("TEX").length===1&&!G.c.TEX.war.length);

hd("mexicanSettlement",1846,5,"USA","The Disputed Border","Admission of Texas has brought the United States and Mexico into open dispute.",
 "War began in 1846. Mexico ceded California and New Mexico under the 1848 peace treaty.",
 [["Press the western claim","Declare war with California and New Mexico as the war goal.",c=>{if(!declareWar(c.tag,"MEX",{k:"conquer",tag:"MEX",prov:"SFO",hist:1}))msg("diplomacy","The dispute remains unresolved.");}],
  ["Seek a border agreement","Improve Mexican relations by 25.",hr("MEX",25)]],
 c=>alive("MEX")&&owns("USA","TEX")&&owns("MEX","SFO")&&!c.war.length&&!(c.truce.MEX>G.t));

hd("reconstruction",1865,4,"USA","Reconstruction","The seceded states are back under federal authority. Congress must settle the terms of reunification.",
 "After the Civil War, constitutional amendments abolished slavery and established citizenship and voting protections. Enforcement faced sustained opposition.",
 [["Fund federal enforcement","Spend two months’ revenue and reduce militancy by 1 in the former Confederate core.",c=>{
  pp(2,3,0,0)(c);
  for(const id of ["RIC","NOL"])if(owns("USA",id))for(const q of P(id).pops)q.mil=Math.max(0,q.mil-1);
 }],["Restore local control quickly","Preserve the treasury. Militancy rises by 0.6 in the former Confederate core.",()=>{
  for(const id of ["RIC","NOL"])if(owns("USA",id))for(const q of P(id).pops)q.mil=Math.min(10,q.mil+.6);
 }]],c=>!!G.ev.civilwar&&!alive("CSA")&&c.reforms.slavery===2&&owns("USA","RIC"),120);

hd("korea1894",1894,7,"JAP","The Korean Question","Both Japan and Qing China assert influence over Korea.",
 "The First Sino-Japanese War began in 1894, and the Treaty of Shimonoseki ended it in 1895.",
 [["Contest Qing influence","Chinese relations fall by 30 and Korean relations rise by 15.",c=>{hr("CHI",-30)(c);hr("KOR",15)(c);}],
  ["Seek a joint settlement","Chinese relations rise by 20.",hr("CHI",20)]],()=>alive("KOR")&&alive("CHI"));

hd("hague1899",1899,5,"RUS","The Hague Peace Conference","A Russian initiative seeks agreement on arbitration and limits to armaments.",
 "The 1899 conference created the Permanent Court of Arbitration. It did not secure general disarmament.",
 [["Sponsor arbitration","Spend half a month’s revenue for 5 prestige.",pp(.5,5,0,0)],
  ["Send observers","Spend nothing and gain 1 prestige.",pp(0,1,0,0)]]);

hd("norway1905",1905,6,"SWE","The Norwegian Union","Norway is demanding dissolution of the union with Sweden.",
 "In 1905 Sweden accepted the dissolution after a Norwegian referendum and negotiations.",
 [["Recognize Norway","Release Norway as an independent constitutional monarchy. Gain 3 prestige.",c=>{
  spawnNation("NOR","Norway","Norwegian","#bf3956","norwegian","const","LIB",["NOR"],c.tag);
  pp(0,3,0,0)(c);
 }],["Maintain the union","Retain Norway and increase militancy there by 1.",()=>{
  for(const q of P("NOR").pops)q.mil=Math.min(10,q.mil+1);
 }]],()=>!alive("NOR")&&owns("SWE","NOR"));

hd("tripoli1911",1911,9,"OTT","The Italian Ultimatum","Italy presses for control of Tripolitania.",
 "Italy declared war in 1911 and took control of Libya under the 1912 peace settlement.",
 [["Refuse the ultimatum","Italy declares war for Tripolitania if the existing diplomacy permits it.",()=>{
  if(!declareWar("SAR","OTT",{k:"conquer",tag:"OTT",prov:"TRP",hist:1}))msg("diplomacy","The ultimatum expires without a declaration of war.");
 }],["Cede Tripolitania","Transfer Tripolitania to Italy in exchange for peace.",()=>transferProv(P("TRP"),"SAR")]],
 c=>owns("OTT","TRP")&&alive("SAR")&&G.c.SAR.formed==="ITA"&&!c.war.length&&!G.c.SAR.war.length&&!(G.c.SAR.truce.OTT>G.t));

hd("july1914",1914,7,"AUS","The July Crisis","A dispute with Serbia threatens to draw in Austria's and Serbia's partners.",
 "In 1914 Austria-Hungary's ultimatum to Serbia and the failure of diplomacy led to a wider war.",
 [["Seek mediation","Improve Serbian and Russian relations by 20.",c=>{hr("SER",20)(c);hr("RUS",20)(c);}],
  ["Issue the ultimatum","Declare war for prestige. Treaty partners will make separate decisions about joining.",c=>{
   startJulyWar(c);
  }]],c=>alive("SER")&&!c.war.length&&!(c.truce.SER>G.t),11);

hd("suffrage",1918,2,"GBR","A Wider Franchise","Parliament can broaden participation in national elections.",
 "The Representation of the People Act 1918 enfranchised most adult men and some women. Equal voting terms followed in 1928.",
 [["Broaden the franchise","Advance the franchise by one step and reduce capital militancy by 0.5.",c=>{c.reforms.vote++;pp(0,0,0,-.5)(c);}],
  ["Delay the bill","Capital militancy rises by 0.8.",pp(0,0,0,.8)]],c=>c.reforms.vote<3);

function financialPanic(id, year, month, title, history, duration, rate, worldwide) {
 const date = (year - 1836) * 12 + month - 1;
 EVENTS.push({id, y:year, date, until:date+11, title, history, run(){
  G.creditShock={until:G.t+duration, rate, worldwide};
  msg("economy", title + ". Private investment slows; central banks cushion the shock.");
 }});
 hd(id+"Relief",year,month,"USA",title+": Emergency Credit","The government must decide whether to support private lending.",history,
  [["Back emergency lending","Spend one month’s revenue and halve the domestic investment penalty during this panic.",c=>{
   pp(1,0,0,0)(c);c.creditRelief=G.creditShock.until;
  }],["Leave recovery to the banks","Keep the treasury intact and take the full investment penalty.",pp(0,0,0,0)]],
  ()=>G.creditShock?.until>G.t, duration-1);
}


financialPanic("panic1837",1837,5,"Panic of 1837","Bank suspensions and a prolonged downturn followed the 1837 panic.",12,.18,false);
financialPanic("panic1857",1857,8,"Panic of 1857","The 1857 financial crisis spread across the Atlantic.",10,.16,true);
financialPanic("panic1873",1873,9,"Panic of 1873","The crises of 1873 affected European and American markets and railway finance.",18,.24,true);
financialPanic("panic1893",1893,5,"Panic of 1893","American railway and banking failures contributed to a severe downturn.",14,.22,false);
financialPanic("panic1907",1907,10,"Panic of 1907","Runs on American trust companies disrupted the financial system.",8,.20,false);
financialPanic("crash1929",1929,10,"Stock Market Crash of 1929","The Wall Street crash accompanied the onset of a prolonged international depression.",30,.34,true);

EVENTS.push({
 id:"influenza1918",y:1918,date:(1918-1836)*12+8,until:(1919-1836)*12+7,
 title:"Influenza Pandemic",history:"The 1918–19 influenza pandemic spread around the world in several waves.",
 run(){G.influenzaUntil=G.t+12;msg("politics","Influenza pandemic: population growth falls for twelve months. Hospitals reduce the demographic penalty.");}
});


hd("zollverein",1836,1,"PRU","Extend the Zollverein","Prussia can use its customs union to build influence among the German states.",
 "The Zollverein began in 1834 under Prussian leadership and added members over the following decades.",
 [["Strengthen the union","Enact the Zollverein decision, adding influence and improving relations among the eligible German states.",c=>takeDecision(c,"zoll")],
  ["Leave membership as it stands","Make no change to influence or relations.",pp(0,0,0,0)]],c=>!decisionTaken(c,"zoll"));

hd("polish1863",1863,1,"RUS","The January Uprising","Polish leaders demand greater autonomy under the empire.",
 "The January Uprising in Russian-ruled Poland began in 1863 and was defeated in 1864.",
 [["Offer local concessions","Spend one month’s revenue and reduce Polish militancy by 1.",c=>{
  pp(1,0,0,0)(c);
  for(const p of provsOf(c.tag))for(const q of p.pops)if(q.c==="polish")q.mil=Math.max(0,q.mil-1);
 }],["Refuse autonomy","Spend nothing. Polish militancy rises by 1.",c=>{
  for(const p of provsOf(c.tag))for(const q of p.pops)if(q.c==="polish")q.mil=Math.min(10,q.mil+1);
 }]],c=>owns(c.tag,"WAR"));

hd("meijiChoice",1868,1,"JAP","The Meiji Restoration","The imperial court challenges the shogunate and proposes a new government.",
 "The Restoration returned governing authority to the emperor in 1868. The Meiji Constitution came later, in 1889.",
 [["Back the Restoration","Enact the existing Restoration decision and begin modernization.",c=>takeDecision(c,"meiji")],
  ["Retain the shogunate","Keep the current institutions and reduce capital militancy by 0.4.",c=>{c.hold=G.t+120;pp(0,0,0,-.4)(c);}]],
 c=>!c.civ&&G.ev.meiji==null&&!(c.hold>G.t)&&!decisionTaken(c,"meiji"));

hd("congoReform",1908,11,"BEL","Responsibility for the Congo","International scrutiny puts pressure on Belgium to answer for abuses in the Congo.",
 "Belgium annexed the Congo Free State in 1908 following international criticism of its administration and abuses.",
 [["Fund civilian oversight","Spend two months’ revenue and reduce militancy in Belgian-held Congo by 1.",c=>{
  pp(2,0,0,0)(c);
  for(const p of provsOf(c.tag))if(/Congo/i.test(p.n))for(const q of p.pops)q.mil=Math.max(0,q.mil-1);
 }],["Decline funding","Keep the treasury intact and lose 4 prestige.",pp(0,-4,0,0)]],
 c=>provsOf(c.tag).some(p=>/Congo/i.test(p.n)));

hd("washingtonNaval",1922,2,"JAP","The Washington Naval Treaty","The maritime powers are negotiating limits on capital ships.",
 "The Five-Power Treaty signed in 1922 set limits on capital-ship tonnage for Britain, the United States, Japan, France and Italy.",
 [["Support the agreement","Improve American and British relations by 15. Fleet capacity stays the same.",c=>{hr("USA",15)(c);hr("GBR",15)(c);}],
  ["Stay outside the agreement","Gain 2 prestige domestically but lose 15 American relations.",c=>{pp(0,2,0,0)(c);hr("USA",-15)(c);}]],
 c=>c.civ&&alive("USA")&&alive("GBR"));

hd("gold1931",1931,9,"GBR","Sterling Under Pressure","The government faces a choice between defending monetary commitments and easing credit.",
 "Britain suspended gold convertibility in September 1931.",
 [["Ease credit","Spend one month’s revenue to halve the remaining worldwide credit penalty at home.",c=>{pp(1,0,0,0)(c);c.creditRelief=G.creditShock.until;}],
  ["Defend sterling","Keep the treasury intact and gain 2 prestige.",pp(0,2,0,0)]],()=>G.creditShock?.worldwide&&G.creditShock.until>G.t);

hd("newDeal",1933,3,"USA","The First Hundred Days","Bank failures and unemployment have intensified demands for federal intervention.",
 "The Roosevelt administration passed a series of banking, relief and recovery measures in 1933.",
 [["Fund emergency relief","Spend two months’ revenue and lower capital militancy by 1.5.",pp(2,0,0,-1.5)],
  ["Prioritize the budget","Preserve treasury funds. Capital militancy rises by 1.",pp(0,0,0,1)]],()=>!!G.ev.crash1929);

