const fs=require('fs');const L=fs.readFileSync('data.js','utf8');
let i=L.indexOf('"id": "q_r3_01"');i=L.lastIndexOf('{',i);let j=L.indexOf('"id": "q_r4_01"');j=L.lastIndexOf('{',j);
const a=eval('['+L.slice(i,j).trim().replace(/,\s*$/,'')+']');
const strip=s=>s.replace(/<rt>.*?<\/rt>/g,'').replace(/<[^>]+>/g,'');
const bare=s=>s.replace(/<ruby>.*?<\/ruby>/g,'').replace(/<span class="q-target">.*?<\/span>/g,'').match(/[\u4e00-\u9fff々]/g);
for(const q of a){const f=q.fullRubyJp; const sf=strip(f).replace(/[「」]/g,'');
 const t=q.tts.replace(/[「」]/g,'');
 if(q.type!=='unnatural'&&sf!==t&&!/：/.test(sf)) console.log(q.id,'TTSMISMATCH',sf,t);
 for(const [k,v] of [['prompt',q.promptJp],['full',f],...(q.options||[]).map((o,n)=>['opt'+n,o]),...(q.chunks||[]).map(c=>['ch'+c.id,c.html])]){ if(v&&bare(v)&&!(k==='prompt'&&q.type==='reorder')) console.log(q.id,k,'BARE',bare(v).join('')); 
  if(v&&(v.match(/<ruby>/g)||[]).length!==(v.match(/<rt>/g)||[]).length) console.log(q.id,k,'UNBAL');}
 if(q.chunks){ const j2=q.chunks.map(c=>c.plain).join(''); if(j2!==strip(f)) console.log(q.id,'CHUNKJOIN',j2,strip(f)); if(q.chunks.some(c=>strip(c.html)!==c.plain)) console.log(q.id,'HTMLPLAIN');}
 if(q.options.length&&new Set(q.options).size!==q.options.length) console.log(q.id,'DUPOPT');
 if(q.type==='unnatural'||q.options.length){ if(!(q.answerIndex>=0&&q.answerIndex<q.options.length))console.log(q.id,'ANSRANGE');}
}
console.log('done');
