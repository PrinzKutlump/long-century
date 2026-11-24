/* B1: grain freight. A sparse graph over the map's own land adjacency (ADJ) and sea lanes (SEAADJ). Every edge has a capacity, a controller and a cost.
 * One matching order for every nation: (1) home demand, (2) treaty and corridor commitments, (3) residual exchange.
 * Capacity is spent once per edge across all three passes; a tariff is charged once per delivery at the border, never per edge.
 * Provinces keep origin, destination and access; nothing here aggregates regions. Prices are per unit of grain at the world price. */
const FREIGHT={landCap:400,railCap:600,seaCap:800,portCap:800,landCost:.03,seaCost:.012,seaMonth:.01,portFee:.01,reach:.25,every:6}; /* the monthly path settles every third month at three months' supply, demand and capacity, to stay inside the 130 ms budget */
let _FG=null,_FGadj=null;
function freightEdgeId(a,b){return a<b?a+"|"+b:b+"|"+a;}
/* static structure, rebuilt only when the map is rebuilt (a new game): edge list and neighbour lists */
function freightGraph(){
 if(_FG&&_FGadj===ADJ)return _FG;
 const edges={},nb={};
 const add=(a,b,kind,m)=>{const id=freightEdgeId(a,b);if(edges[id])return;edges[id]={id,a:a<b?a:b,b:a<b?b:a,kind,m:m||1};(nb[a]=nb[a]||[]).push(id);(nb[b]=nb[b]||[]).push(id);};
 for(const a in ADJ)for(const b of ADJ[a])add(a,b,"land");
 for(const a in SEAADJ)for(const[b,m]of SEAADJ[a])add(a,b,"sea",m);
 for(const k in nb)nb[k].sort();
 const names=Object.keys(nb).sort(),ix={};names.forEach((n,i)=>{ix[n]=i;});
 _FGadj=ADJ;return _FG={edges,nb,names,ix};
}
/* dynamic state of an edge this month: capacity, cost per unit as a fraction of price, open or closed. Same function for every nation. */
function freightEdge(e,closed,months){
 const A=P(e.a),B=P(e.b),mo=months||1,shut=(closed||G.freightClosed||{})[e.id];
 if(e.kind==="land"){const r=Math.min(A.rail||0,B.rail||0);return{cap:shut?0:mo*(FREIGHT.landCap+FREIGHT.railCap*r),cost:FREIGHT.landCost/(1+r),open:!shut&&!A.waste&&!B.waste};}
 const port=Math.min(A.port||0,B.port||0);
 return{cap:shut?0:mo*(FREIGHT.seaCap+FREIGHT.portCap*port),cost:FREIGHT.seaCost*e.m+FREIGHT.seaMonth+FREIGHT.portFee*2/(1+port),open:!shut&&!!A.sea&&!!B.sea};
}
/* who controls travel into a node: its controller (occupier), else its owner */
function freightCtl(id){const p=P(id);return p.ctl||p.o||null;}
function freightBlocked(shipper,node){const c=freightCtl(node);return !!(shipper&&c&&c!==shipper&&hostile(shipper,c));}
/* cheapest path tree from one node over open edges that still have capacity and are not held by an enemy of the shipper */
function freightTree(from,shipper,F){
 const n=F.names.length,dist=new Float64Array(n).fill(Infinity),pn=new Int32Array(n).fill(-1),pe=new Array(n),done=new Uint8Array(n),blk=F.block[shipper]||(F.block[shipper]={});
 const hd=[],hv=[]; /* binary heap of (distance, node index); equal distances break by index, which is name order */
 const lt=(i,j)=>hd[i]<hd[j]||(hd[i]===hd[j]&&hv[i]<hv[j]);
 const sw=(i,j)=>{[hd[i],hd[j]]=[hd[j],hd[i]];[hv[i],hv[j]]=[hv[j],hv[i]];};
 const push=(d,v)=>{let i=hd.push(d)-1;hv.push(v);while(i>0){const p=(i-1)>>1;if(!lt(i,p))break;sw(i,p);i=p;}};
 const pop=()=>{const d=hd[0],v=hv[0],ld=hd.pop(),lv=hv.pop();if(hd.length){hd[0]=ld;hv[0]=lv;let i=0;for(;;){let m=i;const l=2*i+1,r=l+1;if(l<hd.length&&lt(l,m))m=l;if(r<hd.length&&lt(r,m))m=r;if(m===i)break;sw(i,m);i=m;}}return[d,v];};
 const s0=F.ix[from];dist[s0]=0;push(0,s0);
 while(hd.length){
  const[d,u]=pop();if(done[u])continue;done[u]=1;
  for(const[id,v,s]of F.adj[u]){
   if(done[v]||!s.open||F.used[id]>=s.cap-1e-9)continue;
   let b=blk[v];if(b===undefined)b=blk[v]=freightBlocked(shipper,F.names[v]);
   if(b)continue;
   const nd=d+s.cost;if(nd<=FREIGHT.reach&&nd<dist[v]-1e-12){dist[v]=nd;pn[v]=u;pe[v]=id;push(nd,v);}
  }
 }
 return{dist:id=>{const v=dist[F.ix[id]];return v===Infinity?null:v;},pn,pe,F};
}
/* the edges of the cheapest path to a node, in order from the source: [edgeId, fromNode, toNode] */
function freightPath(tree,to){const ids=[],F=tree.F;let v=F.ix[to];while(tree.pn[v]>=0){ids.push([tree.pe[v],F.names[tree.pn[v]],F.names[v]]);v=tree.pn[v];}return ids.reverse();}
/* no tariff inside a nation, a sphere or an overlord's realm */
function freightExempt(a,b){
 if(!a||!b)return false;if(a===b)return true;
 const A=G.c[a],B=G.c[b];if(!A||!B)return false;
 return A.sphere===b||B.sphere===a||A.overlord===b||B.overlord===a||!!(A.sphere&&A.sphere===B.sphere&&A.civ&&B.civ);
}
/* this month's state of every edge, with adjacency carrying it; the used-capacity ledger starts empty */
function freightFrame(closed,months){
 const{edges,nb,names,ix}=freightGraph(),F={state:{},used:{},adj:{},block:{},names,ix};
 for(const id in edges){F.state[id]=freightEdge(edges[id],closed,months);F.used[id]=0;}
 for(const u in nb)F.adj[ix[u]]=nb[u].map(id=>[id,ix[edges[id].a===u?edges[id].b:edges[id].a],F.state[id]]);
 return F;
}
/* The matching. sellers and buyers are provinces: {id,tag,qty}. commitments: {seller,buyer,qty} between nations. opt: {price, tariff:(tag)=>rate, closed:{edgeId:1}}. */
function freightMatch(sellers,buyers,commitments,opt){
 const price=opt.price,tariffOf=opt.tariff||(t=>(G.c[t]&&G.c[t].tariff)||0);
 const F=freightFrame(opt.closed,opt.months);
 const byId=(x,y)=>x.id<y.id?-1:1;
 const S=sellers.filter(s=>s.qty>1e-9).map(s=>({...s,rem:s.qty})).sort(byId);
 const B=buyers.filter(b=>b.qty>1e-9).map(b=>({...b,rem:b.qty,got:0,paid:0})).sort(byId);
 const receipts=[],trees={},carrier={};let sat=0;
 let flows=0;
 const treeOf=s=>{if(!trees[s.id]){trees[s.id]=freightTree(s.id,s.tag,F);trees[s.id].stamp=flows;}return trees[s.id];};
 const exposureNow=()=>{const x={};for(const b of B){let m=null;for(const s of S){if(s.rem<=1e-9)continue;const t=treeOf(s);if(t.dist(b.id)==null)continue;
  const l=price*(1+t.dist(b.id))*(1+(freightExempt(s.tag,b.tag)?0:tariffOf(b.tag)));if(m==null||l<m)m=l;}x[b.id]=m;}return x;};
 const exposureOpen=opt.exposure?exposureNow():null;
 /* one pass: repeatedly ship along the cheapest landed (seller, buyer) pair that is allowed, until nothing allowed is left to ship */
 const pass=(name,allow,take)=>{
  const cand=new Map(); /* each seller's cheapest allowed buyer; only recomputed when its tree changed or that buyer filled */
  const pick=s=>{const t=treeOf(s);let best=null;
   for(const b of B){if(b.rem<=1e-9||t.dist(b.id)==null||!allow(s,b))continue;
    const ex=freightExempt(s.tag,b.tag)||name==="commit",land=price*(1+t.dist(b.id))*(1+(ex?0:tariffOf(b.tag)));
    if(!best||land<best.land-1e-12||(Math.abs(land-best.land)<=1e-12&&b.id<best.b.id))best={s,b,t,land,ex};}
   return best;};
  for(;;){
   let best=null;
   for(const s of S){if(s.rem<=1e-9)continue;let c=cand.get(s);
    if(c===undefined||(c&&(c.b.rem<=1e-9||!allow(s,c.b)))){c=pick(s);cand.set(s,c);}
    if(c&&(!best||c.land<best.land-1e-12||(Math.abs(c.land-best.land)<=1e-12&&(s.id+c.b.id)<(best.s.id+best.b.id))))best=c;}
   if(!best)break;
   const{s,b,t,ex}=best,path=freightPath(t,b.id);
   let q=Math.min(s.rem,b.rem,take?take.room(s,b):1e18);for(const[id]of path)q=Math.min(q,F.state[id].cap-F.used[id]);
   if(q<=1e-9){if(t.stamp===flows)break;delete trees[s.id];cand.delete(s);continue;} /* a stale tree: its costs are lower bounds, so only the winner is checked and rebuilt */
   flows++;
   const pay={};let unit=0,full=false;
   for(const[id,u,v]of path){F.used[id]+=q;if(F.used[id]>=F.state[id].cap-1e-9){sat++;full=true;}const ctl=freightCtl(v)||"carrier";unit+=F.state[id].cost;pay[ctl]=(pay[ctl]||0)+price*F.state[id].cost*q;}
   s.rem-=q;b.rem-=q;b.got+=q;if(take)take.book(s,b,q);
   const base=q*price,freight=base*unit,tariff=ex?0:base*tariffOf(b.tag);
   b.paid+=base+freight+tariff;
   receipts.push({pass:name,from:s.id,to:b.id,seller:s.tag,buyer:b.tag,qty:q,base,freight,tariff,exempt:ex,path:path.map(x=>x[0]),pay});
   for(const k in pay)carrier[k]=(carrier[k]||0)+pay[k];
  }
 };
 /* pass 1: home demand. A buyer is served first by sellers of its own nation. */
 pass("home",(s,b)=>s.tag===b.tag);
 /* pass 2: commitments, each limited to its agreed quantity and tariff-exempt */
 const cl=(commitments||[]).map(c=>({...c,left:c.qty})),ofPair=(s,b)=>cl.find(c=>c.left>1e-9&&c.seller===s.tag&&c.buyer===b.tag);
 pass("commit",(s,b)=>!!ofPair(s,b),{room:(s,b)=>ofPair(s,b).left,book:(s,b,q)=>{ofPair(s,b).left-=q;}});
 /* pass 3: residual exchange at landed cost; tariff unless exempt */
 pass("exchange",()=>true);
 /* after the passes: what the next unit would cost with this month's capacity spent (null when the buyer is cut off or the links are full) */
 for(const k in trees)delete trees[k];
 const exposure=opt.exposure?exposureNow():null;
 const util={};for(const id in F.used)if(F.used[id]>0)util[id]=F.used[id]/F.state[id].cap;
 return{receipts,delivered:Object.fromEntries(B.map(b=>[b.id,b.got])),unmet:Object.fromEntries(B.map(b=>[b.id,b.rem])),unsold:Object.fromEntries(S.map(s=>[s.id,s.rem])),exposureOpen,exposure,used:F.used,util,carrier,saturated:sat};
}
/* totals that must reconcile: what buyers paid equals what sellers, controllers and the buyers' treasuries received */
function freightTotals(rs){
 const t={qty:0,base:0,freight:0,tariff:0,paid:0,byController:{},byBuyer:{}};
 for(const r of rs){t.qty+=r.qty;t.base+=r.base;t.freight+=r.freight;t.tariff+=r.tariff;for(const k in r.pay)t.byController[k]=(t.byController[k]||0)+r.pay[k];t.byBuyer[r.buyer]=(t.byBuyer[r.buyer]||0)+r.tariff;}
 t.paid=t.base+t.freight+t.tariff;return t;
}
/* Monthly path, grain only: provinces with a surplus offer it, provinces with a shortfall ask. Same rule for every nation.
 * This records receipts and route use (G.grainFreight, not saved); it does not yet move the household market. */
