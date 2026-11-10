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
 assert.equal(new Set(D.chapters.map(x=>x.id)).size,9);assert.equal(new Set(D.stories.map(x=>x.id)).size,6);
 for(const q of D.questions)assert.ok(Number.isInteger(q.answer)&&q.options[q.answer]);
});
