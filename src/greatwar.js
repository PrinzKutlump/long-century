"use strict";

function julyTies(c, side, enemy){
 if(!c.alive||side.includes(c.tag)||enemy.includes(c.tag)||c.war.length)return 0;
 if(enemy.some(t=>(c.truce[t]||0)>G.t)||side.some(t=>atWarWith(c,G.c[t])))return 0;
 let tie=0;
 for(const t of side){
  const a=G.c[t];
  if(!a?.alive)continue;
  if(c.ally.includes(t)||a.ally.includes(c.tag))tie=Math.max(tie,4);
  if((c.guar||[]).includes(t))tie=Math.max(tie,5);
  if(c.sphere===t||a.sphere===c.tag||c.overlord===t)tie=Math.max(tie,3);
 }
 if(tie&&enemy.some(t=>(c.rel[t]||0)<-35))tie++;
 return tie;
}

function julyAlignment(c,w){
 const a=julyTies(c,w.att,w.def),d=julyTies(c,w.def,w.att);
 return a===d?null:{side:a>d?1:2,weight:Math.max(a,d)};
}

function julyJoin(w,c,side){
 const current=julyAlignment(c,w);
 if(!current||current.side!==side||w.july.answers[c.tag])return false;
 joinWar(w,c.tag,side);
 w.july.answers[c.tag]="joined";
 w.july.wear[c.tag]=0;
 msg("war",c.n+" enters the July Crisis war alongside "+G.c[(side===1?w.att:w.def)[0]].n+".");
 return true;
}

function startJulyWar(c){
 const w=declareWar(c.tag,"SER",{k:"humble",tag:"SER",hist:1,managed:true});
 if(!w){msg("diplomacy","The ultimatum expires without a declaration of war.");return;}
 w.july={wear:{[c.tag]:0,SER:0},answers:{},general:false};
 msg("diplomacy","The July Crisis becomes a regional war. Treaty partners must decide whether to intervene.");
}

ev("july1914").run=()=>{
 const c=G.c.AUS,ser=G.c.SER;
 const involved=Object.values(G.c).filter(n=>isGP(n.tag));
 const rivalBlocs=involved.some(n=>julyTies(n,[c.tag],["SER"])>=4)&&involved.some(n=>julyTies(n,["SER"],[c.tag])>=4);
 if((c.rel.SER||0)<-25&&rivalBlocs)startJulyWar(c);
 else {
  hr("SER",20)(c);hr("RUS",20)(c);
  msg("diplomacy",c.n+" seeks mediation with "+ser.n+".");
 }
};

function julySeparate(w,c){
 const own=w.att.includes(c.tag)?w.att:w.def,foes=own===w.att?w.def:w.att;
 const i=own.indexOf(c.tag);
 if(i<1)return false;
 own.splice(i,1);
 c.war=c.war.filter(id=>id!==w.id);
 for(const t of foes){
  c.truce[t]=Math.max(c.truce[t]||0,G.t+48);
  G.c[t].truce[c.tag]=Math.max(G.c[t].truce[c.tag]||0,G.t+48);
 }
 for(const p of G.plist)if(p.ctl!==p.o&&((p.o===c.tag&&foes.includes(p.ctl))||(p.ctl===c.tag&&foes.includes(p.o)))&&!atWarWith(G.c[p.o],G.c[p.ctl]))p.ctl=p.o;
 w.july.answers[c.tag]="withdrawn";
 c.pres=Math.max(0,c.pres-5);
 msg("diplomacy",c.n+" signs a separate peace and leaves the war.");
 return true;
}

const JULY_EXIT_WEAR=65;
function julyArmistice(w,c){
 const sides=w.att.includes(c.tag)?[w.att,w.def]:[w.def,w.att],j=w.july;
 if(sides[0][0]!==c.tag)return false;
 const signedScore=sides[0]===w.att?w.ws:-w.ws;
 const enemyWear=j.wear[sides[1][0]]||0;
 if(enemyWear<45&&Math.abs(signedScore)>15&&signedScore<35)return false;
 endWar(w,signedScore>=35?(sides[0]===w.att?"att":"def"):"white");
 return true;
}