function freightMonth(supply,demand){
 if(G.t%FREIGHT.every)return;
 const mo=FREIGHT.every,sellers=[],buyers=[];
 for(const p of G.plist){if(!p.o||p.waste||!G.c[p.o]||!G.c[p.o].alive||!supply[p.id]||!demand[p.id])continue;
  const sv=supply[p.id].grain||0,dm=demand[p.id].grain||0;
  if(sv>dm&&p.ctl===p.o)sellers.push({id:p.id,tag:p.o,qty:(sv-dm)*mo});else if(dm>sv)buyers.push({id:p.id,tag:p.o,qty:(dm-sv)*mo});}
 const commits=[];
 for(const tag in G.c){const c=G.c[tag],r=c.commercialRoute;if(c.alive&&r&&r.good==="grain"&&r.until>G.t&&G.c[r.seller]&&G.c[r.seller].alive)commits.push({seller:r.seller,buyer:tag,qty:20*mo*(c.access==null?1:c.access)});}
 const m=freightMatch(sellers,buyers,commits,{price:G.pricePrev.grain||G.price.grain,months:mo}),T=freightTotals(m.receipts);
 const top=Object.entries(m.util).sort((a,b)=>b[1]-a[1]||(a[0]<b[0]?-1:1)).slice(0,5);
 G.grainFreight={t:G.t,months:mo,good:"grain",qty:T.qty,base:T.base,freight:T.freight,tariff:T.tariff,unmet:Object.values(m.unmet).reduce((a,b)=>a+b,0),saturated:m.saturated,busiest:top};
}
