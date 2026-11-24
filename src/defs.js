"use strict";
/* ================= GOODS ================= */
// k: raw (from the land), man (from factories); p: base price; y: year it can first be made
const GOODS={
 grain:{n:"Grain",k:"raw",p:2},fruit:{n:"Fruit",k:"raw",p:2},livestock:{n:"Livestock",k:"raw",p:3},fish:{n:"Fish",k:"raw",p:2.5},
 wool:{n:"Wool",k:"raw",p:2.5},cotton:{n:"Cotton",k:"raw",p:2.5},tobacco:{n:"Tobacco",k:"raw",p:3},coffee:{n:"Coffee and tea",k:"raw",p:4},sugar:{n:"Sugar",k:"raw",p:3},
 timber:{n:"Timber",k:"raw",p:1.5},rubber:{n:"Rubber",k:"raw",p:6},coal:{n:"Coal",k:"raw",p:2},iron:{n:"Iron",k:"raw",p:3},oil:{n:"Oil",k:"raw",p:4},gold:{n:"Precious metal",k:"raw",p:10},
 fabric:{n:"Fabric",k:"man",p:7},clothes:{n:"Clothes",k:"man",p:10},liquor:{n:"Liquor",k:"man",p:8.5},canned:{n:"Canned food",k:"man",p:14,y:1845},
 furniture:{n:"Furniture",k:"man",p:6.5},paper:{n:"Paper",k:"man",p:6.5},cement:{n:"Cement",k:"man",p:7},luxuries:{n:"Luxuries",k:"man",p:17},
 steel:{n:"Steel",k:"man",p:11.5},machinery:{n:"Machine parts",k:"man",p:19},arms:{n:"Arms",k:"man",p:29},ammo:{n:"Ammunition",k:"man",p:11},
 ships:{n:"Ships",k:"man",p:32},fuel:{n:"Fuel",k:"man",p:11.5,y:1870},electric:{n:"Electric gear",k:"man",p:25,y:1885},cars:{n:"Automobiles",k:"man",p:60,y:1900}};
const GK=Object.keys(GOODS);
// one batch: inputs -> output; the engine scales each recipe so a factory level uses about ₤600 of inputs a month
const RECIPE={fabric:{i:{cotton:2},o:1},clothes:{i:{fabric:1},o:1},liquor:{i:{grain:2,fruit:1},o:1},canned:{i:{livestock:2,steel:.5},o:1},furniture:{i:{timber:3},o:1},paper:{i:{timber:3},o:1},
 cement:{i:{coal:1,iron:1},o:1},luxuries:{i:{fabric:1,gold:.5},o:1},steel:{i:{iron:2,coal:1},o:1},machinery:{i:{steel:1,coal:1},o:1},arms:{i:{steel:1,machinery:.5},o:1},
 ammo:{i:{steel:.5,coal:1},o:1},ships:{i:{steel:1,timber:1,machinery:.5},o:1},fuel:{i:{oil:2},o:1},electric:{i:{steel:.5,machinery:.5,rubber:.5},o:1},cars:{i:{steel:1,machinery:1,rubber:1,fuel:.5},o:1}};
const FAC_IN=600,FAC_WORK=10; // ₤ of inputs a month per level; thousand workers per level (90% craftsmen, 10% clerks)
for(const g in RECIPE){const r=RECIPE[g];let v=0;for(const x in r.i)v+=r.i[x]*GOODS[x].p;const b=FAC_IN/v;r.I={};for(const x in r.i)r.I[x]=r.i[x]*b;r.O=r.o*b;}
const ARTISAN_GOODS=["clothes","furniture","liquor","paper","fabric","luxuries","cement"]; // what artisans can make by hand
/* raw output per thousand workers a month, before modifiers */
const RGO_OUT={grain:7,fruit:7,livestock:4.7,fish:5.6,wool:5.6,cotton:5.6,tobacco:4.7,coffee:3.5,sugar:4.7,timber:9.3,rubber:2.3,coal:7,iron:4.7,oil:3.5,gold:1.4};
const MINE_GOODS=new Set(["coal","iron","oil","gold","timber","rubber"]);
const TERRAIN={p:{n:"Plains",farm:1.1,move:1,def:0,width:1,sup:10},h:{n:"Hills",farm:.9,move:1.3,def:1,width:.85,sup:7},m:{n:"Mountains",farm:.65,move:1.7,def:2,width:.6,sup:4},f:{n:"Forest",farm:.75,move:1.4,def:1,width:.75,sup:6},
 j:{n:"Jungle",farm:.8,move:1.8,def:2,width:.6,sup:4},d:{n:"Desert",farm:.45,move:1.5,def:0,width:.9,sup:3},s:{n:"Steppe",farm:.8,move:1,def:0,width:1,sup:7}};
