(function(root){
 'use strict';
 const initial=()=>({version:1,completed:[],read:[],favorites:[],actions:[],bestScore:0,quizRuns:0,note:''});
 const uniqueStrings=a=>Array.isArray(a)?[...new Set(a.filter(x=>typeof x==='string'))]:[];
 function normalize(input){const v=input&&typeof input==='object'?input:{}; return {...initial(),completed:uniqueStrings(v.completed),read:uniqueStrings(v.read),favorites:uniqueStrings(v.favorites),actions:uniqueStrings(v.actions),bestScore:Number.isFinite(v.bestScore)?Math.min(100,Math.max(0,v.bestScore)):0,quizRuns:Number.isFinite(v.quizRuns)?Math.max(0,Math.floor(v.quizRuns)):0,note:typeof v.note==='string'?v.note.slice(0,3000):''};}
 function packing(values){const nums=values.map(Number);return nums.length===4&&nums.every(n=>Number.isInteger(n)&&n>=0)&&nums.reduce((a,b)=>a+b,0)<=12&&nums[0]>=3&&nums[1]>=2&&nums[2]>=3&&nums[3]>=2;}
 const blocks=[2,7,10,12,18,19,21];
 function canStep(path,next){if(!Number.isInteger(next)||next<0||next>24||blocks.includes(next)||path.includes(next))return false;const last=path[path.length-1];return Math.abs(Math.floor(last/5)-Math.floor(next/5))+Math.abs(last%5-next%5)===1;}
 function award(state,id){return {...state,completed:[...new Set([...state.completed,id])]};}
 const api={initial,normalize,packing,blocks,canStep,award};
 if(typeof module!=='undefined'&&module.exports)module.exports=api; else root.XH_CORE=api;
})(typeof window!=='undefined'?window:globalThis);
