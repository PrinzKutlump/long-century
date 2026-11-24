"use strict";
/* ================= FLAGS (1836 designs where they existed) ================= */
// h: horizontal stripes, v: vertical stripes, n: Nordic cross [field, cross, inner], c: centred cross, d: disc [field, disc], m: crescent [field], s: plain [field]
const FLAGS={GBR:["uk"],FRA:["v","#0055a4","#fff","#ef4135"],PRU:["h","#111","#fff"],AUS:["h","#111","#f3c614"],RUS:["h","#fff","#0039a6","#d52b1e"],OTT:["m","#c8102e"],SPA:["h","#c60b1e","#ffc400","#ffc400","#c60b1e"],
 USA:["us"],NED:["h","#ae1c28","#fff","#21468b"],BEL:["v","#111","#fdda24","#ef3340"],POR:["v","#1f4e9c","#fff"],SWE:["n","#006aa7","#fecc00"],DEN:["n","#c8102e","#fff"],SAR:["c","#c8102e","#fff"],TUS:["h","#c8102e","#fff","#c8102e"],
 PAP:["v","#ffe000","#fff"],SIC:["s","#f4f1e6"],BAV:["h","#fff","#0098d4"],SAX:["h","#fff","#007a3d"],HAN:["h","#f3c614","#fff"],WUR:["h","#111","#c8102e"],SWI:["c","#d52b1e","#fff"],GRE:["gr"],SER:["h","#c6363c","#0c4076","#fff"],
 RMN:["v","#002b7f","#fcd116","#ce1126"],EGY:["m","#c8102e"],PER:["h","#239f40","#fff","#da0000"],AFG:["s","#111"],BUK:["s","#2e7d32"],PUN:["s","#f3a712"],SND:["s","#2e7d32"],NEP:["s","#c8102e"],BUR:["s","#f3c614"],SIA:["s","#c8102e"],
 DAI:["s","#f3c614"],CHI:["s","#f3c614","#1f4e9c"],KOR:["d","#fff","#c8102e"],JAP:["d","#fff","#bc002d"],OMA:["s","#c8102e"],YEM:["s","#c8102e"],NEJ:["s","#2e7d32"],TUN:["m","#c8102e"],MOR:["s","#c1272d"],SOK:["h","#fff","#2e7d32"],
 ETH:["h","#078930","#fcdd09","#da121a"],ZUL:["s","#6b4f2a"],TRN:["h","#c8102e","#fff","#1f4e9c"],MDG:["v","#fff","#fc3d32"],MEX:["v","#006847","#fff","#ce1126"],TEX:["tx"],UCA:["h","#0f47af","#fff","#0f47af"],HAI:["h","#00209f","#d21034"],
 CLM:["h","#fcd116","#fcd116","#003893","#ce1126"],VNZ:["h","#ffcc00","#00247d","#cf142b"],ECU:["h","#ffdd00","#ffdd00","#034ea2","#ed1c24"],PEU:["v","#d91023","#fff","#d91023"],BOL:["h","#d52b1e","#f9e300","#007934"],CHL:["cl"],ARG:["h","#74acdf","#fff","#74acdf"],
 PRG:["h","#d52b1e","#fff","#0038a8"],URU:["h","#fff","#0038a8","#fff","#0038a8","#fff"],BRA:["br"],POL:["h","#fff","#dc143c"],HUN:["h","#ce2939","#fff","#477050"],CZE:["h","#fff","#d7141a"],BUL:["h","#fff","#00966e","#d62612"],IRL:["v","#169b62","#fff","#ff883e"],
 NOR:["n","#ba0c2f","#fff","#00205b"],FIN:["n","#fff","#003580"],CUB:["h","#002a8f","#fff","#002a8f","#fff","#002a8f"],PHI:["h","#0038a8","#ce1126"],UKR:["h","#0057b7","#ffd700"],ARM:["h","#d90012","#0033a0","#f2a800"],ALB:["s","#e41e20","#111"],
 CRO:["h","#ff0000","#fff","#171796"],ITA:["v","#009246","#fff","#ce2b37"],GER:["h","#111","#fff","#dd0000"],CSA:["csa"]};