/* ================= PEOPLE ================= */
// s: stratum 0 poor 1 middle 2 rich
const PTYPES={ARI:{n:"Aristocrats",s:2},CAP:{n:"Capitalists",s:2},CLE:{n:"Clergy",s:1},BUR:{n:"Bureaucrats",s:1},OFF:{n:"Officers",s:1},ART:{n:"Artisans",s:1},CLK:{n:"Clerks",s:1},
 CRA:{n:"Craftsmen",s:0},FAR:{n:"Farmers",s:0},LAB:{n:"Labourers",s:0},SOL:{n:"Soldiers",s:0},SLA:{n:"Slaves",s:0}};
const PTK=Object.keys(PTYPES);
// needs per thousand people a month, by stratum: life, everyday, luxury
const NEEDS=[
 {l:{grain:1.1,fish:.25,fruit:.3,livestock:.2,timber:.4,fabric:.15},e:{clothes:.35,liquor:.25,tobacco:.2,sugar:.2,coffee:.12,furniture:.2,coal:.25,paper:.05},x:{luxuries:.15,canned:.2,furniture:.2,coffee:.15,electric:.04,cars:.01}},
 {l:{grain:1.3,fish:.4,fruit:.5,livestock:.5,timber:.5,clothes:.3},e:{clothes:.6,liquor:.5,tobacco:.4,sugar:.4,coffee:.4,furniture:.6,coal:.6,paper:.4,canned:.2},x:{luxuries:1.1,furniture:.6,canned:.4,electric:.3,cars:.08,fuel:.3}},
 {l:{grain:1.6,fish:.6,fruit:.8,livestock:1.0,timber:.6,clothes:.8},e:{clothes:2.5,liquor:2,tobacco:1.5,sugar:1.2,coffee:1.5,furniture:2.5,coal:2,paper:1.5,canned:1},x:{luxuries:9,furniture:3,canned:2,electric:1.5,cars:.8,fuel:2}}];
/* ================= IDEOLOGY AND POLITICS ================= */
const IDEOS={REA:{n:"Reactionary",c:"#5a4636",y:0},CON:{n:"Conservative",c:"#3f6f8f",y:0},LIB:{n:"Liberal",c:"#d4a537",y:0},SOC:{n:"Socialist",c:"#c0507a",y:1848},
 ANL:{n:"Anarcho-liberal",c:"#8a9a5b",y:1848},COM:{n:"Communist",c:"#8b1a1a",y:1875},FAS:{n:"Fascist",c:"#3a3a3a",y:1905}};
const IK=Object.keys(IDEOS);
const GOVS={abs:{n:"Absolute monarchy",elect:0,vote:0},const:{n:"Constitutional monarchy",elect:1,vote:1},dem:{n:"Democracy",elect:1,vote:2},
 pres:{n:"Presidential dictatorship",elect:0,vote:0},prol:{n:"Proletarian dictatorship",elect:0,vote:0},fasc:{n:"Fascist dictatorship",elect:0,vote:0}};
// party policies by ideology: economy, trade, religion, citizenship, war
const ECON={laissez:{n:"Laissez-faire",build:0,cap:1.2},inter:{n:"Interventionism",build:.5,cap:1},state:{n:"State capitalism",build:1,cap:.7},planned:{n:"Planned economy",build:1,cap:0}};
const TRADE={free:{n:"Free trade",max:.15},prot:{n:"Protectionism",max:.75}};
const CITIZEN={res:{n:"Residency",acc:.8},limited:{n:"Limited citizenship",acc:.4},culture:{n:"Culture only",acc:0}};
const PARTY_OF={REA:{econ:"inter",trade:"prot",cit:"culture"},CON:{econ:"inter",trade:"prot",cit:"limited"},LIB:{econ:"laissez",trade:"free",cit:"res"},
 SOC:{econ:"state",trade:"prot",cit:"res"},ANL:{econ:"laissez",trade:"free",cit:"res"},COM:{econ:"planned",trade:"prot",cit:"res"},FAS:{econ:"state",trade:"prot",cit:"culture"}};