function julyCard(w,c,kind,side){
 if(kind==="entry"){
  const leader=G.c[(side===1?w.att:w.def)[0]].n;
  return cardOpen({kind:"july",id:"july-entry",ctx:{war:w.id,side},title:"The call to intervene",txt:leader+" is asking for support. Your current treaties make intervention possible.",
   history:"In 1914 several powers entered the war following a series of separate decisions. Some remained neutral.",
   def:"neutral",opts:[{k:"join",label:"Join "+leader,txt:"Enter the war on that side."},{k:"neutral",label:"Remain neutral",txt:"Decline entry in this escalation."}]});
 }
 const lead=w.att[0]===c.tag||w.def[0]===c.tag;
 return cardOpen({kind:"july",id:"july-exit",ctx:{war:w.id},title:"A government under strain",txt:"War exhaustion has reached "+Math.round(w.july.wear[c.tag])+" out of 100. Unless you choose otherwise, your government does what any other would at this point.",
  def:lead?"armistice":"exit",opts:[{k:lead?"armistice":"exit",label:lead?"Propose an armistice":"Sign a separate peace",txt:lead?"If your opponent agrees, end the war. The war score and enemy exhaustion affect acceptance.":"Return occupied provinces, leave the war, sign a four-year truce and lose 5 prestige."},{k:"continue",label:"Continue the war",txt:"Keep fighting. A new peace review can follow in twelve months."}]});
}

function chooseJulyCard(card,key){
 const c=G.c[G.player];
 if(!c?.alive)return;
 if(card.id==="july-conference"){
  const p=(G.peaceConferences||[]).find(x=>x.war===card.ctx.war);
  if(p&&!p.resolved)resolveConference(p,key);
  return;
 }
 const w=G.wars.find(x=>x.id===card.ctx.war);
 if(!w?.july)return;
 const j=w.july;
 if(key==="join")julyJoin(w,c,card.ctx.side);
 if(key==="neutral")j.answers[c.tag]="neutral";
 if(key==="continue")(j.review||={})[c.tag]=G.t+12;
 if(key==="exit")julySeparate(w,c);
 if(key==="armistice"&&!julyArmistice(w,c))msg("diplomacy","The opposing government declines the armistice.");
}

function julyWear(w,c){
 const land=provsOf(c.tag),inc=Math.max(1,c.stat.inc||1);
 const occupied=land.filter(p=>p.ctl&&p.ctl!==c.tag).length/Math.max(1,land.length);
 const deficit=clamp(-(c.stat.net||0)/inc,0,1);
 const warSpending=clamp((c.stat.gov||0)/inc,0,1);
 const j=w.july,previous=j.wear[c.tag]||0;
 j.wear[c.tag]=clamp(previous+.45+1.4*occupied+.55*deficit+.25*warSpending,0,100);
 c.we=clamp((c.we||0)+Math.max(0,j.wear[c.tag]-previous),0,100);
 return j.wear[c.tag];
}

function resolveConference(p,key){
 const win=G.c[p.chair],lose=G.c[p.other];
 if(p.resolved||!win?.alive||!lose?.alive)return;
 p.resolved=key;
 if(key==="rebuild"){
  const amount=Math.min(Math.max(0,win.tr),incOf(win)*.5);
  if(amount<=0||((lose.rel[win.tag]||0)<-75)){
   p.resolved="rebuild-refused";
   msg("diplomacy","The reconstruction proposal was refused. Existing peace terms stand.");
   return;
  }
  win.tr-=amount;
  lose.tr+=amount;
  hr(lose.tag,25)(win);
  win.truce[lose.tag]=Math.max(win.truce[lose.tag]||0,G.t+72);
  lose.truce[win.tag]=Math.max(lose.truce[win.tag]||0,G.t+72);
  msg("diplomacy","The conference agrees on "+money(amount)+" in reconstruction aid and a six-year truce.");
  return;
 }
 if(key==="reparations"&&p.victory){
  (lose.owes||=[]).push({to:win.tag,share:.04,until:G.t+36});
  hr(lose.tag,-15)(win);
 }else{
  hr(lose.tag,20)(win);
  win.truce[lose.tag]=Math.max(win.truce[lose.tag]||0,G.t+72);
  lose.truce[win.tag]=Math.max(lose.truce[win.tag]||0,G.t+72);
 }
 msg("diplomacy","The peace conference adopts "+(key==="reparations"&&p.victory?"three years of reparations.":"a reconciliation agreement."));
}

