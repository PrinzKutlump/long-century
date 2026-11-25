// Era sound cues, synthesised with WebAudio. No audio files. Off by default; the level is kept with the other settings (vic.opt, key "sound": 0, 0.35 low, 0.7 medium).
// The AudioContext is created only after the player turns sound on, which is a tap, so no context exists while sound is off.
const SND={ctx:null,master:null,
 level(){const v=+OPT("sound",0);return v>0?Math.min(1,v):0;},
 ensure(){try{if(!this.ctx){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return null;this.ctx=new AC();this.master=this.ctx.createGain();this.master.connect(this.ctx.destination);}
 if(this.ctx.state==="suspended")this.ctx.resume();return this.ctx;}catch(e){return null;}},
 tone(f,t,d,type,g,to){const c=this.ctx,o=c.createOscillator(),e=c.createGain();o.type=type;o.frequency.setValueAtTime(f,t);if(to)o.frequency.exponentialRampToValueAtTime(to,t+d);
 e.gain.setValueAtTime(0.0001,t);e.gain.exponentialRampToValueAtTime(g,t+0.01);e.gain.exponentialRampToValueAtTime(0.0001,t+d);o.connect(e);e.connect(this.master);o.start(t);o.stop(t+d+0.05);},
 noise(t,d,g){const c=this.ctx,n=Math.floor(c.sampleRate*d),b=c.createBuffer(1,n,c.sampleRate),x=b.getChannelData(0);for(let i=0;i<n;i++)x[i]=(Math.random()*2-1)*(1-i/n);const s=c.createBufferSource(),e=c.createGain();s.buffer=b;e.gain.value=g;s.connect(e);e.connect(this.master);s.start(t);},
 cues:{
  tap(t){SND.tone(1400,t,0.03,"square",0.12);},
  tick(t){SND.tone(2000,t,0.025,"triangle",0.35);},
  bell(t){SND.tone(392,t,1.6,"sine",0.35);SND.tone(784,t,1.0,"sine",0.12);},
  drum(t){SND.tone(110,t,0.4,"sine",0.8,45);SND.noise(t,0.2,0.4);},
  victory(t){SND.tone(523,t,0.25,"triangle",0.3);SND.tone(784,t+0.2,0.4,"triangle",0.3);}
 },
 play(n){const v=this.level();if(!v)return;const c=this.ensure();if(!c)return;try{this.master.gain.value=v;const f=this.cues[n];if(f)f(c.currentTime+0.02);}catch(e){}}
};
function sndRow(){const v=+OPT("sound",0);const b=([l,x])=>`<button class="btn sm ${Math.abs(v-x)<.01?"on":""}" data-a="sndset" data-v="${x}">${l}</button>`;
 return `<div class="setrow"><span class="small" style="align-self:center">Sound</span><div class="seg">${[["Off",0],["Low",.35],["Medium",.7]].map(b).join("")}</div></div>`;}
Object.assign(ACT,{sndset:d=>{const x=+d.v||0;OPTS("sound",x);if(x){SND.ensure();SND.play("tap");}else if(SND.master)SND.master.gain.value=0;openSettings();}});
document.addEventListener("click",e=>{const el=e.target&&e.target.closest&&e.target.closest("[data-a]");if(el&&!el.disabled)SND.play("tap");},true);
{const f=endMonth;endMonth=function(){const t0=G.t,r=f.apply(this,arguments);if(G.t!==t0)SND.play("tick");return r;};}
{const f=drawCard;drawCard=function(){const had=!!document.getElementById("card");f();if(!had&&document.getElementById("card"))SND.play("bell");};}
{const f=ACT.declare;ACT.declare=(d,el)=>{const n=G.wars.length;f(d,el);if(G.wars.length>n)SND.play("drum");};}
{const f=ACT.peace;ACT.peace=(d,el)=>{const n=G.wars.length;f(d,el);if(G.wars.length<n)SND.play("victory");};}
{const f=ACT.dealgo;ACT.dealgo=(d,el)=>{const n=G.wars.length;f(d,el);if(G.wars.length<n)SND.play("victory");};}