// reforms: political (p) and social (s); levels from 0
const REFORMS=[
 {id:"slavery",k:"p",n:"Slavery",lv:["Allowed","Freedom of womb","Abolished"]},
 {id:"vote",k:"p",n:"Franchise",lv:["Landed","Wealth-weighted","Universal male","Universal"]},
 {id:"system",k:"p",n:"Voting system",lv:["Open ballot","Secret ballot"]},
 {id:"meet",k:"p",n:"Public meetings",lv:["Forbidden","Allowed"]},
 {id:"press",k:"p",n:"Press",lv:["State press","Censored","Free"]},
 {id:"unions",k:"p",n:"Trade unions",lv:["Forbidden","State-controlled","Free"]},
 {id:"parties",k:"p",n:"Political parties",lv:["Underground","Harassed","Non-secret ballot","Free"]},
 {id:"wage",k:"s",n:"Minimum wage",lv:["None","Trinket","Low","Acceptable","Good"],y:1860},
 {id:"hours",k:"s",n:"Working hours",lv:["No limit","Fourteen hours","Twelve hours","Ten hours","Eight hours"],y:1860},
 {id:"safety",k:"s",n:"Safety at work",lv:["None","Trinket","Low","Acceptable","Good"],y:1870},
 {id:"unemp",k:"s",n:"Unemployment relief",lv:["None","Trinket","Low","Acceptable","Good"],y:1880},
 {id:"pension",k:"s",n:"Pensions",lv:["None","Trinket","Low","Acceptable","Good"],y:1880},
 {id:"health",k:"s",n:"Health care",lv:["None","Trinket","Low","Acceptable","Good"],y:1880},
 {id:"school",k:"s",n:"Schools",lv:["None","Trinket","Low","Acceptable","Good"],y:1850}];
/* ================= MILITARY ================= */
// a: attack, d: defense, m: morale, sp: speed (provinces a month), sup: supply goods a month, cost: goods to raise
const UNITS={
 inf:{n:"Infantry",land:1,a:2,d:4,m:1,sp:1,men:3,sup:{ammo:.3,canned:.2},cost:{arms:10,clothes:4}},
 cav:{n:"Cavalry",land:1,a:3,d:2,m:1,sp:1.4,men:3,sup:{ammo:.2,livestock:.6},cost:{arms:8,livestock:12},rec:1},
 art:{n:"Artillery",land:1,a:4,d:2,m:.8,sp:.8,men:3,sup:{ammo:.8},cost:{arms:18,ammo:6},sup2:1},
 eng:{n:"Engineers",land:1,a:1,d:5,m:1,sp:1,men:3,sup:{ammo:.3,cement:.3},cost:{arms:8,cement:10},tech:"mil_eng"},
 mg:{n:"Machine guns",land:1,a:3,d:7,m:1,sp:.9,men:3,sup:{ammo:1.2},cost:{arms:20,machinery:4},tech:"mg"},
 tank:{n:"Tanks",land:1,a:9,d:5,m:1.2,sp:1.5,men:3,sup:{ammo:1,fuel:1},cost:{arms:20,cars:12,fuel:6},tech:"tank"},
 air:{n:"Aircraft",land:1,a:6,d:3,m:1,sp:2,men:3,sup:{ammo:.6,fuel:1.2},cost:{arms:10,cars:8,electric:6},tech:"plane"},
 frig:{n:"Frigates",land:0,a:3,d:2,hull:2,sp:2,sup:{timber:.4},cost:{ships:8,arms:2}},
 mow:{n:"Ships of the line",land:0,a:6,d:5,hull:5,sp:1.6,sup:{timber:.8},cost:{ships:20,arms:6}},
 clip:{n:"Transports",land:0,a:0,d:1,hull:1,sp:2,cap:3,sup:{timber:.2},cost:{ships:6}},
 iron:{n:"Ironclads",land:0,a:10,d:9,hull:9,sp:1.8,sup:{coal:1},cost:{ships:30,steel:10},tech:"ironclad"},
 cru:{n:"Cruisers",land:0,a:14,d:9,hull:9,sp:2.4,sup:{coal:1.2},cost:{ships:35,steel:12},tech:"cruiser"},
 bb:{n:"Battleships",land:0,a:30,d:25,hull:25,sp:2,sup:{coal:2,fuel:1},cost:{ships:70,steel:30,electric:6},tech:"dread"},
 steam:{n:"Steam transports",land:0,a:0,d:2,hull:2,sp:2.6,cap:6,sup:{coal:.4},cost:{ships:10,steel:3},tech:"steamer"}};
