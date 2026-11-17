const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const C=require('../dist/core.js');
const context={window:{}};vm.createContext(context);vm.runInContext(fs.readFileSync(require('node:path').join(__dirname,'../dist/data.js'),'utf8'),context);const D=context.window.XH_DATA;
test('damaged saved data recovers without propagating invalid values',()=>{
 const s=C.normalize({completed:['yudu','yudu',null],favorites:'bad',note:42,bestScore:Infinity,quizRuns:-2});
 assert.deepEqual(s.completed,['yudu']);assert.deepEqual(s.favorites,[]);assert.equal(s.note,'');assert.equal(s.bestScore,0);assert.equal(s.quizRuns,0);
});
test('a replay cannot award the same chapter twice',()=>{const s=C.award(C.award(C.initial(),'yudu'),'yudu');assert.equal(s.completed.length,1);});
test('packing enforces budget and all four needs',()=>{
 assert.equal(C.packing([3,2,3,2]),true);assert.equal(C.packing([4,2,3,3]),true);
 for(const v of [[6,2,3,2],[2,2,3,2],[3,1,3,2],[3,2,2,2],[3,2,3,1],[3.5,2,3,2],[-3,2,3,2]])assert.equal(C.packing(v),false);
});
test('the route puzzle has a valid path and rejects obstacles and row wrap',()=>{
 const queue=[[0]],seen=new Set([0]);let result;
 while(queue.length){const p=queue.shift();if(p.at(-1)===24){result=p;break;}for(let n=0;n<25;n++)if(!seen.has(n)&&C.canStep(p,n)){seen.add(n);queue.push([...p,n]);}}
 assert.ok(result,'exit must be reachable');assert.ok(result.length>=9);assert.equal(C.canStep([0,1],2),false);assert.equal(C.canStep([4],5),false);assert.equal(C.canStep([0,5],0),false);
});
test('every historical card and quiz answer refers to a valid source',()=>{
 for(const item of [...D.chapters,...D.stories,...D.questions])assert.ok(D.sources[item.source]?.url.startsWith('https://'));
 assert.equal(new Set(D.chapters.map(x=>x.id)).size,9);assert.equal(new Set(D.stories.map(x=>x.id)).size,7);
 for(const q of D.questions)assert.ok(Number.isInteger(q.answer)&&q.options[q.answer]);
});

