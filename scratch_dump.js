const fs=require('fs');const L=fs.readFileSync('data.js','utf8').split('\n');
let src=L.join('\n');let i=src.indexOf('"id": "q_r3_01"');i=src.lastIndexOf('{',i);let j=src.indexOf('"id": "q_r4_01"');j=src.lastIndexOf('{',j);let t=src.slice(i,j).trim().replace(/,\s*$/,'');
let a;try{a=eval('['+t+']')}catch(e){console.log('ERR',e.message);process.exit()}
const out=[];
for(const q of a){ if(!/^q_r3_/.test(q.id)) continue; const r=x=>x; 
let s=[q.id,q.type,q.promptJp,'FULL:'+q.fullRubyJp,'TTS:'+q.tts];
if(q.options&&q.options.length)s.push('OPT:'+q.options.map((o,i)=>i+'.'+o).join(' | '));
if(q.chunks)s.push('CH:'+q.chunks.map(c=>c.html+((c.html.replace(/<rt>.*?<\/rt>/g,'').replace(/<[^>]+>/g,'')!==c.plain)?'!!BAD':'')).join(' / '));
s.push('ANS:'+q.answerIndex+' '+q.correctDisplay+' | '+q.kanaReading,'WR:'+q.wrongReason,'EX:'+q.explanation);
out.push(s.join('\n'));}
fs.writeFileSync('scratch_r3.txt',out.join('\n\n'));console.log(out.length);