/* ================= TECHNOLOGY ================= */
// f: field (army navy com cul ind), y: year, c: cost in research points, fx: effects
const TECHS=[
 ["mil_drill","army",1836,"Post-Napoleonic drill",{atk:.1}],["army_mass","army",1836,"Mass conscription",{mob:.2}],
 ["percussion","army",1845,"Percussion caps",{atk:.15}],["mil_eng","army",1850,"Military engineering",{def:.15,unit:"eng"}],["staff","army",1855,"General staff",{atk:.1,def:.1,move:.1}],
 ["rifled","army",1860,"Rifled muskets",{atk:.2,def:.1}],["breech","army",1870,"Breech-loading rifles",{atk:.2,def:.2}],["rail_mil","army",1875,"Railway mobilization",{move:.25,mob:.2}],
 ["mg","army",1885,"Machine guns",{def:.3,unit:"mg"}],["smokeless","army",1892,"Smokeless powder",{atk:.2,def:.1}],["howitzer","army",1900,"Quick-firing artillery",{atk:.3}],
 ["trench","army",1910,"Trench warfare",{def:.4}],["infiltration","army",1917,"Infiltration tactics",{atk:.3}],["tank","army",1917,"Tanks",{unit:"tank"}],["mech","army",1930,"Mechanized warfare",{atk:.4,move:.3}],
 ["clipper","navy",1836,"Clipper design",{nav:.1}],["steamer","navy",1845,"Steam transports",{unit:"steam"}],["shell","navy",1850,"Explosive shells",{nav:.2}],["ironclad","navy",1858,"Ironclads",{unit:"iron"}],
 ["turret","navy",1870,"Rotating turrets",{nav:.2}],["cruiser","navy",1880,"Steel cruisers",{unit:"cru"}],["torpedo","navy",1890,"Torpedoes",{nav:.2}],["dread","navy",1906,"Dreadnoughts",{unit:"bb"}],
 ["radio","navy",1912,"Wireless",{nav:.15,move:.05}],["plane","navy",1914,"Military aviation",{unit:"air"}],["carrier","navy",1925,"Naval aviation",{nav:.4}],
 ["banking","com",1836,"Private banking",{tax:.05,inv:.1}],["mercantile","com",1836,"Mercantilism",{tax:.05}],["exchange","com",1845,"Stock exchanges",{inv:.25}],["telegraph","com",1846,"The telegraph",{admin:.1,research:.05}],
 ["joint","com",1850,"Joint-stock companies",{inv:.2,fac:.05}],["central","com",1860,"Central banking",{tax:.1}],["colonial","com",1860,"Colonial administration",{colony:1}],["freight","com",1870,"Railway freight",{rgo:.1}],
 ["stats","com",1880,"National statistics",{tax:.1,admin:.1}],["limited","com",1885,"Limited liability",{inv:.3}],["telephone","com",1890,"The telephone",{admin:.1}],["assembly","com",1913,"Mass marketing",{fac:.1,inv:.2}],["keynes","com",1930,"Economic management",{tax:.1,fac:.05}],
 ["romantic","cul",1836,"Romanticism",{pres:.1}],["ideal","cul",1840,"Idealism",{research:.1}],["empiric","cul",1850,"Empiricism",{research:.15}],["vaccin","cul",1850,"Vaccination",{growth:.0001}],
 ["realism","cul",1860,"Realism",{pres:.1}],["darwin","cul",1865,"Natural selection",{research:.1}],["antisep","cul",1870,"Antisepsis",{growth:.0001}],["mass_school","cul",1875,"Mass education",{lit:.3}],
 ["sociology","cul",1885,"Social science",{research:.1,mil:-.1}],["germ","cul",1890,"Germ theory",{growth:.00015}],["modernism","cul",1905,"Modernism",{pres:.1}],["psych","cul",1915,"Psychology",{mil:-.15}],["antibio","cul",1928,"Antibiotics",{growth:.0002}],
 ["water","ind",1836,"Water-powered mills",{fac:.1}],["mech_spin","ind",1836,"Mechanized spinning",{fac:.1}],["rail1","ind",1840,"Early railways",{rail:1}],["steam_eng","ind",1845,"Steam engines",{fac:.1,rgo:.05}],
 ["bessemer","ind",1856,"The Bessemer process",{fac:.15}],["rail2","ind",1860,"Iron railways",{rail:2}],["mech_farm","ind",1860,"Mechanized farming",{rgo:.2}],["canning","ind",1845,"Canning",{good:"canned"}],
 ["refine","ind",1870,"Oil refining",{good:"fuel",rgo:.05}],["dynamo","ind",1880,"The dynamo",{fac:.1,good:"electric"}],["rail3","ind",1880,"Steel railways",{rail:3}],["chem","ind",1890,"Chemical fertilizer",{rgo:.25}],
 ["combust","ind",1895,"Internal combustion",{good:"cars"}],["electrify","ind",1905,"Electrification",{fac:.15,rail:4}],["assembly_line","ind",1913,"The assembly line",{fac:.2}],["tractor","ind",1920,"Tractors",{rgo:.3}],["synth","ind",1930,"Synthetics",{fac:.1,rgo:.1,rail:5}]
].map(([id,f,y,n,fx])=>({id,f,y,n,fx,c:Math.round(400+(y-1836)*28)}));
/* ================= REGIONS (theatres of war): every province in exactly one; each region is connected by land or sea lane ================= */
const REGIONS=[
 ["brit","The British Isles","LON MID SCO IRE"],
 ["fran","France","PAR BDX LYO MRS"],
 ["lowc","The Low Countries","HOL BRU"],
 ["rhin","The Rhineland","RHN LOR STU"],
 ["ngem","North Germany","HNV SLH COP BER DRE"],
 ["alps","Bavaria and the Alps","MUN ZUR"],
 ["bohe","Bohemia and Silesia","BOH SIL"],
 ["vist","The Vistula","KON PSN WAR"],
 ["danu","The Danube","VIE HUN CRO"],
 ["carp","The Carpathians","GAL TRS BUC"],
 ["nita","North Italy","LOM PIE TUS"],
 ["sita","South Italy","ROM NAP PAL"],
 ["iber","Iberia","MAD GLC LIS CAT AND"],
 ["balk","The Balkans","SRB BSN SAL ATH SOF"],
 ["balt","Scandinavia and the Baltic","STO NOR FIN SPB MSK"],
 ["ukra","Ukraine","UKR ODE"],
 ["musc","Moscow and the Volga","MOS KAZ"],
 ["anat","Anatolia","IST SMY ANK ERZ"],
 ["leva","The Levant and Iraq","DAM BAG"],
 ["arab","Arabia","MEC RIY YEM RUB MUS"],
 ["nile","The Nile and the Horn","CAI ASW SAE KHA ADD MOG"],
 ["cauc","The Caucasus and Persia","TIF TEH SHI"],
 ["tura","Turan and the Steppe","BKH KAB ORE URA"],
 ["sibe","Siberia","OMS IRK SIN"],
 ["punj","The Punjab and Sindh","LAH MUL PES SND"],
 ["nind","North India","DEL NAG NEP CAL ASM"],
 ["sind","South India","BOM HYD MDR CEY"],
 ["indo","Indochina","AVA BKK MLY TNK SGN"],
 ["nchi","North China","PEK JIN XIA"],
 ["schi","South China","NAN WUH FUZ CAN CHG KUN LHA"],
 ["manc","Manchuria and Korea","MUK SEO"],
 ["mong","Mongolia and Xinjiang","ULA URU"],
 ["japa","Japan","EDO OSA KYU TOH"],
 ["eind","The East Indies","BOR SUM JAV MNL"],
 ["ocea","Australasia","SYD WAU AUI NZL"],
 ["magh","The Maghreb","ALG MOR TUN TRP SAH"],
 ["waf","West Africa","SEN GLD LAG SOK"],
 ["caf","Central and East Africa","CGO LUA KEN ZAN MOZ TAN"],
 ["saf","Southern Africa","CPT NAT TRV KAL"],
 ["usea","The US East Coast","NEN NYC RIC"],
 ["miss","The Mississippi","NOL CIN STL"],
 ["fwst","The Far West and Texas","PLN ORG SFO TEX"],
 ["cana","Canada","QUE TOR RUP ARC"],
 ["mexi","Mexico and the Caribbean","CHH MEX YUC GUA HAV HAI JAM"],
 ["ande","The Andes and Colombia","BOG CCS QUI LIM AMI"],
 ["braz","Brazil","BLM BAH RIO POA"],
 ["plat","The River Plate","ASU MVD BUE COR LPZ SCL PAT"],
 ["grnl","Greenland","GRL"]].map(([id,n,p])=>({id,n,p:p.split(" ")}));
