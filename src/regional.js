"use strict";

function orderRegionalBuilding(country, province, kind){
 if(country.bq?.some(item=>item.p===province.id&&item.b===kind)){
  const reason="Already in the queue.";
  msg("economy",reason);
  return {ok:false,txt:reason};
 }
 const result=startBld(country,province,kind);
 const order=result.full?bqAdd(country,province.id,kind):result;
 msg("economy",order.txt||order.why);
 return order;
}

function rememberRegional(key, value){
 (G.regionalChoices||={})[key]=value;
}

hd("bombayRailway",1853,4,"GBR","The Bombay Railway","The first passenger line offers an opening for further investment on the Indian network.",
 "The first passenger train in India ran between Bombay and Thane in April 1853.",
 [["Order a railway extension","Start one railway project in Bombay. Construction draws materials and funds through the normal budget.",c=>{
  startRail(c,P("BOM"));
  rememberRegional("bombay","rail");
 }],["Reserve the funds for local services","Keep the railway out of the national construction queue.",()=>rememberRegional("bombay","local")]],
 c=>railCan(c,P("BOM")).ok);

hd("india1858",1858,11,"GBR","The Government of India","London is reviewing the institutions through which it governs India.",
 "The Government of India Act 1858 transferred the East India Company's governing powers to the Crown.",
 [["Fund a civilian administration","Spend one month of national revenue and reduce militancy by 1 in British-held Delhi and Bombay.",c=>{
  pp(1,0,0,0)(c);
  for(const id of ["DEL","BOM"])if(owns(c.tag,id))for(const q of P(id).pops)q.mil=Math.max(0,q.mil-1);
 }],["Keep the existing arrangements","Save the money and leave provincial militancy unchanged.",pp(0,0,0,0)]],
 c=>owns(c.tag,"DEL")&&G.regionalChoices?.bombay!=="rail");

hd("india1858Rail",1858,11,"GBR","Railways and Crown Oversight","Your earlier railway expansion has opened a choice over support facilities in Bombay.",
 "The 1858 transfer to Crown rule changed the government overseeing India's developing railway network.",
 [["Commission a Bombay rail depot","Queue a depot in Bombay at normal material and construction cost.",c=>orderRegionalBuilding(c,P("BOM"),"depot")],
  ["Keep the existing network","Leave the current railway in operation without adding a depot.",pp(0,0,0,0)]],
 c=>owns(c.tag,"BOM")&&G.regionalChoices?.bombay==="rail"&&P("BOM").ctl===c.tag&&bldCan(c,P("BOM"),"depot").ok);

hd("punjabTrade",1846,3,"PUN","The Lahore Settlement","The Sikh state faces pressure from the British East India Company. You can open talks or retain a more independent policy.",
 "The Treaty of Lahore ended the First Anglo-Sikh War in 1846. Another war ended with British annexation of Punjab in 1849.",
 [["Negotiate with the Company","Improve British relations by 20. This opens a later option for fiscal concessions.",c=>{hr("GBR",20)(c);rememberRegional("lahore","talk");}],
  ["Insist on independence","Gain 2 prestige and reduce British relations by 20.",c=>{pp(0,2,0,0)(c);hr("GBR",-20)(c);rememberRegional("lahore","hold");}]],
 ()=>alive("GBR")&&owns("PUN","LAH"));

hd("punjab1849",1849,3,"PUN","Revenue and Sovereignty","You previously opened talks. The Company now asks for concessions in exchange for continued cooperation.",
 "In actual history the British annexed the Punjab in March 1849. This settlement is a counterfactual.",
 [["Reduce duties","Lower tariffs by 10 percentage points and improve British relations by 20.",c=>{c.tariff=Math.max(0,c.tariff-.1);hr("GBR",20)(c);}],
  ["Reject further concessions","Keep the current tariff. British relations fall by 20.",hr("GBR",-20)]],
 ()=>alive("GBR")&&owns("PUN","LAH")&&G.regionalChoices?.lahore==="talk");