test('graph IDs, references, types and provenance are consistent',()=>{
 const G=D.graph,ids=new Set(),edges=new Set();
 for(const n of G.nodes){
  assert.ok(!ids.has(n.id),`duplicate node ${n.id}`);ids.add(n.id);
  assert.ok(['place','event','person','story','spirit','topic','equipment'].includes(n.type));
  assert.equal(G.index[n.id],n);
  assert.ok(D.sources[n.source]?.title&&D.sources[n.source]?.publisher);
  assert.match(D.sources[n.source].url,/^https:\/\//);
  if(n.storyId)assert.ok(D.stories.some(s=>s.id===n.storyId));
  if(n.personId)assert.ok(D.people.some(p=>p.id===n.personId));
  if(n.spiritId)assert.ok(D.spirits.some(s=>s.id===n.spiritId));
 }
 for(const r of G.relations){
  assert.ok(ids.has(r.from),`invalid from: ${r.from}`);assert.ok(ids.has(r.to),`invalid to: ${r.to}`);
  assert.notEqual(r.from,r.to);assert.ok(r.relation);
  const key=`${r.from}|${r.to}|${r.relation}`;assert.ok(!edges.has(key),`duplicate edge ${key}`);edges.add(key);
  assert.ok(D.sources[r.source]?.url);
 }
 assert.equal(G.nodes.filter(n=>n.type==='place').length,9);
 assert.equal(G.nodes.filter(n=>n.type==='event'&&n.chapterId).length,9);
 assert.equal(G.relations.filter(r=>r.relation==='时间先后').length,8);
});
test('all nine archives have substantive details and valid challenge/story links',()=>{
 for(const c of D.chapters){
  for(const field of ['event','date'])assert.ok(c.detail[field]?.length,`${c.id}: ${field}`);
  for(const field of ['background','process','significance'])assert.ok(c.detail[field]?.length>20,`${c.id}: ${field}`);
  assert.ok(c.detail.sources.length);
  for(const source of c.detail.sources)assert.ok(D.sources[source]?.url);
  for(const id of c.detail.people)assert.ok(D.people.some(p=>p.id===id));
  assert.ok(c.type&&c.mission&&c.intro);
  assert.ok(D.graph.relations.some(r=>r.from===c.id&&r.to===`event:${c.id}`));
 }
 for(const p of D.people)if(p.storyId)assert.ok(D.stories.some(s=>s.id===p.storyId));
 const linked=(from,to)=>D.graph.relations.some(r=>r.from===from&&r.to===to);
 for(const [chapter,story] of [['xiangjiang','chen'],['zunyi','meeting'],['luding','bridge'],['snow','mountain'],['grass','mountain'],['huining','victory']])assert.ok(linked(`event:${chapter}`,`story:${story}`));
 assert.ok(linked('event:xiangjiang','person:chen-shuxiang'));
 assert.ok(linked('person:chen-shuxiang','story:chen'));
 assert.ok(D.graph.extensions.includes('story:quilt'));
 assert.ok(!D.graph.relations.some(r=>r.from==='story:quilt'||r.to==='story:quilt'));
});
test('Wuqi and the 1936 meeting places are distinct and corrected everywhere',()=>{
 assert.equal(D.chapters.find(c=>c.id==='wuqi').title,'到达吴起镇');
 const h=D.chapters.find(c=>c.id==='huining');assert.match(h.place,/宁夏/);assert.match(h.place,/西吉/);
 for(const file of ['dist/data.js','dist/app.js','README.md']){
  const text=fs.readFileSync(require('node:path').join(__dirname,'..',file),'utf8');
  assert.ok(!text.includes('吴起会师'));assert.ok(!text.includes('静宁将台堡'));
 }
});

test('legacy saves retain progress; the new learning badge is independent and deduplicated',()=>{
 const legacy={...C.initial(),completed:['grass'],read:['chen'],favorites:['chen'],actions:['learn'],note:'学习手记',bestScore:83,quizRuns:2};
 delete legacy.learningBadges;
 const restored=C.normalize(legacy);
 assert.deepEqual(restored.learningBadges,[]);
 for(const key of Object.keys(legacy))assert.deepEqual(restored[key],legacy[key]);
 assert.deepEqual(C.normalize({...legacy,learningBadges:['radio-relay','radio-relay','bad',null]}).learningBadges,['radio-relay']);
 assert.deepEqual(C.normalize({...legacy,learningBadges:'bad'}).learningBadges,[]);
});
test('radio handover requires setup, contact and confirmation before the original station may move',()=>{
 let m=C.radioInitial();
 for(const [index,action] of [[0,'move'],[1,'confirm'],[1,'setup'],[9,'move'],[1,'unknown']]){
  const r=C.radioStep(m,index,action);assert.equal(r.ok,false);assert.equal(r.model,m);assert.ok(r.message);
 }
 for(let round=0;round<D.communication.rounds;round++){
  const index=round%2===0?1:0,original=1-index;
  for(const action of ['move','arrive','setup','contact']){
   const previous=JSON.stringify(m),r=C.radioStep(m,index,action);
   assert.equal(r.ok,true);assert.equal(JSON.stringify(m),previous,'reducer must not mutate');m=r.model;
   assert.equal(m.stations[original].phase,'onair');assert.equal(m.handoffs,round);
   assert.equal(C.radioStep(m,original,'move').ok,false);
   assert.equal(m.stations.filter(s=>s.phase==='onair').length,1);
  }
  assert.equal(m.stations[index].phase,'waiting');
  m=C.radioStep(m,index,'confirm').model;
  assert.equal(m.handoffs,round+1);assert.equal(m.stations[index].phase,'onair');assert.equal(m.stations[original].phase,'packed');
 }
 assert.equal(m.finished,true);assert.equal(C.radioStep(m,0,'move').ok,false);
 assert.equal(C.radioInitial().handoffs,0);
 assert.deepEqual(C.initial().completed,[],'radio model cannot award a chapter');
});
test('all reachable radio states keep one station on air and invalid actions never change state',()=>{
 const seen=new Set(),queue=[C.radioInitial()];
 while(queue.length){
  const model=queue.shift(),key=JSON.stringify(model);if(seen.has(key))continue;seen.add(key);
  assert.equal(model.stations.filter(s=>s.phase==='onair').length,1);
  assert.ok(model.handoffs>=0&&model.handoffs<=3);
  for(const i of [0,1])for(const action of ['move','arrive','setup','contact','confirm']){
   const r=C.radioStep(model,i,action);if(r.ok)queue.push(r.model);else assert.equal(r.model,model);
  }
 }
 assert.ok(seen.size>10);
});
test('communication archive and graph references have provenance, without inventing a tenth station',()=>{
 const t=D.communication,g=D.graph;
 assert.equal(D.chapters.length,9);assert.equal(t.badgeId,'radio-relay');assert.equal(t.rounds,3);
 for(const id of t.nodeIds)assert.ok(g.index[id]);
 for(const source of t.sources){assert.ok(D.sources[source].title);assert.match(D.sources[source].url,/^https:/);}
 assert.equal(g.index['equipment:hartley'].type,'equipment');
 assert.ok(g.relations.some(r=>r.from==='event:radio-relay'&&r.to==='person:luo-ruoxia'));
 assert.ok(g.relations.some(r=>r.from==='event:chishui'&&r.to==='topic:communication'));
 assert.match(t.distinction,/通信保障/);assert.match(t.distinction,/技术侦察/);assert.match(t.modelNote,/教育模型/);
 assert.ok(D.stories.some(s=>s.id==='radio'));
});

test('quiz records last result independently of historical best and rounds 5/6 to 83',()=>{
 let s=C.recordQuiz(C.initial(),5,6);
 assert.deepEqual(s.lastQuiz,{correct:5,total:6,score:83});assert.equal(s.bestScore,83);assert.equal(s.quizRuns,1);
 s=C.recordQuiz(s,6,6);assert.equal(s.bestScore,100);assert.equal(s.lastQuiz.score,100);
 s=C.recordQuiz(s,2,6);assert.equal(s.bestScore,100);assert.equal(s.lastQuiz.score,33);assert.equal(s.quizRuns,3);
 assert.deepEqual(s.completed,[]);assert.deepEqual(s.learningBadges,[]);
});
test('quiz state migration preserves existing progress and distinguishes missing results from zero',()=>{
 const legacy={completed:['xiangjiang'],read:['chen'],favorites:['chen'],note:'保留手记',bestScore:83,quizRuns:2};
 const s=C.normalize(legacy);assert.equal(s.lastQuiz,null);assert.equal(s.bestScore,83);assert.equal(s.quizRuns,2);
 for(const key of ['completed','read','favorites','note'])assert.deepEqual(s[key],legacy[key]);
 const zero=C.recordQuiz(s,0,6);assert.equal(C.normalize(zero).lastQuiz.score,0);
 for(const lastQuiz of [{correct:7,total:6},{correct:-1,total:6},{correct:1,total:0},{correct:1.5,total:6},{correct:NaN,total:6},'bad'])assert.equal(C.normalize({...legacy,lastQuiz}).lastQuiz,null);
 assert.deepEqual(C.normalize({...legacy,lastQuiz:{correct:5,total:6,score:100}}).lastQuiz,{correct:5,total:6,score:83});
 for(const [correct,total] of [[7,6],[-1,6],[1,0],[1,7]])assert.throws(()=>C.recordQuiz(s,correct,total),RangeError);
});

test('exploration paths only follow real directed relations and never invent a quilt connection',()=>{
 assert.deepEqual(C.relationPath(D.graph.relations,'xiangjiang','person:chen-shuxiang'),['xiangjiang','event:xiangjiang','person:chen-shuxiang']);
 assert.deepEqual(C.relationPath(D.graph.relations,'person:chen-shuxiang','story:chen'),['person:chen-shuxiang','story:chen']);
 assert.deepEqual(C.relationPath(D.graph.relations,'xiangjiang','story:quilt'),[]);
 assert.deepEqual(C.relationPath(D.graph.relations,'yudu','event:xiangjiang'),[],'time order does not imply an association');
 assert.deepEqual(C.relationPath([{from:'a',to:'b'},{from:'b',to:'a'}],'a','c'),[],'cycles must terminate');
});
test('only explicitly mapped historical questions link to valid chapters',()=>{
 for(const q of D.questions.filter(q=>q.chapterId))assert.ok(D.chapters.some(c=>c.id===q.chapterId));
 assert.equal(D.questions[0].chapterId,'yudu');assert.equal(D.questions[11].chapterId,'xiangjiang');
 for(const index of [6,7,8,9,10])assert.equal(D.questions[index].chapterId,undefined);
});