const REGION={},REG_OF={};REGIONS.forEach(r=>{REGION[r.id]=r;r.p.forEach(p=>REG_OF[p]=r.id);});
/* ================= SEA REGIONS (stations for fleets): every port province in exactly one ================= */
const SEAREGS=[
 ["nort","The North Sea and Channel","LON MID SCO IRE PAR HOL BRU SLH NOR"],
 ["balt","The Baltic","COP STO KON PSN FIN SPB"],
 ["bisc","The Bay of Biscay and Iberia","BDX GLC LIS AND"],
 ["wmed","The Western Mediterranean","MRS CAT ALG"],
 ["cmed","The Central Mediterranean","PIE TUS ROM NAP PAL TUN TRP"],
 ["adri","The Adriatic and Aegean","LOM CRO BSN SAL ATH SMY"],
 ["emed","The Eastern Mediterranean","CAI DAM"],
 ["blks","The Black Sea","ODE TIF IST BUC ERZ ANK"],
 ["redg","The Red Sea and Persian Gulf","ASW MEC YEM RIY RUB MUS SHI TEH MOG"],
 ["afat","The African Atlantic","MOR SEN GLD LAG LUA KAL CPT"],
 ["eafr","The East African coast","NAT MOZ ZAN TAN"],
 ["indi","The Indian Ocean and Bay of Bengal","SND BOM HYD MDR CEY CAL AVA"],
 ["seas","South-East Asia","TNK SGN BKK MLY BOR SUM JAV MNL"],
 ["chin","The China and Japan seas","PEK JIN NAN CAN FUZ SEO MUK EDO OSA KYU TOH"],
 ["aust","Australasia","SYD WAU NZL AUI"],
 ["arct","The Arctic","URA OMS SIN ARC GRL"],
 ["naat","The North American Atlantic","NEN NYC RIC NOL QUE TOR TEX RUP"],
 ["napa","The North American Pacific","ORG SFO CHH"],
 ["carb","The Caribbean and Gulf","MEX YUC GUA HAV HAI JAM BOG CCS"],
 ["saat","The South American Atlantic","BLM BAH RIO POA MVD BUE COR PAT"],
 ["sapa","The South American Pacific","QUI LIM LPZ SCL"]].map(([id,n,p])=>({id,n,p:p.split(" ")}));
