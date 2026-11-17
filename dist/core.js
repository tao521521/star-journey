(function(root){
 'use strict';
 const initial=()=>({version:1,completed:[],read:[],favorites:[],actions:[],learningBadges:[],bestScore:0,quizRuns:0,lastQuiz:null,note:''});
 const uniqueStrings=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];
 function validQuiz(value){return value&&Number.isInteger(value.correct)&&Number.isInteger(value.total)&&value.total>0&&value.total<=6&&value.correct>=0&&value.correct<=value.total?{correct:value.correct,total:value.total,score:Math.round(value.correct/value.total*100)}:null;}
 // Only traverse explicit directed historical relations; chronology is not a factual association.
 function relationPath(relations,from,to){
  if(from===to)return [from];const queue=[[from]],seen=new Set([from]);
  while(queue.length){const path=queue.shift(),last=path[path.length-1];
   for(const r of relations){if(r.relation==='时间先后'||r.from!==last||seen.has(r.to))continue;
    const next=[...path,r.to];if(r.to===to)return next;seen.add(r.to);queue.push(next);
   }
  }return [];
 }
 function recordQuiz(state,correct,total){const lastQuiz=validQuiz({correct,total});if(!lastQuiz)throw new RangeError('Invalid quiz result');return {...state,lastQuiz,bestScore:Math.max(state.bestScore,lastQuiz.score),quizRuns:state.quizRuns+1};}
 function normalize(input){const v=input&&typeof input==='object'?input:{}; const lastQuiz=validQuiz(v.lastQuiz);return {...initial(),lastQuiz,completed:uniqueStrings(v.completed),read:uniqueStrings(v.read),favorites:uniqueStrings(v.favorites),actions:uniqueStrings(v.actions),learningBadges:uniqueStrings(v.learningBadges).filter(id=>id==='radio-relay'),bestScore:Number.isFinite(v.bestScore)?Math.min(100,Math.max(0,v.bestScore)):0,quizRuns:Number.isFinite(v.quizRuns)?Math.max(0,Math.floor(v.quizRuns)):0,note:typeof v.note==='string'?v.note.slice(0,3000):''};}
 function packing(values){const nums=values.map(Number);return nums.length===4&&nums.every(n=>Number.isInteger(n)&&n>=0)&&nums.reduce((a,b)=>a+b,0)<=12&&nums[0]>=3&&nums[1]>=2&&nums[2]>=3&&nums[3]>=2;}
 const blocks=[2,7,10,12,18,19,21];
 function canStep(path,next){if(!Number.isInteger(next)||next<0||next>24||blocks.includes(next)||path.includes(next))return false;const last=path[path.length-1];return Math.abs(Math.floor(last/5)-Math.floor(next/5))+Math.abs(last%5-next%5)===1;}
 function award(state,id){return {...state,completed:[...new Set([...state.completed,id])]};}
 // 通信接力只修改体验状态；集章仍仅由 award 处理。
 const radioInitial=()=>({stations:[{phase:'onair',position:0},{phase:'packed',position:0}],handoffs:0,finished:false});
 function radioStep(model,index,action){
  const fail=message=>({model,message,ok:false});
  if(model.finished)return fail('本次接力已完成，可以重新体验。');
  if(![0,1].includes(index))return fail('请选择A或B电台。');
  const next={...model,stations:model.stations.map(s=>({...s}))},station=next.stations[index],other=next.stations[1-index];
  if(action==='move'){
   if(station.phase==='onair')return fail('这部电台正在驻守通信。先让另一部转移、架设并确认联络，再交接岗位。');
   if(station.phase!=='packed')return fail('这部电台已有任务，请完成当前转移和联络流程。');
   if(other.phase!=='onair')return fail('需要保留一部驻守电台，不能同时转移。');
   station.phase='moving';station.position=Math.max(...next.stations.map(s=>s.position))+1;
  }else{
   const transitions={arrive:['moving','setup'],setup:['setup','ready'],contact:['ready','waiting'],confirm:['waiting','onair']};
   const transition=transitions[action];
   if(!transition||station.phase!==transition[0])return fail('请依次完成转移、抵达、架设、试联和确认，不能跳过联络检查。');
   station.phase=transition[1];
   if(action==='confirm'){
    if(other.phase!=='onair')return fail('原驻守电台必须保持联络，才能完成交接。');
    other.phase='packed';next.handoffs++;next.finished=next.handoffs===3;
   }
  }
  const messages={move:'转移途中，原驻守电台继续保障联络。',arrive:'已抵达下一处模拟驻地，现在需要架设电台。',setup:'架设完成，但尚未验证联络，请先发起模拟试联。',contact:'正在等待确认；此时原驻守电台仍不能转移。',confirm:next.finished?'三次交接完成，通信接力学习印记已点亮。':'新电台已确认有效联络，原驻守电台现在可以转移。'};
  return {model:next,message:messages[action],ok:true};
 }
 const api={initial,normalize,recordQuiz,relationPath,packing,blocks,canStep,award,radioInitial,radioStep};
 if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.XH_CORE=api;
})(typeof window!=='undefined'?window:globalThis);