hd("punjab1849Independent",1849,3,"PUN","Independent Finances","Your government declined closer cooperation. The treasury must decide how to support Lahore's institutions.",
 "British annexation ended the independent Sikh state in 1849. This dispatch applies only if the state survives in your campaign.",
 [["Expand education","Queue a school in Lahore at normal construction cost.",c=>orderRegionalBuilding(c,P("LAH"),"school")],
  ["Hold funds in reserve","Preserve the treasury.",pp(0,0,0,0)]],
 c=>owns(c.tag,"LAH")&&G.regionalChoices?.lahore==="hold"&&bldCan(c,P("LAH"),"school").ok);

hd("wichale",1889,5,"ETH","The Treaty of Wichalē","The choice is whether to enter a treaty with Italy or keep negotiations informal.",
 "The 1889 treaty's Amharic and Italian texts differed over the role of Italy in Ethiopian foreign relations.",
 [["Sign the treaty","Improve Italian relations by 20. A later dispute over its interpretation may follow.",c=>{hr("SAR",20)(c);rememberRegional("wichale","signed");}],
  ["Leave the treaty unsigned","Lose 5 Italian relations and retain full freedom of action.",c=>{hr("SAR",-5)(c);rememberRegional("wichale","unsigned");}]],
 ()=>alive("SAR")&&G.c.SAR.formed==="ITA");

hd("wichaleDenounced",1893,2,"ETH","The Protectorate Dispute","You signed the treaty. Italy's interpretation is now testing the relationship.",
 "Menelik II rejected Italy's claim to a protectorate. The dispute preceded the Battle of Adwa in 1896.",
 [["Repudiate the disputed clause","Gain 4 prestige. Italian relations fall by 30.",c=>{pp(0,4,0,0)(c);hr("SAR",-30)(c);}],
  ["Offer arbitration","Spend half a month of revenue and gain 10 Italian relations.",c=>{pp(.5,0,0,0)(c);hr("SAR",10)(c);}]],
 ()=>alive("SAR")&&G.regionalChoices?.wichale==="signed");

hd("wichaleUnsigned",1893,2,"ETH","Diplomacy Without a Treaty","You declined to sign. Ethiopia can invest in foreign representation without renegotiating treaty clauses.",
 "This dispatch represents a counterfactual in which the 1889 treaty was never signed.",
 [["Fund overseas missions","Spend one month of revenue. Gain 4 prestige and 10 French relations.",c=>{pp(1,4,0,0)(c);hr("FRA",10)(c);}],
  ["Concentrate on domestic affairs","Preserve the treasury.",pp(0,0,0,0)]],
 ()=>G.regionalChoices?.wichale==="unsigned");

hd("brazilTransition",1891,2,"BRA","Citizenship After Abolition","Abolition is now law. The cabinet must decide whether to direct public funding toward education.",
 "Brazil abolished slavery in 1888 and adopted its first republican constitution in 1891. Formal citizenship left large exclusions in practice.",
 [["Fund schooling","Queue a school in the capital at the normal construction cost.",c=>orderRegionalBuilding(c,P(c.cap),"school")],
  ["Leave provision to local authorities","Keep the national treasury intact.",pp(0,0,0,0)]],
 c=>c.reforms.slavery===2&&bldCan(c,P(c.cap),"school").ok);

hd("bowring1855",1855,4,"SIA","The Bowring Treaty","British negotiators seek wider access to Siamese trade.",
 "The Bowring Treaty of 1855 opened Siamese trade under new terms and constrained its tariff policy.",
 [["Accept the trade agreement","Lower the tariff by 8 percentage points and improve British relations by 25.",c=>{
  c.tariff=Math.max(0,c.tariff-.08);hr("GBR",25)(c);rememberRegional("bowring","open");
 }],["Keep control over duties","Retain the current tariff and lose 15 British relations.",c=>{
  hr("GBR",-15)(c);rememberRegional("bowring","declined");
 }]],()=>alive("GBR")&&owns("SIA","BKK"));

hd("siam1856",1856,5,"SIA","New Commercial Envoys","Your agreement with Britain has drawn further diplomatic attention.",
 "Siam negotiated another commercial agreement with the United States in 1856.",
 [["Extend negotiations to the United States","Gain 20 American relations and 40 research progress.",c=>{hr("USA",20)(c);pp(0,0,40,0)(c);}],
  ["Consolidate the British agreement","Keep American relations unchanged and gain 5 British relations.",hr("GBR",5)]],
 ()=>alive("USA")&&owns("SIA","BKK")&&G.regionalChoices?.bowring==="open");

