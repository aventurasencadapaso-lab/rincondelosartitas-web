(function(){
  var $=function(s,c){return (c||document).querySelector(s);}, $$=function(s,c){return Array.prototype.slice.call((c||document).querySelectorAll(s));};

  /* menú móvil + submenús */
  var navToggle=$('#navToggle'), navLinks=$('#navLinks');
  function closeSubs(except){ $$('.has-sub').forEach(function(li){ if(li!==except){ li.classList.remove('open'); var b=$('.sub-toggle',li); if(b) b.setAttribute('aria-expanded','false'); } }); }
  if(navToggle && navLinks){
    navToggle.addEventListener('click',function(){
      var open=navLinks.classList.toggle('open');
      navToggle.classList.toggle('open',open);
      navToggle.setAttribute('aria-expanded',open);
      if(!open) closeSubs();
    });
  }
  $$('.has-sub').forEach(function(li){
    var btn=$('.sub-toggle',li);
    btn.addEventListener('click',function(e){
      e.stopPropagation();
      var open=!li.classList.contains('open');
      closeSubs(li);
      li.classList.toggle('open',open);
      btn.setAttribute('aria-expanded',open);
    });
  });
  document.addEventListener('click',function(e){ if(!e.target.closest('.has-sub')) closeSubs(); });
  document.addEventListener('keydown',function(e){ if(e.key==='Escape') closeSubs(); });

  /* aparición al hacer scroll */
  var revealEls=$$('.reveal');
  if('IntersectionObserver' in window){
    var io=new IntersectionObserver(function(entries){ entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('is-visible'); }); },{threshold:0.12});
    revealEls.forEach(function(el){ io.observe(el); });
  } else { revealEls.forEach(function(el){ el.classList.add('is-visible'); }); }

  /* catálogo: búsqueda + filtro por categoría (?cat=...) */
  var grid=$('#productosGrid');
  if(grid){
    var cards=$$('.p-card',grid), noResults=$('#noResults'), searchInput=$('#searchInput'),
        note=$('#filterNote'), noteName=$('#filterName'), clearBtn=$('#filterClear');
    function showNote(name){ if(!note) return; if(name){ noteName.textContent=name; note.hidden=false; } else { note.hidden=true; } }
    function applySearch(q){
      q=q.trim().toLowerCase(); var visible=0;
      cards.forEach(function(card){
        var hay=(card.dataset.cat+' '+card.dataset.name+' '+card.textContent).toLowerCase();
        var m=q===''||hay.indexOf(q)>-1; card.hidden=!m; if(m) visible++;
      });
      noResults.classList.toggle('show',visible===0); showNote(null);
    }
    function applyCat(cat,scroll){
      var f=$('.ficha[data-target="'+cat+'"] .ficha-name'); var name=f?f.textContent:cat;
      if(searchInput) searchInput.value='';
      cards.forEach(function(card){ card.hidden=card.dataset.cat!==cat; });
      noResults.classList.toggle('show',!cards.some(function(c){return !c.hidden;}));
      showNote(name);
      if(scroll) grid.scrollIntoView({behavior:'smooth',block:'start'});
    }
    if(searchInput) searchInput.addEventListener('input',function(e){ applySearch(e.target.value); });
    $$('.ficha[data-target]').forEach(function(f){ f.addEventListener('click',function(){ applyCat(f.dataset.target,true); }); });
    if(clearBtn) clearBtn.addEventListener('click',function(){ applySearch(''); });
    var cat=null; try{ cat=new URLSearchParams(location.search).get('cat'); }catch(e){}
    if(cat) applyCat(cat,true);
  }

  /* cookies + mapa */
  var cookieBanner=$('#cookieBanner'), cookieAccept=$('#cookieAccept'), cookieReject=$('#cookieReject'), reopen=$('#reopenCookieSettings');
  var mapPlaceholder=$('#mapPlaceholder'), loadMapBtn=$('#loadMapBtn');
  var MAPS_SRC='https://www.google.com/maps?q=C.+San+Andr%C3%A9s,+La+Centinela,+Icod+de+los+Vinos,+Tenerife&output=embed';
  function loadMap(){
    var frame=$('#mapFrame'); if(!frame||frame.querySelector('iframe')) return;
    var ph=$('#mapPlaceholder'); if(!ph) return;
    var iframe=document.createElement('iframe');
    iframe.loading='lazy'; iframe.referrerPolicy='no-referrer-when-downgrade';
    iframe.title="Mappa della posizione di El Rincón de los Artistas"; iframe.src=MAPS_SRC;
    ph.replaceWith(iframe);
  }
  function getConsent(){ try{ return localStorage.getItem('cookie-consent'); }catch(e){ return null; } }
  function setConsent(v){ try{ localStorage.setItem('cookie-consent',v); }catch(e){} }
  var consent=getConsent();
  if(consent==='accepted') loadMap(); else if(consent===null && cookieBanner) cookieBanner.classList.add('show');
  if(cookieAccept) cookieAccept.addEventListener('click',function(){ setConsent('accepted'); cookieBanner.classList.remove('show'); loadMap(); });
  if(cookieReject) cookieReject.addEventListener('click',function(){ setConsent('rejected'); cookieBanner.classList.remove('show'); });
  if(reopen) reopen.addEventListener('click',function(){ cookieBanner.classList.add('show'); });
  if(loadMapBtn) loadMapBtn.addEventListener('click',loadMap);

  /* formulario (Formspree) */
  var form=$('#contactForm'), status=$('#formStatus');
  if(form){
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var btn=form.querySelector('button[type="submit"]');
      status.textContent="Invio in corso…"; status.className='form-status mono'; btn.disabled=true;
      fetch(form.action,{method:'POST',body:new FormData(form),headers:{'Accept':'application/json'}})
        .then(function(r){
          if(r.ok){ status.textContent="Messaggio inviato. Ti risponderemo il prima possibile."; status.className='form-status mono ok'; form.reset(); }
          else { status.textContent="Invio non riuscito. Scrivici su WhatsApp o via e-mail mentre controlliamo."; status.className='form-status mono err'; }
        })
        .catch(function(){ status.textContent="Invio non riuscito. Scrivici su WhatsApp o via e-mail mentre controlliamo."; status.className='form-status mono err'; })
        .then(function(){ btn.disabled=false; });
    });
  }