function julyConferences(){
 for(const p of G.peaceConferences||[]){
  if(p.resolved||G.t<=p.t)continue;
  if(!alive(p.chair)||!alive(p.other)){p.resolved="lapsed";continue;}
  if(p.chair===G.player&&!G.c[p.chair].ai){
   if(G.card)continue;
   const opts=[{k:"reconcile",label:"Seek reconciliation",txt:"Improve relations by 20 and extend the minimum truce to six years."}];
   if(G.c[p.chair].tr>0)opts.push({k:"rebuild",label:"Offer reconstruction aid",txt:"Offer up to half a month’s revenue. If accepted, relations improve by 25 and the truce lasts at least six years."});
   if(p.victory)opts.push({k:"reparations",label:"Demand reparations",txt:"Receive up to 4% of the other government's monthly income for three years. Relations worsen by 15."});
   cardOpen({kind:"july",id:"july-conference",ctx:{war:p.war},title:"The peace conference",txt:"The fighting is over. You now set the supplementary terms with "+G.c[p.other].n+".",def:"reconcile",opts});
  }else resolveConference(p,p.victory&&Math.abs(p.score)>=50?"reparations":"reconcile");
 }
}

function julyMonth(){
 for(const w of G.wars.slice()){
  if(!w.july)continue;
  const j=w.july,age=G.t-w.start;
  if(age>0&&age<=18){
   for(const c of Object.values(G.c)){
    if(j.answers[c.tag])continue;
    const choice=julyAlignment(c,w);
    if(!choice)continue;
    if(c.tag===G.player&&!c.ai){if(!G.card)julyCard(w,c,"entry",choice.side);}
    else if(choice.weight>=4)julyJoin(w,c,choice.side);
   }
  }
  const participants=w.att.concat(w.def);
  if(!j.general&&participants.filter(isGP).length>=3&&w.att.some(isGP)&&w.def.some(isGP)){
   j.general=true;
   msg("war","The regional conflict has escalated into a Great War.");
  }
  for(const tag of participants){
   const c=G.c[tag],wear=julyWear(w,c),lead=w.att[0]===tag||w.def[0]===tag;
   /* A4: one threshold for every seat. The AI acts at JULY_EXIT_WEAR; a human gets the same decision at the same point, as a card whose
      default option is the AI's policy (an armistice for a war leader, a separate peace for anyone else), with the same consequences.
      A voluntary earlier peace remains available through the diplomacy screens. */
   if(wear<JULY_EXIT_WEAR||G.t<(j.review?.[tag]||0))continue;
   if(tag===G.player&&!c.ai){
    if(!G.card)julyCard(w,c,"exit");
   }else if(lead){if(julyArmistice(w,c))break;}
   else julySeparate(w,c);
  }
 }
 julyConferences();
}

{
 const nextEvents=eventsMonth;
 eventsMonth=function(){nextEvents();julyMonth();};
 const finish=endWar;
 endWar=function(w,winner){
  if(w.july?.general){
   const chair=(winner==="def"?w.def:w.att)[0],other=(winner==="def"?w.att:w.def)[0];
   (G.peaceConferences||=[]).push({war:w.id,t:G.t,chair,other,victory:winner==="att"||winner==="def",score:w.ws});
  }
  return finish(w,winner);
 };
}