const SEAREG={},SEAR_OF={};SEAREGS.forEach(r=>{SEAREG[r.id]=r;r.p.forEach(p=>SEAR_OF[p]=r.id);});
const PRI_REC=[.6,1,1.5];
const tNm=n=>/^The /.test(n)?"the "+n.slice(4):n;const TF={};TECHS.forEach(t=>TF[t.id]=t);
const FIELDS={army:"Army",navy:"Navy",com:"Commerce",cul:"Culture",ind:"Industry"};
/* ================= WAR ================= */
const WARGOALS={conquer:{n:"Take a province",inf:5,ws:30},puppet:{n:"Make a vassal",inf:8,ws:70},humble:{n:"Humiliate",inf:2,ws:20},free:{n:"Free a people",inf:2,ws:40},colony:{n:"Take a colony",inf:3,ws:25},contain:{n:"Contain the aggressor",inf:0,ws:35}};
const DAYS=30;
/* ================= GENERALS: surnames by culture group ================= */
const SURN={
 en:"Wellesley Hastings Napier Havelock Raglan Gordon Cardigan Campbell Wolseley Roberts Stirling Seymour Cathcart Pakenham Lawrence Haig Grant Sherman Lee Scott".split(" "),
 fr:"Soult Bugeaud Canrobert MacMahon Pelissier Bazaine Cavaignac Faidherbe Chanzy Gallieni Joffre Foch Niel Randon Changarnier Trochu".split(" "),
 de:"Moltke Roon Steinmetz Manteuffel Goeben Blumenthal Radetzky Hess Benedek Schlieffen Hindenburg Falkenhayn Werder Haeseler Kluck Bulow".split(" "),
 it:"Cialdini Lamarmora Garibaldi Durando Cadorna Diaz Medici Pelloux Baratieri Bava Cucchi Pepe Ricotti Cosenz Menabrea".split(" "),
 ib:"Narvaez Prim Espartero Serrano Concha Santa-Anna Bolivar Sucre Paez Bulnes Urquiza Rosas Caxias Osorio Saldanha Sa-da-Bandeira Zaragoza Bustamante".split(" "),
 nl:"Chasse Van-den-Bosch Saxe-Weimar De-Kock Pretorius Joubert Botha De-Wet Cronje Smits Van-Heutsz Diepenbrock".split(" "),
 nd:"Wrangel Bildt Hamilton Dankvart Gerlach Krogh Lunding Hegermann Steinmann Tersmeden Posse Baner".split(" "),
 ru:"Paskevich Gorchakov Menshikov Skobelev Kutuzov Totleben Dragomirov Kuropatkin Brusilov Milyutin Gurko Radetzky-Rus Muravyov Yermolov Tolstoy Rennenkampf".split(" "),
 bk:"Putnik Mishic Stepanovic Kolokotronis Karaiskakis Grivas Averescu Davila Kalafatovic Petrovic Kallergis Mackenzie".split(" "),
 tk:"Osman-Pasha Omer-Pasha Mukhtar Reshid Hasan-Pasha Abdulkerim Ghazi Suleyman Fuad Hafiz Nazim Izzet".split(" "),
 ar:"Ibrahim Abdelkader Urabi Sharif Zubayr Khalid Mansur Tahir Rashid Hamdan Said Qasim Nasr Idris".split(" "),
 pe:"Abbas-Mirza Amir-Kabir Dost-Mohammad Akbar-Khan Sher-Ali Ayub Hasan-Khan Mahmud Naser Ismail Zaman Farrukh".split(" "),
 in:"Singh Ranjit-Singh Hari-Singh Sher-Singh Jang-Bahadur Rana Thapa Talpur Mir-Nasir Dhillon Attariwala Gulab".split(" "),
 ja:"Saigo Oyama Nogi Kuroki Yamagata Oku Togo Terauchi Kawakami Katsura Nozu Takashima".split(" "),
 ea:"Zeng Zuo Li Hongzhang Feng Liu Yi Hong Seo Choe Nguyen-Tri Tran-Hung Tuong Hoang Dung Han".split(" "),
 sa:"Chakri Bunnag Bandula Maha-Nawrahta Nanda Kyaw Thibaw Sihapate Wisut Phraya Bodin Mongkut".split(" "),
 af:"Tewodros Menelik Ras-Alula Shaka Cetshwayo Dingane Moshoeshoe Usman Rabih Samori Toussaint Radama Mkwawa Lobengula".split(" "),
 x:"Aldous Bernard Carew Dumont Esposito Falk Garland Hartmann Ivanov Jansen Kovac Lindqvist Marsh Novak Okafor Pereira".split(" ")};
const CULG={english:"en",american:"en",scottish:"en",french:"fr",belgian:"fr",german:"de",swiss:"de",italian:"it",spanish:"ib",portuguese:"ib",mexican:"ib",andean:"ib",colombian:"ib",chilean:"ib",platinean:"ib",brazilian:"ib",centroamerican:"ib",guarani:"ib",dutch:"nl",boer:"nl",swedish:"nd",danish:"nd",norwegian:"nd",
 russian:"ru",belarusian:"ru",ukrainian:"ru",southslav:"bk",romanian:"bk",greek:"bk",turkish:"tk",turkestani:"tk",arab:"ar",egyptian:"ar",maghrebi:"ar",persian:"pe",afghan:"pe",punjabi:"in",sindhi:"in",nepali:"in",japanese:"ja",han:"ea",manchu:"ea",korean:"ea",vietnamese:"ea",thai:"sa",burmese:"sa",
 amhara:"af",nguni:"af",hausa:"af",malagasy:"af",afrocaribbean:"af",swahili:"af"};