/* buscador global */
  var res=$('#searchResults'), pgrid=$('#searchProducts'), pnone=$('#searchNoProducts');
  if(res && window.SEARCH_INDEX){
    var qi=$('#q'), st=$('#searchStatus'), sf=$('#searchForm'), fT=$('#fType'), fG=$('#fGroup'), fC=$('#fCat'), fCW=$('#fCatWrap'), fM=$('#fMarca'), fR=$('#fReset'), prodWrap=$('#searchProductsWrap');
    var pcards=$$('.p-card',pgrid);
    var norm=function(s){ return (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,''); };
    var DATA=window.SEARCH_INDEX.map(function(it){ return {it:it,t:norm(it.t),d:norm(it.d),k:norm(it.k)}; });
    function kindOf(it){ return it.y==='Producto'?'prod':(it.y==='Categoría'?'cat':(it.y==='Marca o especialidad'?'marca':'info')); }
    function run(){
      var q=qi.value, toks=norm(q).split(/\s+/).filter(Boolean), type=fT.value, grp=fG.value, cat=fC.value, mar=fM.value;
      var active=toks.length>0||type==='marca'||type==='info'||!!mar;
      var filtering=active||!!grp||!!cat||type!=='all';
      var out=[], hit={};
      res.innerHTML='';
      DATA.forEach(function(o){
        var it=o.it, kind=kindOf(it);
        if(type!=='all' && type!==kind) return;
        if(grp && (kind==='info' || (it.g||[]).indexOf(grp)<0)) return;
        if(cat){
          if(kind==='info') return;
          if(kind==='prod' && it.cat!==cat) return;
          if(kind==='cat' && it.id!==cat) return;
          if(kind==='marca' && (it.c||[]).indexOf(cat)<0) return;
        }
        if(mar){
          if(kind==='info') return;
          if((kind==='prod'||kind==='cat') && (it.m||[]).indexOf(mar)<0) return;
          if(kind==='marca' && it.id!==mar) return;
        }
        var score=0, ok=true;
        toks.forEach(function(t){
          var s=0;
          if(o.t.indexOf(t)>-1) s+=3;
          if(o.k.indexOf(t)>-1) s+=2;
          if(o.d.indexOf(t)>-1) s+=1;
          if(!s) ok=false; score+=s;
        });
        if(!ok) return;
        hit[it.u]=true;
        if(kind!=='prod' && active) out.push({o:it,s:score});
      });
      out.sort(function(a,b){ return b.s-a.s; });
      var showProd=!(type==='marca'||type==='info'||type==='cat');
      prodWrap.hidden=!showProd;
      var shown=0;
      pcards.forEach(function(c){ var m=!!hit[c.dataset.u]; c.hidden=!m; if(m&&showProd) shown++; });
      pnone.classList.toggle('show',showProd&&shown===0);
      var total=out.length+(showProd?shown:0);
      if(!filtering) st.textContent='';
      else st.textContent=total? total+(total===1?" risultato":" risultati")+(toks.length?" per «"+q.trim()+"»":'') : "Non abbiamo trovato risultati"+(toks.length?" per «"+q.trim()+"»":'')+". Prova con un'altra parola o chiedici in negozio.";
      out.forEach(function(r){
        var li=document.createElement('li'), a=document.createElement('a'), ty=document.createElement('span'), h=document.createElement('strong'), p=document.createElement('span');
        a.href=r.o.u; ty.className='sr-type'; ty.textContent=r.o.yl||r.o.y; h.textContent=r.o.t; p.className='sr-desc'; p.textContent=r.o.d;
        a.appendChild(ty); a.appendChild(h); a.appendChild(p); li.appendChild(a); res.appendChild(li);
      });
      if(fR) fR.hidden=!filtering;
    }
    function fillCats(){
      var g=fG.value; fC.innerHTML='';
      if(!g){ fCW.hidden=true; return; }
      var o=document.createElement('option'); o.value=''; o.textContent="Tutte in "+fG.options[fG.selectedIndex].text; fC.appendChild(o);
      DATA.forEach(function(d){ if(kindOf(d.it)==='cat' && (d.it.g||[])[0]===g){ var op=document.createElement('option'); op.value=d.it.id; op.textContent=d.it.t; fC.appendChild(op); } });
      fCW.hidden=false;
    }
    var q0=''; try{ q0=new URLSearchParams(location.search).get('q')||''; }catch(e){}
    qi.value=q0; run(); if(!q0) qi.focus();
    qi.addEventListener('input',run);
    fG.addEventListener('change',function(){ fillCats(); run(); });
    [fT,fC,fM].forEach(function(f){ f.addEventListener('change',run); });
    if(fR) fR.addEventListener('click',function(){ qi.value=''; fT.value='all'; fG.value=''; fillCats(); fM.value=''; run(); qi.focus(); });
    sf.addEventListener('submit',function(e){ e.preventDefault(); run(); try{ history.replaceState(null,'','buscar.html?q='+encodeURIComponent(qi.value)); }catch(er){} });
  }