hd("siam1893",1893,7,"SIA","The Mekong Crisis","Relations with France are strained over competing claims in the Mekong region.",
 "A crisis in 1893 ended with Siam conceding claims east of the Mekong.",
 [["Seek British mediation","Improve British relations by 20. A later guarantee can be pursued if Britain is still friendly.",c=>{
  hr("GBR",20)(c);rememberRegional("mekong","mediation");
 }],["Offer a bilateral settlement","Improve French relations by 20 at the cost of 3 prestige.",c=>{
  hr("FRA",20)(c);pp(0,-3,0,0)(c);rememberRegional("mekong","bilateral");
 }]],()=>alive("GBR")&&alive("FRA")&&owns("SIA","BKK"));

hd("siam1896",1896,1,"SIA","An International Understanding","Your request for mediation has opened a diplomatic opportunity.",
 "Britain and France reached an agreement concerning Siam in January 1896.",
 [["Seek a British guarantee","Britain guarantees Siam. Improve French relations by 10.",c=>{
  const uk=G.c.GBR;uk.guar=[...new Set([...(uk.guar||[]),c.tag])];hr("FRA",10)(c);
 }],["Seek assurances from both powers","Improve relations with Britain and France by 10.",c=>{hr("GBR",10)(c);hr("FRA",10)(c);}]],
 c=>G.regionalChoices?.mekong==="mediation"&&alive("GBR")&&alive("FRA")&&(c.rel.GBR||0)>=10&&!atWarWith(c,G.c.GBR));

hd("pacific1879",1879,2,"CHL","The Pacific Dispute","A dispute over taxation and mineral concessions has brought Chile and Bolivia into confrontation.",
 "The dispute over Antofagasta and nitrate interests preceded the War of the Pacific between Chile and Bolivia and Peru.",
 [["Keep negotiations open","Improve Bolivian relations by 20 and retain access to the later settlement talks.",c=>{
  hr("BOL",20)(c);rememberRegional("pacific","talks");
 }],["Press the disputed claims","Lose 30 Bolivian relations and gain 2 prestige. Update the planned investment response.",c=>{
  hr("BOL",-30)(c);pp(0,2,0,0)(c);rememberRegional("pacific","claims");
 }]],()=>alive("BOL")&&owns("CHL","SCL"));

hd("pacific1883",1883,10,"CHL","A Pacific Settlement","The earlier dispute has reached a point where a regional agreement is possible.",
 "Chile and Peru signed the Treaty of Ancón in 1883. The coarse campaign map treats this choice as a diplomatic settlement.",
 [["Sign a commercial settlement","Improve Peruvian and Bolivian relations by 15.",c=>{hr("PEU",15)(c);hr("BOL",15)(c);}],
  ["Prioritize domestic works","Spend half a month of revenue and gain 60 research progress.",pp(.5,0,60,0)]],
 c=>G.regionalChoices?.pacific==="talks"&&alive("PEU")&&alive("BOL")&&!atWarWith(c,G.c.PEU)&&!atWarWith(c,G.c.BOL));

hd("pacific1883Claims",1883,10,"CHL","The Cost of the Dispute","You pressed the disputed claims. The domestic industry now needs investment.",
 "The nitrate economy became a major source of export revenue in Chile after the War of the Pacific.",
 [["Expand mine works","Commission mine works in Chile at normal construction costs.",c=>orderRegionalBuilding(c,P("SCL"),"minew")],
  ["Keep the reserve","Save the treasury funds for future negotiations.",pp(0,0,0,0)]],
 c=>G.regionalChoices?.pacific==="claims"&&bldCan(c,P("SCL"),"minew").ok);
HISTORY_DISPATCHES.sort((a,b)=>a.date-b.date);
const historicalEvents = EVENTS.filter(e=>e.date!=null).sort((a,b)=>a.date-b.date);
EVENTS.splice(0,EVENTS.length,...EVENTS.filter(e=>e.date==null),...historicalEvents);

