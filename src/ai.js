"use strict";
/* ================= AI: budget ================= */
function aiBudget(c){const st=c.stat;/* a state whose interest eats a third of its income and still runs a deficit gives up on its creditors, now and then */ if(c.debt>0&&(st.interest||0)>(st.inc||1)*.3&&(st.net||0)<0&&c.insol>0&&rng()<.08)defaultDebt(c,true);
 const inc=Math.max(1,st.inc||0),net=st.net||0,cushion=c.tr/inc,want=cushion<3?inc*.06:cushion>8?-inc*.1:0,gap=net-want,t=c.tax,sp=c.sp,step=clamp(Math.abs(gap)/inc*.15,.005,.03);
 if(cushion>6)aiBuild(c);const tmin=c.trade==="prot"?(c.civ?.25:.12):0,tmax=TRADE[c.trade].max;if(c.tariff<tmin)c.tariff=r2(Math.min(tmin,c.tariff+.02));else if(gap>0&&cushion>18&&c.tariff>tmin)c.tariff=r2(Math.max(tmin,c.tariff-.01));else if(gap<0&&cushion<4&&c.tariff<tmax)c.tariff=r2(Math.min(tmax,c.tariff+.01));if(c.tariff>tmax)c.tariff=tmax;
 if(gap<0){if(c.debt>inc*12&&sp.mil>.35)sp.mil=Math.max(.35,sp.mil-step);else if(t[2]<.65)t[2]=Math.min(.65,t[2]+step);else if(t[1]<.5)t[1]=Math.min(.5,t[1]+step);else if(t[0]<.45)t[0]=Math.min(.45,t[0]+step);else if(sp.edu>.3)sp.edu-=step;else if(sp.adm>.4)sp.adm-=step;else if(sp.mil>.3)sp.mil-=step;}
 else if(gap>0){if(t[0]>0)t[0]=Math.max(0,t[0]-step);else if(sp.edu<1)sp.edu+=step;else if(sp.adm<1)sp.adm+=step;else if(t[1]>0)t[1]=Math.max(0,t[1]-step);else if(sp.mil<1)sp.mil+=step;else if(t[2]>0)t[2]=Math.max(0,t[2]-step);}
 for(const k in sp)sp[k]=r2(sp[k]);for(let i=0;i<3;i++)t[i]=r2(t[i]);}
function aiMonth(){for(const tag in G.c){const c=G.c[tag];if(!c.alive||!c.ai)continue;aiBudget(c);}}
/* a rich state builds railways and, where its policy allows, factories */
function aiBuild(c){const ps=provsOf(c.tag).filter(p=>p.ctl===p.o&&p.col),busy=sum(ps,p=>p.build.filter(b=>b.k!=="bld").length);if(busy>=Math.min(10,2+Math.floor(ps.length/4)))return;
 const rm=railMax(c);let best=null,bv=0;for(const p of ps){if(p.rail>=rm||p.build.some(b=>b.k==="rail"))continue;const v=(p.pop/1000+sum(p.factories,f=>f.lv)*2+(p.mine?3:0))/(1+p.rail);if(v>bv){bv=v;best=p;}}
 if(best&&c.tr>RAIL_COST.timber*4&&aiOrder(c,{kind:"rail",province:best.id}).ok)return;
 if(ECON[c.econ].build>0&&c.civ&&c.tr>17000*2&&!(c.fill.machinery<.9)&&((G.tight&&G.tight.machinery)||1)<1.08&&!ps.some(p=>p.build.some(b=>b.k==="upg"))){for(const p of ps)for(const f of p.factories)if(f.own==="state"&&upgCan(c,p,f).ok&&f.loss===0){startUpgrade(c,p,f,true);return;}}
 if(c.civ&&(c.stat.lit||0)>.3&&c.tr>17000*3*facPrem(c)&&(ECON[c.econ].build>0||rng()<.5)&&(civRamp(c)>=1||rng()<civRamp(c))){const g=bestGood(c,true);if(g){const pr=bestSite(c,g);if(pr)aiOrder(c,{kind:"factory",province:pr.id,good:g});}}}