/* galería */
  var gg=$('#galGrid');
  if(gg){
    var items=$$('.gal-item',gg), chipsG=$$('[data-gcat]'), cnt=$('#galCount');
    var dlg=$('#lightbox'), lbImg=$('#lbImg'), lbCap=$('#lbCap'), cur=-1, lastBtn=null;
    function vis(){ return items.filter(function(i){ return !i.hidden; }); }
    chipsG.forEach(function(c){ c.addEventListener('click',function(){
      var k=c.dataset.gcat;
      chipsG.forEach(function(x){ var on=x===c; x.classList.toggle('is-on',on); x.setAttribute('aria-pressed',on); });
      items.forEach(function(i){ i.hidden=!(k==='all'||i.dataset.cat===k); });
      if(cnt) cnt.textContent=vis().length+" foto";
    }); });
    function show(i){
      var v=vis(); if(!v.length) return; cur=(i+v.length)%v.length;
      var b=$('.gal-btn',v[cur]); lbImg.src=b.dataset.full; lbImg.alt=b.dataset.alt; lbCap.textContent=b.dataset.alt; lastBtn=b;
    }
    gg.addEventListener('click',function(e){
      var b=e.target.closest('.gal-btn'); if(!b) return;
      var v=vis(); var idx=v.indexOf(b.parentNode); show(idx);
      if(dlg.showModal) dlg.showModal(); else dlg.setAttribute('open','');
    });
    $('#lbClose').addEventListener('click',function(){ dlg.close(); });
    $('#lbPrev').addEventListener('click',function(){ show(cur-1); });
    $('#lbNext').addEventListener('click',function(){ show(cur+1); });
    dlg.addEventListener('click',function(e){ if(e.target===dlg) dlg.close(); });
    dlg.addEventListener('close',function(){ if(lastBtn) lastBtn.focus(); });
    dlg.addEventListener('keydown',function(e){ if(e.key==='ArrowRight') show(cur+1); else if(e.key==='ArrowLeft') show(cur-1); });
    if(cnt) cnt.textContent=items.length+" foto";
    var tema=null; try{ tema=new URLSearchParams(location.search).get('tema'); }catch(e){}
    if(tema){ var tc=$('[data-gcat="'+tema+'"]'); if(tc) tc.click(); }
  }