hd("persianBudget",1907,10,"PER","Who approves the budget?",
 "The cabinet must decide whether to bring its accounts before the assembly.",
 "In the constitutional period, the Majles asserted authority over state expenditure.",
 [["Submit the accounts","Spend half a month’s revenue on oversight and ease unrest in the capital.",c=>{pp(.5,0,0,-1)(c);c.parliamentaryAccounts=true;}],
  ["Keep spending under the crown","Preserve funds and increase unrest in the capital.",pp(0,0,0,.8)]],
 c=>c.gov==="const");

hd("persianPetition",1908,6,"PER","An accounting petition",
 "With the crown retaining authority, merchants petition for published accounts.",
 "The conflict over constitutional authority intensified in 1908. This petition represents an alternative course.",
 [["Publish the accounts","Spend a quarter of one month’s revenue to ease unrest.",pp(.25,0,0,-.6)],
  ["Reject the petition","Preserve funds and increase unrest.",pp(0,0,0,.9)]],
 c=>c.gov==="abs"&&(c.assemblyRefused||G.choices?.some(choice=>choice.id==="persianConstitution"&&choice.k==="1")));

hd("koreanNeutrality",1894,8,"KOR","Korea between two powers",
 "The cabinet must decide how it will respond to pressure from its neighbors.",
 "Japan and Qing China went to war in 1894 amid competition over Korea.",
 [["Seek recognition of neutrality","Spend half a month’s revenue and improve relations with both neighbors.",c=>{pp(.5,0,0,0)(c);hr("JAP",12)(c);hr("CHI",12)(c);}],
  ["Seek Chinese diplomatic backing","Improve relations with China and worsen relations with Japan.",c=>{hr("CHI",20)(c);hr("JAP",-15)(c);}]],
 c=>!c.overlord&&owns("KOR",c.cap)&&alive("JAP")&&alive("CHI"));

hd("koreanMovement",1919,3,"JAP","Petitions for Korean independence",
 "Korean organizers demand self-government. The cabinet must decide whether to hear their representatives.",
 "The March First movement publicly demanded Korean independence from Japanese colonial rule in 1919.",
 [["Hear local representatives","Spend one month’s revenue and reduce militancy in Japanese-governed Korea.",c=>{pp(1,0,0,0)(c);for(const p of provsOf(c.tag))if(p.c==="korean")for(const group of p.pops)group.mil=Math.max(0,group.mil-1);}],
  ["Refuse talks","Keep the funds. Militancy in Japanese-governed Korea rises.",c=>{for(const p of provsOf(c.tag))if(p.c==="korean")for(const group of p.pops)group.mil=Math.min(10,group.mil+1);}]],
 c=>provsOf(c.tag).some(p=>p.c==="korean"));

hd("ethiopianMissions",1896,3,"ETH","Ethiopia’s foreign missions",
 "The cabinet has an opportunity to expand independent diplomatic ties.",
 "Ethiopia pursued international recognition of its sovereignty in the 1890s. This choice represents diplomacy without a live Italian treaty dispute.",
 [["Fund a French mission","Spend half a month’s revenue and gain 15 French relations.",c=>{pp(.5,0,0,0)(c);hr("FRA",15)(c);}],
  ["Keep funds at home","Retain the treasury reserve.",pp(0,0,0,0)]],
 ()=>alive("FRA")&&!(alive("SAR")&&G.c.SAR.formed==="ITA"&&G.regionalChoices?.wichale==="signed"));

const governedIndia = country => ["DEL","BOM"].map(P).filter(p=>p?.o===country.tag&&p.ctl===country.tag);

hd("saltProtests",1930,3,"GBR","Civil disobedience in India",
 "Protesters challenge the salt tax. The cabinet decides whether to negotiate with local representatives.",
 "The Salt March of 1930 challenged the British monopoly and tax on salt.",
 [["Open negotiations","Spend half a month’s revenue to open talks.",c=>{pp(.5,0,0,0)(c);rememberRegional("salt","talk");}],
  ["Keep the present arrangements","Preserve funds. Militancy rises in the affected provinces.",c=>{
   rememberRegional("salt","refuse");
   for(const p of governedIndia(c))for(const group of p.pops)group.mil=Math.min(10,group.mil+.7);
  }]],c=>governedIndia(c).length>0);

