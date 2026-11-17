/* 用户提供的主题插画与权威历史地图。插画不作为历史照片或人物肖像考证。 */
(() => {
 const D=window.XH_DATA;
 const gallery={
  quilt:['剪开棉被的瞬间','灶火旁的相聚','门前的惜别','半条棉被的温暖'],
  chen:['青年红军主题侧影','山路上的后卫交接','山口的侦察报告','林下集结'],
  meeting:['会场迎来晨光','油灯下的记录','冬夜楼廊','整理行军方案'],
  bridge:['桥头的号声','战前支援','递水相扶','桥头整装'],
  mountain:['修补草鞋','雪岩相扶','雪中足迹'],
  victory:['将台堡会师主题','会师后的相聚','旧鞋与补丁','整装再出发'],
  radio:['草地上的无线电守护']
 };
 D.stories.forEach(s=>{
  s.shortTitle={quilt:'半条被子的故事',chen:'陈树湘的故事',meeting:'遵义会议故事',bridge:'泸定桥的故事',mountain:'雪山草地的故事',victory:'胜利会师的故事',radio:'通信人员档案'}[s.id];
  s.gallery=gallery[s.id].slice(0,s.id==='mountain'?2:3).map((caption,i)=>({src:`assets/memories/${s.id}-${i+1}.webp`,caption,alt:caption+'（主题艺术插画）'}));
  if(s.id!=='mountain')s.cover=s.gallery[0].src;
 });
 D.historicalMap={src:'assets/long-march-historical-map.jpg',title:'中国工农红军长征路线示意图',source:'https://www.dswxyjy.org.cn/GB/427277/462086/',publisher:'中央党史和文献研究院'};
})();