/* galería de arte: filtro por estado */
  var og=$('#obraGrid');
  if(og){
    var obras=$$('.obra',og), ech=$$('[data-ecat]');
    ech.forEach(function(c){ c.addEventListener('click',function(){
      var k=c.dataset.ecat;
      ech.forEach(function(x){ var on=x===c; x.classList.toggle('is-on',on); x.setAttribute('aria-pressed',on); });
      obras.forEach(function(o){ o.hidden=!(k==='all'||o.dataset.estado===k); });
    }); });
  }

  /* volver arriba */
  var backTop=$('#backTop');
  if(backTop){
    window.addEventListener('scroll',function(){ backTop.classList.toggle('show',window.scrollY>900); });
    backTop.addEventListener('click',function(){ window.scrollTo({top:0,behavior:'smooth'}); });
  }
})();

/* idioma: recordar elección y detectar el del navegador */
(function(){
  var KEY='lang-pref', SUP=['es','en','de','fr','it'];
  function get(){ try{ return localStorage.getItem(KEY); }catch(e){ return null; } }
  document.querySelectorAll('.lang-menu a').forEach(function(a){
    a.addEventListener('click',function(){ try{ localStorage.setItem(KEY,a.getAttribute('hreflang')); }catch(e){} });
  });
  if(document.documentElement.lang!=='es' || /[?&]nolang/.test(location.search)) return;
  var pref=get();
  if(!pref){
    var langs=(navigator.languages&&navigator.languages.length)?navigator.languages:[navigator.language||'es'];
    for(var i=0;i<langs.length;i++){ var c=String(langs[i]).slice(0,2).toLowerCase(); if(SUP.indexOf(c)>-1){ pref=c; break; } }
  }
  if(pref && pref!=='es' && SUP.indexOf(pref)>-1){
    var file=location.pathname.split('/').pop()||'index.html';
    location.replace(pref+'/'+file+location.search+location.hash);
  }
})();