hd("indiaTalks",1931,3,"GBR","The terms of negotiation",
 "Representatives ask for concessions in return for suspending civil disobedience.",
 "The Gandhi–Irwin Pact of 1931 allowed negotiations to proceed after the civil disobedience campaign.",
 [["Fund a local concession","Spend one month’s revenue and reduce militancy in British-administered Delhi and Bombay over the next year.",c=>{
   pp(1,0,0,0)(c);c.indiaConcessionUntil=G.t+12;
  }],
  ["End the talks","Preserve funds and accept continuing unrest.",pp(0,0,0,0)]],
 c=>governedIndia(c).length>0&&G.regionalChoices?.salt==="talk");

hd("chileDepression",1930,1,"CHL","Relief during the export downturn",
 "The cabinet weighs household support against preserving what remains of the treasury.",
 "The Depression severely affected Chile's export industries and employment.",
 [["Fund temporary relief","Spend one month’s revenue. Support household purchasing power for twelve months, with larger payments in a more export-dependent economy.",c=>{
   pp(1,0,0,0)(c);c.exportRelief={until:G.t+12,exposure:clamp((c.exportValue||0)/Math.max(1,c.stat.gdp||0),0,1)};
  }],
  ["Preserve the treasury","Spend nothing and leave households to absorb the downturn.",pp(0,0,0,0)]],
 ()=>G.creditShock?.worldwide&&G.creditShock.until>G.t);

const COMPANY_DISTRICTS=["DEL","CAL","BOM"];
const COMPANY_TRANSFER=(1858-1836)*12+10;
function indiaAdministrator(province){
 if(province?.o!=="GBR"||!COMPANY_DISTRICTS.includes(province.id))return null;
 if(province.ctl!=="GBR")return "Occupied";
 return G.t<COMPANY_TRANSFER?"East India Company":"Crown administration";
}
function companyBudget(country){
 const districts=COMPANY_DISTRICTS.map(P).filter(p=>indiaAdministrator(p)==="East India Company");
 const taxes=sum(districts,p=>sum(p.pops,q=>q._tax||0));
 const retained=taxes*.12;
 const officials=districts.flatMap(p=>p.pops.filter(q=>q.t==="BUR"));
 const population=sum(officials,q=>q.n);
 const reserve=(country.companyBudget?.reserve||0)+retained;
 const spent=population?Math.min(reserve,retained*.75):0;
 if(population)for(const q of officials)q.cash+=spent*q.n/population;
 const transfer=G.t>=COMPANY_TRANSFER?reserve:0;
 country.companyBudget={month:G.t,taxes,retained,spent,remitted:taxes-retained,
  reserve:reserve-spent-transfer,transferred:transfer};
 return retained-transfer;
}

function companyLahoreDo(){const c=G.c.GBR;if(!c||!c.alive||!alive("PUN"))return;
 rememberRegional("companyLahore","offer");
 if(!(c.commercialRoute?.until>G.t))c.commercialRoute={seller:"PUN",good:"grain",until:G.t+24,rights:["trade"]};
 msg("diplomacy","Punjab accepts the Company's commercial proposal.");
}
hd("companyLahore",1846,3,"GBR","The Company and Lahore",
 "Company officials ask London for instructions on commercial negotiations with Punjab.",
 "This is an alternate-history decision. It uses the Lahore settlement already modelled in the Punjab campaign.",
 [["Authorise a commercial offer","Request access to Punjab grain without acquiring Punjab's territory or tax powers.",c=>{
  const punjab=G.c.PUN;
  if((punjab.rel.GBR||0)<0||atWarWith(c,punjab)){
   msg("diplomacy","Punjab refuses the Company's commercial proposal.");
   return;
  }
  /* A3: a human Punjab is asked; the AI accepts */
  if(askHuman("PUN",{a:"companyLahore"},"The Company's commercial proposal","The Company asks for access to Punjab grain, without territory or tax powers.",["Accept the offer","Punjab sells grain to the Company under a two-year commercial route."],["Refuse the offer","Nothing changes."]))return;
  companyLahoreDo();
 }],["Keep existing terms","Leave territory, taxation and commercial rights as they stand.",()=>{
  rememberRegional("companyLahore","hold");
 }]],()=>alive("PUN")&&owns("PUN","LAH")&&COMPANY_DISTRICTS.some(id=>indiaAdministrator(P(id))==="East India Company"));
