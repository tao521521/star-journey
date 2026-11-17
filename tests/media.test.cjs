const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..','dist');
const sandbox={window:{}};vm.createContext(sandbox);
for(const file of ['data.js','media.js'])vm.runInContext(fs.readFileSync(path.join(root,file),'utf8'),sandbox);
const D=sandbox.window.XH_DATA;
test('all memory artwork is bundled locally and the requested snow cover is preserved',()=>{
 for(const story of D.stories){
  assert.ok(story.gallery.length>=1);
  if(story.id==='mountain')assert.equal(story.cover,undefined);
  else assert.ok(story.cover);
  for(const image of story.gallery){
   assert.ok(image.src.startsWith('assets/memories/'));assert.ok(!image.src.includes('..'));
   assert.ok(fs.statSync(path.join(root,image.src)).size>1000);
   assert.ok(image.alt.includes('插画'));assert.ok(image.caption);
  }
 }
});
test('the historical atlas is local, attributed and loaded before the app',()=>{
 assert.ok(fs.existsSync(path.join(root,D.historicalMap.src)));
 assert.equal(new URL(D.historicalMap.source).hostname,'www.dswxyjy.org.cn');
 const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
 assert.ok(index.indexOf('media.js')<index.indexOf('app.js'));
});
test('each chapter has a distinct, usable learning marker on the historical atlas',()=>{
 assert.deepEqual(Object.keys(D.progressPins).sort(),Array.from(D.chapters,c=>c.id).sort());
 const positions=new Set();
 for(const chapter of D.chapters){
  const point=D.progressPins[chapter.id];
  assert.equal(point.length,2);
  assert.ok(point.every(value=>Number.isFinite(value)&&value>0&&value<100));
  assert.ok(!positions.has(point.join(',')),`${chapter.id} must have its own marker`);
  positions.add(point.join(','));
 }
});
