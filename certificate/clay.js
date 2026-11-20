/* NAVIG 클레이 아이콘 스크롤 인터랙션 (라이브러리 없음) */
(function(){
  var stages=[].slice.call(document.querySelectorAll('.clay-stage'));
  if(!stages.length) return;
  var reduce=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(reduce||!('IntersectionObserver' in window)){stages.forEach(function(s){s.classList.add('is-in');});return;}
  var vis=new Set();
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){
      var s=e.target;
      if(e.isIntersecting){vis.add(s); if(e.intersectionRatio>=0.35) s.classList.add('is-in');}
      else{vis.delete(s); s.classList.remove('is-in');} /* 화면 밖으로 나가면 초기화, 다시 오면 재생 */
    });
    tick();
  },{threshold:[0,0.35,0.6]});
  stages.forEach(function(s){io.observe(s); s._m={x:0,y:0}; s._l=[].slice.call(s.querySelectorAll('.cl'));
    s.addEventListener('pointermove',function(ev){var r=s.getBoundingClientRect();s._m.x=(ev.clientX-r.left)/r.width-0.5;s._m.y=(ev.clientY-r.top)/r.height-0.5;tick();});
    s.addEventListener('pointerleave',function(){s._m.x=0;s._m.y=0;tick();});
  });
  var raf=0;
  function tick(){if(!raf) raf=requestAnimationFrame(draw);}
  function draw(){
    raf=0; var vh=window.innerHeight;
    vis.forEach(function(s){
      var r=s.getBoundingClientRect();
      var p=(r.top+r.height/2-vh/2)/vh; if(p<-1)p=-1; if(p>1)p=1;
      var w=r.width;
      s._l.forEach(function(el){
        var d=+el.getAttribute('data-d')||0, sp=el.getAttribute('data-spin')!==null;
        var ty=p*d*-0.22*w + s._m.y*d*-0.05*w, tx=s._m.x*d*-0.05*w;
        var rot=sp?p*d*-40:0;
        el.style.transform='translate3d('+tx.toFixed(1)+'px,'+ty.toFixed(1)+'px,0) rotate('+rot.toFixed(1)+'deg)';
      });
    });
  }
  window.addEventListener('scroll',tick,{passive:true});
  window.addEventListener('resize',tick);
})();