function flagSVG(tag,cls){const f=FLAGS[tag]||["s",(G&&G.c[tag]&&G.c[tag].col)||"#999"],k=f[0];let b="";
 if(k==="h"){const n=f.length-1;for(let i=1;i<=n;i++)b+=`<rect y="${(i-1)*20/n}" width="30" height="${20/n+.1}" fill="${f[i]}"/>`;}
 else if(k==="v"){const n=f.length-1;for(let i=1;i<=n;i++)b+=`<rect x="${(i-1)*30/n}" width="${30/n+.1}" height="20" fill="${f[i]}"/>`;}
 else if(k==="n")b=`<rect width="30" height="20" fill="${f[1]}"/><rect x="8" width="5" height="20" fill="${f[2]}"/><rect y="7.5" width="30" height="5" fill="${f[2]}"/>`+(f[3]?`<rect x="9.4" width="2.2" height="20" fill="${f[3]}"/><rect y="8.9" width="30" height="2.2" fill="${f[3]}"/>`:"");
 else if(k==="c")b=`<rect width="30" height="20" fill="${f[1]}"/><rect x="13" y="4" width="4" height="12" fill="${f[2]}"/><rect x="9" y="8" width="12" height="4" fill="${f[2]}"/>`;
 else if(k==="d")b=`<rect width="30" height="20" fill="${f[1]}"/><circle cx="15" cy="10" r="5.6" fill="${f[2]}"/>`;
 else if(k==="m")b=`<rect width="30" height="20" fill="${f[1]}"/><circle cx="13" cy="10" r="5" fill="#fff"/><circle cx="14.4" cy="10" r="4" fill="${f[1]}"/><circle cx="19" cy="10" r="1.6" fill="#fff"/>`;
 else if(k==="s")b=`<rect width="30" height="20" fill="${f[1]}"/>`+(f[2]?`<rect x="11" y="6" width="8" height="8" fill="${f[2]}"/>`:"");
 else if(k==="uk")b=`<rect width="30" height="20" fill="#012169"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4"/><path d="M0 0L30 20M30 0L0 20" stroke="#c8102e" stroke-width="1.4"/><rect x="12" width="6" height="20" fill="#fff"/><rect y="7" width="30" height="6" fill="#fff"/><rect x="13.3" width="3.4" height="20" fill="#c8102e"/><rect y="8.3" width="30" height="3.4" fill="#c8102e"/>`;
 else if(k==="us"){for(let i=0;i<7;i++)b+=`<rect y="${i*20/6.5}" width="30" height="${20/13}" fill="#b22234"/>`;b=`<rect width="30" height="20" fill="#fff"/>`+b+`<rect width="13" height="10.8" fill="#3c3b6e"/>`;}
 else if(k==="gr"){b=`<rect width="30" height="20" fill="#fff"/>`;for(let i=0;i<9;i+=2)b+=`<rect y="${i*20/9}" width="30" height="${20/9}" fill="#0d5eaf"/>`;b+=`<rect width="11" height="11.1" fill="#0d5eaf"/><rect x="4.4" width="2.2" height="11.1" fill="#fff"/><rect y="4.4" width="11" height="2.2" fill="#fff"/>`;}
 else if(k==="tx")b=`<rect width="30" height="20" fill="#fff"/><rect y="10" width="30" height="10" fill="#bf0a30"/><rect width="10" height="20" fill="#002868"/><circle cx="5" cy="10" r="2" fill="#fff"/>`;
 else if(k==="cl")b=`<rect width="30" height="20" fill="#fff"/><rect y="10" width="30" height="10" fill="#d52b1e"/><rect width="10" height="10" fill="#0039a6"/><circle cx="5" cy="5" r="1.8" fill="#fff"/>`;
 else if(k==="br")b=`<rect width="30" height="20" fill="#009c3b"/><path d="M15 2.5L27 10L15 17.5L3 10Z" fill="#ffdf00"/><circle cx="15" cy="10" r="4" fill="#002776"/>`;
 else if(k==="csa")b=`<rect width="30" height="20" fill="#bf0a30"/><path d="M0 0L30 20M30 0L0 20" stroke="#fff" stroke-width="4.4"/><path d="M0 0L30 20M30 0L0 20" stroke="#002868" stroke-width="3"/>`;
 return`<svg class="${cls||"fl"}" viewBox="0 0 30 20" preserveAspectRatio="none" aria-hidden="true">${b}</svg>`;}
const flagOf=tag=>{const c=G&&G.c[tag];return flagSVG(c&&c.formed?c.formed:tag);};
