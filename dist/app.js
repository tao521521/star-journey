/* 星火征程 — framework-free, offline-capable educational experience. */
(()=>{
 'use strict';
 const D=window.XH_DATA,C=window.XH_CORE,$=s=>document.querySelector(s),KEY='xinghuo-journey-v1';
 const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let state=C.initial(),storageOK=true;
 try{state=C.normalize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch{storageOK=false;}
 state.completed=state.completed.filter(id=>D.chapters.some(c=>c.id===id));
 state.read=state.read.filter(id=>D.stories.some(c=>c.id===id));
 state.favorites=state.favorites.filter(id=>D.stories.some(c=>c.id===id));
 state.actions=state.actions.filter(id=>D.actions.some(c=>c.id===id));
 let graphTopic=false,graphPath=[],lastRound=null;
 const routeVisited=new Set();
 let journeyView='route',graphExpanded=false,hasJourneySelection=false;
 let current='home',selected=0,memoryFilter='全部',active=null,toastTimer;
 const icons={home:'<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z"/>',map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3zM9 3v15M15 6v15"/>',flag:'<path d="M5 22V3m0 1c5-4 9 4 15 0v10c-6 4-10-4-15 0"/>',book:'<path d="M12 6c-3-3-7-3-10-2v16c4-1 7-1 10 1 3-2 6-2 10-1V4c-3-1-7-1-10 2zm0 0v15"/>',bag:'<rect x="5" y="6" width="14" height="16" rx="3"/><path d="M9 6V4a3 3 0 0 1 6 0v2M5 12h14M9 16h6"/>',arrow:'<path d="M4 12h16m-6-6 6 6-6 6"/>',heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8z"/>',mountain:'<path d="m2 21 8-17 5 10 3-5 5 12zm5-10 3 3 3-3"/>',code:'<path d="m8 5-7 7 7 7m8-14 7 7-7 7m-3-16-2 20"/>',check:'<path d="m5 12 4 4L20 5"/>',star:'<path d="m12 2 3 6.5 7 1-5 5 1 7-6-3.5L6 22l1-7-5-5 7-1z"/>',download:'<path d="M12 2v14m-5-5 5 5 5-5M3 17v5h18v-5"/>'};
 function icon(n,cl=''){return `<svg class="icon ${cl}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[n]||icons.star}</svg>`;}
 const navs=[['home','home','启程首页'],['map','map','重走长征'],['challenge','flag','精神挑战'],['memory','book','红色记忆'],['action','heart','青春接力'],['bag','bag','我的行囊']];
 $('#navigation').innerHTML=navs.map(([id,ic,t])=>`<a href="#${id}" data-page="${id}">${icon(ic)}<span>${t}</span></a>`).join('');
 function save(){try{localStorage.setItem(KEY,JSON.stringify(state));storageOK=true;}catch{storageOK=false;toast('浏览器未允许保存；本次进度仍可继续使用。');}updateProgress();}
 function updateProgress(){
  const done=new Set(state.completed);$('#side-count').textContent=`${done.size} / 9`;$('#side-bar').style.width=done.size/9*100+'%';
  document.querySelectorAll('[data-completion-count]').forEach(el=>el.textContent=done.size);
  document.querySelectorAll('[data-progress-id]').forEach(el=>{const id=el.dataset.progressId,complete=done.has(id);el.classList.toggle('is-complete',complete);const mark=el.querySelector('[data-progress-mark]');if(mark)mark.textContent=complete?'✓':String(D.chapters.findIndex(c=>c.id===id)+1);el.setAttribute('aria-label',`${D.chapters.find(c=>c.id===id).title}，${complete?'已通关':'待挑战'}`);});
 }
 function toast(t){$('#toast').textContent=t;$('#toast').classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').classList.remove('show'),3000);}
 function go(page){if(!navs.some(n=>n[0]===page))page='home';if(location.hash!=='#'+page){location.hash=page;return;}render(page);}
 let firstRender=true,pageAnimation;
 function render(page){
  const update=()=>{current=page;$('#page-label').textContent=navs.find(n=>n[0]===page)?.[2]||'启程首页';document.querySelectorAll('[data-page]').forEach(a=>{a.classList.toggle('active',a.dataset.page===page);if(a.dataset.page===page)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});const screens={home,map:mapPage,challenge:challengePage,memory:memoryPage,action:actionPage,bag:bagPage};$('#content').innerHTML=(screens[page]||home)();window.scrollTo({top:0,behavior:'instant'});updateProgress();updateGraphPath();centerProgressMap();};
  pageAnimation?.cancel();update();if(!firstRender&&!matchMedia('(prefers-reduced-motion: reduce)').matches)pageAnimation=$('#content').animate([{opacity:0,filter:'blur(6px)',transform:'translateY(14px)'},{opacity:1,filter:'blur(0)',transform:'translateY(0)'}],{duration:320,easing:'cubic-bezier(.2,.8,.2,1)'});firstRender=false;
 }
 function eyebrow(t){return /[A-Za-z]/.test(t)?'':`<div class="eyebrow">${t}</div>`;}
 function pageHeading(k,title,desc){return `<div class="page-heading"><h1>${title}</h1><p>${desc}</p></div>`;}
 function arrow(){return icon('arrow');}
 function home(){const next=D.chapters.findIndex(c=>!state.completed.includes(c.id));return `<section class="hero"><div class="hero-art" role="img" aria-label="红军行进主题艺术插画"></div><div class="hero-copy"><div class="hero-kicker">纪念中国工农红军长征胜利90周年</div><h1>山河铭记<br>星火<span>不息</span></h1><p>重走信仰之路，<br>让长征精神照亮青春。</p><div class="hero-buttons"><button class="primary" data-start="${next<0?0:next}">${state.completed.length?'继续我的征途':'启程，重走长征路'} ${arrow()}</button><button class="text-button" data-nav="memory">阅读红色记忆 ${arrow()}</button></div></div></section>
 <div class="history-strip"><div><strong>1934 — 1936</strong><p>伟大远征</p></div><div><strong>二万五千里</strong><p>红一方面军长征行程</p></div><div><strong>九十载</strong><p>长征精神，薪火相传</p></div></div>
 <section class="section"><div class="section-title"><h2>在探索中，读懂长征</h2></div><div class="explore-grid"><button class="explore-card route-card" data-nav="map"><span class="module-number">一</span><h3>重走长征</h3><p>九站历史坐标，连接一段伟大征途。</p><span class="card-link">走进历史 ${arrow()}</span></button><button class="explore-card challenge-card" data-nav="challenge"><span class="module-number">二</span><h3>精神挑战</h3><p>在选择、协作与思考中，感悟前行的力量。</p><span class="card-link">开启挑战 ${arrow()}</span></button><button class="explore-card archive-card" data-nav="memory"><span class="module-number">三</span><h3>红色记忆</h3><p>走近英雄与人民，重温温暖而坚定的故事。</p><span class="card-link">翻开记忆 ${arrow()}</span></button></div></section>
 <section class="section memory-preview"><div class="section-title"><h2>那些故事，始终有光</h2><button class="text-button" data-nav="memory">全部记忆 ${arrow()}</button></div><div class="story-row">${D.stories.slice(0,3).map(storyCard).join('')}</div></section><section class="relay-banner"><div><h2>把感动，化作今天的行动</h2><p>以专业所学服务他人，走好我们这一代人的长征路。</p></div><button class="primary light" data-nav="action">接过青春的火炬 ${arrow()}</button></section>`;}
 function chapterPanel(){const c=D.chapters[selected];return `<article class="chapter-panel" aria-labelledby="chapter-title"><div class="chapter-num">第${selected+1}站 <span>${c.tag}</span></div><h2 id="chapter-title">${c.title}</h2><div class="chapter-meta"><span>${c.date}</span><span>${c.place}</span></div><p class="chapter-summary">${c.summary}</p><div class="chapter-actions"><button class="primary" data-mission="${selected}">${state.completed.includes(c.id)?'重温挑战':'开启挑战'}：${c.mission} ${arrow()}</button><button class="text-button" data-explore-chapter="${c.id}">详细史实与关联故事 ${arrow()}</button></div><details class="chapter-references"><summary>史料来源</summary>${sourceLink(c.source)}</details></article>`;}
 function mapPage(){if(journeyView==='graph')return graphPage();return `${pageHeading('','重走长征路','完成本站挑战，点亮一个历史坐标。')}${journeyTabs()}<div class="journey-layout"><section class="route-atlas"><div class="atlas-heading"><div><h2>征途进度 <span><b data-completion-count>${state.completed.length}</b> / 9</span></h2><p>灰色待挑战，红色已通关</p></div><button class="outline" data-action="map-image">查看历史原图 ${icon('arrow')}</button></div><div class="progress-map-viewport" tabindex="0" aria-label="长征地图，可左右滚动，点击数字选择站点"><div class="progress-map-board"><img src="${D.historicalMap.src}" alt="中国工农红军长征路线示意图，保留1934至1936年历史路线与图例" width="2377" height="1598"><div class="map-progress-markers">${D.chapters.map((c,i)=>{const pos=D.progressPins[c.id],complete=state.completed.includes(c.id);return `<button class="progress-pin ${complete?'is-complete':''} ${selected===i?'is-current':''}" data-progress-id="${c.id}" data-node="${i}" style="left:${pos[0]}%;top:${pos[1]}%" aria-label="${c.title}，${complete?'已通关':'待挑战'}" aria-pressed="${selected===i}"><span data-progress-mark>${complete?'✓':i+1}</span><span class="pin-label">${c.title}</span></button>`;}).join('')}</div></div></div><div class="station-list" role="group" aria-label="选择历史节点">${D.chapters.map((c,i)=>`<button data-node="${i}" data-progress-id="${c.id}" class="${selected===i?'selected':''} ${state.completed.includes(c.id)?'is-complete':''}" aria-pressed="${selected===i}"><span data-progress-mark>${state.completed.includes(c.id)?'✓':i+1}</span><b>${c.title}</b></button>`).join('')}</div><p class="atlas-note">数字标记是学习入口，位置仅作导航，真实路线以底图为准。<a href="${D.historicalMap.source}" target="_blank" rel="noopener noreferrer">图源：${D.historicalMap.publisher} ↗</a></p></section>${chapterPanel()}</div>`;}
 function centerProgressMap(){requestAnimationFrame(()=>{const viewport=$('.progress-map-viewport'),pin=$('.progress-pin.is-current');if(viewport&&pin&&viewport.scrollWidth>viewport.clientWidth){viewport.scrollLeft=pin.offsetLeft-viewport.clientWidth/2;}});}
 function journeyTabs() {
  return `<div class="journey-tabs" role="group" aria-label="重走长征视图">
   <button data-journey-view="route" aria-pressed="${journeyView==='route'}">历史路线</button>
   <button data-journey-view="graph" aria-pressed="${journeyView==='graph'}">历史关联</button>
  </div>`;
 }
 function graphArt(){
  if(graphTopic)return communicationGraphArt();
  const c=D.chapters[selected],eventId=`event:${c.id}`,related=D.graph.relations.filter(r=>r.from===eventId&&r.relation!=='时间先后');
  const types={person:'人物',story:'故事',spirit:'精神',topic:'专题'};
  return `<div class="relations-hub"><span>历史事件</span><h2>${esc(c.detail.event)}</h2></div><div class="relations-list">${related.map(r=>{const n=D.graph.index[r.to];return `<button data-graph-node="${n.id}" class="relation-card"><span>${types[n.type]||'关联阅读'}</span><strong>${esc(n.storyId?D.stories.find(st=>st.id===n.storyId)?.shortTitle||n.title:n.title)}</strong>${arrow()}</button>`;}).join('')}</div>`;
 }
 function graphArchive(){
  const c=D.chapters[selected],d=c.detail;
  return `<article class="graph-archive"><h2 id="archive-title" tabindex="-1">${esc(d.event)}</h2><p class="archive-date">${esc(d.date)} · ${esc(c.place)}</p><section><h3>历史背景</h3><p>${esc(d.background)}</p></section><section><h3>事件经过</h3><p>${esc(d.process)}</p></section><section><h3>历史意义</h3><p>${esc(d.significance)}</p></section><details class="archive-sources"><summary>参考史料</summary>${d.sources.map(sourceLink).join('')}</details><button class="primary full" data-mission="${selected}">进入本站挑战 ${arrow()}</button></article>`;
 }
 function graphPathContent() {
  if(graphPath.length<2)return '';
  const last=D.graph.index[graphPath.at(-1)],root=D.graph.index[graphPath[0]];
  const relation=graphPath.length>1?D.graph.relations.find(r=>r.from===graphPath.at(-2)&&r.to===last.id):null;
  const discovered=relation&&['person','story'].includes(last.type);
  return `<nav class="graph-breadcrumb" aria-label="历史关联探索路径">${graphPath.map(id=>`<button data-graph-node="${id}">${esc(D.graph.index[id].title)}</button>`).join('<span aria-hidden="true"> / </span>')}</nav>${discovered?`<div class="history-discovery"><p>你发现了${esc(root.title)}与${esc(last.title)}之间的历史联系。</p>${sourceLink(relation.source)}<small>这是一次关联探索，不计入挑战完成或集章。</small></div>`:''}`;
 }
 function recordGraphPath(id) {
  const node=D.graph.index[id];if(!node)return;
  if(node.type==='place'){graphPath=[id];updateGraphPath();return;}
  if(current!=='map'||journeyView!=='graph')return;
  const root=graphTopic?'topic:communication':D.chapters[selected].id;
  if(graphPath[0]!==root)graphPath=[root];
  const prior=graphPath.indexOf(id);
  if(prior>=0)graphPath=graphPath.slice(0,prior+1);
  else {
   const continuation=C.relationPath(D.graph.relations,graphPath.at(-1),id);
   graphPath=continuation.length?[...graphPath,...continuation.slice(1)]:C.relationPath(D.graph.relations,root,id);
   if(!graphPath.length)graphPath=[root];
  }
  updateGraphPath();
 }
 function updateGraphPath() {
  const region=$('.graph-exploration');if(!region)return;
  region.innerHTML=graphPathContent();
  const activeEdges=new Set(graphPath.slice(1).map((id,i)=>`${graphPath[i]}|${id}`));
  document.querySelectorAll('.graph-edge[data-from]').forEach(edge=>{
   const chosen=activeEdges.has(`${edge.dataset.from}|${edge.dataset.to}`);
   edge.classList.toggle('path-active',chosen);edge.classList.toggle('path-muted',activeEdges.size>0&&!chosen);
  });
  document.querySelectorAll('.memory-graph .graph-node').forEach(node=>{
   node.classList.toggle('path-current',graphPath.length>1&&node.dataset.graphNode===graphPath.at(-1));
   node.classList.toggle('path-related',graphPath.includes(node.dataset.graphNode));
  });
 }
 function quizGraphLink(question) {
  return question.chapterId&&D.chapters.some(c=>c.id===question.chapterId)?`<button class="quiz-graph-link" data-explore-chapter="${question.chapterId}">了解相关历史 ↗</button>`:'';
 }
 function reviewQuiz() {
  if(!lastRound)return;
  const wrong=lastRound.questions.map((q,i)=>({q,answer:lastRound.answers[i]})).filter(({q,answer})=>answer!==q.answer);
  active=lastRound;
  openModal(`<span class="overline">本轮错题回顾 · ${wrong.length} 题</span><h2 id="dialog-title">带着问题，再读一段历史</h2>${wrong.length?wrong.map(({q,answer})=>`<article class="quiz-review-item"><h3>${esc(q.q)}</h3><p class="review-user-answer">你的答案：${esc(q.options[answer])}</p><p class="review-correct-answer">正确答案：${esc(q.options[q.answer])}</p><p>${esc(q.explain)}</p>${sourceLink(q.source)}${quizGraphLink(q)}</article>`).join(''):'<p class="modal-lead">本轮全部答对，没有错题。可以继续在图谱中了解相关历史。</p>'}<div class="modal-actions"><button class="outline" data-quiz-result>返回本轮成绩</button><button class="primary" data-quiz="all">再挑战一次 ${arrow()}</button></div>`,true);
 }
 function graphPage(){
  graphExpanded=true;const root=graphTopic?'topic:communication':D.chapters[selected].id;if(graphPath[0]!==root)graphPath=[root];
  return `${pageHeading('','历史关联','从一处坐标出发，走近事件、人物与长征精神。')}${journeyTabs()}<div class="graph-stations" role="group" aria-label="选择历史站点">${D.chapters.map((c,i)=>`<button data-node="${i}" aria-pressed="${!graphTopic&&i===selected}">${esc(c.title)}</button>`).join('')}<button data-communication-topic aria-pressed="${graphTopic}">长征通信史</button></div><div class="graph-layout"><section class="graph-board"><div class="graph-toolbar"><h2>${graphTopic?'长征通信史':D.chapters[selected].title}</h2></div>${graphArt()}<div class="graph-exploration">${graphPathContent()}</div><button class="text-button" data-graph-node="story:quilt">延伸阅读：半条被子的温暖 ${arrow()}</button></section>${graphTopic?communicationArchive():graphArchive()}</div>`;
 }
 function refreshJourney(focusSelector){$('#content').innerHTML=mapPage();updateProgress();centerProgressMap();if(focusSelector)$(focusSelector)?.focus({preventScroll:true});updateGraphPath();}

 function exploreGraphNode(id) {
  const n=D.graph.index[id];
  if(!n)return;
  recordGraphPath(id);
  if(n.type==='topic'||n.id==='event:radio-relay'){openCommunicationTopic();return;}
  if(n.type==='equipment'){
   const equipment=D.communication.equipment;
   openModal(`<h2 id="dialog-title">${esc(equipment.title)}</h2>${radioEquipmentArt()}<p class="modal-lead">${esc(equipment.description)}</p>${sourceLink(equipment.source)}<button class="primary" data-radio-start>体验教学电台接力</button>`,true);return;
  }
  if(n.type==='place'||n.type==='event') {
   graphTopic=false;selected=D.chapters.findIndex(c=>c.id===n.chapterId);graphExpanded=true;
   if(n.type==='place')graphPath=[n.id];
   refreshJourney(`[data-graph-node="${n.type==='place'?n.id:n.chapterId}"]`);
   return;
  }
  if(n.type==='story'){story(n.storyId);return;}
  const entry=n.type==='person'?D.people.find(p=>p.id===n.personId):D.spirits.find(s=>s.id===n.spiritId);
  if(entry.storyId){story(entry.storyId);return;}
  const stations=D.graph.relations.filter(r=>r.to===id&&r.from.startsWith('event:')).map(r=>D.graph.index[r.from].chapterId).filter(Boolean);
  openModal(`<span class="overline">${n.type==='person'?'历史人物':'精神内涵'}</span><h2 id="dialog-title">${esc(n.title)}</h2><p class="modal-lead">${esc(entry.description)}</p>${sourceLink(entry.source)}${D.communication.nodeIds.includes(id)?'<div class="modal-actions"><button class="outline" data-story="radio">阅读通信人员档案</button><button class="primary" data-radio-start>体验通信接力</button></div>':''}${stations.length?`<h3>继续探索关联地点</h3><div class="graph-stations">${stations.map(id=>`<button data-explore-chapter="${id}">${esc(D.graph.index[id].title)} ↗</button>`).join('')}</div>`:''}`);
 }

 function quizScores() {
  return `<div class="quiz-score-heading">${icon('star')} 我的知识挑战</div><dl class="quiz-score-values"><div><dt>本轮成绩</dt><dd>${state.lastQuiz?`${state.lastQuiz.score}<small>分</small>`:`<span>${state.quizRuns?'尚无本轮记录':'尚未挑战'}</span>`}</dd>${state.lastQuiz?`<p>答对 ${state.lastQuiz.correct} / ${state.lastQuiz.total} 题</p>`:'<p>完成一次竞答后更新</p>'}</div><div><dt>历史最高分</dt><dd>${state.quizRuns?`${state.bestScore}<small>分</small>`:'<span>尚未挑战</span>'}</dd><p>已完成 ${state.quizRuns} 轮</p></div></dl>${lastRound?'<button class="text-button" data-review-quiz>回顾本轮错题 ↗</button>':''}`;
 }
 function syncQuizScores(newRecord=false) {
  document.querySelectorAll('[data-quiz-scores]').forEach(card=>{card.innerHTML=quizScores();card.classList.remove('new-record');if(newRecord)requestAnimationFrame(()=>{if(card.isConnected)card.classList.add('new-record');});});
 }
 function challengePage(){return `${pageHeading('LEARN THROUGH PLAY','每一次挑战，都是精神的回响','用知识读懂历史，用协作跨越险阻。选择一种方式，开始你的挑战。')}<div class="challenge-hero"><div><span class="pill">知识与信念的双重旅程</span><h2>星火知识挑战</h2><p>每轮最多6题，涵盖长征历史与精神内涵。<br>作答后查看解析，让每个答案都有来处。</p><div class="quiz-mode-buttons"><button class="primary" data-quiz="all">综合挑战 ${arrow()}</button><button class="outline" data-quiz="历史">历史专场</button><button class="outline" data-quiz="精神">精神专场</button></div></div><div class="challenge-emblem" data-quiz-scores>${quizScores()}</div></div><div class="secondary-challenges"><button class="game-card" data-special="order">${icon('map')}<h3>时空排序</h3><p>把历史节点放回时间长河，梳理中央红军的征途。</p><span>开启排序挑战 ${arrow()}</span></button><button class="game-card" data-radio-start>${icon('code')}<h3>红色电波·行军通信</h3><p>认识长征通信人员与设备，安排两部电台交替前进，保持联络。</p><span>开启通信接力 ${arrow()}</span></button><button class="game-card" data-special="grid">${icon('flag')}<h3>机动路线</h3><p>观察阻碍，规划路径。坚定目标，也善于改变方法。</p><span>开启路线挑战 ${arrow()}</span></button></div><div class="learning-note">${icon('book')}<p>游戏中的行囊、棋盘与信号均为原创教学模型，不代表真实作战参数或历史原始记录。关卡可以重复尝试，学习比速度更重要。</p></div>`;}
 function storyCard(s){return `<article class="story-card"><button class="story-open" data-story="${s.id}"><div class="story-art story-${s.id}">${s.cover?`<img src="${s.cover}" alt="${s.gallery[0].alt}" loading="lazy" width="1366" height="910">`:'<span class="sr-only">雪山草地主题艺术插画</span>'}</div><div class="story-copy"><span class="story-tag">${s.category}</span><h3>${s.title}</h3><p>${s.summary}</p><span class="story-read">${state.read.includes(s.id)?'再次回望':'阅读故事'} ${arrow()}</span></div></button><button class="favorite ${state.favorites.includes(s.id)?'on':''}" data-favorite="${s.id}" aria-label="${state.favorites.includes(s.id)?'取消收藏':'收藏'}${s.title}" aria-pressed="${state.favorites.includes(s.id)}">${icon('heart')}</button></article>`;}
 function memoryPage(){const filters=['全部','通信档案','英雄人物','军民故事','精神坐标','征途记忆','我的收藏'];const stories=D.stories.filter(s=>memoryFilter==='全部'||(memoryFilter==='我的收藏'?state.favorites.includes(s.id):s.category===memoryFilter));return `${pageHeading('THE RED ARCHIVE','岁月远去，精神从未褪色','一位英雄，一段故事，一处精神坐标。让历史的温度，抵达今天的我们。')}<div class="filter-tabs" role="group" aria-label="筛选红色记忆">${filters.map(f=>`<button class="${memoryFilter===f?'active':''}" data-filter="${f}" aria-pressed="${memoryFilter===f}">${f}</button>`).join('')}</div><div class="memory-grid">${stories.map(storyCard).join('')||'<div class="empty-state">还没有收藏的故事。点击故事卡片上的爱心，把一束光装进行囊。</div>'}</div>`;}
 function actionPage(){return `${pageHeading('PASS ON THE SPARK','接过火炬，走好青春的长征路','把历史带来的感动，转化为今天可以完成的一件小事。')}<div class="action-intro"><span>从“我读过”，到“我做过”。</span><p>不必等待宏大的时刻，认真学习、求实创新、服务他人，都是我们这一代人的回答。</p></div><div class="action-list">${D.actions.map((a,i)=>`<article class="action-item ${state.actions.includes(a.id)?'done':''}"><span class="action-number">0${i+1}</span><div class="action-icon">${icon(a.icon)}</div><div><small>${a.tag}</small><h3>${a.title}</h3><p>${a.text}</p></div><button class="${state.actions.includes(a.id)?'completed-button':'outline'}" data-check="${a.id}" aria-pressed="${state.actions.includes(a.id)}">${state.actions.includes(a.id)?'✓ 已完成':'标记完成'}</button></article>`).join('')}</div><section class="reflection"><div><h2>写下你的青春回应</h2><p>一个目标，一次行动，一点收获。<br>这页手记，只保存在你的浏览器中。</p></div><div><label for="reflection-note">我的学习手记</label><textarea id="reflection-note" maxlength="3000" placeholder="我想用自己的专业与行动……">${esc(state.note)}</textarea><div class="note-toolbar"><small id="note-count">${state.note.length} / 3000</small><button class="primary" data-action="save-note">保存我的回应 ${icon('check')}</button></div></div></section>`;}
 function bagPage(){const n=state.completed.length,originalStories=D.stories.filter(s=>s.id!=='radio');const badges=[['初心启程',n>=1,'点亮第一站','flag'],['万水千山',n===9,'完成九站征途','mountain'],['知史明志',state.bestScore>=80,'知识挑战达到80分','book'],['记忆守护者',originalStories.every(s=>state.read.includes(s.id)),'阅读原有'+originalStories.length+'篇记忆','heart'],['青春践行者',state.actions.length>=3,'完成三项青春行动','star'],['红色电波',state.learningBadges.includes('radio-relay'),'完成三次通信交接','code']];return `${pageHeading('MY JOURNEY','把信仰与收获，装进行囊','每一次探索、每一个故事、每一份行动，都在这里留下自己的印记。')}<div class="bag-summary"><div class="bag-medal">★</div><div><span class="overline">${n===9?'万水千山，初心不改':'新的征程，由此展开'}</span><h2>${n===9?'九站征途已点亮':'你好，星火同行者'}</h2><p>${n?'你已点亮 '+n+' 站历史坐标，继续让信念照亮前路。':'你的行囊已准备好，去遇见长征路上的第一束光。'}</p></div><button class="primary" data-start="${Math.max(0,D.chapters.findIndex(c=>!state.completed.includes(c.id)))}">${n===9?'重温征途':'继续出发'} ${arrow()}</button></div><div class="bag-stats"><div><strong>${n}<small> / 9</small></strong><span>征途站点</span></div><div><strong>${state.read.length}<small> / ${D.stories.length}</small></strong><span>已读记忆</span></div><div><strong>${state.quizRuns?state.bestScore:'—'}<small> 分</small></strong><span>知识最高分</span></div><div><strong>${state.actions.length}<small> / 5</small></strong><span>青春行动</span></div></div><div class="bag-quiz-summary" data-quiz-scores>${quizScores()}</div><section class="section"><div class="section-title"><h2>我的精神印记</h2><span>行动，让印记有了温度。</span></div><div class="badges">${badges.map(([name,done,desc,ic])=>`<div class="badge ${done?'earned':''}"><div>${icon(ic)}</div><h3>${name}</h3><p>${desc}</p><small>${done?'已点亮':'待点亮'}</small></div>`).join('')}</div></section><section class="stamp-section"><div class="section-title"><h2>九站征途集章册</h2><button class="text-button" data-nav="map">探索历史地图 ${arrow()}</button></div><div class="stamps">${D.chapters.map((c,i)=>`<button class="stamp ${state.completed.includes(c.id)?'collected':''}" data-start="${i}"><span>★</span><strong>${c.title}</strong><small>${state.completed.includes(c.id)?'星火已点亮':c.date}</small></button>`).join('')}</div></section><section class="bag-export"><div><h3>留存一份属于你的征途记忆</h3><p>导出进度与手记，或在完成九站后生成纪念卡。</p></div><div><button class="outline" data-action="export">${icon('download')} 导出学习记录</button><button class="primary" data-action="certificate" ${n<9?'disabled':''}>生成纪念卡 ${arrow()}</button></div></section><div class="storage-note">${storageOK?'进度保存在当前设备的浏览器中，不会自动跨设备同步。':'当前浏览器未允许本地保存，关闭后进度可能丢失。'} <button data-action="reset">清空本机记录</button></div>`;}
 function openModal(html,wide=false){const d=$('#dialog');$('#dialog-content').innerHTML=`<button class="dialog-close" data-action="close" aria-label="关闭弹窗">×</button>${html}`;d.classList.toggle('wide',wide);if(!d.open)d.showModal();}
 function closeModal(){$('#dialog').close();active=null;}
 function sourceLink(index){const s=D.sources[index];return `<a class="source-inline" href="${s.url}" target="_blank" rel="noopener noreferrer">参考史料：${s.publisher} · ${s.title} ↗</a>`;}
 function sources(){openModal(`<h2 id="dialog-title">让每一段记忆，都有来处</h2><p class="modal-lead">《星火征程》是纪念长征胜利90周年的互动学习作品。</p><div class="about-block"><h3>史料与艺术表达</h3><p>历史介绍为基于下列资料编写的简要转述；历史地图引自中央党史和文献研究院。情境选择、行囊配置、路线棋盘、架桥、信号记忆与通信接力均为教学创作，不是历史原貌复现。</p><p>界面、交互、关卡与程序重新设计；主视觉由人工智能辅助创作，作为主题艺术插画使用。红色记忆插画来自用户提供的演示文稿，均不作历史照片使用。创意研究参考了《前进之路》的参与式学习思路，未使用其代码、图片、界面或剧情。</p></div><div class="source-list">${D.sources.map((s,i)=>`<a href="${s.url}" target="_blank" rel="noopener noreferrer"><span>0${i+1}</span><div><b>${s.title}</b><small>${s.publisher}</small></div><span>↗</span></a>`).join('')}</div><p class="fine-print">网页不收集个人身份信息。学习记录与手记保存在本机浏览器，清除浏览器数据会同时清除记录。</p>`,true);}
 function guide(){openModal(`<h2 id="dialog-title">从第一束星火开始</h2><div class="guide-steps"><p><b>01 · 重走长征</b>点击地图站点，阅读史实，完成不同类型的挑战。可以自由探索，也可以按时间顺序前进。</p><p><b>02 · 收藏与思考</b>阅读红色记忆，收藏触动你的故事；知识挑战中，每道题都有解析与来源。</p><p><b>03 · 把感动变成行动</b>在青春接力中完成实际行动，保存手记。到我的行囊查看印记、导出记录。</p></div><button class="primary full" data-guide-start>开启我的征途 ${arrow()}</button>`);}
 function storyChapterLinks(id) {
  const chapters=D.graph.relations.filter(r=>r.to===`story:${id}`&&r.from.startsWith('event:')).map(r=>D.graph.index[r.from].chapterId).filter(Boolean);
  return chapters.length?`<h3>关联历史</h3><div class="graph-stations">${chapters.map(id=>`<button data-explore-chapter="${id}">${esc(D.graph.index[id].title)} ↗</button>`).join('')}</div>`:'';
 }
 function illustration(item){return `<figure class="story-figure"><img src="${item.src}" alt="${item.alt}" loading="lazy" width="1366" height="910"><figcaption>${item.caption} · 主题插画</figcaption></figure>`;}
 function story(id){const s=D.stories.find(x=>x.id===id);if(!s)return;state.read=[...new Set([...state.read,id])];save();const images=s.id==='mountain'?s.gallery:s.gallery.slice(1);openModal(`<div class="story-modal-banner ${s.id==='mountain'?'story-mountain':''}">${s.cover?`<img src="${s.cover}" alt="${s.gallery[0].alt}" width="1366" height="910">`:''}</div><p class="story-category">${s.category} · ${s.time}</p><h2 id="dialog-title">${s.title}</h2><div class="story-body">${s.text.split('\n\n').map((p,i)=>`<p>${esc(p)}</p>${images[i]?illustration(images[i]):''}`).join('')}</div><p class="image-note">本页插画为艺术表达，不作为历史照片或人物肖像考证。</p><div class="thinking"><strong>把故事带回今天</strong><p>${s.question}</p></div><details class="story-references"><summary>参考史料</summary>${(s.sources||[s.source]).map(sourceLink).join('')}</details>${id==='radio'?'<button class="primary full" data-radio-start>体验通信接力</button>':''}${storyChapterLinks(id)}<div class="modal-actions"><button class="outline" data-favorite="${id}">${icon('heart')} ${state.favorites.includes(id)?'已收藏 · 点击取消':'收藏故事'}</button><button class="primary" data-story-action>写下我的回应 ${arrow()}</button></div>`,true);}

 const sequence=[['observe','观察环境'],['support','稳固支撑'],['lay','铺设通道'],['walk','协同通过']];
 const order=['yudu','xiangjiang','zunyi','luding','wuqi'].map(id=>D.chapters.find(c=>c.id===id).title);
 const symbols=[['★','星火'],['△','山峰'],['≈','河流'],['⌂','营地']];
 function radioEquipmentArt() {
  return `<svg class="radio-device" viewBox="0 0 560 155" role="img" aria-label="电台功能示意：发报操作、收发设备、天线与供电相互配合，不是文物外观复原">
   <g fill="none" stroke="currentColor" stroke-width="2"><path d="M80 108h63m-48 0 28-22m-6-3 18 8M143 107h44M375 107h39M250 40V8m-22 0h44m-35 12h26m-17 95v22h-55m222-58h65v53h-65z"/>
   <rect x="188" y="42" width="187" height="77" rx="4"/><circle cx="224" cy="78" r="15"/><circle cx="282" cy="78" r="15"/><path d="M216 78h16m42 0h16m33-9h32m-32 10h32m-32 10h32m76 6h11m-6-5v10m19-5h11"/></g>
   <g fill="currentColor" font-size="13" text-anchor="middle"><text x="112" y="148">操作</text><text x="282" y="148">收发协同</text><text x="302" y="20">天线</text><text x="446" y="148">供电</text></g></svg>`;
 }
 function radioHistory() {
  const t=D.communication;
  return `<div class="radio-history"><section><h3>行军中，为什么更需要联络？</h3><p>${esc(t.background)}</p></section><section><h3>一部先行，一部留守</h3><p>${esc(t.relay)}</p></section><section><h3>两类工作，分别理解</h3><p>${esc(t.distinction)}</p></section></div>`;
 }
 function startRadio() {active={kind:'radio',model:C.radioInitial(),intro:true,message:''};renderRadio();}
 function renderRadio(focusKey){
  const t=D.communication,a=active;
  if(a.intro){openModal(`<h2 id="dialog-title">${t.title}</h2><p class="modal-lead">一部电台先行，一部电台留守。新台确认联络后，原台再转移。</p><img class="radio-cover" src="assets/memories/radio-1.webp" alt="行军通信主题插画"><details class="radio-history-details"><summary>了解历史与通信设备</summary>${radioHistory()}<h3>${t.equipment.title}</h3>${radioEquipmentArt()}<p>${t.equipment.description}</p>${t.sources.map(sourceLink).join('')}</details><p class="radio-model-note">教学模拟：两部电台、三次交接，不对应真实编制与电文。</p><button class="primary full" data-radio-begin>开始通信接力 ${arrow()}</button>`,true);return;}
  const m=a.model,statuses={onair:'驻守通信',packed:'待转移',moving:'转移途中',setup:'等待架设',ready:'架设完成',waiting:'等待确认'},next={packed:['move','安排转移'],moving:['arrive','抵达驻地'],setup:['setup','架设电台'],ready:['contact','发起试联'],waiting:['confirm','确认联络']};
  openModal(`<h2 id="dialog-title">通信接力</h2><p class="modal-lead">保持一部驻守，另一部先行。完成三次交接。</p><div class="radio-progress">${Array.from({length:3},(_,i)=>`<span class="${i<m.handoffs?'done':''}">${i<m.handoffs?'✓':i+1} 第${i+1}次交接</span>`).join('')}</div><p id="radio-feedback" class="radio-feedback" role="status">${esc(a.message||'请先安排二号电台转移。')}</p><div class="radio-stations">${m.stations.map((station,i)=>`<article class="radio-station ${station.phase==='onair'?'onair':''}"><div class="radio-station-title"><h3>${i===0?'一号':'二号'}电台</h3><strong>${statuses[station.phase]}</strong></div>${icon('code')}<p>模拟驻地 ${station.position}</p>${m.finished?'<span>接力完成</span>':next[station.phase]?`<button class="primary full" data-radio-step="${next[station.phase][0]}" data-radio-station="${i}">${next[station.phase][1]} ${arrow()}</button>`:'<button class="outline full" disabled>驻守保障联络</button>'}</article>`).join('')}</div>${m.finished?'<div class="radio-result"><h3>红色电波印记已点亮</h3><p>先确认，再交接，让通信与行军相互配合。</p><button class="primary full" data-finish-bag>查看我的行囊</button></div>':''}<div class="modal-actions"><button class="text-button" data-radio-start>重新开始</button><button class="text-button" data-radio-history>回看历史</button></div>`,true);
  if(focusKey)$('#dialog [data-radio-station="'+focusKey.index+'"][data-radio-step="'+focusKey.action+'"]')?.focus({preventScroll:true});
 }
 function stepRadio(index,action) {
  if(active?.kind!=='radio'||active.intro)return;
  const result=C.radioStep(active.model,index,action);
  if(!result.ok){$('#radio-feedback').textContent=result.message;return;}
  active.model=result.model;active.message=result.message;
  if(result.model.finished){state.learningBadges=[...new Set([...state.learningBadges,D.communication.badgeId])];save();}
  const nextAction={move:'arrive',arrive:'setup',setup:'contact',contact:'confirm',confirm:'move'}[action];
  renderRadio({index:action==='confirm'?1-index:index,action:nextAction});
 }
 function communicationGraphArt(){return `<div class="relations-hub"><span>通信保障</span><h2>让电波连接征途</h2></div><div class="relations-list">${D.communication.nodeIds.filter(id=>id!=='topic:communication').map(id=>{const n=D.graph.index[id];return `<button class="relation-card" data-graph-node="${id}"><strong>${esc(n.storyId?D.stories.find(st=>st.id===n.storyId)?.shortTitle||n.title:n.title)}</strong>${arrow()}</button>`;}).join('')}</div>`;}
 function communicationArchive() {
  const t=D.communication;
  return `<article class="graph-archive"><span class="overline">长征通信史 · 专题档案</span><h2 id="archive-title" tabindex="-1">${t.title}</h2>${radioHistory()}<section><h3>认识通信设备</h3>${radioEquipmentArt()}<p>${esc(t.equipment.description)}</p></section><section><h3>通信人员档案</h3><button class="archive-chip" data-story="radio">守住联络：长征通信人员 ↗</button></section><section><h3>参考史料</h3>${t.sources.map(sourceLink).join('')}</section><p class="radio-model-note">${esc(t.modelNote)}</p><button class="primary full" data-radio-start>体验两部电台通信接力 ${arrow()}</button></article>`;
 }
 function openCommunicationTopic() {
  graphTopic=true;journeyView='graph';if(graphPath[0]!=='topic:communication')graphPath=['topic:communication'];
  if($('#dialog').open)closeModal();
  if(current==='map')refreshJourney('#archive-title');else go('map');
 }

 function startMission(index,special){if(special==='memory'){startRadio();return;}const c=special?{type:special,mission:{order:'时空排序',memory:'红色电波·行军通信',grid:'机动路线'}[special],intro:{order:'按发生时间从早到晚，依次选择五个历史节点。',memory:'记住四个联络符号的顺序，再准确传递给同伴。',grid:'从起点出发，点击相邻格，避开障碍，到达星火出口。'}[special]}:D.chapters[index];active={kind:'mission',index,special,c,values:[0,0,0,0],path:[0],chosen:[],hidden:false,pattern:Array.from({length:4},()=>Math.floor(Math.random()*4))};renderMission();}
 function missionInner(){const {c}=active;switch(c.type){
 case 'pack':return `<div class="pack-capacity">行囊容量 <b id="pack-total">${active.values.reduce((a,b)=>a+b,0)}</b> / 12 格</div><div class="pack-items">${[['食物','维持行进，至少3格','book'],['医疗','照护伙伴，至少2格','heart'],['保暖','抵御寒冷，至少3格','mountain'],['工具','共同协作，至少2格','flag']].map(([t,d,ic],i)=>`<div>${icon(ic)}<label for="pack-${i}"><b>${t}</b><small>${d}</small></label><input id="pack-${i}" type="range" min="0" max="6" value="${active.values[i]}" data-pack="${i}"><output id="pack-out-${i}">${active.values[i]}</output></div>`).join('')}</div><p class="fine-print">配置为抽象教学模型，不是历史物资配给数据。各项最低需求已标注，可留出备用容量。</p><button class="primary full" data-submit-pack>确认出发行囊 ${arrow()}</button>`;
 case 'decision':return `<div class="answer-options">${c.options.map((o,i)=>`<button data-decision="${i}"><span>${String.fromCharCode(65+i)}</span>${o}</button>`).join('')}</div>`;
 case 'grid':return `<div class="route-puzzle" role="group" aria-label="五乘五路线棋盘">${Array.from({length:25},(_,i)=>`<button class="${C.blocks.includes(i)?'blocked':''} ${active.path.includes(i)?'visited':''} ${i===active.path.at(-1)?'position':''}" data-cell="${i}" ${C.blocks.includes(i)?'disabled':''} aria-label="第${Math.floor(i/5)+1}行第${i%5+1}列${C.blocks.includes(i)?'障碍':''}">${i===0?'起点':i===24?'★':C.blocks.includes(i)?'×':active.path.includes(i)?'·':''}</button>`).join('')}</div><div class="puzzle-toolbar"><span>已走 ${active.path.length-1} 步 · 点击上下左右相邻格</span><button class="outline" data-undo>回退一步</button></div><p class="fine-print">抽象路线解谜，不代表四渡赤水实际路线。红格为障碍，亮色格为已走路径。</p>`;
 case 'sequence':return `<div class="bridge-progress">${sequence.map((s,i)=>`<div class="${active.chosen.length>i?'built':''}"><span>${active.chosen.length>i?'✓':i+1}</span><i></i></div>`).join('')}</div><div class="answer-options">${[sequence[2],sequence[0],sequence[3],sequence[1]].map(([id,t])=>`<button data-sequence="${id}" ${active.chosen.includes(id)?'disabled':''}>${icon('flag')} ${t}</button>`).join('')}</div><p class="fine-print">这是工程协作模型，不是泸定桥战斗的真实战术推演。</p>`;
 case 'memory':return `${!active.hidden?`<div class="signal-sequence">${active.pattern.map((n,i)=>`<div><small>${i+1}</small><strong>${symbols[n][0]}</strong><span>${symbols[n][1]}</span></div>`).join('')}</div><button class="primary full" data-hide-signal>记住了，开始传递 ${arrow()}</button>`:`<div class="signal-answer">${Array.from({length:4},(_,i)=>`<span>${active.chosen[i]===undefined?'?':symbols[active.chosen[i]][0]}</span>`).join('')}</div><div class="signal-buttons">${symbols.map(([sym,t],i)=>`<button data-signal="${i}"><strong>${sym}</strong>${t}</button>`).join('')}</div><button class="text-button" data-recall>重新观察信号</button>`}`;
 case 'order':return `<div class="order-slots">${order.map((_,i)=>`<div><small>0${i+1}</small><span>${active.chosen[i]===undefined?'等待历史节点':order[active.chosen[i]]}</span></div>`).join('')}</div><div class="order-buttons">${[2,4,0,3,1].map(i=>`<button class="outline" data-order="${i}" ${active.chosen.includes(i)?'disabled':''}>${order[i]}</button>`).join('')}</div><button class="text-button" data-order-reset>重新排列</button>`;
 default:return '';}}
 function renderMission(){openModal(`<span class="overline">${active.special?'星火精神挑战':`第 ${String(active.index+1).padStart(2,'0')} 站 · ${active.c.title}`} / ${active.c.type==='decision'&&active.index===8?'历史知识':'教学模拟'}</span><h2 id="dialog-title">${active.c.mission}</h2><p class="modal-lead">${active.c.intro}</p><div id="mission-feedback" role="status"></div>${missionInner()}`);}
 function feedback(msg){$('#mission-feedback').innerHTML=`<p class="feedback error">${msg}</p>`;}
 function finishMission(explanation){const a=active;if(!a.special){state=C.award(state,a.c.id);save();}openModal(`<div class="success-mark">★</div><span class="overline">${a.special?'挑战完成':'征途印记'}</span><h2 id="dialog-title">${a.special?'挑战完成，收获新的力量':a.c.title+' · 星火已点亮'}</h2><p class="modal-lead">${explanation||a.c.spirit||'观察、思考、再尝试，让目标与方法一起前进。'}</p>${a.special?'':`<div class="earned-stamp">${a.c.tag}<small>星火征程 · 第${a.index+1}站纪念印记</small></div>${sourceLink(a.c.source)}`}<div class="modal-actions"><button class="outline" data-finish-back>${a.special?'返回挑战':'返回地图'}</button>${!a.special&&a.index<8?`<button class="primary" data-next-chapter="${a.index+1}">前往下一站 ${arrow()}</button>`:`<button class="primary" data-finish-bag>查看我的行囊 ${arrow()}</button>`}</div>`);active={...a,finished:true};}
 function startQuiz(mode){let questions=D.questions.filter(q=>mode==='all'||q.topic===mode).map(q=>({...q}));for(let i=questions.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[questions[i],questions[j]]=[questions[j],questions[i]];}active={kind:'quiz',questions:questions.slice(0,6),at:0,score:0,answer:null,answers:[]};renderQuiz();}
 function renderQuiz(){const a=active,q=a.questions[a.at];openModal(`<span class="overline">星火知识挑战 / 第 ${a.at+1} 题 / 共 ${a.questions.length} 题</span><div class="quiz-progress"><i style="width:${(a.at+1)/a.questions.length*100}%"></i></div><h2 id="dialog-title" class="quiz-question">${q.q}</h2><div class="answer-options">${q.options.map((o,i)=>`<button data-answer="${i}" class="${a.answer!==null?(i===q.answer?'correct':i===a.answer?'wrong':''):''}" ${a.answer!==null?'disabled':''}><span>${String.fromCharCode(65+i)}</span>${o}${a.answer!==null&&i===q.answer?' ✓':''}</button>`).join('')}</div>${a.answer!==null?`<div class="quiz-explanation"><b>${a.answer===q.answer?'回答正确':'一起记住正确答案'}</b><p>${q.explain}</p>${sourceLink(q.source)}${quizGraphLink(q)}</div><button class="primary full" data-next-question>${a.at===a.questions.length-1?'查看本轮收获':'下一题'} ${arrow()}</button>`:'<p class="fine-print">每题只有一个正确答案。作答后可查看史料解析。</p>'}`);}
 function quizResult(){
  const a=active,total=a.questions.length,correct=a.score,previousBest=state.bestScore;
  state=C.recordQuiz(state,correct,total);save();
  const score=state.lastQuiz.score;
  active={...a,kind:'quiz-result',score,correct,total,newRecord:score>previousBest};lastRound=active;
  syncQuizScores(active.newRecord);
  renderQuizResult();
 }
 function renderQuizResult(){const a=active;openModal(`<div class="success-mark">${a.score>=80?'★':'✦'}</div><h2 id="dialog-title">${a.score>=80?'知史明志，薪火相传':'带着新的收获，再次出发'}</h2><div class="quiz-score">${a.score}<small>分</small></div><p class="modal-lead">本轮答对 ${a.correct} / ${a.total} 题 · 历史最高分 ${state.bestScore} 分</p><p class="quiz-record-note">${a.newRecord?'本轮刷新历史最高分！':'本轮成绩已保存，历史最高分保持不变。'}</p><div class="modal-actions"><button class="outline" data-review-quiz>查看错题解析</button><button class="outline" data-quiz="all">再挑战一次</button><button class="primary" data-finish-bag>查看精神印记 ${arrow()}</button></div>`);}
 function download(data,name,type){const url=URL.createObjectURL(new Blob([data],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 function exportRecord(){const text=['星火征程 · 我的学习记录','导出时间：'+new Date().toLocaleString('zh-CN',{timeZone:'Asia/Shanghai'}),'','九站征途：'+state.completed.length+'/9',...D.chapters.map(c=>(state.completed.includes(c.id)?'✓ ':'○ ')+c.title+' · '+c.date),'','已读红色记忆：'+state.read.length+'/'+D.stories.length,'收藏：'+D.stories.filter(s=>state.favorites.includes(s.id)).map(s=>s.title).join('、'),'知识最高分：'+state.bestScore,'本轮知识成绩：'+(state.lastQuiz?state.lastQuiz.score+'分（'+state.lastQuiz.correct+'/'+state.lastQuiz.total+'）':'暂无记录'),'专题印记：'+(state.learningBadges.includes('radio-relay')?'红色电波':'尚未获得'),'','青春行动：',...D.actions.map(a=>(state.actions.includes(a.id)?'✓ ':'○ ')+a.title),'','我的学习手记：',state.note||'尚未记录'].join('\n');download('\ufeff'+text,'星火征程-我的学习记录.txt','text/plain;charset=utf-8');toast('学习记录已导出');}
 function certificate(){if(state.completed.length<9)return;const canvas=document.createElement('canvas');canvas.width=1500;canvas.height=1000;const ctx=canvas.getContext('2d');ctx.fillStyle='#f6ecd9';ctx.fillRect(0,0,1500,1000);ctx.fillStyle='#b52d25';ctx.fillRect(0,0,1500,20);ctx.strokeStyle='#b52d25';ctx.lineWidth=2;ctx.strokeRect(45,45,1410,910);ctx.textAlign='center';ctx.fillStyle='#b52d25';ctx.font='80px serif';ctx.fillText('★',750,160);ctx.font='bold 76px serif';ctx.fillText('万水千山，初心不改',750,285);ctx.fillStyle='#806650';ctx.font='25px sans-serif';ctx.fillText('星火征程 · 九站探索纪念卡',750,350);ctx.font='32px serif';ctx.fillStyle='#514337';ctx.fillText('已完成九站历史探索与精神挑战',750,455);ctx.font='23px sans-serif';D.chapters.forEach((c,i)=>{const x=280+(i%3)*470,y=550+Math.floor(i/3)*80;ctx.fillStyle='#b52d25';ctx.fillText('★ '+c.title,x,y);});ctx.fillStyle='#806650';ctx.font='24px serif';ctx.fillText('九十载长征 · 代码续星火',750,845);ctx.font='19px sans-serif';ctx.fillText('1936 — 2026  |  青春的长征，继续向前',750,900);canvas.toBlob(blob=>{if(!blob)return;const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='星火征程-九站纪念卡.png';a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);},'image/png');toast('纪念卡已生成');}
 document.addEventListener('click',e=>{const b=e.target.closest('button,a,[data-graph-node]');if(!b||b.disabled)return;const d=b.dataset;
  if(d.radioStart!==undefined){startRadio();return;}
  if(d.radioBegin!==undefined&&active?.kind==='radio'){active.intro=false;renderRadio();return;}
  if(d.radioHistory!==undefined&&active?.kind==='radio'){active.intro=true;renderRadio();return;}
  if(d.radioStep){stepRadio(Number(d.radioStation),d.radioStep);return;}
  if(d.communicationTopic!==undefined){openCommunicationTopic();return;}
  if(d.nav){go(d.nav);return;}
  if(d.start!==undefined){graphTopic=false;hasJourneySelection=true;graphExpanded=true;selected=Number(d.start);if(current==='map')render('map');else go('map');return;}
  if(d.journeyView){journeyView=d.journeyView;graphExpanded=hasJourneySelection;refreshJourney(`[data-journey-view="${journeyView}"]`);return;}
  if(d.graphReset!==undefined){graphPath=[];graphTopic=false;graphExpanded=false;refreshJourney('[data-graph-reset]');return;}
  if(d.graphNode){hasJourneySelection=true;exploreGraphNode(d.graphNode);return;}
  if(d.exploreChapter){graphPath=[];graphTopic=false;selected=D.chapters.findIndex(c=>c.id===d.exploreChapter);hasJourneySelection=true;graphExpanded=true;journeyView='graph';closeModal();if(current==='map')refreshJourney('#archive-title');else go('map');return;}
  if(d.node!==undefined){const origin=journeyView==='graph'?'.graph-stations':b.classList.contains('progress-pin')?'.map-progress-markers':'.station-list';graphTopic=false;hasJourneySelection=true;graphExpanded=true;selected=Number(d.node);graphPath=[D.chapters[selected].id];routeVisited.add(D.chapters[selected].id);refreshJourney(`${origin} [data-node="${selected}"]`);return;}
  if(d.mission!==undefined){startMission(Number(d.mission));return;}
  if(d.special){startMission(-1,d.special);return;}
  if(d.quiz){startQuiz(d.quiz);return;}
  if(d.reviewQuiz!==undefined){reviewQuiz();return;}
  if(d.quizResult!==undefined&&lastRound){active=lastRound;renderQuizResult();return;}
  if(d.story){story(d.story);return;}
  if(d.favorite){const id=d.favorite;state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();if($('#dialog').open)story(id);else render(current);toast(state.favorites.includes(id)?'这束光已装进行囊':'已取消收藏');return;}
  if(d.filter){memoryFilter=d.filter;$('#content').innerHTML=memoryPage();return;}
  if(d.check){if($('#reflection-note'))state.note=$('#reflection-note').value;state.actions=state.actions.includes(d.check)?state.actions.filter(x=>x!==d.check):[...state.actions,d.check];save();$('#content').innerHTML=actionPage();toast(state.actions.includes(d.check)?'行动已记录，继续让精神照亮生活':'已取消标记');return;}
  if(d.guideStart!==undefined){closeModal();go('map');return;}
  if(d.storyAction!==undefined){closeModal();go('action');return;}
  if(d.finishBack!==undefined){const p=active?.special?'challenge':'map';closeModal();go(p);return;}
  if(d.finishBag!==undefined){closeModal();go('bag');return;}
  if(d.nextChapter!==undefined){graphTopic=false;hasJourneySelection=true;graphExpanded=true;selected=Number(d.nextChapter);closeModal();go('map');return;}
  if(d.submitPack!==undefined){if(C.packing(active.values))finishMission('在有限资源下兼顾行进、健康、保暖与协作，体现统筹准备和对伙伴的关心。'+active.c.spirit);else feedback('再调整一下：总量不超过12格，食物至少3格、医疗2格、保暖3格、工具2格。');return;}
  if(d.decision!==undefined){if(Number(d.decision)===active.c.answer)finishMission(active.c.explain);else feedback('再想一想：'+(active.index===8?'注意区分1935年中央红军到达陕北与1936年三大主力会师。':'兼顾实际情况、共同使命与同行伙伴，再试一次。'));return;}
  if(d.cell!==undefined){const next=Number(d.cell);if(!C.canStep(active.path,next)){toast('请选择与当前位置上下左右相邻、尚未走过的格子');return;}active.path.push(next);if(next===24)finishMission('你通过观察与调整找到了一条通路。坚定目标、灵活运用方法，是这个抽象解谜希望传达的启发。');else renderMission();return;}
  if(d.undo!==undefined){if(active.path.length>1)active.path.pop();renderMission();return;}
  if(d.sequence){if(d.sequence===sequence[active.chosen.length][0]){active.chosen.push(d.sequence);if(active.chosen.length===4)finishMission('通道已经连接。观察、准备、分工与协同，让个人的努力汇成集体的力量。');else renderMission();}else feedback('先完成前置准备。参考提示顺序，再选择下一步。');return;}
  if(d.hideSignal!==undefined){active.hidden=true;active.chosen=[];renderMission();return;}
  if(d.recall!==undefined){active.hidden=false;active.chosen=[];renderMission();return;}
  if(d.signal!==undefined){const n=Number(d.signal);if(n!==active.pattern[active.chosen.length]){active.hidden=false;active.chosen=[];renderMission();feedback('信号有一点偏差。重新观察，不着急，准确沟通更重要。');}else{active.chosen.push(n);if(active.chosen.length===4)finishMission('信号传递成功。认真观察、准确表达、相互确认，能让团队在复杂环境中更好地协作。');else renderMission();}return;}
  if(d.order!==undefined){const n=Number(d.order);if(active.chosen.includes(n))return;active.chosen.push(n);if(active.chosen.length===5){if(active.chosen.every((v,i)=>v===i))finishMission('时间轴已整理：1934年10月于都启程 → 11月血战湘江 → 1935年1月遵义转折 → 5月飞夺泸定桥 → 10月到达吴起。');else{renderMission();feedback('时间顺序还有偏差。提示：于都与湘江在1934年，遵义、泸定桥、吴起在1935年。可以重新排列。');}}else renderMission();return;}
  if(d.orderReset!==undefined){active.chosen=[];renderMission();return;}
  if(d.answer!==undefined){if(!active||active.answer!==null)return;active.answer=Number(d.answer);active.answers[active.at]=active.answer;if(active.answer===active.questions[active.at].answer)active.score++;renderQuiz();return;}
  if(d.nextQuestion!==undefined){if(active?.kind!=='quiz'||active.answer===null)return;if(active.at===active.questions.length-1)quizResult();else{active.at++;active.answer=null;renderQuiz();}return;}
  if(d.confirmReset!==undefined){state=C.initial();save();closeModal();render('bag');toast('本机学习记录已清空');return;}
  switch(d.action){case 'map-image':openModal(`<h2 id="dialog-title">${D.historicalMap.title}</h2><div class="map-zoom" tabindex="0" role="region" aria-label="完整历史地图，可滚动查看"><img src="${D.historicalMap.src}" alt="完整长征路线示意图"></div><p class="map-source">历史地图保留原图与图例。<a href="${D.historicalMap.source}" target="_blank" rel="noopener noreferrer">查看来源 ↗</a></p>`,true);break;case 'close':closeModal();break;case 'sources':sources();break;case 'guide':guide();break;case 'route-info':openModal('<h2 id="dialog-title">九个节点，一段精神旅程</h2><p class="modal-lead">地图以中央红军长征主要节点为线索，延伸到1936年红军三大主力会师。它不是全部红军长征路线的完整复原。</p><p>各支红军长征的出发时间、路线和行程有所不同。1935年10月中央红军到达陕北，与1936年10月三大主力会师应当区分。</p><p>路线图采用中央党史和文献研究院发布的历史地图，保留当时地名与区划；下方九个节点为学习入口，完成挑战后点亮印记。</p>'+sourceLink(1));break;case 'save-note':state.note=$('#reflection-note').value;save();toast('你的青春回应已保存在本机');break;case 'export':exportRecord();break;case 'certificate':certificate();break;case 'reset':openModal('<h2 id="dialog-title">清空本机学习记录？</h2><p class="modal-lead">将清除当前浏览器中的征途进度、收藏、成绩、行动与手记。需要留存时，可先导出学习记录。</p><div class="modal-actions"><button class="outline" data-action="close">保留记录</button><button class="primary" data-confirm-reset>确认清空</button></div>');break;}
 });
 document.addEventListener('keydown',e=>{const node=e.target.closest('[data-graph-node][role=button]');if(node&&(e.key==='Enter'||e.key===' ')){e.preventDefault();node.dispatchEvent(new MouseEvent('click',{bubbles:true}));}});
 document.addEventListener('input',e=>{if(e.target.dataset.pack!==undefined){const i=Number(e.target.dataset.pack);active.values[i]=Number(e.target.value);$('#pack-out-'+i).textContent=e.target.value;const total=active.values.reduce((a,b)=>a+b,0);$('#pack-total').textContent=total;$('#pack-total').classList.toggle('over-capacity',total>12);}if(e.target.id==='reflection-note'){$('#note-count').textContent=e.target.value.length+' / 3000';}});
 $('#dialog').addEventListener('click',e=>{if(e.target===$('#dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeModal();}});
 $('#dialog').addEventListener('cancel',()=>{active=null;});
 window.addEventListener('hashchange',()=>{const p=location.hash.slice(1);if(p==='content'){$('#content').focus();return;}render(navs.some(n=>n[0]===p)?p:'home');});
 render(navs.some(n=>n[0]===location.hash.slice(1))?location.hash.slice(1):'home');
})();
