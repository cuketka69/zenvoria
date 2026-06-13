/* ---------- DATA ---------- */
const SERVICES=[
  {id:'osobni',name:'Osobní péče',icon:'M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21c0-4 3-7 7-7s7 3 7 7',desc:'Pomoc s běžnými denními činnostmi, mobilitou a osobní pohodou seniora.'},
  {id:'lekar',name:'Doprovod k lékaři',icon:'M9 3h6v3h3v6h-3v3H9v-3H6V6h3V3Z',desc:'Bezpečný doprovod na vyšetření, k lékaři i na úřady — s trpělivostí.'},
  {id:'domaci',name:'Domácí péče',icon:'M4 11 12 4l8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1Z',desc:'Komplexní péče v pohodlí domova podle individuálních potřeb klienta.'},
  {id:'pomoc',name:'Pomoc v domácnosti',icon:'M3 13h18M5 13V7l7-4 7 4v6M9 21v-5h6v5',desc:'Úklid, vaření a běžný chod domácnosti, ať má senior klid a pohodlí.'},
  {id:'nocni',name:'Noční péče',icon:'M20 14a8 8 0 1 1-9-10 6.5 6.5 0 0 0 9 10Z',desc:'Dohled a péče během noci — jistota a klid pro seniora i celou rodinu.'},
  {id:'nemocnice',name:'Péče v nemocnici',icon:'M5 8h14v12H5V8ZM9 4h6v4H9V4ZM12 11v6M9 14h6',desc:'Doprovod a podpora během hospitalizace i po návratu z nemocnice.'},
  {id:'rehab',name:'Rehabilitace a cvičení',icon:'M4 12h2l2-5 4 10 2-5h6',desc:'Šetrné cvičení a rehabilitace pro udržení kondice a soběstačnosti.'},
  {id:'spolecnost',name:'Společnost a povídání',icon:'M4 5h16v10H9l-5 4V5Z',desc:'Lidský kontakt, povídání a společné chvíle proti samotě a nudě.'},
  {id:'hygiena',name:'Hygiena',icon:'M7 13h10v6a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-6ZM6 13h12M9 13V7a3 3 0 0 1 6 0',desc:'Citlivá pomoc s osobní hygienou a péčí o tělo s respektem a důstojností.'},
  {id:'nakupy',name:'Nákupy',icon:'M6 6h15l-1.5 9h-12L6 6ZM6 6 5 3H2M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm9 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',desc:'Zajištění nákupů, léků a pochůzek, aby měl senior vše potřebné doma.'}
];
const VALUES=['Lidskost','Důvěra','Respekt','Bezpečí','Profesionalita'];
const VAL_SUBS=['Empatie a srdce','Prověřeno a ověřeno','Důstojnost vždy','Pojištěno a chráněno','Zkušenost a péče'];
const VAL_ICONS=['M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z','M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z','m5 12 4 4 10-10','M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z','M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21c0-4 3-7 7-7s7 3 7 7'];

let CAREGIVERS=[];
let cgSeq=0;
/* tarif přihlášené pečovatelky podle e-mailu */
let cgPlanMap={};
const PLANS={
  start:{name:'START',badge:'🟢',
    feats:['Profil v aplikaci','Ověření identity','Přijímání rezervací','Kalendář dostupnosti','Chat s rodinami','Hodnocení klientů']},
  premium:{name:'PREMIUM',badge:'💎',
    feats:['Vše ze START','Vyšší zobrazení ve vyhledávání','Odznak PREMIUM','Neomezené poptávky','Statistiky profilu','Prioritní podpora','Video představení']}
};
/* ceny tarifů (Kč/měsíc). START je vždy zdarma; nastavuje se jen PREMIUM. */
let planPrices={start:0,premium:390};
const planPrice=k=>k==='start'?0:(planPrices[k]||0);
const planPriceLabel=k=>planPrice(k)>0?planPrice(k).toLocaleString('cs-CZ')+' Kč / měsíc':'Zdarma';
/* SVG diamant se zeleným obrysem (ostrý, škálovatelný) */
const diamondSVG=(s,col)=>`<svg width="${s||14}" height="${s||14}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M12 22 2.5 9.5 6 3.5H18l3.5 6L12 22Z" stroke="${col||'#0A5A34'}" stroke-width="1.6" stroke-linejoin="round"/><path d="M2.5 9.5h19M6 3.5 9 9.5M18 3.5 15 9.5M9 9.5 12 3.5 15 9.5M9 9.5 12 22 15 9.5" stroke="${col||'#0A5A34'}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/* ikona tarifu: PREMIUM = zelený SVG diamant (jasnější zelená kvůli tmavým kartám/bannerům), START = 🟢 */
const planIcon=(k,h)=>k==='premium'?diamondSVG(h||16,'#13A552'):'🟢';

/* ---------- ADMIN: fronta žádostí o ověření ---------- */
/* stav žádosti: submitted | approved | rejected */
let VERIFICATIONS=[];
let verSeq=0;
/* stav ověření přihlášené pečovatelky podle e-mailu: none|submitted|verified|rejected */
let cgStatusMap={};

/* ---------- ADMIN: uživatelé (rodiny) pro správu ---------- */
/* stav: active | suspended */
let USERS=[];
let userSeq=0;

const REVIEWS=[];
let cgReviews={}; // id pečovatelky → [{init,name,stars,text}] nové recenze od rodin

/* objednávky rodiny — plochý seznam se stavy: pending|confirmed|done|declined */
let ORDERS=[];
let orderSeq=0;
const ORDER_STATUS={
  pending:{cls:'pending',label:'Čeká na potvrzení'},
  confirmed:{cls:'ok',label:'Potvrzeno'},
  done:{cls:'done',label:'Dokončeno'},
  declined:{cls:'declined',label:'Zamítnuto'},
  cancelled:{cls:'declined',label:'Zrušeno'}
};

/* ---------- STATE ---------- */
const state={caregiverId:1,bkService:'osobni',bkHours:4};
let legalBackView='home';
let legalCurrentKey='terms';
const LEGAL_COMPANY={
  name:'ZENVORIA s.r.o.',
  meta:'IČO doplňte před ostrým spuštěním.',
  email:'miklasova@zenvoria.cz'
};
const sIcon=(d)=>`<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="${d}" stroke="#C9A233" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const sName=(id)=>SERVICES.find(s=>s.id===id)?.name||id;
const cg=(id)=>CAREGIVERS.find(c=>c.id===id);
function activeView(){
  const el=document.querySelector('.view.active');
  return el ? el.id.replace('view-','') : 'home';
}
function legalHash(key){
  return 'legal-'+key;
}
function legalUrl(key){
  try{
    const url=new URL(window.location.href);
    url.searchParams.delete('reset');
    url.searchParams.delete('changeEmail');
    url.hash=legalHash(key);
    return url.toString();
  }catch(e){
    return 'https://www.zenvoria.cz/#'+legalHash(key);
  }
}
async function copyLegalLink(){
  const url=legalUrl(legalCurrentKey);
  try{
    await navigator.clipboard.writeText(url);
    toast('Odkaz na dokument byl zkopírován.','success');
  }catch(e){
    toast('Odkaz: <b>'+esc(url)+'</b>');
  }
}

/* ---------- NAV ---------- */
async function go(v,fromPop){
  let target=document.getElementById('view-'+v);
  if(!target&&isDeferredView(v)){
    try{
      await ensureDeferredViewsLoaded();
      target=document.getElementById('view-'+v);
    }catch(e){
      toast('Nepodarilo se nacist dalsi cast aplikace.','declined');
      return;
    }
  }
  if(!target)return;
  document.querySelectorAll('.view').forEach(e=>e.classList.remove('active'));
  target.classList.add('active');
  document.querySelectorAll('[data-v]').forEach(a=>{
    const on=a.dataset.v===v;
    a.classList.toggle('active',on);
    if(on)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');
  });
  toggleMenu(false);
  closeAccountMenu();
  window.scrollTo({top:0,behavior:'smooth'});
  if(v==='bookings')renderCalendar();
  if(v==='cg-dashboard')renderCgDashboard();
  if(v==='cg-requests')renderCgRequests();
  if(v==='cg-calendar')renderCgCalendar();
  if(v==='cg-profile')renderCgProfile();
  if(v==='cg-verify')renderCgVerify();
  if(v==='chat')renderChat();
  if(v==='fam-dash')renderFamilyDash();
  if(v==='admin-dash')renderAdminDash();
  if(v==='admin-verify')renderAdminVerify();
  if(v==='admin-caregivers')renderAdminCaregivers();
  if(v==='admin-users')renderAdminUsers();
  if(v==='admin-orders')renderAdminOrders();
  if(v==='admin-audit')renderAdminAudit();
  if(v==='admin-plans')renderAdminPlans();
  if(v==='admin-broadcast')renderAdminBroadcast();
  if(v==='pricing')renderPricing();
  if(v==='settings')renderSettings();
  if(v==='register')pickRole(regRole);
  if(v==='forgot')resetForgot();
  if(v==='howto')howtoTab('family');
  if(v==='reset-password')resetResetPassword(true);
  if(v==='change-email')resetChangeEmail(true);
  // Při odchodu z reset hesla vyčisti token z URL, ať tam nezůstává viset.
  if(v!=='reset-password'&&v!=='change-email'){
    try{
      const url=new URL(window.location.href);
      if(url.searchParams.has('reset')){
        url.searchParams.delete('reset');
      }
      if(url.searchParams.has('changeEmail'))url.searchParams.delete('changeEmail');
      const hash=(v==='legal'&&legalCurrentKey)?legalHash(legalCurrentKey):v;
      const nextState=v==='legal'?{view:v,legalKey:legalCurrentKey}:{view:v};
      history.replaceState(nextState,'',url.pathname+(url.search?url.search:'')+'#'+hash);
      resetPwToken='';
      changeEmailToken='';
    }catch(e){}
  }
  // Napojení na historii prohlížeče → funguje tlačítko Zpět/Vpřed.
  if(!fromPop){
    try{
      const cur=history.state&&history.state.view;
      const nextState=v==='legal'?{view:v,legalKey:legalCurrentKey}:{view:v};
      const nextHash=(v==='legal'&&legalCurrentKey)?legalHash(legalCurrentKey):v;
      if(cur!==v||(v==='legal'&&history.state&&history.state.legalKey!==legalCurrentKey))history.pushState(nextState,'','#'+nextHash);
    }catch(e){}
  }
}
// Zpět/Vpřed v prohlížeči přepíná views (bez dalšího zápisu do historie).
window.addEventListener('popstate',function(e){
  const v=(e.state&&e.state.view)||'home';
  if(v==='legal'&&e.state&&e.state.legalKey&&LEGAL[e.state.legalKey]){
    openLegal(e.state.legalKey,{fromPop:true,direct:true});
    return;
  }
  if(document.getElementById('view-'+v)||isDeferredView(v))go(v,true);
});
function scrollTo2(id){setTimeout(()=>document.getElementById(id)?.scrollIntoView({behavior:'smooth'}),60);}

/* ---------- HERO PARALLAX ---------- */
(function(){
  const hero=document.querySelector('.hero');
  const bg=document.getElementById('heroBg');
  if(!hero||!bg)return;
  let ticking=false;
  function update(){
    const max=hero.offsetHeight*0.4;
    let offset=window.scrollY*0.4;
    if(offset>max)offset=max;
    bg.style.transform='translate3d(0,'+offset+'px,0)';
    ticking=false;
  }
  window.addEventListener('scroll',function(){
    if(!ticking){requestAnimationFrame(update);ticking=true;}
  },{passive:true});
  update();
})();

/* ---------- SECTION PARALLAX (audience) ---------- */
(function(){
  const sec=document.querySelector('.aud-section');
  const bg=document.getElementById('audBg');
  if(!sec||!bg)return;
  let ticking=false;
  function update(){
    const rect=sec.getBoundingClientRect();
    const delta=(rect.top+rect.height/2)-window.innerHeight/2;
    const max=sec.offsetHeight*0.22;
    let offset=-delta*0.18;
    if(offset>max)offset=max;else if(offset<-max)offset=-max;
    bg.style.transform='translate3d(0,'+offset+'px,0)';
    ticking=false;
  }
  window.addEventListener('scroll',function(){
    if(!ticking){requestAnimationFrame(update);ticking=true;}
  },{passive:true});
  window.addEventListener('resize',update);
  update();
})();

/* ---------- MOBILE MENU ---------- */
function toggleMenu(open){
  const m=document.getElementById('mobileMenu');
  const t=document.getElementById('menuToggle');
  if(!m)return;
  m.classList.toggle('open',open);
  t.setAttribute('aria-expanded',open?'true':'false');
  document.body.style.overflow=open?'hidden':'';
  if(open){m.querySelector('.panel a')?.focus();}
}

/* ---------- KEYBOARD ACTIVATION (role=button) ---------- */
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){toggleMenu(false);closeRating();closeConfirm();closePay();closeAccountMenu();closeAllDD();return;}
  if((e.key==='Enter'||e.key===' ')){
    const el=e.target;
    const r=el&&el.getAttribute&&el.getAttribute('role');
    if((r==='button'||r==='menuitem'||r==='radio')&&el.tagName!=='BUTTON'){
      e.preventDefault();el.click();
    }
  }
});

/* ---------- VLASTNÍ ROZBALOVAČKA ---------- */
function closeAllDD(){document.querySelectorAll('.dd.open').forEach(d=>d.classList.remove('open'));}
function enhanceSelect(sel){
  if(!sel||sel.dataset.enh)return; sel.dataset.enh='1';
  const wrap=document.createElement('div');
  wrap.className='dd'+(sel.closest('.sort-row')?' dd-bordered':(sel.classList.contains('inp')?' dd-inp':''));
  const btn=document.createElement('button'); btn.type='button'; btn.className='dd-btn'; btn.setAttribute('aria-haspopup','listbox');
  const lbl=document.createElement('span'); lbl.className='dd-lbl';
  const car=document.createElement('span'); car.className='dd-car';
  car.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.appendChild(lbl); btn.appendChild(car);
  const menu=document.createElement('div'); menu.className='dd-menu'; menu.setAttribute('role','listbox');
  const sync=()=>{lbl.textContent=sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:'';};
  Array.from(sel.options).forEach((o,i)=>{
    const it=document.createElement('div'); it.className='dd-opt'+(i===sel.selectedIndex?' sel':''); it.textContent=o.text; it.setAttribute('role','option');
    it.onclick=()=>{sel.selectedIndex=i;sync();menu.querySelectorAll('.dd-opt').forEach(x=>x.classList.remove('sel'));it.classList.add('sel');wrap.classList.remove('open');sel.dispatchEvent(new Event('change',{bubbles:true}));};
    menu.appendChild(it);
  });
  btn.onclick=e=>{e.stopPropagation();const op=wrap.classList.contains('open');closeAllDD();if(!op)wrap.classList.add('open');};
  wrap.appendChild(btn); wrap.appendChild(menu);
  sel.style.display='none'; sel.parentNode.insertBefore(wrap,sel.nextSibling); sync();
  // refresh popisku + zvýraznění (po programové změně hodnoty)
  sel._ddRefresh=()=>{sync();const items=menu.querySelectorAll('.dd-opt');items.forEach((x,i)=>x.classList.toggle('sel',i===sel.selectedIndex));};
  sel.addEventListener('change',sel._ddRefresh);
}
function ddRefresh(){document.querySelectorAll('select[data-enh]').forEach(s=>s._ddRefresh&&s._ddRefresh());}
document.addEventListener('click',e=>{if(!e.target.closest('.dd'))closeAllDD();});

/* ---------- SCROLL REVEAL ANIMACE (stejné jako patrikzdercik.cz) ---------- */
let revealIO=null;
function initReveal(){
  if(!('IntersectionObserver'in window))return;
  if(!revealIO){
    revealIO=new IntersectionObserver(function(entries){
      entries.forEach(function(e){if(e.isIntersecting){e.target.classList.add('visible');revealIO.unobserve(e.target);}});
    },{threshold:0.1,rootMargin:'0px 0px -40px 0px'});
  }
  const io=revealIO;
  function tag(sel,cls,stagger){
    document.querySelectorAll(sel).forEach(function(el,i){
      if(el.dataset.rev)return; // už označeno → přeskoč (idempotentní)
      el.dataset.rev='1';
      el.classList.add(cls);
      if(stagger)el.style.transitionDelay=(Math.min(i,6)*0.1)+'s';
      io.observe(el);
    });
  }
  // hero — postupný nástup po načtení
  ['.hero .eyebrow','.hero h1','.hero p.lead','.hero-cta'].forEach(function(sel,i){
    const el=document.querySelector(sel);
    if(el&&!el.dataset.rev){el.dataset.rev='1';el.classList.add('reveal');el.style.transitionDelay=(i*0.12)+'s';io.observe(el);}
  });
  tag('.trust-band .trust','reveal',true);
  tag('#view-home .sec-head','reveal',false);
  tag('.about-lead','reveal',false);
  // foto karty „O nás" — střídavě zleva/zprava, široká zespoda
  document.querySelectorAll('.ap-card').forEach(function(el,i){
    if(el.dataset.rev)return;
    el.dataset.rev='1';
    el.classList.add(el.classList.contains('ap-wide')?'reveal':(i%2?'reveal-right':'reveal-left'));
    io.observe(el);
  });
  tag('.svc-card','reveal-scale',true);
  tag('#view-home .aud','reveal',true);
  tag('.val','reveal',true);
  // navbar — stín při scrollu (navěsit jen jednou)
  const hdr=document.querySelector('header.nav');
  if(hdr&&!hdr.dataset.scrollBound){hdr.dataset.scrollBound='1';window.addEventListener('scroll',function(){hdr.classList.toggle('scrolled',window.scrollY>60);},{passive:true});}
}

/* ---------- TOAST ---------- */
let toastT;
function toast(msg,type){const t=document.getElementById('toast');t.innerHTML=msg;
  t.className='toast show'+(type?' '+type:'');
  clearTimeout(toastT);toastT=setTimeout(()=>{t.className='toast';},3200);}

/* ---------- THEME ---------- */
const MOON_ICON='<path d="M20 14a8 8 0 1 1-9-10 6.5 6.5 0 0 0 9 10Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>';
const SUN_ICON='<circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.7"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6 19 19M19 5l-1.4 1.4M6.4 17.6 5 19" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>';
function applyTheme(t){
  const dark=t==='dark';
  if(dark)document.documentElement.setAttribute('data-theme','dark');
  else document.documentElement.removeAttribute('data-theme');
  const ic=document.getElementById('themeIcon');if(ic)ic.innerHTML=dark?SUN_ICON:MOON_ICON;
  try{localStorage.setItem('zv_theme',dark?'dark':'light');}catch(e){}
}
function toggleTheme(){applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark');}
function initTheme(){applyTheme('dark');}

/* ---------- HOME RENDER ---------- */
/* mapování id služby → název obrázku (kde se liší) */
const SVC_IMG={lekar:'doktor',domaci:'domacipece',pomoc:'pomocvdomacnosti',rehab:'Rehabilitace'};
/* hlavních 6 služeb na úvodní stránce */
const MAIN_SERVICES=['osobni','lekar','domaci','nakupy','nocni','nemocnice'];
function renderHome(){
  document.getElementById('servGrid').innerHTML=MAIN_SERVICES.map(id=>SERVICES.find(s=>s.id===id)).filter(Boolean).map(s=>
    `<div class="svc-card">
      <div class="svc-top">
        <div class="svc-img" style="background-image:url('${SVC_IMG[s.id]||s.id}.webp'),linear-gradient(135deg,#1a5236,#0c2419)"></div>
      </div>
      <div class="svc-ic">${sIcon(s.icon)}</div>
      <div class="svc-body">
        <h4>${s.name}</h4>
        <p>${s.desc||''}</p>
        <button class="svc-btn" onclick="fillThen(this,()=>filterByService('${s.id}'))">Zobrazit pečovatelky <span>→</span></button>
      </div>
    </div>`).join('');
  document.getElementById('valuesRow').innerHTML=VALUES.map((v,i)=>
    `<div class="val"><div class="vc">${sIcon(VAL_ICONS[i])}</div><b>${v}</b><span class="vsub">${VAL_SUBS[i]||''}</span></div>`).join('');
  // audience check icons
  document.querySelectorAll('#view-home .aud li').forEach(li=>{
    const chk='<span class="chk"><svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5 9-11" stroke="#C9A233" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
    li.innerHTML=li.innerHTML.replace('{c}',chk).replace('{cg}',chk);
  });
}

/* ---------- SEARCH RENDER ---------- */
let activeFilter='';
function renderFilters(){
  const all=[{id:'',name:'Vše'},...SERVICES];
  document.getElementById('servFilters').innerHTML=all.map(s=>
    `<button class="fbtn ${activeFilter===s.id?'on':''}" onclick="setFilter('${s.id}')">${s.name}</button>`).join('');
}
function setFilter(id){activeFilter=id;renderFilters();renderCare();}
function filterByService(id){activeFilter=id;go('search');renderFilters();renderCare();}

function renderCare(){
  const q=(document.getElementById('q').value||'').toLowerCase();
  const loc=document.getElementById('loc').value;
  const priceMax=+((document.getElementById('priceMax')||{}).value||999);
  const onlyVer=(document.getElementById('onlyVerified')||{}).checked;
  const sortBy=(document.getElementById('sortBy')||{}).value||'rec';
  let list=CAREGIVERS.filter(c=>{
    if(!c.verified||c.suspended)return false; // rodiny vidí jen ověřené a aktivní pečovatelky
    const matchF=!activeFilter||c.services.includes(activeFilter);
    const matchL=!loc||c.loc===loc;
    const matchQ=!q||c.name.toLowerCase().includes(q)||c.loc.toLowerCase().includes(q)||
      c.services.some(s=>sName(s).toLowerCase().includes(q));
    return matchF&&matchL&&matchQ&&c.rate<=priceMax&&(!onlyVer||c.verified);
  });
  const sorters={'price-asc':(a,b)=>a.rate-b.rate,'price-desc':(a,b)=>b.rate-a.rate,
    'rating':(a,b)=>b.rating-a.rating,'exp':(a,b)=>b.exp-a.exp};
  if(sorters[sortBy])list.sort(sorters[sortBy]);
  // Premium pečovatelky mají vyšší zobrazení v doporučeném řazení
  if(!sorters[sortBy])list.sort((a,b)=>(b.plan==='premium')-(a.plan==='premium'));
  const cnt=document.getElementById('careCount');
  if(cnt){const n=list.length;cnt.textContent=n+' '+(n===1?'pečovatelka':(n>=2&&n<=4?'pečovatelky':'pečovatelek'));}
  const g=document.getElementById('careGrid');
  if(!list.length){g.innerHTML=`<div style="grid-column:1/-1;text-align:center;padding:50px;color:var(--muted)">Žádná pečovatelka neodpovídá filtru.</div>`;return;}
  g.innerHTML=list.map(c=>`
    <div class="care-card ${c.plan==='premium'?'is-premium':''}" onclick="openProfile(${c.id})">
      ${c.plan==='premium'?`<span class="prem-ribbon">${diamondSVG(13)}PREMIUM</span>`:''}
      <div class="care-top">
        ${avaHtml(c.init,c.photo)}
        <div style="flex:1">
          <div class="care-name">${esc(c.name)}</div>
          <div class="care-loc"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11Z" stroke="#7A736A" stroke-width="1.6"/><circle cx="12" cy="10" r="2.2" stroke="#7A736A" stroke-width="1.6"/></svg>${esc(c.loc)}</div>
          <div class="care-meta"><span class="stars">★</span><b style="color:var(--navy-900)">${c.rating}</b><span>(${c.reviews}) · ${c.exp} let praxe</span></div>
        </div>
      </div>
      <div class="care-tags">
        ${cgBadges(c)}
        ${c.services.slice(0,2).map(s=>`<span class="chip">${sName(s)}</span>`).join('')}
        ${c.kmPrice>0?`<span class="chip">🚗 ${c.kmPrice} Kč/km</span>`:''}
      </div>
      <div class="care-foot">
        <div class="price">${priceShort(c)}</div>
        <button class="btn btn-gold" style="padding:9px 16px" onclick="event.stopPropagation();openProfile(${c.id})">Zobrazit profil</button>
      </div>
    </div>`).join('');
}

/* ---------- PROFILE ---------- */
function openProfile(id){
  state.caregiverId=id;const c=cg(id);
  const revs=[...(cgReviews[id]||[]),...REVIEWS];
  const revCount=c.reviews+((cgReviews[id]||[]).length);
  document.getElementById('profileGrid').innerHTML=`
    <div class="pcard">
      <div class="phead">
        ${avaHtml(c.init,c.photo)}
        <div>
          <h1>${esc(c.name)}</h1>
          <div class="pmeta">
            <span class="stars">★★★★★ <b style="color:var(--navy-900)">${c.rating}</b> <span style="color:var(--muted)">(${c.reviews} hodnocení)</span></span>
          </div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            ${cgBadges(c)}
            ${c.cert?'<span class="chip">🎓 Ověřené vzdělání</span>':''}
            ${(c.langs||[]).map(l=>`<span class="chip">🗣️ ${l}</span>`).join('')}
          </div>
        </div>
      </div>
      <div class="pchips">
        <div class="pchip"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11Z" stroke="#C9A233" stroke-width="1.6"/><circle cx="12" cy="10" r="2.2" stroke="#C9A233" stroke-width="1.6"/></svg>${esc(c.loc)} · dojezd do ${c.radius} km</div>
        <div class="pchip"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="8" stroke="#C9A233" stroke-width="1.6"/><path d="M12 8v4l3 2" stroke="#C9A233" stroke-width="1.6" stroke-linecap="round"/></svg>${c.exp} let praxe</div>
        <div class="pchip"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" stroke="#C9A233" stroke-width="1.6"/></svg>Ověřené doklady</div>
        <div class="pchip"><svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 8h14v12H5V8ZM9 4h6v4H9V4Z" stroke="#C9A233" stroke-width="1.6"/></svg>Pojištěná péče</div>
      </div>
      <div class="pdiv"></div>
      <h3>O mně</h3>
      <p class="bio">${esc(c.bio)}</p>
      <div class="pdiv"></div>
      <h3>Nabízené služby</h3>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
        ${c.services.map(s=>`<span class="chip gold">${sName(s)}</span>`).join('')}
      </div>
      <div class="pdiv"></div>
      <h3>Hodnocení (${revCount})</h3>
      ${revs.map(r=>`<div class="rev"><div class="ava">${esc(r.init)}</div><div><div class="rb">${esc(r.name)} <span class="stars" style="font-size:12px">${'★'.repeat(r.stars)}</span></div><div class="rt">${esc(r.text)}</div></div></div>`).join('')}
    </div>
    <div class="pcard book-aside">
      <h3 style="margin-bottom:4px">Objednat péči</h3>
      <p style="color:var(--muted);font-size:13.5px;margin-bottom:18px">Vyberte si termín a my zajistíme zbytek.</p>
      <div class="row"><span class="l">Cena</span><span class="r">${priceLabel(c)}</span></div>
      <div class="row"><span class="l">Doprava</span><span class="r">${kmLabel(c)}</span></div>
      <div class="row"><span class="l">Dojezd</span><span class="r">${esc(c.loc)} do ${c.radius} km</span></div>
      <div class="row"><span class="l">Dostupnost</span><span class="r" style="color:var(--gold-deep)">Tento týden</span></div>
      <div class="row"><span class="l">Reakce</span><span class="r">do 2 hodin</span></div>
      <div class="total-row"><span class="l">${c.priceType==='indiv'?'Cena':'Od'}</span><span class="big">${c.priceType==='indiv'?'Dohodou':priceShort(c).replace(/<b>|<\/b>/g,'')}</span></div>
      <button class="btn btn-gold btn-block" style="margin-top:18px" onclick="openBooking(${c.id})">Objednat službu</button>
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openChat(${jsq(c.name)},${jsq(c.init)},'caregiver')">Napsat zprávu</button>
    </div>`;
  go('profile');
}

/* ---------- BOOKING ---------- */
let pendingBookingId=null;
/* po přihlášení/registraci dokonči odloženou objednávku; vrací true, pokud něco čekalo */
function resumePendingBooking(){
  if(pendingBookingId==null||!auth.loggedIn||auth.role!=='family')return false;
  const id=pendingBookingId;pendingBookingId=null;
  toast('✓ Hotovo! Teď můžete dokončit objednávku.');
  openBooking(id);
  return true;
}
function openBooking(id){
  // Objednat smí jen přihlášený zákazník — jinak nejdřív registrace.
  if(!auth.loggedIn){
    pendingBookingId=id;
    pickRole('family');
    toast('ℹ️ Pro objednání služby se prosím nejdřív zaregistrujte.');
    go('register');
    return;
  }
  state.caregiverId=id;const c=cg(id);
  state.bkService=c.services[0];state.bkHours=4;
  document.getElementById('bkServices').innerHTML=c.services.map(s=>
    `<div class="opt ${s===state.bkService?'on':''}" onclick="pickService('${s}')">${sName(s)}</div>`).join('');
  document.getElementById('bkHours').innerHTML=[2,4,6,8].map(h=>
    `<div class="opt ${h===state.bkHours?'on':''}" onclick="pickHours(${h})">${h} hodin</div>`).join('');
  const dateEl=document.getElementById('bkDate');
  dateEl.min=todayISO();
  dateEl.value=todayISO();
  // pole vzdálenosti jen když pečovatel účtuje dopravu
  const kmWrap=document.getElementById('bkKmWrap');
  document.getElementById('bkKm').value=0;
  if(kmWrap)kmWrap.style.display=(c.kmPrice&&c.kmPrice>0)?'':'none';
  updateSummary();go('booking');
}
function pickService(s){state.bkService=s;
  document.querySelectorAll('#bkServices .opt').forEach(o=>o.classList.toggle('on',o.textContent===sName(s)));updateSummary();}
function pickHours(h){state.bkHours=h;
  document.querySelectorAll('#bkHours .opt').forEach(o=>o.classList.toggle('on',o.textContent===h+' hodin'));updateSummary();}
function updateSummary(){
  const c=cg(state.caregiverId);const sub=c.rate*state.bkHours;
  const km=Math.max(0,+(document.getElementById('bkKm')||{}).value||0);
  const transport=(c.kmPrice&&c.kmPrice>0)?km*c.kmPrice:0;
  const total=sub+transport;
  const d=document.getElementById('bkDate').value;const t=document.getElementById('bkTime').value;
  const dateStr=d?new Date(d).toLocaleDateString('cs-CZ',{day:'numeric',month:'long',year:'numeric'}):'—';
  document.getElementById('summaryCard').innerHTML=`
    <h3>Souhrn objednávky</h3>
    <div style="display:flex;gap:12px;align-items:center;margin-bottom:16px">
      ${avaHtml(c.init,c.photo,'width:46px;height:46px;font-size:16px')}
      <div><div style="font-family:'Playfair Display',serif;font-size:16px;color:#fff">${esc(c.name)}</div>
      <div style="font-size:12.5px;color:#A2B0A6">${esc(c.loc)} · ★ ${c.rating}</div></div>
    </div>
    <div class="row"><span class="l">Služba</span><span class="r">${sName(state.bkService)}</span></div>
    <div class="row"><span class="l">Datum</span><span class="r">${dateStr}</span></div>
    <div class="row"><span class="l">Čas</span><span class="r">${t} (${state.bkHours} h)</span></div>
    <div class="row"><span class="l">Péče</span><span class="r">${sub.toLocaleString('cs-CZ')} Kč (${c.rate} Kč/hod)</span></div>
    ${transport>0?`<div class="row"><span class="l">Doprava</span><span class="r">${transport.toLocaleString('cs-CZ')} Kč (${km} km × ${c.kmPrice} Kč)</span></div>`:''}
    <div class="grand"><span class="l" style="font-size:15px;color:#fff">Celkem</span><span class="big">${total.toLocaleString('cs-CZ')} Kč</span></div>
    <button class="btn btn-gold btn-block" style="margin-top:22px" onclick="confirmBooking()">Potvrdit objednávku</button>
    <p style="font-size:11.5px;color:#8E9A8F;text-align:center;margin-top:12px">Platba proběhne až po potvrzení pečovatelkou.</p>`;
}
function confirmBooking(){
  const c=cg(state.caregiverId);
  const date=document.getElementById('bkDate').value;
  const time=document.getElementById('bkTime').value;
  const addr=document.getElementById('bkAddr').value.trim();
  if(!date){toast('⚠️ Vyberte prosím datum péče.');document.getElementById('bkDate').focus();return;}
  if(date<todayISO()){toast('⚠️ Datum nemůže být v minulosti.');document.getElementById('bkDate').focus();return;}
  if(!time){toast('⚠️ Vyberte prosím čas.');document.getElementById('bkTime').focus();return;}
  if(addr.length<5){toast('⚠️ Zadejte prosím platnou adresu.');document.getElementById('bkAddr').focus();return;}
  const note=document.getElementById('bkNote').value.trim();
  const hours=state.bkHours;
  const km=Math.max(0,+document.getElementById('bkKm').value||0);
  if(!auth.loggedIn){toast('Pro objednávku se prosím přihlaste.');go('login');return;}
  api('/orders',{method:'POST',body:{cid:c.id,service:state.bkService,hours,date,time,addr,note,km}})
    .then(r=>{const o=r.order;
      ORDERS.unshift({oid:o.oid,cid:c.id,service:state.bkService,hours,date,time,addr,note,km,status:'pending'});
      orderSeq=Math.max(orderSeq,o.oid);
      toast(`✓ Objednávka u <b>${esc(c.name)}</b> odeslána — čeká na potvrzení`,'success');
      setTimeout(()=>go('bookings'),900);
    })
    .catch(e=>toast('⚠️ Objednávku se nepodařilo odeslat: '+e.message,'declined'));
}

/* ---------- DATE HELPER ---------- */
function todayISO(){
  const d=new Date();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/* ---------- AUTH ---------- */
let regRole='family';
const auth={loggedIn:false,name:'',email:'',role:'family'};
const DEFERRED_VIEW_IDS=new Set([
  'profile','booking','bookings',
  'cg-dashboard','cg-requests','cg-calendar','cg-profile','cg-verify',
  'chat',
  'order-detail','login','forgot','reset-password','change-email','register',
  'fam-dash','admin-dash','admin-verify','admin-caregivers','admin-users','admin-orders','admin-audit','admin-broadcast','admin-plans',
  'pricing','settings'
]);
let deferredViewsLoaded=false;
let deferredViewsPromise=null;
let resetPwToken='';
let resetPwTokenValid=true;
let changeEmailToken='';
let changeEmailTokenValid=true;
let changeEmailCurrent='';
let changeEmailPending='';
const PASSWORD_HINT='Heslo musí mít alespoň 8 znaků a obsahovat malé písmeno, velké písmeno a číslo.';
const isEmail=v=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v||'').trim());
const isPhone=v=>/^[0-9+\s/]+$/.test((v||'').trim())&&(v||'').replace(/[^0-9]/g,'').length>=9;
const isStrongPassword=v=>{const s=String(v||'');return s.length>=8&&/[a-z]/.test(s)&&/[A-Z]/.test(s)&&/\d/.test(s);};

function isDeferredView(v){return DEFERRED_VIEW_IDS.has(String(v||''));}
async function ensureDeferredViewsLoaded(){
  if(deferredViewsLoaded)return true;
  if(deferredViewsPromise)return deferredViewsPromise;
  const host=document.getElementById('deferredViews');
  if(!host)return false;
  deferredViewsPromise=fetch('/deferred-views.html',{credentials:'same-origin'})
    .then(async(res)=>{
      if(!res.ok)throw new Error('Nepodarilo se nacist dalsi cast aplikace.');
      const html=await res.text();
      host.innerHTML=html;
      deferredViewsLoaded=true;
      document.querySelectorAll('#deferredViews select').forEach(enhanceSelect);
      initReveal();
      return true;
    })
    .catch((e)=>{
      deferredViewsPromise=null;
      throw e;
    });
  return deferredViewsPromise;
}

function pickRole(role){
  regRole=role;
  ['family','caregiver'].forEach(r=>{
    const el=document.getElementById('role-'+r);
    if(!el)return;
    el.classList.toggle('on',r===role);
    el.setAttribute('aria-checked',r===role?'true':'false');
  });
}
function togglePw(btn,id){
  const inp=document.getElementById(id);const show=inp.type==='password';
  inp.type=show?'text':'password';
  btn.setAttribute('aria-label',show?'Skrýt heslo':'Zobrazit heslo');
}
function setFieldError(fieldId,bad){document.getElementById(fieldId).classList.toggle('invalid',bad);}
function esc(v){
  return String(v==null?'':v)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}
function jsq(v){return JSON.stringify(String(v==null?'':v));}
function initials(name){
  const p=name.trim().split(/\s+/);
  return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase()||'Z';
}
/* avatar: foto, nebo iniciály (velikost řeší kontextové CSS) */
function avaHtml(init,photo,extra){
  extra=extra||'';
  return photo
    ? `<div class="ava" style="${extra};background-image:url('${photo}');background-size:cover;background-position:center;color:transparent"></div>`
    : `<div class="ava"${extra?` style="${extra}"`:''}>${init}</div>`;
}
function setAva(el,photo,init){
  if(!el)return;
  if(photo){el.textContent='';el.style.backgroundImage=`url('${photo}')`;el.style.backgroundSize='cover';el.style.backgroundPosition='center';el.style.color='transparent';}
  else{el.style.backgroundImage='';el.style.color='';el.textContent=init;}
}
/* propíše profilovou fotku pečovatelky do seznamu (Jana = id 1) */
function syncCgPhotoToList(){ if(CAREGIVERS[0])CAREGIVERS[0].photo=cgProfile.photo; }

/* ---- session ---- */
function loginAs(name,email,role){
  auth.loggedIn=true;auth.name=name;auth.email=email;auth.role=role||'family';
  updateAuthUI();
}
async function logout(){
  try{await api('/auth/logout',{method:'POST'});}catch(e){}
  auth.loggedIn=false;auth.name='';auth.email='';auth.role='family';
  closeAccountMenu();
  await apiSync(bootstrap());
  updateAuthUI();renderCare();
  toast('👋 Byli jste odhlášeni.');
  go('home');
}

/* ---------- NASTAVENÍ ---------- */
let appSettings={email:true,requests:true,chat:true,reminders:true};
function renderSettings(){
  ['email','requests','chat','reminders'].forEach(k=>{
    const el=document.getElementById('nt'+k.charAt(0).toUpperCase()+k.slice(1));
    if(el)el.checked=!!appSettings[k];
  });
  const name=auth.loggedIn?auth.name:'Host';
  document.getElementById('setName').textContent=name;
  document.getElementById('setEmail').textContent=auth.loggedIn?auth.email:'—';
  document.getElementById('setRole').textContent=auth.role==='caregiver'?'Účet pečovatelky':'Účet rodiny';
  setAva(document.getElementById('setAva'),auth.role==='caregiver'?cgProfile.photo:null,initials(name));
}
function toggleSetting(key,el){appSettings[key]=el.checked;if(auth.loggedIn)apiSync(api('/users/me/settings',{method:'PATCH',body:{settings:appSettings}}));toast('✓ Nastavení uloženo');}
async function changePassword(e){
  e.preventDefault();
  const cur=document.getElementById('pwCurrent'),nw=document.getElementById('pwNew'),cf=document.getElementById('pwConfirm');
  const err=document.getElementById('pwErr');err.textContent='';
  if(!cur.value){err.textContent='Zadejte současné heslo.';cur.focus();return false;}
  if(nw.value.length<6){err.textContent='Nové heslo musí mít alespoň 6 znaků.';nw.focus();return false;}
  if(nw.value!==cf.value){err.textContent='Hesla se neshodují.';cf.focus();return false;}
  try{
    await api('/auth/change-password',{method:'POST',body:{current:cur.value,next:nw.value}});
    cur.value=nw.value=cf.value='';
    toast('✓ Heslo bylo změněno');
  }catch(e2){err.textContent=e2.message||'Změna hesla se nezdařila.';}
  return false;
}
async function requestEmailChange(){
  const err=document.getElementById('emailChangeReqErr');
  if(err)err.textContent='';
  try{
    await api('/auth/change-email/request',{method:'POST'});
    toast('📧 Poslali jsme potvrzovaci odkaz na puvodni e-mail.');
  }catch(e){
    if(err)err.textContent=e.message||'Nepodarilo se odeslat potvrzovaci e-mail.';
  }
}
function resetChangeEmail(keepToken){
  const stepNew=document.getElementById('changeEmailStepNew');
  const stepCode=document.getElementById('changeEmailStepCode');
  const done=document.getElementById('changeEmailDone');
  const invalid=document.getElementById('changeEmailInvalid');
  if(stepNew)stepNew.style.display='';
  if(stepCode)stepCode.style.display='none';
  if(done)done.style.display='none';
  if(invalid)invalid.style.display='none';
  document.getElementById('changeEmailNewErr').textContent='';
  document.getElementById('changeEmailCodeErr').textContent='';
  document.getElementById('changeEmailNew').value='';
  document.getElementById('changeEmailCode').value='';
  document.getElementById('changeEmailCurrent').textContent='-';
  document.getElementById('changeEmailTarget').textContent='-';
  document.getElementById('changeEmailDoneValue').textContent='';
  changeEmailTokenValid=true;
  changeEmailCurrent='';
  changeEmailPending='';
  if(!keepToken)changeEmailToken='';
}
async function submitChangeEmailNew(e,resend){
  if(e&&e.preventDefault)e.preventDefault();
  const err=document.getElementById('changeEmailNewErr');
  err.textContent='';
  document.getElementById('changeEmailCodeErr').textContent='';
  if(!changeEmailToken||!changeEmailTokenValid){
    err.textContent='Odkaz pro zmenu e-mailu uz neni platny.';
    return false;
  }
  const input=document.getElementById('changeEmailNew');
  const newEmail=((input.value)||changeEmailPending||'').trim().toLowerCase();
  if(!isEmail(newEmail)){
    err.textContent='Zadejte platny e-mail.';
    input.focus();
    return false;
  }
  try{
    await api('/auth/change-email/send-code',{method:'POST',body:{token:changeEmailToken,newEmail}});
    changeEmailPending=newEmail;
    document.getElementById('changeEmailTarget').textContent=newEmail;
    document.getElementById('changeEmailStepNew').style.display='none';
    document.getElementById('changeEmailStepCode').style.display='';
    toast(resend?'📧 Poslali jsme novy overovaci kod.':'📧 Poslali jsme overovaci kod na novy e-mail.');
  }catch(e2){
    err.textContent=e2.message||'Kod se nepodarilo odeslat.';
    if(e2&&['invalid','expired','used'].includes(e2.reason||'')){
      changeEmailTokenValid=false;
      document.getElementById('changeEmailStepNew').style.display='none';
      document.getElementById('changeEmailStepCode').style.display='none';
      document.getElementById('changeEmailInvalid').style.display='block';
      document.getElementById('changeEmailInvalidText').textContent=e2.message||'Pozadejte prosim o novy odkaz pro zmenu e-mailu.';
    }
  }
  return false;
}
async function submitChangeEmailCode(){
  const err=document.getElementById('changeEmailCodeErr');
  err.textContent='';
  const code=document.getElementById('changeEmailCode').value.trim();
  if(!/^\d{6}$/.test(code)){
    err.textContent='Zadejte 6mistny overovaci kod.';
    document.getElementById('changeEmailCode').focus();
    return false;
  }
  try{
    const r=await api('/auth/change-email/confirm',{method:'POST',body:{token:changeEmailToken,code}});
    auth.email=(r&&r.user&&r.user.email)||changeEmailPending;
    document.getElementById('changeEmailDoneValue').textContent=auth.email;
    document.getElementById('changeEmailStepNew').style.display='none';
    document.getElementById('changeEmailStepCode').style.display='none';
    document.getElementById('changeEmailDone').style.display='block';
    changeEmailToken='';
    updateAuthUI();
    renderSettings();
    toast('✓ E-mail byl zmenen.');
  }catch(e){
    err.textContent=e.message||'Overeni noveho e-mailu se nezdarilo.';
    if(e&&['invalid','expired','used'].includes(e.reason||'')){
      changeEmailTokenValid=false;
      document.getElementById('changeEmailStepNew').style.display='none';
      document.getElementById('changeEmailStepCode').style.display='none';
      document.getElementById('changeEmailDone').style.display='none';
      document.getElementById('changeEmailInvalid').style.display='block';
      document.getElementById('changeEmailInvalidText').textContent=e.message||'Pozadejte prosim o novy odkaz pro zmenu e-mailu.';
    }
  }
  return false;
}
function exportData(){
  try{
    const data=localStorage.getItem(LS_KEY)||'{}';
    const blob=new Blob([data],{type:'application/json'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='zenvoria-data.json';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast('⬇️ Data byla exportována');
  }catch(e){toast('⚠️ Export se nezdařil');}
}
function deleteAccount(){
  askConfirm({title:'Smazat účet?',icon:'🗑️',
    message:'Tím se smažou všechna lokální data a akce je nevratná.',
    confirmLabel:'Smazat účet',danger:true,onConfirm:()=>{
      try{localStorage.removeItem(LS_KEY);localStorage.removeItem('zv_auth');}catch(e){}
      toast('Účet byl smazán.');
      setTimeout(()=>location.reload(),700);
    }});
}
const NAV_GUEST=[
  {v:'home',label:'Domů',fn:"go('home')"},
  {v:'search',label:'Hledat péči',fn:"go('search')"},
  {v:'howto',label:'Jak to funguje',fn:"go('howto')"}
];
const NAV_CAREGIVER=[
  {v:'cg-dashboard',label:'Přehled',fn:"go('cg-dashboard')"},
  {v:'cg-requests',label:'Poptávky',fn:"go('cg-requests')"},
  {v:'cg-calendar',label:'Kalendář',fn:"go('cg-calendar')"},
  {v:'cg-verify',label:'Ověření',fn:"go('cg-verify')"},
  {v:'cg-profile',label:'Můj profil',fn:"go('cg-profile')"}
];
const NAV_ADMIN=[
  {v:'admin-dash',label:'Přehled',fn:"go('admin-dash')"},
  {v:'admin-verify',label:'Žádosti o ověření',fn:"go('admin-verify')"},
  {v:'admin-caregivers',label:'Pečovatelky',fn:"go('admin-caregivers')"},
  {v:'admin-users',label:'Uživatelé',fn:"go('admin-users')"},
  {v:'admin-audit',label:'Audit logy',fn:"go('admin-audit')"},
  {v:'admin-broadcast',label:'Zprávy',fn:"go('admin-broadcast')"},
  {v:'admin-plans',label:'Tarify',fn:"go('admin-plans')"},
  {v:'admin-orders',label:'Objednávky',fn:"go('admin-orders')"}
];
const NAV_FAMILY=[
  {v:'fam-dash',label:'Přehled',fn:"go('fam-dash')"},
  {v:'search',label:'Hledat péči',fn:"go('search')"},
  {v:'bookings',label:'Moje objednávky',fn:"go('bookings')"},
  {v:'chat',label:'Zprávy',fn:"go('chat')"}
];
/* kam přesměrovat po přihlášení / kliknutí na logo */
function landingView(){
  return auth.role==='caregiver'?'cg-dashboard':(auth.role==='admin'?'admin-dash':'fam-dash');
}
function goHome(){
  if(auth.loggedIn)go(landingView());
  else go('home');
}
/* počet čekajících žádostí o ověření */
function pendingVerCount(){return VERIFICATIONS.filter(v=>v.status==='submitted').length;}
function renderNav(){
  const isCg=auth.loggedIn&&auth.role==='caregiver';
  const isAdmin=auth.loggedIn&&auth.role==='admin';
  const navset=isAdmin?NAV_ADMIN:(isCg?NAV_CAREGIVER:(auth.loggedIn?NAV_FAMILY:NAV_GUEST));
  const html=navset.map(l=>{
    let badge='';
    if(l.v==='cg-requests'&&CG_REQUESTS.length)badge=`<span class="nav-badge">${CG_REQUESTS.length}</span>`;
    else if(l.v==='chat'&&chatUnread())badge=`<span class="nav-badge">${chatUnread()}</span>`;
    else if(l.v==='cg-verify'&&cgStatus()!=='verified')badge=`<span class="nav-badge">!</span>`;
    else if(l.v==='admin-verify'&&pendingVerCount())badge=`<span class="nav-badge">${pendingVerCount()}</span>`;
    return `<a data-v="${l.v}" role="button" tabindex="0" onclick="navProgress(this,()=>{${l.fn}})">${l.label}${badge}</a>`;
  }).join('');
  document.getElementById('navlinks').innerHTML=html;
  document.getElementById('mmLinks').innerHTML=html;
  document.getElementById('navCta').hidden=isCg||isAdmin;
  const dot=document.getElementById('notifDot');
  if(dot)dot.hidden=!(chatUnread()>0||(isCg&&CG_REQUESTS.length>0)||(isAdmin&&pendingVerCount()>0));
}
function updateAuthUI(){
  const inn=auth.loggedIn;
  ensureBroadcastConvo();
  renderNav();
  document.getElementById('accountWrap').hidden=!inn;
  document.getElementById('loginBtn').hidden=inn;
  // obálka zpráv v headeru — jen pro přihlášené rodiny/pečovatelky (admin nemá chat)
  const msgBtn=document.getElementById('msgBtn');
  if(msgBtn){
    const hasChat=inn&&auth.role!=='admin';
    msgBtn.hidden=!hasChat;
    const u=chatUnread();
    const badge=document.getElementById('msgBadge');
    msgBtn.classList.toggle('has-unread',hasChat&&u>0);
    if(badge){badge.hidden=!(hasChat&&u>0);badge.textContent=u>9?'9+':u;}
    msgBtn.setAttribute('aria-label',u>0?`Zprávy — ${u} nepřečtené`:'Zprávy');
  }
  if(inn){
    setAva(document.getElementById('avatarInit'), auth.role==='caregiver'?cgProfile.photo:null, initials(auth.name));
    document.getElementById('avatarName').textContent=auth.name.split(/\s+/)[0];
    document.getElementById('amName').textContent=auth.name;
    document.getElementById('amEmail').textContent=auth.email;
    document.getElementById('amBadgeText').textContent=auth.role==='caregiver'?'Účet pečovatelky':(auth.role==='admin'?'Správce systému':'Účet rodiny');
    const mi=(fn,label,path)=>`<a role="menuitem" tabindex="0" onclick="${fn}"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" aria-hidden="true">${path}</svg>${label}</a>`;
    const chatIcon='<path d="M4 5h16v11H9l-5 4V5Z" stroke="#7A736A" stroke-width="1.6" stroke-linejoin="round"/>';
    const gridIcon='<rect x="4" y="4" width="7" height="7" rx="1.5" stroke="#7A736A" stroke-width="1.6"/><rect x="13" y="4" width="7" height="7" rx="1.5" stroke="#7A736A" stroke-width="1.6"/><rect x="4" y="13" width="7" height="7" rx="1.5" stroke="#7A736A" stroke-width="1.6"/><rect x="13" y="13" width="7" height="7" rx="1.5" stroke="#7A736A" stroke-width="1.6"/>';
    const shieldIcon='<path d="M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z" stroke="#7A736A" stroke-width="1.6"/>';
    const unread=chatUnread();const zpr='Zprávy'+(unread?` <span class="nav-badge">${unread}</span>`:'');
    const pv=pendingVerCount();const zad='Žádosti o ověření'+(pv?` <span class="nav-badge">${pv}</span>`:'');
    document.getElementById('amLinks').innerHTML=auth.role==='admin'
      ? mi("go('admin-dash')",'Přehled',gridIcon)
        +mi("go('admin-verify')",zad,shieldIcon)
        +mi("go('admin-caregivers')",'Pečovatelky','<circle cx="12" cy="8" r="3.4" stroke="#7A736A" stroke-width="1.6"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#7A736A" stroke-width="1.6"/>')
        +mi("go('admin-users')",'Uživatelé','<circle cx="9" cy="8" r="3" stroke="#7A736A" stroke-width="1.6"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5M16 7a3 3 0 0 1 0 6m5 6c0-2.4-1.6-4.2-4-4.8" stroke="#7A736A" stroke-width="1.6"/>')
        +mi("go('admin-audit')",'Audit logy','<path d="M8 4h8l3 3v13H5V4h3Z" stroke="#7A736A" stroke-width="1.6"/><path d="M8 9h8M8 13h8M8 17h5" stroke="#7A736A" stroke-width="1.6" stroke-linecap="round"/>')
      : auth.role==='caregiver'
      ? mi("go('cg-dashboard')",'Přehled',gridIcon)
        +mi("go('cg-requests')",'Poptávky','<path d="M3 6h18v12H3z" stroke="#7A736A" stroke-width="1.6"/><path d="m3 7 9 6 9-6" stroke="#7A736A" stroke-width="1.6"/>')
        +mi("go('chat')",zpr,chatIcon)
        +mi("go('cg-profile')",'Můj profil','<circle cx="12" cy="8" r="3.4" stroke="#7A736A" stroke-width="1.6"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#7A736A" stroke-width="1.6"/>')
      : mi("go('bookings')",'Moje objednávky','<rect x="4" y="5" width="16" height="16" rx="2" stroke="#7A736A" stroke-width="1.6"/><path d="M4 9h16M8 3v4M16 3v4" stroke="#7A736A" stroke-width="1.6" stroke-linecap="round"/>')
        +mi("go('chat')",zpr,chatIcon)
        +mi("go('search')",'Hledat péči','<circle cx="11" cy="11" r="7" stroke="#7A736A" stroke-width="1.6"/><path d="m20 20-3-3" stroke="#7A736A" stroke-width="1.6" stroke-linecap="round"/>');
  }
  const mm=document.getElementById('mmAuth');
  const greet=document.getElementById('homeGreeting');
  if(inn&&auth.role==='family'){greet.hidden=false;greet.innerHTML=`👋 Vítejte zpět, <b style="color:var(--navy-900)">${esc(auth.name.split(/\s+/)[0])}</b>`;}
  else{greet.hidden=true;}
  const homeLink=(auth.role==='caregiver'||auth.role==='admin')?`<a role="button" tabindex="0" onclick="go('${landingView()}')">Přehled</a>`:"<a role=\"button\" tabindex=\"0\" onclick=\"go('bookings')\">Moje objednávky</a>";
  mm.innerHTML=inn
    ? `<div class="mm-user">${avaHtml(initials(auth.name),auth.role==='caregiver'?cgProfile.photo:null)}<div><b>${esc(auth.name)}</b><span>${esc(auth.email)}</span></div></div>
       ${homeLink}
       <a role="button" tabindex="0" onclick="logout()" style="color:#B23A2E">Odhlásit se</a>`
    : `<a data-v="login" role="button" tabindex="0" onclick="go('login')">Přihlásit se</a>
       <a role="button" tabindex="0" onclick="go('register')">Registrace</a>`;
}
function toggleAccountMenu(){
  const w=document.getElementById('accountWrap');
  const open=!w.classList.contains('open');
  w.classList.toggle('open',open);
  document.getElementById('avatarPill').setAttribute('aria-expanded',open?'true':'false');
}
function closeAccountMenu(){
  document.getElementById('accountWrap')?.classList.remove('open');
  document.getElementById('avatarPill')?.setAttribute('aria-expanded','false');
}
document.addEventListener('click',e=>{if(!e.target.closest('#accountWrap'))closeAccountMenu();});

async function submitLogin(e){
  e.preventDefault();
  const email=document.getElementById('loginEmail'),pw=document.getElementById('loginPw');
  const eBad=!isEmail(email.value),pBad=pw.value.length<6;
  setFieldError('lf-email',eBad);setFieldError('lf-pw',pBad);
  document.getElementById('lf-pw-err').textContent='Zadejte heslo (min. 6 znaků).';
  if(eBad){email.focus();return false;}
  if(pBad){pw.focus();return false;}
  const key=email.value.trim().toLowerCase();
  try{
    const r=await api('/auth/login',{method:'POST',body:{email:key,password:pw.value}});
    loginAs(r.user.name,r.user.email,r.user.role);
    if(r.user.settings)Object.assign(appSettings,r.user.settings);
    await apiSync(bootstrap());updateAuthUI();renderCare();
    toast(`✓ Vítejte zpět, <b>${esc(auth.name.split(/\s+/)[0])}</b>!`);
    if(!resumePendingBooking())go(landingView());
  }catch(err){
    setFieldError('lf-pw',true);
    document.getElementById('lf-pw-err').textContent=err.message||'Přihlášení se nezdařilo.';
    pw.focus();
  }
  return false;
}
async function submitRegister(e){
  e.preventDefault();
  const name=document.getElementById('regName'),email=document.getElementById('regEmail'),
    phone=document.getElementById('regPhone'),pw=document.getElementById('regPw'),terms=document.getElementById('regTerms');
  const nBad=name.value.trim().split(/\s+/).filter(Boolean).length<2;
  const eBad=!isEmail(email.value),phBad=!isPhone(phone.value),pBad=!isStrongPassword(pw.value),tBad=!terms.checked;
  setFieldError('rf-name',nBad);setFieldError('rf-email',eBad);setFieldError('rf-phone',phBad);
  setFieldError('rf-pw',pBad);setFieldError('rf-terms',tBad);
  const firstBad=[[nBad,name],[eBad,email],[phBad,phone],[pBad,pw]].find(x=>x[0]);
  if(firstBad){firstBad[1].focus();return false;}
  if(tBad){document.getElementById('regTerms').focus();return false;}
  try{
    const r=await api('/auth/register',{method:'POST',body:{name:name.value.trim(),email:email.value.trim().toLowerCase(),password:pw.value,role:regRole}});
    loginAs(r.user.name,r.user.email,r.user.role);
    await apiSync(bootstrap());updateAuthUI();renderCare();
    toast(regRole==='caregiver'?'✓ Účet pečovatelky vytvořen. Dokončete prosím ověření.':'✓ Účet vytvořen. Vítejte v ZENVORIA!');
    if(!resumePendingBooking())go(landingView());
  }catch(err){
    setFieldError('rf-email',true);
    document.getElementById('rf-email-err')&&(document.getElementById('rf-email-err').textContent=err.message);
    toast('⚠️ '+(err.message||'Registrace se nezdařila.'),'declined');
  }
  return false;
}
function submitForgot(e){
  e.preventDefault();
  const email=document.getElementById('forgotEmail');
  const bad=!isEmail(email.value);
  setFieldError('ff-email',bad);
  if(bad){email.focus();return false;}
  api('/auth/forgot-password',{method:'POST',body:{email:email.value.trim().toLowerCase()}})
    .then(()=>{
      document.getElementById('forgotEmailEcho').textContent=email.value.trim().toLowerCase();
      document.getElementById('forgotFields').style.display='none';
      document.getElementById('forgotDone').style.display='block';
      toast('📧 Odeslali jsme odkaz pro obnovu hesla.');
    })
    .catch(err=>{
      document.getElementById('ff-email-err').textContent=err.message||'Odeslání odkazu se nezdařilo.';
      setFieldError('ff-email',true);
      email.focus();
    });
  return false;
}
function resetForgot(){
  const f=document.getElementById('forgotFields'),d=document.getElementById('forgotDone');
  if(f)f.style.display='';
  if(d)d.style.display='none';
  const i=document.getElementById('forgotEmail');
  if(i){i.value='';}
  setFieldError('ff-email',false);
}
function resetResetPassword(keepToken){
  const f=document.getElementById('resetPwFields'),d=document.getElementById('resetPwDone'),x=document.getElementById('resetPwInvalid');
  if(f)f.style.display='';
  if(d)d.style.display='none';
  if(x)x.style.display='none';
  const n=document.getElementById('resetPwNext'),c=document.getElementById('resetPwConfirm');
  if(n)n.value='';
  if(c)c.value='';
  setFieldError('rpw-next',false);
  setFieldError('rpw-confirm',false);
  document.getElementById('rpw-next-err').textContent=PASSWORD_HINT;
  document.getElementById('rpw-confirm-err').textContent='Hesla se musí shodovat.';
  resetPwTokenValid=true;
  if(!keepToken)resetPwToken='';
}
async function submitResetPassword(e){
  e.preventDefault();
  const next=document.getElementById('resetPwNext'),confirm=document.getElementById('resetPwConfirm');
  const pBad=!isStrongPassword(next.value),matchBad=next.value!==confirm.value;
  setFieldError('rpw-next',pBad);
  setFieldError('rpw-confirm',matchBad);
  if(!resetPwToken||!resetPwTokenValid){
    document.getElementById('rpw-next-err').textContent='Odkaz pro obnovu hesla je neplatný nebo chybí.';
    setFieldError('rpw-next',true);next.focus();return false;
  }
  document.getElementById('rpw-next-err').textContent=PASSWORD_HINT;
  if(pBad){next.focus();return false;}
  if(matchBad){confirm.focus();return false;}
  try{
    await api('/auth/reset-password',{method:'POST',body:{token:resetPwToken,next:next.value}});
    document.getElementById('resetPwFields').style.display='none';
    document.getElementById('resetPwDone').style.display='block';
    resetPwToken='';
    try{
      const url=new URL(window.location.href);
      url.searchParams.delete('reset');
      history.replaceState({},'',url.pathname+(url.search?url.search:'')+url.hash);
    }catch(e){}
    toast('✓ Nové heslo bylo uloženo.');
    setTimeout(()=>go('login'),1800);
  }catch(err){
    if(/vypršel|neplatný/i.test(err.message||'')){
      resetPwTokenValid=false;
      document.getElementById('resetPwFields').style.display='none';
      document.getElementById('resetPwDone').style.display='none';
      document.getElementById('resetPwInvalid').style.display='block';
      document.getElementById('resetPwInvalidText').textContent=err.message||'Požádejte prosím o nový odkaz pro obnovu hesla.';
    }else{
      document.getElementById('rpw-next-err').textContent=err.message||'Reset hesla se nezdařil.';
      setFieldError('rpw-next',true);
      next.focus();
    }
  }
  return false;
}

/* ---------- LEGAL / PRÁVNÍ STRÁNKY ---------- */
const LEGAL={
  gdpr:{title:'Ochrana osobních údajů',upd:'Naposledy aktualizováno: 6. června 2026',lead:'Jak chráníme osobní údaje rodin, pečovatelek i dalších uživatelů platformy ZENVORIA.',body:`
    <p>Ochrana vašich osobních údajů je pro ZENVORIA prioritou. Tento dokument popisuje, jaké údaje zpracováváme, za jakým účelem a jaká práva v souvislosti s nimi máte. Zpracování probíhá v souladu s nařízením (EU) 2016/679 (GDPR) a zákonem č. 110/2019 Sb.</p>
    <h2>1. Správce údajů</h2>
    <p>Správcem osobních údajů je ZENVORIA s.r.o., IČO 000 00 000, se sídlem v Praze. Kontakt: <a href="mailto:miklasova@zenvoria.cz">miklasova@zenvoria.cz</a>.</p>
    <h2>2. Jaké údaje zpracováváme</h2>
    <ul>
      <li>Identifikační a kontaktní údaje (jméno, e-mail, telefon, adresa).</li>
      <li>Údaje o objednávkách péče a komunikaci v aplikaci.</li>
      <li>U pečovatelek doklady o ověření, certifikace a reference.</li>
      <li>Technické údaje (IP adresa, typ zařízení, soubory cookies).</li>
    </ul>
    <h2>3. Účel a právní základ zpracování</h2>
    <ul>
      <li>Poskytování služby a plnění smlouvy (čl. 6 odst. 1 písm. b GDPR).</li>
      <li>Plnění zákonných povinností, např. účetnictví (písm. c).</li>
      <li>Oprávněný zájem — bezpečnost a zlepšování služby (písm. f).</li>
      <li>Marketing pouze na základě vašeho souhlasu (písm. a).</li>
    </ul>
    <h2>4. Doba uchování</h2>
    <p>Údaje uchováváme po dobu trvání smluvního vztahu a následně po dobu vyžadovanou právními předpisy (zpravidla 10 let u daňových dokladů).</p>
    <h2>5. Vaše práva</h2>
    <p>Máte právo na přístup k údajům, jejich opravu či výmaz, omezení zpracování, přenositelnost, vznesení námitky a podání stížnosti u Úřadu pro ochranu osobních údajů (<a href="https://www.uoou.cz" target="_blank" rel="noopener">uoou.cz</a>).</p>
    <h2>6. Kontakt</h2>
    <p>S dotazy ke zpracování osobních údajů se obraťte na <a href="mailto:miklasova@zenvoria.cz">miklasova@zenvoria.cz</a>.</p>`},
  terms:{title:'Obchodní podmínky',upd:'Účinné od: 6. června 2026',lead:'Pravidla používání platformy ZENVORIA, registrace, objednávek péče a odpovědnosti jednotlivých stran.',body:`
    <p>Tyto obchodní podmínky upravují práva a povinnosti při užívání platformy ZENVORIA, která zprostředkovává spojení mezi rodinami a ověřenými pečovatelkami.</p>
    <h2>1. Úvodní ustanovení</h2>
    <p>Provozovatelem platformy je ZENVORIA s.r.o. Registrací a užíváním služby vyjadřujete souhlas s těmito podmínkami.</p>
    <h2>2. Vymezení pojmů</h2>
    <ul>
      <li><b>Uživatel</b> — rodina nebo osoba poptávající péči.</li>
      <li><b>Pečovatelka</b> — ověřený poskytovatel pečovatelských služeb.</li>
      <li><b>Zprostředkování</b> — propojení uživatele a pečovatelky prostřednictvím platformy.</li>
    </ul>
    <h2>3. Registrace a účet</h2>
    <p>Uživatel je povinen uvádět pravdivé údaje a chránit přístupové údaje ke svému účtu. Za aktivity provedené pod účtem odpovídá jeho držitel.</p>
    <h2>4. Zprostředkování péče</h2>
    <p>ZENVORIA poskytuje technologickou platformu pro vyhledání a objednání péče. Samotnou péči poskytuje pečovatelka, která za ni nese odpovědnost. Pečovatelky procházejí ověřením dokladů a referencí.</p>
    <h2>5. Ceny a platby</h2>
    <p>Ceny péče jsou uvedeny u jednotlivých pečovatelek. Platby probíhají prostřednictvím zabezpečené platební brány. Platforma si může účtovat zprostředkovatelský poplatek.</p>
    <h2>6. Zrušení a storno</h2>
    <p>Objednávku lze bezplatně zrušit nejpozději 24 hodin před začátkem péče. Při pozdějším zrušení může být účtován storno poplatek.</p>
    <h2>7. Odpovědnost a reklamace</h2>
    <p>Případné reklamace lze uplatnit na <a href="mailto:miklasova@zenvoria.cz">miklasova@zenvoria.cz</a>. Spotřebitel má právo na mimosoudní řešení sporů u České obchodní inspekce.</p>
    <h2>8. Závěrečná ustanovení</h2>
    <p>Tyto podmínky se řídí právním řádem České republiky. Provozovatel je oprávněn podmínky měnit; o změnách bude informovat v aplikaci.</p>`},
  cookies:{title:'Zásady používání cookies',upd:'Naposledy aktualizováno: 6. června 2026',lead:'Přehled souborů cookies, které používáme pro fungování aplikace, nastavení a analytiku.',body:`
    <p>Soubory cookies nám pomáhají zajistit správné fungování aplikace a zlepšovat vaši zkušenost. Zde se dozvíte, jaké cookies používáme a jak je můžete spravovat.</p>
    <h2>1. Co jsou cookies</h2>
    <p>Cookies jsou malé textové soubory ukládané ve vašem prohlížeči. Umožňují například zapamatovat přihlášení nebo předvolby zobrazení.</p>
    <h2>2. Jaké cookies používáme</h2>
    <ul>
      <li><b>Nezbytné</b> — zajišťují základní funkce, přihlášení a bezpečnost. Nelze je vypnout.</li>
      <li><b>Předvolby</b> — pamatují si nastavení, např. světlý/tmavý režim.</li>
      <li><b>Analytické</b> — anonymně měří návštěvnost a pomáhají službu zlepšovat.</li>
    </ul>
    <h2>3. Správa cookies</h2>
    <p>Nastavení cookies můžete kdykoli změnit ve svém prohlížeči, kde je lze také smazat. Omezení některých cookies může ovlivnit funkčnost aplikace.</p>
    <h2>4. Kontakt</h2>
    <p>S dotazy ke cookies se obraťte na <a href="mailto:miklasova@zenvoria.cz">miklasova@zenvoria.cz</a>.</p>`}
};
function openLegal(key,opts){
  const options=opts||{};
  const d=LEGAL[key];if(!d)return;
  const current=activeView();
  legalCurrentKey=key;
  legalBackView=options.direct?'home':(current==='legal' ? legalBackView : current);
  document.getElementById('legalTitle').textContent=d.title;
  document.getElementById('legalUpd').textContent=d.upd;
  document.getElementById('legalLead').textContent=d.lead||'Právní informace k používání platformy ZENVORIA najdete přehledně na jednom místě.';
  document.getElementById('legalUrl').textContent=legalUrl(key);
  document.getElementById('legalCompanyName').textContent=LEGAL_COMPANY.name;
  document.getElementById('legalCompanyMeta').textContent=LEGAL_COMPANY.meta;
  document.getElementById('legalCompanyEmail').textContent=LEGAL_COMPANY.email;
  document.getElementById('legalCompanyEmail').href='mailto:'+LEGAL_COMPANY.email;
  document.getElementById('legalBody').innerHTML=d.body;
  document.getElementById('legalBackLabel').textContent=legalBackView==='register'?'Zpět k registraci':(legalBackView==='login'?'Zpět k přihlášení':'Zpět');
  go('legal',options.fromPop===true);
}
function closeLegal(){
  const target=document.getElementById('view-'+legalBackView)?legalBackView:'home';
  go(target);
}
/* clear validation state while typing */
document.addEventListener('input',e=>{
  const f=e.target.closest('.auth-field');
  if(f)f.classList.remove('invalid');
});
/* session se obnovuje ze serveru přes /api/auth/me v initApp() */

/* ---------- CALENDAR ---------- */
const TODAY=new Date();
let calMonth=TODAY.getMonth(),calYear=TODAY.getFullYear();
const MONTHS=['Leden','Únor','Březen','Duben','Květen','Červen','Červenec','Srpen','Září','Říjen','Listopad','Prosinec'];
const BOOKED_DAYS=[20,24,28]; // demo: naplánované služby v květnu 2026
function renderCalendar(){
  if(!document.getElementById('calTitle')||!document.getElementById('calDays'))return;
  document.getElementById('calTitle').textContent=MONTHS[calMonth]+' '+calYear;
  const first=new Date(calYear,calMonth,1).getDay();
  const offset=(first+6)%7; // Monday-first
  const dim=new Date(calYear,calMonth+1,0).getDate();
  let html='';
  for(let i=0;i<offset;i++)html+='<div class="day muted" aria-hidden="true"></div>';
  const showDots=(calMonth===4&&calYear===2026);
  for(let d=1;d<=dim;d++){
    const has=showDots&&BOOKED_DAYS.includes(d);
    const today=(d===TODAY.getDate()&&calMonth===TODAY.getMonth()&&calYear===TODAY.getFullYear());
    const lbl=has?`${d}. ${MONTHS[calMonth].toLowerCase()} ${calYear} — naplánovaná služba`:`${d}. ${MONTHS[calMonth].toLowerCase()} ${calYear}`;
    html+=`<div class="day ${has?'has':''} ${today?'today':''}" ${has?'role="button" tabindex="0"':''} aria-label="${lbl}" onclick="${has?`toast('📅 Máte naplánovanou službu ${d}. ${MONTHS[calMonth].toLowerCase()}')`:''}">${d}</div>`;
  }
  document.getElementById('calDays').innerHTML=html;
  renderOrders('up');
}
function calMove(dir){calMonth+=dir;if(calMonth<0){calMonth=11;calYear--}if(calMonth>11){calMonth=0;calYear++}renderCalendar();}
function setOrderTab(el,tab){document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));el.classList.add('on');renderOrders(tab);}
function orderPrice(o){const c=cg(o.cid);const transport=(c.kmPrice&&o.km)?c.kmPrice*o.km:0;return c.rate*o.hours+transport;}
function renderOrders(tab){
  const want=tab==='up'?['pending','confirmed']:['done','declined','cancelled'];
  const list=ORDERS.filter(o=>want.includes(o.status));
  const el=document.getElementById('orderList');
  if(!list.length){el.innerHTML=`<div class="empty">${tab==='up'?'Žádné nadcházející objednávky.':'Zatím žádné minulé objednávky.'}</div>`;return;}
  el.innerHTML=list.map(o=>{
    const c=cg(o.cid);const st=ORDER_STATUS[o.status];
    return `<div class="order" style="cursor:pointer" role="button" tabindex="0" onclick="openFamilyOrder(${o.oid})">
      ${avaHtml(c.init,c.photo)}
      <div class="od">
        <b>${sName(o.service)}</b>
        <div class="det">${esc(c.name)} · ${fmtDate(o.date)}<br>${timeRange(o.time,o.hours)}</div>
      </div>
      <div class="ost">
        <span class="status ${st.cls}">${st.label}</span>
        <div class="pr">${orderPrice(o).toLocaleString('cs-CZ')} Kč</div>
      </div>
    </div>`;}).join('');
}

/* ---------- RODINA · PŘEHLED ---------- */
function famOrderRow(o){
  const c=cg(o.cid);const st=ORDER_STATUS[o.status];
  return `<div class="order" style="cursor:pointer" role="button" tabindex="0" onclick="openFamilyOrder(${o.oid})">
    ${avaHtml(c.init,c.photo)}
    <div class="od"><b>${sName(o.service)}</b><div class="det">${esc(c.name)} · ${fmtDate(o.date)}<br>${timeRange(o.time,o.hours)}</div></div>
    <div class="ost"><span class="status ${st.cls}">${st.label}</span><div class="pr">${orderPrice(o).toLocaleString('cs-CZ')} Kč</div></div>
  </div>`;
}
function renderFamilyDash(){
  const name=auth.loggedIn?auth.name:'U�ivatel';
  setAva(document.getElementById('famDashAva'),null,initials(name));
  document.getElementById('famFirst').textContent=name.split(/\s+/)[0];
  const up=ORDERS.filter(o=>['pending','confirmed'].includes(o.status));
  const pend=ORDERS.filter(o=>o.status==='pending').length;
  const done=ORDERS.filter(o=>o.status==='done').length;
  const unread=chatUnread();
  document.getElementById('famIntro').textContent=up.length
    ?`Máte ${up.length} ${up.length===1?'nadcházející objednávku':(up.length<5?'nadcházející objednávky':'nadcházejících objednávek')}.`
    :'Zatím nemáte žádné objednávky — najděte si pečovatelku.';
  const stats=[
    {ic:'M8 2v4M16 2v4M4 9h16M4 5h16v15H4z',v:up.length,l:'Nadcházející objednávky'},
    {ic:'M12 8v4l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',v:pend,l:'Čeká na potvrzení'},
    {ic:'M20 6 9 17l-5-5',v:done,l:'Dokončené služby'},
    {ic:'M4 5h16v11H9l-5 4V5Z',v:unread,l:'Nepřečtené zprávy'}
  ];
  document.getElementById('famStats').innerHTML=stats.map(s=>`
    <div class="stat"><div class="stat-top"><span class="sl">${s.l}</span><div class="si">${sIcon(s.ic)}</div></div><div class="sv">${s.v}</div></div>`).join('');
  document.getElementById('famUpcoming').innerHTML=up.length?up.slice(0,4).map(famOrderRow).join(''):'<div class="empty">Žádné nadcházející objednávky.</div>';
  // Důvěra a bezpečí: kdo přijde, kdy, historie péče, SOS
  const next=ORDERS.filter(o=>['pending','confirmed'].includes(o.status)).sort((a,b)=>a.date.localeCompare(b.date))[0];
  const trust=document.getElementById('famTrust');
  if(trust){
    const nc=next&&cg(next.cid);
    trust.innerHTML=`
      ${nc?`<div class="order" style="cursor:pointer" role="button" tabindex="0" onclick="openProfile(${nc.id})">
        ${avaHtml(nc.init,nc.photo)}
        <div class="od"><b>Přijde: ${esc(nc.name)}</b><div class="det">${fmtDate(next.date)} · ${next.time} · ${cgBadges(nc,{max:1})||'ověřená'}</div></div>
        <div class="ost"><span class="status ok">★ ${nc.rating}</span></div>
      </div>`:'<div class="empty" style="padding:14px">Zatím nemáte naplánovanou péči.</div>'}
      <div class="qa" style="margin-top:10px">
        <button class="qa-item" onclick="go('bookings')"><span class="qa-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C9A233" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="#C9A233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="qa-l">Historie péče (${done} dokončených)</span><span class="qa-ar">›</span></button>
        <button class="qa-item" onclick="toast('🚨 SOS linka 24/7: +420 800 999 111')"><span class="qa-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C9A233" stroke-width="1.6"/><circle cx="12" cy="12" r="3.4" stroke="#C9A233" stroke-width="1.6"/><path d="m5.4 5.4 4 4M18.6 5.4l-4 4M18.6 18.6l-4-4M5.4 18.6l4-4" stroke="#C9A233" stroke-width="1.6" stroke-linecap="round"/></svg></span><span class="qa-l">SOS linka 24/7</span><span class="qa-ar">›</span></button>
      </div>`;
  }
  const rec=CAREGIVERS.slice().filter(c=>c.verified&&!c.suspended).sort((a,b)=>(b.plan==='premium')-(a.plan==='premium')||b.rating-a.rating).slice(0,3);
  document.getElementById('famRecommended').innerHTML=rec.map(c=>`
    <div class="order" style="cursor:pointer" role="button" tabindex="0" onclick="openProfile(${c.id})">
      ${avaHtml(c.init,c.photo)}
      <div class="od"><b>${esc(c.name)}</b><div class="det">${esc(c.loc)} · ${c.exp} let praxe</div></div>
      <div class="ost"><span class="status ok">★ ${c.rating}</span><div class="pr">${c.rate} Kč</div></div>
    </div>`).join('');
}

/* ====================================================================
   OVĚŘENÍ PEČOVATELEK + ADMIN PANEL
   ==================================================================== */
const sName2=id=>SERVICES.find(s=>s.id===id)?.name||id;
/* stav ověření přihlášené pečovatelky */
function cgStatus(){
  if(!auth.loggedIn||auth.role!=='caregiver')return 'none';
  return cgStatusMap[auth.email]||'pending';
}
/* tarif přihlášené pečovatelky */
function cgPlan(){return cgPlanMap[auth.email]||'start';}
/* zobrazení ceny dle typu: za hodinu / za den / individuální */
function priceLabel(c){
  if(c.priceType==='indiv')return 'Individuální nabídka';
  if(c.priceType==='den')return `${(c.dayRate||c.rate*8).toLocaleString('cs-CZ')} Kč / den`;
  return `${c.rate} Kč / hod`;
}
function priceShort(c){
  if(c.priceType==='indiv')return '<b>Individuální</b>';
  if(c.priceType==='den')return `<b>${(c.dayRate||c.rate*8).toLocaleString('cs-CZ')} Kč</b> <span>/ den</span>`;
  return `<b>${c.rate} Kč</b> <span>/ hod</span>`;
}
/* doprava: cena za km, 0 = v ceně */
function kmLabel(c){return (c.kmPrice&&c.kmPrice>0)?`${c.kmPrice} Kč / km`:'V ceně';}
/* odznaky pečovatelky pro karty a profil */
function cgBadges(c,opts){
  opts=opts||{};const b=[];
  if(c.idVerified&&c.verified)b.push('<span class="chip badge-id"><img src="verify.webp" alt="" width="14" height="17" style="vertical-align:-3px;margin-right:3px">Ověřená identita</span>');
  if(c.rating>=4.85)b.push('<span class="chip badge-top">⭐ Top hodnocení</span>');
  if(c.plan==='premium')b.push(`<span class="chip badge-prem">${diamondSVG(13)}<span style="margin-left:4px">Premium</span></span>`);
  return b.slice(0,opts.max||b.length).join('');
}

/* ---- CENÍK / PŘEDPLATNÉ ---- */
function renderPricing(){
  const isCg=auth.loggedIn&&auth.role==='caregiver';
  const cur=isCg?cgPlan():null;
  const note=document.getElementById('planCurrentNote');
  note.innerHTML=isCg
    ?`<div class="verify-banner ok" style="margin-bottom:24px"><span class="vb-ic">${planIcon(cur,30)}</span><div class="vb-t"><b>Váš aktuální tarif: ${PLANS[cur].name}</b><span>${cur==='premium'?'Máte vyšší zobrazení a odznak Premium.':'Přejděte na PREMIUM pro vyšší zobrazení a více poptávek.'}</span></div></div>`
    :`<div class="verify-banner wait" style="margin-bottom:24px"><span class="vb-ic">👩‍⚕️</span><div class="vb-t"><b>Jste pečovatelka?</b><span>Zaregistrujte se a vyberte si tarif. Ceník je informativní.</span></div></div>`;
  document.getElementById('planGrid').innerHTML=['start','premium'].map(key=>{
    const p=PLANS[key];const featured=key==='premium';
    let action;
    if(isCg){action=cur===key
      ?(key==='premium'
        ? '<div class="plan-current">✓ Váš aktuální tarif</div><button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openBillingPortal(this)">Spravovat předplatné</button>'
        : '<div class="plan-current">✓ Váš aktuální tarif</div>')
      :(key==='premium'
        ? `<button class="btn btn-gold btn-block" onclick="startPremiumCheckout(this)">Zaplatit a aktivovat PREMIUM</button>`
        : `<button class="btn btn-ghost btn-block" onclick="setPlan('start')">Přejít na START</button>`);}
    else{action=`<button class="btn ${featured?'btn-gold':'btn-ghost'} btn-block" onclick="go('register');pickRole('caregiver')">Začít s ${p.name}</button>`;}
    return `<div class="plan-card ${featured?'featured':''}">
      ${featured?'<span class="pl-tag">NEJOBLÍBENĚJŠÍ</span>':''}
      <h3>${planIcon(key,22)} ${p.name}</h3>
      <div class="pl-price">${planPrice(key)>0?planPrice(key).toLocaleString('cs-CZ')+' Kč <span>/ měsíc</span>':'Zdarma'}</div>
      <div class="pl-sub">${featured?'Pro pečovatelky, které chtějí být více vidět.':'Základní tarif zdarma — automaticky po ověření.'}</div>
      <ul>${p.feats.map(f=>`<li>${f}</li>`).join('')}</ul>
      ${action}
    </div>`;}).join('');
  const pm=document.getElementById('planPayInfo');
  if(pm)pm.textContent='';
}
/* aktivace/změna tarifu (po zaplacení nebo downgrade na START) */
function setPlan(key){
  if(!(auth.loggedIn&&auth.role==='caregiver')){go('register');pickRole('caregiver');return;}
  const apply=()=>{cgPlanMap[auth.email]=key;const c=CAREGIVERS.find(x=>x.email===auth.email);if(c){c.plan=key;apiSync(api('/caregivers/'+c.id,{method:'PATCH',body:{plan:key}}));}
    renderPricing();renderCare();
    toast(key==='premium'?'💎 Aktivován tarif PREMIUM!':'Tarif změněn na START.');};
  if(key==='start'&&cgPlan()==='premium'){
    askConfirm({title:'Přejít na START?',icon:'⬇️',
      message:'Přijdete o odznak Premium a vyšší zobrazení ve vyhledávání.',
      confirmLabel:'Přejít na START',onConfirm:apply});
  }else apply();
}
/* ---- STRIPE: koupě předplatného PREMIUM ---- */
async function startPremiumCheckout(btn){
  if(!(auth.loggedIn&&auth.role==='caregiver')){go('register');pickRole('caregiver');return;}
  const orig=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Přesměrovávám na platbu…';}
  try{
    const r=await api('/billing/checkout',{method:'POST'});
    if(r&&r.url){window.location.href=r.url;return;} // přesměrování na Stripe Checkout
    throw new Error('Platební bránu se nepodařilo otevřít.');
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent=orig;}
    // Stripe není nakonfigurovaný → zatím použij dosavadní (mock) platbu
    if(/503|nakonfigurov/i.test(e.message||'')){openPayment();return;}
    toast('⚠️ '+(e.message||'Platba se nezdařila.'),'declined');
  }
}
async function openBillingPortal(btn){
  const orig=btn?btn.textContent:'';
  if(btn){btn.disabled=true;btn.textContent='Otevírám…';}
  try{
    const r=await api('/billing/portal',{method:'POST'});
    if(r&&r.url){window.location.href=r.url;return;}
    throw new Error('Portál se nepodařilo otevřít.');
  }catch(e){
    if(btn){btn.disabled=false;btn.textContent=orig;}
    toast('⚠️ '+(e.message||'Správu předplatného se nepodařilo otevřít.'),'declined');
  }
}
/* návrat ze Stripe Checkout (#pricing?paid=1) — tarif nastaví webhook, počkáme na něj */
async function handleBillingReturn(){
  const h=location.hash||'';
  const q=h.indexOf('?')>=0?h.slice(h.indexOf('?')+1):'';
  if(!/(^|&)paid=1(&|$)/.test(q)&&!/(^|&)canceled=1(&|$)/.test(q))return;
  // vyčisti parametry z URL, ať při refreshi nehlásí znovu
  history.replaceState({view:'pricing'},'','#pricing');
  go('pricing');
  if(/canceled=1/.test(q)){toast('Platba byla zrušena.');return;}
  toast('💳 Platba proběhla. Aktivuji PREMIUM…');
  // webhook může chvíli trvat — pár pokusů obnovit data
  for(let i=0;i<5;i++){
    await new Promise(r=>setTimeout(r,1500));
    try{await bootstrap();updateAuthUI();renderCare();renderPricing();}catch(e){}
    if(cgPlan()==='premium'){toast('💎 Aktivován tarif PREMIUM!');return;}
  }
  toast('Platba přijata. Aktivace tarifu se projeví za okamžik.');
}
/* ---- PLATBA PŘEDPLATNÉHO PREMIUM (záložní mock, dokud Stripe není zapnutý) ---- */
function openPayment(){
  if(!(auth.loggedIn&&auth.role==='caregiver')){go('register');pickRole('caregiver');return;}
  document.getElementById('paySub').textContent=`Měsíční předplatné · ${planPrice('premium').toLocaleString('cs-CZ')} Kč / měsíc`;
  document.getElementById('payBtn').textContent=`Zaplatit ${planPrice('premium').toLocaleString('cs-CZ')} Kč`;
  ['payCard','payExp','payCvc','payName'].forEach(id=>document.getElementById(id).value='');
  document.getElementById('payErr').textContent='';
  const m=document.getElementById('payModal');m.classList.add('open');document.body.style.overflow='hidden';
  setTimeout(()=>document.getElementById('payCard').focus(),60);
}
function closePay(){const m=document.getElementById('payModal');if(m&&m.classList.contains('open')){m.classList.remove('open');document.body.style.overflow='';}}
function fmtCard(el){el.value=el.value.replace(/\D/g,'').slice(0,19).replace(/(.{4})/g,'$1 ').trim();}
function fmtExp(el){let v=el.value.replace(/\D/g,'').slice(0,4);if(v.length>=3)v=v.slice(0,2)+'/'+v.slice(2);el.value=v;}
function payConfirm(e){
  e.preventDefault();
  const card=document.getElementById('payCard').value.replace(/\s/g,'');
  const exp=document.getElementById('payExp').value;
  const cvc=document.getElementById('payCvc').value.trim();
  const name=document.getElementById('payName').value.trim();
  const err=document.getElementById('payErr');err.textContent='';
  if(card.length<13||!/^\d+$/.test(card)){err.textContent='Zadejte platné číslo karty.';return false;}
  if(!/^\d{2}\/\d{2}$/.test(exp)){err.textContent='Zadejte platnost ve formátu MM/RR.';return false;}
  if(!/^\d{3,4}$/.test(cvc)){err.textContent='Zadejte CVC (3–4 číslice).';return false;}
  if(name.split(/\s+/).filter(Boolean).length<2){err.textContent='Zadejte jméno držitele karty.';return false;}
  const btn=document.getElementById('payBtn');const orig=btn.textContent;
  btn.disabled=true;btn.textContent='Zpracovávám platbu…';
  setTimeout(()=>{
    btn.disabled=false;btn.textContent=orig;
    closePay();
    setPlan('premium');
  },1100);
  return false;
}
/* odkaz „Ověření" — pečovatelku pošle na formulář, ostatní na přihlášení */
function goVerify(){
  if(auth.loggedIn&&auth.role==='caregiver')go('cg-verify');
  else{toast('🛡️ Přihlaste se jako pečovatelka a dokončete ověření.');go('login');}
}
const VER_BANNER={
  verified:{cls:'ok',ic:'✅',t:'Jste ověřená pečovatelka',s:'Váš profil je viditelný rodinám ve vyhledávání.'},
  submitted:{cls:'wait',ic:'⏳',t:'Žádost čeká na schválení',s:'Správce kontroluje vaše doklady, zpravidla do 48 hodin.'},
  rejected:{cls:'bad',ic:'⚠️',t:'Žádost byla zamítnuta',s:'Upravte prosím údaje a odešlete znovu.'},
  pending:{cls:'wait',ic:'📝',t:'Dokončete své ověření',s:'Vyplňte formulář a nahrejte osvědčení, abyste se zobrazili rodinám.'}
};
let verifyDocName='';
let verifySelfieName='';
let verifyDocData='';
let verifySelfieData='';
let verifyIdFrontName='';
let verifyIdFrontData='';
let verifyIdBackName='';
let verifyIdBackData='';
/* obsah nahraných souborů (data URL) — v paměti, klíč `${verId}:doc` / `:selfie` */
const DOC_BLOBS={};
function withWebpName(name){
  const raw=String(name||'obrazek').trim()||'obrazek';
  const base=raw.replace(/\.[^.]+$/,'');
  return `${base}.webp`;
}
/* načte soubor jako data URL; obrázky zmenší kvůli velikosti */
function readVerifyFile(file,cb){
  if(file.type&&file.type.startsWith('image/')){
    const r=new FileReader();
    r.onload=function(){const img=new Image();img.onload=function(){
      const max=1400;let w=img.width,h=img.height;
      if(w>h){if(w>max){h=Math.round(h*max/w);w=max;}}else{if(h>max){w=Math.round(w*max/h);h=max;}}
      const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
      cb({name:withWebpName(file.name),data:c.toDataURL('image/webp',0.82)});
    };img.src=r.result;};
    r.readAsDataURL(file);
  }else{const r=new FileReader();r.onload=function(){cb({name:file.name,data:r.result});};r.readAsDataURL(file);}
}

/* ---- formulář ověření (pečovatelka) ---- */
function renderCgVerify(){
  const st=cgStatus();
  let b=VER_BANNER[st]||VER_BANNER.pending;
  if(st==='verified'&&cgPlan()==='premium')b={cls:'ok',ic:diamondSVG(30,'#13A552'),t:'Premium ověřená pečovatelka',s:'Máte odznak Premium a vyšší zobrazení ve vyhledávání.'};
  const rej=VERIFICATIONS.filter(v=>v.email===auth.email&&v.status==='rejected').slice(-1)[0];
  const reason=(st==='rejected'&&rej&&rej.reason)?` Důvod: ${rej.reason}`:'';
  document.getElementById('cgVerifyBanner').innerHTML=
    `<div class="verify-banner ${b.cls}"><span class="vb-ic">${b.ic}</span><div class="vb-t"><b>${b.t}</b><span>${b.s}${reason}</span></div></div>`;
  // prefill
  const setv=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val;};
  setv('vfName',auth.name||cgProfile.name);
  setv('vfLoc',cgProfile.loc||'Praha 6');
  document.getElementById('vfDocText').innerHTML='<b>Nahrát soubor</b> — PDF, Word, obrázek nebo sken dokladu';
  document.getElementById('vfSelfieText').innerHTML='<b>Nahrát selfie</b> — potvrzení, že s registrací souhlasíte';
  document.getElementById('vfIdFrontText').innerHTML='<b>Přední strana</b> — foto nebo sken';
  document.getElementById('vfIdBackText').innerHTML='<b>Zadní strana</b> — foto nebo sken';
  verifyDocName='';verifySelfieName='';verifyDocData='';verifySelfieData='';
  verifyIdFrontName='';verifyIdFrontData='';verifyIdBackName='';verifyIdBackData='';
  const form=document.getElementById('cgVerifyForm');
  const btn=document.getElementById('vfSubmitBtn');
  const locked=(st==='verified'||st==='submitted');
  form.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=locked);
  if(btn){btn.disabled=locked;btn.textContent=st==='rejected'?'Odeslat znovu':'Odeslat k ověření';}
  document.getElementById('vfErr').textContent='';
  ddRefresh();
}
function onVerifyDoc(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifyDocName=f.name;verifyDocData='';
  document.getElementById('vfDocText').innerHTML=`📎 <b>${esc(f.name)}</b> — připraveno k odeslání`;
  readVerifyFile(f,res=>{verifyDocName=res.name;verifyDocData=res.data;document.getElementById('vfDocText').innerHTML=`📎 <b>${esc(res.name)}</b> — připraveno k odeslání`;});
}
function onVerifySelfie(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifySelfieName=f.name;verifySelfieData='';
  document.getElementById('vfSelfieText').innerHTML=`🤳 <b>${esc(f.name)}</b> — selfie připraveno`;
  readVerifyFile(f,res=>{verifySelfieName=res.name;verifySelfieData=res.data;document.getElementById('vfSelfieText').innerHTML=`🤳 <b>${esc(res.name)}</b> — selfie připraveno`;});
}
function onVerifyIdFront(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifyIdFrontName=f.name;verifyIdFrontData='';
  document.getElementById('vfIdFrontText').innerHTML=`🪪 <b>${esc(f.name)}</b>`;
  readVerifyFile(f,res=>{verifyIdFrontName=res.name;verifyIdFrontData=res.data;document.getElementById('vfIdFrontText').innerHTML=`🪪 <b>${esc(res.name)}</b>`;});
}
function onVerifyIdBack(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifyIdBackName=f.name;verifyIdBackData='';
  document.getElementById('vfIdBackText').innerHTML=`🪪 <b>${esc(f.name)}</b>`;
  readVerifyFile(f,res=>{verifyIdBackName=res.name;verifyIdBackData=res.data;document.getElementById('vfIdBackText').innerHTML=`🪪 <b>${esc(res.name)}</b>`;});
}
function submitVerify(e){
  e.preventDefault();
  const g=id=>document.getElementById(id).value.trim();
  const err=document.getElementById('vfErr');err.textContent='';
  const name=g('vfName'),phone=g('vfPhone'),docNum=g('vfDocNum'),cert=g('vfCert'),issuer=g('vfIssuer');
  if(name.split(/\s+/).filter(Boolean).length<2){err.textContent='Zadejte celé jméno a příjmení.';return false;}
  if(!isPhone(phone)){err.textContent='Zadejte platné telefonní číslo.';return false;}
  if(!docNum){err.textContent='Zadejte číslo dokladu totožnosti.';return false;}
  if(!verifyIdFrontName){err.textContent='Nahrajte prosím přední stranu dokladu totožnosti.';return false;}
  if(!verifyIdBackName){err.textContent='Nahrajte prosím zadní stranu dokladu totožnosti.';return false;}
  if(!verifySelfieName){err.textContent='Nahrajte prosím selfie pro ověření totožnosti.';return false;}
  if(!cert){err.textContent='Uveďte název osvědčení nebo kurzu.';return false;}
  if(!issuer){err.textContent='Uveďte, kdo osvědčení vystavil.';return false;}
  if(!verifyDocName){err.textContent='Nahrajte prosím doklad (osvědčení nebo diplom).';return false;}
  if(!document.getElementById('vfRules').checked){err.textContent='Potvrďte prosím pravdivost údajů a souhlas s pravidly.';return false;}
  // kontrola duplicity účtu (demo): stejný e-mail už nesmí mít čekající žádost
  if(VERIFICATIONS.some(v=>v.email===auth.email&&v.status==='submitted')){err.textContent='Už máte žádost čekající na schválení.';return false;}
  const rec={
    id:++verSeq,name,email:auth.email,init:initials(name),loc:g('vfLoc'),
    rate:+g('vfRate')||240,exp:+g('vfExp')||0,phone,
    docType:document.getElementById('vfDocType').value==='pas'?'Cestovní pas':'Občanský průkaz',docNum,
    idFront:verifyIdFrontName,idBack:verifyIdBackName,selfie:verifySelfieName,
    services:cgProfile.services.slice(),cert,issuer,validUntil:g('vfValid')||'—',
    fileName:verifyDocName,refs:g('vfRefs'),note:g('vfNote'),bio:cgProfile.bio,
    status:'submitted',date:new Date().toISOString().slice(0,10)
  };
  VERIFICATIONS.unshift(rec);
  if(verifyDocData)DOC_BLOBS[rec.id+':doc']=verifyDocData;
  if(verifySelfieData)DOC_BLOBS[rec.id+':selfie']=verifySelfieData;
  if(verifyIdFrontData)DOC_BLOBS[rec.id+':idfront']=verifyIdFrontData;
  if(verifyIdBackData)DOC_BLOBS[rec.id+':idback']=verifyIdBackData;
  cgStatusMap[auth.email]='submitted';
  apiSync(api('/verifications',{method:'POST',body:rec}).then(r=>{if(r&&r.verification)rec.id=r.verification.id;}));
  verifyDocName='';verifySelfieName='';verifyDocData='';verifySelfieData='';
  verifyIdFrontName='';verifyIdFrontData='';verifyIdBackName='';verifyIdBackData='';
  persist();
  toast('🛡️ Žádost odeslána správci k ověření.');
  renderCgVerify();renderNav();
  return false;
}

/* ---- ADMIN: dashboard ---- */
function renderAdminDash(){
  setAva(document.getElementById('admDashAva'),null,initials(auth.name||'Správce systému'));
  const pend=pendingVerCount();
  const verified=CAREGIVERS.filter(c=>c.verified&&!c.suspended).length;
  document.getElementById('admIntro').textContent=pend
    ?`Čeká na vás ${pend} ${pend===1?'žádost':(pend<5?'žádosti':'žádostí')} o ověření.`
    :'Žádné čekající žádosti o ověření.';
  const stats=[
    {ic:'M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z',v:pend,l:'Čeká na ověření'},
    {ic:'M20 6 9 17l-5-5',v:verified,l:'Ověřené pečovatelky'},
    {ic:'M9 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20c0-3.5 3-6 6-6s6 2.5 6 6',v:USERS.length,l:'Registrované rodiny'},
    {ic:'M4 5h16v15H4zM8 2v4M16 2v4M4 9h16',v:ORDERS.length,l:'Objednávek celkem'}
  ];
  document.getElementById('admStats').innerHTML=stats.map(s=>`
    <div class="stat"><div class="stat-top"><span class="sl">${s.l}</span><div class="si">${sIcon(s.ic)}</div></div><div class="sv">${s.v}</div></div>`).join('');
  document.getElementById('admPendBadge').textContent=pend;
  const q=VERIFICATIONS.filter(v=>v.status==='submitted');
  document.getElementById('admPendPreview').innerHTML=q.length
    ?q.slice(0,4).map(v=>`
      <div class="req">
        <div class="ava">${v.init}</div>
        <div class="ri"><b>${esc(v.name)}</b><div class="rd">${esc(v.loc)} · ${v.exp} let praxe · ${fmtDate(v.date)}</div><span class="rs">${esc(v.cert)}</span></div>
        <div class="req-actions"><button class="btn btn-sm btn-gold" onclick="go('admin-verify')">Zkontrolovat</button></div>
      </div>`).join('')
    :'<div class="empty">Žádné čekající žádosti.</div>';
}

/* ---- ADMIN: fronta ověření ---- */
function verBadge(st){
  return st==='approved'?'<span class="badge ok">Schváleno</span>'
    :st==='rejected'?'<span class="badge bad">Zamítnuto</span>'
    :'<span class="badge wait">Čeká</span>';
}
function renderAdminVerify(){
  const q=VERIFICATIONS.filter(v=>v.status==='submitted');
  const done=VERIFICATIONS.filter(v=>v.status!=='submitted');
  document.getElementById('admVerCount').textContent=q.length;
  document.getElementById('admVerQueue').innerHTML=q.length?q.map(v=>`
    <div class="req" style="align-items:flex-start">
      <div class="ava">${v.init}</div>
      <div class="ri">
        <b>${esc(v.name)}</b>
        <div class="rd">${esc(v.loc)} · sazba ${v.rate} Kč/hod · ${v.exp} let praxe</div>
        <div class="rd" style="margin-top:6px"><b style="color:var(--navy-800)">🛡️ Identita:</b> ${esc(v.docType||'—')}${v.docNum?` č. ${esc(v.docNum)}`:''}${v.phone?` · ☎ ${esc(v.phone)}`:''}${v.idFront?` · <a role="button" tabindex="0" class="doc-link" onclick="downloadVer(${v.id},'idfront')">🪪 přední ⬇</a>`:''}${v.idBack?` · <a role="button" tabindex="0" class="doc-link" onclick="downloadVer(${v.id},'idback')">🪪 zadní ⬇</a>`:''}${v.selfie?` · <a role="button" tabindex="0" class="doc-link" onclick="downloadVer(${v.id},'selfie')">🤳 selfie ⬇</a>`:''}</div>
        <div class="rd"><b style="color:var(--navy-800)">🎓 Osvědčení:</b> ${esc(v.cert)} — ${esc(v.issuer)} (platnost ${esc(v.validUntil)})</div>
        <div class="rd"><b style="color:var(--navy-800)">Doklad:</b> <a role="button" tabindex="0" class="doc-link" onclick="downloadVer(${v.id},'doc')">${docIcon(v.fileName)} ${esc(v.fileName)} ⬇</a> · <b style="color:var(--navy-800)">Služby:</b> ${v.services.map(sName2).join(', ')}</div>
        ${v.refs?`<div class="rd"><b style="color:var(--navy-800)">Reference:</b> ${esc(v.refs)}</div>`:''}
        ${v.note?`<div class="rd" style="margin-top:6px;font-style:italic">„${esc(v.note)}"</div>`:''}
        <span class="rs">Podáno ${fmtDate(v.date)}</span>
      </div>
      <div class="req-actions">
        <button class="btn btn-sm btn-ghost" onclick="downloadWithFx(this,()=>downloadDossier(${v.id}))"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 19h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>Stáhnout .zip</button>
        <button class="btn btn-sm btn-gold" onclick="approveVerification(${v.id})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 5 5 9-11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Schválit</button>
        <button class="btn btn-sm btn-decline" onclick="rejectVerification(${v.id})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>Zamítnout</button>
      </div>
    </div>`).join(''):'<div class="empty">Žádné čekající žádosti. 🎉</div>';
  document.getElementById('admVerDone').innerHTML=done.length?`
    <table class="adm-table"><thead><tr><th>Pečovatelka</th><th>Osvědčení</th><th>Datum</th><th style="text-align:right">Výsledek</th></tr></thead><tbody>
    ${done.slice().reverse().map(v=>`<tr>
      <td><div class="u-cell"><div class="ava">${esc(v.init)}</div><div><b>${esc(v.name)}</b><span>${esc(v.loc)}</span></div></div></td>
      <td>${v.cert}</td><td>${fmtDate(v.date)}</td>
      <td style="text-align:right">${verBadge(v.status)}${v.status==='rejected'&&v.reason?`<div class="rd" style="margin-top:4px">${v.reason}</div>`:''}</td>
    </tr>`).join('')}</tbody></table>`:'<div class="empty">Zatím žádné zpracované žádosti.</div>';
}
/* ====== ZIP + XLSX generátor (bez knihoven, offline) ====== */
const CRC_TABLE=(()=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=CRC_TABLE[(c^buf[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function concatBytes(arrs){let len=arrs.reduce((s,a)=>s+a.length,0),out=new Uint8Array(len),o=0;arrs.forEach(a=>{out.set(a,o);o+=a.length;});return out;}
function dataURLtoBytes(d){const b64=d.slice(d.indexOf(',')+1);const bin=atob(b64);const u=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)u[j]=bin.charCodeAt(j);return u;}
/* ZIP se „store" metodou (bez komprese); files=[{name,data:Uint8Array}] -> Uint8Array */
function zipStore(files){
  const enc=new TextEncoder();const chunks=[],central=[];let offset=0;
  files.forEach(f=>{
    const nb=enc.encode(f.name),data=f.data,crc=crc32(data);
    const lh=new Uint8Array(30+nb.length),dv=new DataView(lh.buffer);
    dv.setUint32(0,0x04034b50,true);dv.setUint16(4,20,true);dv.setUint16(6,0x0800,true);
    dv.setUint16(8,0,true);dv.setUint16(10,0,true);dv.setUint16(12,0,true);
    dv.setUint32(14,crc,true);dv.setUint32(18,data.length,true);dv.setUint32(22,data.length,true);
    dv.setUint16(26,nb.length,true);dv.setUint16(28,0,true);lh.set(nb,30);
    chunks.push(lh,data);
    const cd=new Uint8Array(46+nb.length),cv=new DataView(cd.buffer);
    cv.setUint32(0,0x02014b50,true);cv.setUint16(4,20,true);cv.setUint16(6,20,true);
    cv.setUint16(8,0x0800,true);cv.setUint16(10,0,true);cv.setUint16(12,0,true);cv.setUint16(14,0,true);
    cv.setUint32(16,crc,true);cv.setUint32(20,data.length,true);cv.setUint32(24,data.length,true);
    cv.setUint16(28,nb.length,true);cv.setUint32(42,offset,true);cd.set(nb,46);
    central.push(cd);offset+=lh.length+data.length;
  });
  const cs=central.reduce((s,c)=>s+c.length,0);
  const end=new Uint8Array(22),ev=new DataView(end.buffer);
  ev.setUint32(0,0x06054b50,true);ev.setUint16(8,files.length,true);ev.setUint16(10,files.length,true);
  ev.setUint32(12,cs,true);ev.setUint32(16,offset,true);
  return concatBytes([...chunks,...central,end]);
}
/* minimální .xlsx z řádků (pole polí) -> Uint8Array */
function xlsxFromRows(rows){
  const esc=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const col=i=>{let s='';i++;while(i>0){const m=(i-1)%26;s=String.fromCharCode(65+m)+s;i=Math.floor((i-1)/26);}return s;};
  const body=rows.map((r,ri)=>`<row r="${ri+1}">${r.map((c,ci)=>`<c r="${col(ci)}${ri+1}" t="inlineStr"><is><t xml:space="preserve">${esc(c)}</t></is></c>`).join('')}</row>`).join('');
  const sheet=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><cols><col min="1" max="1" width="22" customWidth="1"/><col min="2" max="2" width="60" customWidth="1"/></cols><sheetData>${body}</sheetData></worksheet>`;
  const wb=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="Žádost" sheetId="1" r:id="rId1"/></sheets></workbook>`;
  const wbr=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>`;
  const rels=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`;
  const ct=`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>`;
  const enc=new TextEncoder();
  return zipStore([
    {name:'[Content_Types].xml',data:enc.encode(ct)},
    {name:'_rels/.rels',data:enc.encode(rels)},
    {name:'xl/workbook.xml',data:enc.encode(wb)},
    {name:'xl/_rels/workbook.xml.rels',data:enc.encode(wbr)},
    {name:'xl/worksheets/sheet1.xml',data:enc.encode(sheet)}
  ]);
}
function slug(s){return (s||'zadost').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-zA-Z0-9]+/g,'-').replace(/^-|-$/g,'').toLowerCase();}
/* plnicí efekt tlačítka → akce (např. přesměrování) */
function fillThen(btn,fn,delay){
  if(!btn||btn.classList.contains('dl-busy'))return;
  btn.disabled=true;btn.classList.add('dl-busy');
  setTimeout(function(){btn.classList.remove('dl-busy');btn.disabled=false;if(fn)fn();},delay||950);
}
/* progress lišta pod nav odkazem → poté spustí akci */
function navProgress(el,fn,delay){
  if(!el||el.classList.contains('nav-busy'))return;
  el.classList.add('nav-busy');
  setTimeout(function(){el.classList.remove('nav-busy');if(fn)fn();},delay||850);
}
/* ---------- INTERAKTIVNÍ PRŮVODCE („Proveďte mě") ---------- */
/* otevře profil první nalezené pečovatelky (pro krok průvodce) */
function tourFirstCgId(){
  const card=document.querySelector('#careGrid .care-card[onclick]');
  if(!card)return null;
  const m=/openProfile\((\d+)\)/.exec(card.getAttribute('onclick')||'');
  return m?+m[1]:null;
}
function tourOpenFirstProfile(){const id=tourFirstCgId();if(id!=null)openProfile(id);else go('search');}
const TOUR_STEPS=[
  {view:'home',sel:'#navCta',
   title:'1. Najděte pomoc',
   text:'Začneme tady. Tohle žluté tlačítko „Najít pečovatelku" otevře seznam pečovatelek. Klikněte na „Další" a ukážu vám to.'},
  {view:'search',sel:'#q',
   title:'2. Co hledáte?',
   text:'Sem můžete napsat své město nebo druh péče. Nemusíte ale psát nic — i tak uvidíte všechny pečovatelky ve svém okolí.'},
  {view:'search',sel:'#careGrid .care-card',
   title:'3. Prohlédněte si pečovatelky',
   text:'Tady jsou pečovatelky. U každé je fotka, hvězdičky (jak jsou s ní rodiny spokojené) a cena za hodinu.'},
  {view:'search',sel:'#careGrid .care-card .btn-gold',
   title:'4. Otevřete profil',
   text:'Až se vám některá zalíbí, klikněte na žluté tlačítko „Zobrazit profil". Ukážu vám, jak vypadá.'},
  {action:tourOpenFirstProfile,sel:'#view-profile .book-aside .btn-gold',
   title:'5. Objednejte péči',
   text:'Tady je vše o pečovatelce — zkušenosti, recenze i ceny. Až budete chtít, kliknete na žluté tlačítko „Objednat službu".'},
  {sel:null,
   title:'6. Rychlá registrace',
   text:'Před první objednávkou vás požádáme o krátkou bezplatnou registraci — stačí jméno, e-mail a heslo. Je to kvůli vašemu bezpečí. Potom se vrátíte rovnou k objednávce.'},
  {sel:null,
   title:'A to je vše! 😊',
   text:'Nakonec už jen vyberete den a čas a kliknete na „Rezervovat". S pečovatelkou si můžete kdykoli napsat přes „Zprávy" a všechny termíny najdete v „Moje objednávky". Průvodce si můžete kdykoli pustit znovu.'}
];
/* kroky průvodce pro pečovatelky */
const TOUR_STEPS_CG=[
  {action:function(){go('register');pickRole('caregiver');},sel:'#role-caregiver',
   title:'1. Zvolte „Pečovatelka"',
   text:'Při registraci nahoře vyberte „Pečovatelka". Tím si založíte účet pro poskytování péče. Registrace je zdarma.'},
  {sel:'#registerForm',
   title:'2. Vyplňte své údaje',
   text:'Zadejte jméno, e-mail, telefon a heslo. Zabere to jen chvilku a hned můžete pokračovat.'},
  {sel:null,
   title:'3. Ověření totožnosti',
   text:'Po registraci nahrajete doklad totožnosti a případně certifikát. Náš tým vás ověří — ověřené pečovatelky mají u profilu odznak důvěry a vidí je více rodin.'},
  {sel:null,
   title:'4. Nabídka a kalendář',
   text:'Ve svém profilu nastavíte, jaké služby nabízíte a za kolik. V kalendáři jednoduše označíte, kdy máte volno.'},
  {sel:null,
   title:'A můžete pomáhat! 😊',
   text:'Rodiny vás samy osloví, vy jen potvrdíte termín. Platby probíhají bezpečně přes aplikaci. Průvodce si můžete kdykoli pustit znovu.'}
];
let tourIdx=-1;
let tourSteps=TOUR_STEPS;
function tourClearSpot(){document.querySelectorAll('.tour-spot').forEach(e=>e.classList.remove('tour-spot'));}
function tourEnd(){
  tourClearSpot();
  const b=document.getElementById('tourBox');if(b)b.remove();
  tourIdx=-1;
}
function tourStart(steps){tourSteps=steps||TOUR_STEPS;tourIdx=-1;tourGoto(0);}
function tourGoto(i){
  tourClearSpot();
  if(i<0||i>=tourSteps.length){tourEnd();return;}
  tourIdx=i;
  const s=tourSteps[i];
  if(s.action)s.action();
  else if(s.view)go(s.view);
  const wait=(s.action||s.view)?320:80;
  setTimeout(function(){
    let el=s.sel?document.querySelector(s.sel):null;
    if(el){el.classList.add('tour-spot');el.scrollIntoView({behavior:'smooth',block:'center'});}
    tourRenderBox(s,i);
  },wait);
}
function tourRenderBox(s,i){
  let box=document.getElementById('tourBox');
  if(!box){box=document.createElement('div');box.id='tourBox';box.className='tour-box';box.setAttribute('role','dialog');box.setAttribute('aria-live','polite');document.body.appendChild(box);}
  const last=i===tourSteps.length-1;
  const first=i===0;
  box.innerHTML=
    '<div class="tb-step">Krok '+(i+1)+' z '+tourSteps.length+'</div>'+
    '<h4>'+s.title+'</h4>'+
    '<p>'+s.text+'</p>'+
    '<div class="tb-actions">'+
      '<button class="tb-skip" onclick="tourEnd()">Ukončit průvodce</button>'+
      '<div class="right">'+
        (first?'':'<button class="btn btn-ghost" onclick="tourGoto('+(i-1)+')">Zpět</button>')+
        '<button class="btn btn-gold" onclick="'+(last?'tourEnd()':'tourGoto('+(i+1)+')')+'">'+(last?'Hotovo':'Další')+'</button>'+
      '</div>'+
    '</div>';
}
/* přepínač na stránce „Jak to funguje" (rodiny / pečovatelky) */
function howtoTab(which){
  const fam=which==='family';
  document.getElementById('htTabFamily').classList.toggle('on',fam);
  document.getElementById('htTabCaregiver').classList.toggle('on',!fam);
  document.getElementById('htTabFamily').setAttribute('aria-selected',fam);
  document.getElementById('htTabCaregiver').setAttribute('aria-selected',!fam);
  document.getElementById('htPaneFamily').classList.toggle('on',fam);
  document.getElementById('htPaneCaregiver').classList.toggle('on',!fam);
}
/* plnicí efekt tlačítka → stažení → „✓ Staženo" → návrat */
function downloadWithFx(btn,fn){
  if(!btn){fn();return;}
  if(btn.classList.contains('dl-busy')||btn.classList.contains('dl-done'))return;
  const orig=btn.innerHTML;
  btn.disabled=true;btn.classList.add('dl-busy');
  setTimeout(()=>{
    try{fn();}catch(e){}
    btn.classList.remove('dl-busy');btn.classList.add('dl-done');
    btn.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 5 5 9-11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Staženo';
    setTimeout(()=>{btn.classList.remove('dl-done');btn.innerHTML=orig;btn.disabled=false;},1700);
  },950);
}
/* stáhne ZIP složku: Excel s údaji + přiložené soubory (doklad, selfie) */
function downloadDossier(id){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  const enc=new TextEncoder();
  const rows=[
    ['ZENVORIA — žádost o ověření pečovatelky',''],
    ['',''],
    ['Jméno',v.name],['E-mail',v.email],['Telefon',v.phone||''],
    ['Lokalita',v.loc],['Hodinová sazba (Kč)',String(v.rate)],['Praxe (let)',String(v.exp)],
    ['Doklad totožnosti',(v.docType||'')+(v.docNum?' č. '+v.docNum:'')],['Doklad přední (soubor)',v.idFront||''],['Doklad zadní (soubor)',v.idBack||''],['Selfie (soubor)',v.selfie||''],
    ['Osvědčení',v.cert||''],['Vystavil',v.issuer||''],['Platnost do',v.validUntil||''],
    ['Doklad (soubor)',v.fileName||''],['Služby',(v.services||[]).map(sName2).join(', ')],
    ['Reference',v.refs||''],['Poznámka',v.note||''],
    ['Podáno',v.date||''],['Stav',v.status||'']
  ];
  const files=[{name:'udaje.xlsx',data:xlsxFromRows(rows)}];
  // přílohy do podsložky "prilohy/"
  [['doc',v.fileName],['idfront',v.idFront],['idback',v.idBack],['selfie',v.selfie]].forEach(([k,nm])=>{
    if(!nm&&!DOC_BLOBS[id+':'+k])return;
    const blob=DOC_BLOBS[id+':'+k];
    if(blob){files.push({name:'prilohy/'+(nm||k),data:dataURLtoBytes(blob)});}
    else{
      const txt=`Zástupný soubor (demo).\nPůvodní příloha: ${nm||k}\nPečovatelka: ${v.name}\n\n`+
        `Skutečný soubor nahrála pečovatelka ve svém prohlížeči; po obnovení stránky nebo u demo žádosti se generuje tento placeholder.`;
      const base=(nm?nm.replace(/\.[^.]+$/,''):k);
      files.push({name:'prilohy/'+base+'.txt',data:enc.encode(txt)});
    }
  });
  const zip=zipStore(files);
  const blob=new Blob([zip],{type:'application/zip'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='overeni-'+slug(v.name)+'.zip';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  toast('⬇️ Stahuji složku '+a.download);
}
/* ikona podle přípony souboru */
function docIcon(name){
  const e=(name||'').toLowerCase().split('.').pop();
  if(['jpg','jpeg','png','gif','webp','heic','bmp'].includes(e))return '🖼️';
  if(e==='pdf')return '📕';
  if(['doc','docx','odt','rtf'].includes(e))return '📝';
  if(e==='txt')return '📄';
  return '📎';
}
/* stažení nahraného dokladu / selfie pro kontrolu adminem */
function downloadVer(id,which){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  const name=which==='selfie'?v.selfie:(which==='idfront'?v.idFront:(which==='idback'?v.idBack:v.fileName));
  const data=DOC_BLOBS[id+':'+which];
  let href,fname=name||(which+'.txt');
  if(data){href=data;}
  else{
    const txt=`ZENVORIA — ukázkový doklad (demo)\n\n`+
      `Pečovatelka: ${v.name}\nE-mail: ${v.email}\nTelefon: ${v.phone||'—'}\n`+
      `Typ souboru: ${which==='selfie'?'Selfie pro ověření identity':'Doklad / osvědčení'}\n`+
      `Název: ${name||'—'}\nDoklad totožnosti: ${v.docType||'—'} č. ${v.docNum||'—'}\n\n`+
      `Pozn.: Skutečný soubor nahrála pečovatelka ve svém prohlížeči. Tento zástupný soubor `+
      `se generuje u demo žádostí nebo po obnovení stránky.`;
    href='data:text/plain;charset=utf-8,'+encodeURIComponent(txt);
    fname=(name?name.replace(/\.[^.]+$/,''):'demo-doklad')+'.txt';
  }
  const a=document.createElement('a');a.href=href;a.download=fname;
  document.body.appendChild(a);a.click();a.remove();
  toast('⬇️ Stahuji '+fname);
}
function approveVerification(id){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  v.status='approved';
  // přidat (nebo aktualizovat) pečovatelku ve veřejném seznamu
  let c=CAREGIVERS.find(x=>x.email===v.email);
  if(c){c.verified=true;c.suspended=false;c.status='verified';c.idVerified=true;}
  else{
    CAREGIVERS.push({id:++cgSeq,name:v.name,email:v.email,init:v.init,loc:v.loc,rate:v.rate,
      rating:5.0,reviews:0,exp:v.exp,services:v.services.slice(),verified:true,cert:true,idVerified:true,
      suspended:false,status:'verified',plan:cgPlanMap[v.email]||'start',langs:['Čeština'],
      priceType:'hod',dayRate:v.rate*8,radius:10,kmPrice:0,bio:v.bio||''});
  }
  cgStatusMap[v.email]='verified';
  apiSync(api('/verifications/'+id+'/approve',{method:'POST'}).then(()=>bootstrap()).then(()=>{renderAdminVerify();renderNav();renderCare();}));
  renderAdminVerify();renderNav();renderCare();
  toast(`✅ ${esc(v.name)} byla ověřena a zveřejněna.`);
}
function rejectVerification(id){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  const reason=prompt('Důvod zamítnutí (uvidí ho pečovatelka):','Nečitelné nebo neplatné osvědčení.');
  if(reason===null)return;
  v.status='rejected';v.reason=reason.trim()||'Bez uvedení důvodu.';
  cgStatusMap[v.email]='rejected';
  apiSync(api('/verifications/'+id+'/reject',{method:'POST'}));
  renderAdminVerify();renderNav();
  toast(`⚠️ Žádost ${esc(v.name)} byla zamítnuta.`);
}

/* ---- ADMIN: pečovatelky ---- */
function renderAdminCaregivers(){
  document.getElementById('admCgCount').textContent=CAREGIVERS.length;
  document.getElementById('admCgBody').innerHTML=CAREGIVERS.map(c=>{
    const badge=c.suspended?'<span class="badge off">Pozastavena</span>':(c.verified?'<span class="badge gold">✓ Ověřená</span>':'<span class="badge wait">Neověřená</span>');
    return `<tr>
      <td><div class="u-cell">${avaHtml(c.init,c.photo)}<div><b>${esc(c.name)}</b><span>★ ${c.rating} · ${c.exp} let praxe</span></div></div></td>
      <td>${esc(c.loc)}</td><td>${c.rate} Kč</td><td>${badge}</td>
      <td><div class="adm-actions">
        <button class="btn btn-sm ${c.suspended?'btn-accept':'btn-decline'}" onclick="toggleSuspendCg(${c.id})">${c.suspended?'Obnovit':'Pozastavit'}</button>
        <button class="btn btn-sm btn-decline" onclick="removeCaregiver(${c.id})">Odebrat</button>
      </div></td>
    </tr>`;}).join('');
}
function toggleSuspendCg(id){
  const c=CAREGIVERS.find(x=>x.id===id);if(!c)return;
  const doIt=()=>{c.suspended=!c.suspended;
    apiSync(api('/caregivers/'+id,{method:'PATCH',body:{suspended:c.suspended}}));
    renderAdminCaregivers();renderCare();
    toast(c.suspended?`⏸️ ${esc(c.name)} pozastavena.`:`▶️ ${esc(c.name)} obnovena.`);};
  if(!c.suspended){
    askConfirm({title:'Pozastavit pečovatelku?',icon:'⏸️',
      message:`${esc(c.name)} se přestane zobrazovat rodinám, dokud ji znovu neobnovíte.`,
      confirmLabel:'Pozastavit',danger:true,onConfirm:doIt});
  }else doIt();
}
function removeCaregiver(id){
  const c=CAREGIVERS.find(x=>x.id===id);if(!c)return;
  askConfirm({title:'Odebrat pečovatelku?',icon:'🗑️',
    message:`Opravdu chcete odebrat pečovatelku ${esc(c.name)}? Tato akce je nevratná.`,
    confirmLabel:'Odebrat',danger:true,onConfirm:()=>{
      CAREGIVERS=CAREGIVERS.filter(x=>x.id!==id);
      if(c.email)cgStatusMap[c.email]='rejected';
      apiSync(api('/caregivers/'+id,{method:'DELETE'}));
      renderAdminCaregivers();renderCare();
      toast(`🗑️ ${esc(c.name)} odebrána.`);
    }});
}

/* ---- ADMIN: uživatelé (rodiny) ---- */
function renderAdminUsers(){
  document.getElementById('admUsrCount').textContent=USERS.length;
  document.getElementById('admUsrBody').innerHTML=USERS.map(u=>{
    const badge=u.status==='suspended'?'<span class="badge off">Pozastaven</span>':'<span class="badge ok">Aktivní</span>';
    return `<tr>
      <td><div class="u-cell"><div class="ava">${esc(u.init)}</div><div><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div></div></td>
      <td>${fmtDate(u.joined)}</td><td>${u.orders}</td><td>${badge}</td>
      <td><div class="adm-actions">
        <button class="btn btn-sm ${u.status==='suspended'?'btn-accept':'btn-decline'}" onclick="toggleSuspendUser(${u.id})">${u.status==='suspended'?'Obnovit':'Pozastavit'}</button>
        <button class="btn btn-sm btn-decline" onclick="removeUser(${u.id})">Odebrat</button>
      </div></td>
    </tr>`;}).join('');
}
function toggleSuspendUser(id){
  const u=USERS.find(x=>x.id===id);if(!u)return;
  const doIt=()=>{u.status=u.status==='suspended'?'active':'suspended';
    apiSync(api('/users/'+u.id,{method:'PATCH',body:{status:u.status}}));
    renderAdminUsers();
    toast(u.status==='suspended'?`⏸️ ${esc(u.name)} pozastaven.`:`▶️ ${esc(u.name)} obnoven.`);};
  if(u.status!=='suspended'){
    askConfirm({title:'Pozastavit uživatele?',icon:'⏸️',
      message:`Účet ${esc(u.name)} bude pozastaven, dokud ho znovu neobnovíte.`,
      confirmLabel:'Pozastavit',danger:true,onConfirm:doIt});
  }else doIt();
}
function removeUser(id){
  const u=USERS.find(x=>x.id===id);if(!u)return;
  askConfirm({title:'Odebrat uživatele?',icon:'🗑️',
    message:`Opravdu chcete odebrat uživatele ${esc(u.name)}? Tato akce je nevratná.`,
    confirmLabel:'Odebrat',danger:true,onConfirm:()=>{
      USERS=USERS.filter(x=>x.id!==id);
      apiSync(api('/users/'+id,{method:'DELETE'}));
      renderAdminUsers();
      toast(`🗑️ ${esc(u.name)} odebrán.`);
    }});
}

/* ---- ADMIN: objednávky ---- */
function renderAdminOrders(){
  document.getElementById('admOrdCount').textContent=ORDERS.length;
  document.getElementById('admOrdBody').innerHTML=ORDERS.slice().reverse().map(o=>{
    const c=cg(o.cid);const st=ORDER_STATUS[o.status]||{cls:'pending',label:o.status};
    const cls=st.cls==='ok'?'ok':(st.cls==='done'?'ok':(st.cls==='declined'?'bad':'wait'));
    return `<tr>
      <td><b>${sName(o.service)}</b><div class="rd" style="font-size:12px;color:var(--muted)">${o.hours} h</div></td>
      <td>${c?esc(c.name):'—'}</td>
      <td>${fmtDate(o.date)} · ${o.time}</td>
      <td><span class="badge ${cls}">${st.label}</span></td>
    </tr>`;}).join('');
}

async function renderAdminAudit(){
  const body=document.getElementById('admAuditBody');
  const count=document.getElementById('admAuditCount');
  body.innerHTML='<tr><td colspan="4" class="empty">Načítám audit logy…</td></tr>';
  count.textContent='…';
  try{
    const r=await api('/admin/audit-logs?limit=80');
    AUDIT_LOGS=r.logs||[];
    applyAdminAuditFilters();
  }catch(e){
    count.textContent='0';
    body.innerHTML=`<tr><td colspan="4" class="empty">Audit logy se nepodařilo načíst: ${esc(e.message||'neznámá chyba')}.</td></tr>`;
  }
}

function renderAdminAuditRows(list){
  const body=document.getElementById('admAuditBody');
  const count=document.getElementById('admAuditCount');
  FILTERED_AUDIT_LOGS=list;
  count.textContent=list.length;
  body.innerHTML=list.length?list.map(log=>{
    const actor=esc(log.actorEmail||log.actorId||'—');
    const target=esc([log.targetType,log.targetId].filter(Boolean).join(' · ')||'—');
    const meta=log.metadata&&typeof log.metadata==='object'
      ?Object.entries(log.metadata).slice(0,3).map(([k,v])=>`<span class="chip">${esc(k)}: ${esc(String(v))}</span>`).join('')
      :'';
    const statusCls=log.status==='success'?'ok':(log.status==='failed'?'bad':'wait');
    return `<tr>
      <td>
        <b>${esc(log.action)}</b>
        <div class="audit-meta">
          <span class="badge ${statusCls}">${log.status}</span>
          ${log.actorRole?`<span class="chip">${esc(log.actorRole)}</span>`:''}
        </div>
      </td>
      <td>
        <span class="mono">${actor}</span>
        ${log.ip?`<span class="small">IP: ${esc(log.ip)}</span>`:''}
      </td>
      <td>
        <span>${target}</span>
        ${meta?`<div class="audit-meta">${meta}</div>`:''}
      </td>
      <td>
        <b>${fmtDate(log.createdAt)}</b>
        <span class="small">${new Date(log.createdAt).toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</span>
      </td>
    </tr>`;
  }).join(''):'<tr><td colspan="4" class="empty">Žádné audit logy neodpovídají zvolenému filtru.</td></tr>';
}

function applyAdminAuditFilters(){
  const q=(document.getElementById('admAuditSearch')?.value||'').trim().toLowerCase();
  const status=(document.getElementById('admAuditStatus')?.value||'').trim().toLowerCase();
  const filtered=AUDIT_LOGS.filter(log=>{
    const hay=[log.action,log.actorEmail,log.actorId,log.targetType,log.targetId].filter(Boolean).join(' ').toLowerCase();
    if(q && !hay.includes(q)) return false;
    if(status && String(log.status||'').toLowerCase()!==status) return false;
    return true;
  });
  renderAdminAuditRows(filtered);
}

function exportAdminAuditCsv(){
  if(!FILTERED_AUDIT_LOGS.length){toast('Žádné audit logy k exportu.','info');return;}
  const esc=v=>`"${String(v==null?'':v).replace(/"/g,'""')}"`;
  const rows=[
    ['createdAt','action','status','actorEmail','actorId','actorRole','targetType','targetId','ip','metadata']
  ].concat(FILTERED_AUDIT_LOGS.map(log=>[
    log.createdAt,
    log.action,
    log.status,
    log.actorEmail||'',
    log.actorId||'',
    log.actorRole||'',
    log.targetType||'',
    log.targetId||'',
    log.ip||'',
    log.metadata?JSON.stringify(log.metadata):''
  ]));
  const csv=rows.map(row=>row.map(esc).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv;charset=utf-8;'});
  const url=URL.createObjectURL(blob);
  const a=document.createElement('a');
  const stamp=new Date().toISOString().slice(0,19).replace(/[:T]/g,'-');
  a.href=url;
  a.download=`zenvoria-audit-logs-${stamp}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  toast('⬇️ Audit logy byly exportovány do CSV.','success');
}

/* ---- ADMIN: ceny tarifů ---- */
function renderAdminPlans(){
  document.getElementById('apPremium').value=planPrices.premium;
  document.getElementById('apErr').textContent='';
  document.getElementById('adminPlanPreview').innerHTML=['start','premium'].map(k=>`
    <div class="row" style="display:flex;justify-content:space-between;padding:9px 0;font-size:14.5px;border-bottom:1px solid var(--line)">
      <span>${planIcon(k,15)} ${PLANS[k].name}</span>
      <b style="color:var(--navy-900)">${planPriceLabel(k)}</b>
    </div>`).join('');
  const premCount=Object.values(cgPlanMap).filter(p=>p==='premium').length;
  document.getElementById('apPremCount').textContent=premCount;
  document.getElementById('apRevenue').textContent=(premCount*planPrice('premium')).toLocaleString('cs-CZ')+' Kč';
}
function saveAdminPlans(e){
  e.preventDefault();
  const p=+document.getElementById('apPremium').value;
  const err=document.getElementById('apErr');err.textContent='';
  if(!(p>=0)){err.textContent='Zadejte platnou cenu.';return false;}
  planPrices.premium=p;planPrices.start=0;
  apiSync(api('/settings/planPrices',{method:'PUT',body:{value:planPrices}}));
  renderAdminPlans();
  toast('✓ Cena PREMIUM uložena.');
  return false;
}

/* ---- ADMIN: hromadné zprávy ---- */
function audienceLabel(b){
  if(b.audience==='all')return 'Všem';
  if(b.audience==='caregivers')return 'Všem pečovatelkám';
  if(b.audience==='families')return 'Všem rodinám';
  return `Vybraným (${(b.emails||[]).length})`;
}
function renderBcRecipients(){
  const wrap=document.getElementById('bcRecipients');
  const aud=document.getElementById('bcAudience').value;
  if(aud!=='specific'){wrap.innerHTML='';return;}
  const cgs=CAREGIVERS.filter(c=>c.email).map(c=>({email:c.email,name:c.name,role:'Pečovatelka'}));
  const fams=USERS.filter(u=>u.email).map(u=>({email:u.email,name:u.name,role:'Rodina'}));
  const all=[...cgs,...fams];
  wrap.innerHTML=`<div style="max-height:230px;overflow:auto;border:1px solid var(--line);border-radius:12px;padding:10px">
    ${all.map(p=>`<label class="set-row" style="padding:8px 4px;cursor:pointer">
      <span style="display:flex;align-items:center;gap:8px"><input type="checkbox" class="bc-rcpt" value="${esc(p.email)}"> <b style="font-weight:600;color:var(--navy-900)">${esc(p.name)}</b> <span style="color:var(--muted);font-size:12px">· ${esc(p.role)}</span></span>
    </label>`).join('')||'<div class="empty">Žádní příjemci.</div>'}
  </div>`;
}
function renderAdminBroadcast(){
  document.getElementById('bcText').value='';
  document.getElementById('bcErr').textContent='';
  renderBcRecipients();
  const list=BROADCASTS.slice().reverse();
  document.getElementById('bcSentCount').textContent=BROADCASTS.length;
  document.getElementById('bcSentList').innerHTML=list.length?list.map(b=>`
    <div class="req" style="align-items:flex-start">
      <div class="ava">ZV</div>
      <div class="ri"><b>${audienceLabel(b)}</b><div class="rd" style="margin-top:4px">${esc(b.text)}</div><span class="rs">${fmtDate(b.date)} · ${esc(b.t)}</span></div>
    </div>`).join(''):'<div class="empty">Zatím jste neodeslali žádnou zprávu.</div>';
}
function sendBroadcast(e){
  e.preventDefault();
  const aud=document.getElementById('bcAudience').value;
  const text=document.getElementById('bcText').value.trim();
  const err=document.getElementById('bcErr');err.textContent='';
  if(!text){err.textContent='Napište prosím text zprávy.';return false;}
  let emails=[];
  if(aud==='specific'){
    emails=Array.from(document.querySelectorAll('.bc-rcpt:checked')).map(el=>el.value);
    if(!emails.length){err.textContent='Vyberte alespoň jednoho příjemce.';return false;}
  }
  const draft={id:++bcSeq,audience:aud,emails,text,date:new Date().toISOString().slice(0,10),t:chatNow()};
  BROADCASTS.push(draft);
  apiSync(api('/broadcasts',{method:'POST',body:{audience:aud,emails,text,t:draft.t}}).then(r=>{
    if(r&&r.broadcast){
      const i=BROADCASTS.findIndex(b=>b.id===draft.id);
      if(i>=0)BROADCASTS[i]=r.broadcast;
      bcSeq=Math.max(bcSeq,r.broadcast.id||0);
      renderAdminBroadcast();
    }
  }));
  renderAdminBroadcast();
  const n=aud==='specific'?emails.length:(aud==='caregivers'?'pečovatelkám':(aud==='families'?'rodinám':'všem'));
  toast(`✉️ Zpráva odeslána ${aud==='specific'?n+' příjemcům':n}.`);
  return false;
}

/* ---------- CAREGIVER PORTAL ---------- */
const cgProfile={
  name:'',loc:'',rate:0,exp:0,rating:0,reviews:0,photo:null,
  priceType:'hod',dayRate:0,radius:0,kmPrice:0,
  services:[],
  bio:''
};
let CG_REQUESTS=[];
let reqSeq=0;
let AUDIT_LOGS=[];
let FILTERED_AUDIT_LOGS=[];
let CG_SCHEDULE=[];
const DAYS_CZ=['Pondělí','Úterý','Středa','Čtvrtek','Pátek','Sobota','Neděle'];
let cgAvail=[true,true,true,true,true,false,false];
/* časové sloty dostupnosti pro každý den: ranní 08–12, odpolední 12–18, večerní 18–22 */
const TIME_SLOTS=[{k:'r',l:'08–12'},{k:'o',l:'12–18'},{k:'v',l:'18–22'}];
let cgSlots=[0,1,2,3,4,5,6].map(i=>({r:cgAvail[i],o:cgAvail[i],v:i<5}));

function cgFirstName(){return (auth.role==='caregiver'&&auth.name)?auth.name:cgProfile.name;}
function fmtDate(iso){return new Date(iso).toLocaleDateString('cs-CZ',{day:'numeric',month:'long',year:'numeric'});}
function timeRange(start,hours){
  const [h,m]=start.split(':').map(Number);const end=new Date(2000,0,1,h+hours,m);const pad=n=>String(n).padStart(2,'0');
  return `${start} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
}

function renderCgDashboard(){
  if(auth.role==='caregiver'&&auth.name)cgProfile.name=auth.name;
  const st=cgStatus();const notice=document.getElementById('cgVerifyNotice');
  if(notice){
    if(st==='verified'){notice.innerHTML='';}
    else{const b=VER_BANNER[st]||VER_BANNER.pending;
      notice.innerHTML=`<div class="verify-banner ${b.cls}"><span class="vb-ic">${b.ic}</span><div class="vb-t"><b>${b.t}</b><span>${b.s}</span></div><button class="btn btn-sm btn-gold" onclick="go('cg-verify')">${st==='submitted'?'Zobrazit stav':'Ověřit se'}</button></div>`;}
  }
  setAva(document.getElementById('cgDashAva'),cgProfile.photo,initials(cgProfile.name));
  document.getElementById('cgFirst').textContent=cgFirstName().split(/\s+/)[0];
  document.getElementById('cgIntro').textContent=CG_REQUESTS.length
    ?`Máte ${CG_REQUESTS.length} ${CG_REQUESTS.length===1?'novou poptávku':'nové poptávky'} a ${CG_SCHEDULE.length} naplánovaných služeb.`
    :'Aktuálně nemáte žádné nové poptávky.';
  const earn=CG_SCHEDULE.reduce((s,j)=>s+j.hours*cgProfile.rate,0);
  const stats=[
    {ic:'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',v:earn.toLocaleString('cs-CZ')+' K�',l:'V�d�lek tento m�s�c',t:null},
    {ic:'M8 2v4M16 2v4M4 9h16M4 5h16v15H4z',v:CG_SCHEDULE.length,l:'Nadcházející služby',t:null},
    {svg:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C9A233" stroke-width="1.5"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0" stroke="#C9A233" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="10" r="1.1" fill="#C9A233"/><circle cx="15" cy="10" r="1.1" fill="#C9A233"/></svg>',v:cgProfile.rating,l:'Hodnocení ('+cgProfile.reviews+')',t:null},
    {svg:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="#C9A233" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="#C9A233" stroke-width="1.5"/></svg>',v:'�',l:'Zhl�dnut� profilu',t:null}
  ];
  document.getElementById('cgStats').innerHTML=stats.map(s=>`
    <div class="stat">
      <div class="stat-top">
        <span class="sl">${s.l}</span>
        <div class="si">${s.svg||sIcon(s.ic)}</div>
      </div>
      <div class="sv">${s.v}</div>
      ${s.t?`<span class="trend"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M4 18 14 8l4 4 4-4" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>${s.t} <em>za měsíc</em></span>`:''}
    </div>`).join('');
  renderEarnings();
  document.getElementById('cgScheduleList').innerHTML=cgScheduleHTML();
  const prev=CG_REQUESTS.slice(0,2);
  document.getElementById('cgReqBadge').textContent=CG_REQUESTS.length;
  document.getElementById('cgReqPreview').innerHTML=prev.length?prev.map(reqCardHTML).join(''):'<div class="empty">Žádné nové poptávky.</div>';
}
function cgScheduleHTML(){
  if(!CG_SCHEDULE.length)return '<div class="empty">Zatím nemáte naplánované žádné služby.</div>';
  return CG_SCHEDULE.slice().sort((a,b)=>a.date.localeCompare(b.date)).map((j,i)=>`
    <div class="order" style="cursor:pointer" role="button" tabindex="0" onclick="openCgOrder(${i})">
      <div class="ava">${j.init}</div>
      <div class="od"><b>${sName(j.service)}</b><div class="det">${esc(j.fam)} · ${fmtDate(j.date)}<br>${timeRange(j.time,j.hours)}</div></div>
      <div class="ost"><span class="status ok">Potvrzeno</span><div class="pr">${(j.hours*cgProfile.rate).toLocaleString('cs-CZ')} Kč</div></div>
    </div>`).join('');
}
function reqCardHTML(r){
  return `<div class="req">
    <div class="ava">${r.init}</div>
    <div class="ri">
      <b>${esc(r.fam)}</b>
      <div class="rd">${sName(r.service)} · ${fmtDate(r.date)} · ${timeRange(r.time,r.hours)}</div>
      <span class="rs">${(r.hours*cgProfile.rate).toLocaleString('cs-CZ')} Kč · ${esc(r.addr)}</span>
    </div>
    <div class="req-actions">
      <button class="btn btn-accept btn-sm" onclick="acceptRequest(${r.id})">Přijmout</button>
      <button class="btn btn-decline btn-sm" onclick="declineRequest(${r.id})">Odmítnout</button>
    </div>
  </div>`;
}
function renderCgRequests(){
  document.getElementById('cgReqBadge2').textContent=CG_REQUESTS.length;
  document.getElementById('cgReqFull').innerHTML=CG_REQUESTS.length?CG_REQUESTS.map(reqCardHTML).join(''):'<div class="empty">Žádné nové poptávky. 🎉</div>';
  document.getElementById('cgConfirmed').innerHTML=cgScheduleHTML();
}
function acceptRequest(id){
  const i=CG_REQUESTS.findIndex(r=>r.id===id);if(i<0)return;
  const r=CG_REQUESTS.splice(i,1)[0];
  CG_SCHEDULE.push({fam:r.fam,init:r.init,service:r.service,date:r.date,time:r.time,hours:r.hours});
  if(r.oid){const o=ORDERS.find(x=>x.oid===r.oid);if(o)o.status='confirmed';}
  apiSync(api('/requests/'+id+'/accept',{method:'POST'}));
  toast(`✓ Poptávka od <b>${esc(r.fam)}</b> přijata`,'success');refreshCg();
}
function declineRequest(id){
  const i=CG_REQUESTS.findIndex(r=>r.id===id);if(i<0)return;
  const r=CG_REQUESTS.splice(i,1)[0];
  if(r.oid){const o=ORDERS.find(x=>x.oid===r.oid);if(o)o.status='declined';}
  apiSync(api('/requests/'+id+'/decline',{method:'POST'}));
  toast(`Poptávka od ${esc(r.fam)} byla odmítnuta`,'info');refreshCg();
}
function refreshCg(){
  persist();
  updateAuthUI();
  renderCgDashboard();
  if(document.getElementById('view-cg-requests')&&document.getElementById('view-cg-requests').classList.contains('active'))renderCgRequests();
  if(document.getElementById('view-cg-calendar')&&document.getElementById('view-cg-calendar').classList.contains('active'))renderCgCalendar();
}

/* caregiver availability calendar */
let cgCalMonth=TODAY.getMonth(),cgCalYear=TODAY.getFullYear();
function renderCgCalendar(){
  document.getElementById('cgCalTitle').textContent=MONTHS[cgCalMonth]+' '+cgCalYear;
  const first=new Date(cgCalYear,cgCalMonth,1).getDay();
  const offset=(first+6)%7;
  const dim=new Date(cgCalYear,cgCalMonth+1,0).getDate();
  const booked=CG_SCHEDULE.filter(j=>{const d=new Date(j.date);return d.getMonth()===cgCalMonth&&d.getFullYear()===cgCalYear;}).map(j=>new Date(j.date).getDate());
  let html='';
  for(let i=0;i<offset;i++)html+='<div class="day muted" aria-hidden="true"></div>';
  for(let d=1;d<=dim;d++){
    const has=booked.includes(d);
    const today=(d===TODAY.getDate()&&cgCalMonth===TODAY.getMonth()&&cgCalYear===TODAY.getFullYear());
    html+=`<div class="day ${has?'has':''} ${today?'today':''}" ${has?'role="button" tabindex="0"':''} onclick="${has?`toast('📅 Naplánovaná služba ${d}. ${MONTHS[cgCalMonth].toLowerCase()}')`:''}">${d}</div>`;
  }
  document.getElementById('cgCalDays').innerHTML=html;
  document.getElementById('cgAvail').innerHTML=DAYS_CZ.map((d,i)=>`
    <div class="avail-day" style="flex-direction:column;align-items:stretch">
      <div style="display:flex;align-items:center;justify-content:space-between;width:100%">
        <span class="ad-name">${d}</span>
        <label class="switch"><input type="checkbox" ${cgAvail[i]?'checked':''} onchange="toggleAvail(${i},this.checked)" aria-label="Dostupnost ${d}"><span class="track"></span><span class="thumb"></span></label>
      </div>
      ${cgAvail[i]?`<div style="display:flex;gap:6px;width:100%;margin-top:8px">
        ${TIME_SLOTS.map(s=>`<button type="button" class="cg-serv ${cgSlots[i][s.k]?'on':''}" style="flex:1;padding:6px 8px;font-size:12px" onclick="toggleSlot(${i},'${s.k}')">${s.l}</button>`).join('')}
      </div>`:''}
    </div>`).join('');
  const jobs=CG_SCHEDULE.slice().sort((a,b)=>a.date.localeCompare(b.date));
  document.getElementById('cgCalJobs').innerHTML=jobs.length?jobs.map(j=>`
    <div class="order" style="padding:13px 15px"><div class="ava" style="width:42px;height:42px;font-size:14px">${j.init}</div>
      <div class="od"><b style="font-size:15px">${sName(j.service)}</b><div class="det">${fmtDate(j.date)} · ${timeRange(j.time,j.hours)}</div></div></div>`).join(''):'<div class="empty">Žádné naplánované služby v tomto období.</div>';
}
function cgCalMove(dir){cgCalMonth+=dir;if(cgCalMonth<0){cgCalMonth=11;cgCalYear--}if(cgCalMonth>11){cgCalMonth=0;cgCalYear++}renderCgCalendar();}
function saveCgAvail(){
  const c=CAREGIVERS.find(x=>x.email===auth.email);if(!c)return;
  const avail=cgSlots.map((s,i)=>cgAvail[i]?{r:!!s.r,o:!!s.o,v:!!s.v}:{r:false,o:false,v:false});
  apiSync(api('/caregivers/'+c.id,{method:'PATCH',body:{avail}}));
}
function toggleAvail(i,val){
  cgAvail[i]=val;
  if(val&&!(cgSlots[i].r||cgSlots[i].o||cgSlots[i].v)){cgSlots[i]={r:true,o:true,v:true};}
  saveCgAvail();renderCgCalendar();
  toast(val?`✓ ${DAYS_CZ[i]} — nyní dostupná`:`${DAYS_CZ[i]} — označeno jako nedostupné`);
}
function toggleSlot(i,k){cgSlots[i][k]=!cgSlots[i][k];saveCgAvail();renderCgCalendar();}

/* caregiver profile editing */
function renderCgProfile(){
  if(auth.role==='caregiver'&&auth.name)cgProfile.name=auth.name;
  document.getElementById('cpName').value=cgProfile.name;
  document.getElementById('cpLoc').value=cgProfile.loc;
  document.getElementById('cpRate').value=cgProfile.rate;
  document.getElementById('cpExp').value=cgProfile.exp;
  document.getElementById('cpRadius').value=cgProfile.radius;
  document.getElementById('cpKmPrice').value=cgProfile.kmPrice||0;
  document.getElementById('cpPriceType').value=cgProfile.priceType||'hod';
  if(cgProfile.priceType==='den')document.getElementById('cpRate').value=cgProfile.dayRate;
  document.getElementById('cpBio').value=cgProfile.bio;
  renderCgServiceChips();
  updateCgAvatar();
  syncCgPreview();
  ddRefresh();
}
function updateCgAvatar(){
  const el=document.getElementById('cpAvatar');
  const rm=document.getElementById('cpPhotoRemove');
  if(!el)return;
  if(cgProfile.photo){
    el.textContent='';
    el.style.backgroundImage=`url('${cgProfile.photo}')`;
    el.style.backgroundSize='cover';
    el.style.backgroundPosition='center';
    el.style.backgroundRepeat='no-repeat';
    el.style.color='transparent';
    if(rm)rm.style.display='';
  }else{
    el.style.backgroundImage='';
    el.style.color='';
    el.textContent=initials((document.getElementById('cpName')||{}).value||cgProfile.name);
    if(rm)rm.style.display='none';
  }
}
function onCgPhoto(e){
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){toast('⚠️ Vyberte prosím obrázek.');return;}
  const reader=new FileReader();
  reader.onload=function(){
    const img=new Image();
    img.onload=function(){
      const max=400;let w=img.width,h=img.height;
      if(w>h){if(w>max){h=Math.round(h*max/w);w=max;}}else{if(h>max){w=Math.round(w*max/h);h=max;}}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      cgProfile.photo=c.toDataURL('image/webp',0.85);
      const me=CAREGIVERS.find(x=>x.email===auth.email);
      if(me){me.photo=cgProfile.photo;apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{photo:cgProfile.photo}}));}
      syncCgPhotoToList();updateCgAvatar();syncCgPreview();updateAuthUI();renderCare();
      toast('✓ Profilová fotka nahrána');
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
function removeCgPhoto(){
  cgProfile.photo=null;
  const inp=document.getElementById('cpPhotoInput');if(inp)inp.value='';
  const me=CAREGIVERS.find(x=>x.email===auth.email);
  if(me){me.photo=null;apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{photo:null}}));}
  syncCgPhotoToList();updateCgAvatar();syncCgPreview();updateAuthUI();renderCare();
  toast('Profilová fotka odebrána');
}
function renderCgServiceChips(){
  document.getElementById('cpServices').innerHTML=SERVICES.map(s=>
    `<button type="button" class="cg-serv ${cgProfile.services.includes(s.id)?'on':''}" onclick="toggleCgService('${s.id}')">${s.name}</button>`).join('');
}
function toggleCgService(id){
  const i=cgProfile.services.indexOf(id);
  if(i<0)cgProfile.services.push(id);else cgProfile.services.splice(i,1);
  renderCgServiceChips();syncCgPreview();
}
function syncCgPreview(){
  const name=document.getElementById('cpName').value||'Vaše jméno';
  const loc=document.getElementById('cpLoc').value;
  const rate=document.getElementById('cpRate').value||0;
  const exp=document.getElementById('cpExp').value||0;
  const radius=document.getElementById('cpRadius').value||10;
  const priceType=document.getElementById('cpPriceType').value;
  // popisek sazby + skrytí pole u individuální nabídky
  const rateLbl=document.getElementById('cpRateLbl');
  const rateWrap=document.getElementById('cpRateWrap');
  if(rateLbl)rateLbl.textContent=priceType==='den'?'Denní sazba (Kč)':'Hodinová sazba (Kč)';
  if(rateWrap)rateWrap.style.visibility=priceType==='indiv'?'hidden':'visible';
  // počítadlo znaků bio
  const bioEl=document.getElementById('cpBio');const cnt=document.getElementById('cpBioCount');
  if(cnt&&bioEl)cnt.textContent=`${bioEl.value.length} / 500`;
  const priceHTML=priceType==='indiv'?'<b>Individuální</b>':(priceType==='den'?`<b>${(+rate).toLocaleString('cs-CZ')} Kč</b> <span>/ den</span>`:`<b>${rate} Kč</b> <span>/ hod</span>`);
  const servs=cgProfile.services.map(s=>`<span class="chip">${sName(s)}</span>`).join('');
  const avaStyle=cgProfile.photo?` style="background-image:url('${cgProfile.photo}');background-size:cover;background-position:center;color:transparent"`:'';
  if(!cgProfile.photo)updateCgAvatar();
  document.getElementById('cgPreview').innerHTML=`
    <div class="care-card" style="cursor:default">
      <div class="care-top">
        <div class="ava"${avaStyle}>${cgProfile.photo?'':initials(name)}</div>
        <div style="flex:1">
          <div class="care-name">${name}</div>
          <div class="care-loc"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11Z" stroke="#7A736A" stroke-width="1.6"/><circle cx="12" cy="10" r="2.2" stroke="#7A736A" stroke-width="1.6"/></svg>${loc} · dojezd do ${radius} km</div>
          <div class="care-meta"><span class="stars">★</span><b style="color:var(--navy-900)">${cgProfile.rating}</b><span>(${cgProfile.reviews}) · ${exp} let praxe</span></div>
        </div>
      </div>
      <div class="care-tags"><span class="chip badge-id"><img src="verify.webp" alt="" width="14" height="17" style="vertical-align:-3px;margin-right:3px">Ověřená identita</span>${servs}</div>
      <div class="care-foot"><div class="price">${priceHTML}</div><button class="btn btn-gold" style="padding:9px 16px">Zobrazit profil</button></div>
    </div>`;
}
function saveCgProfile(){
  cgProfile.name=document.getElementById('cpName').value.trim()||cgProfile.name;
  cgProfile.loc=document.getElementById('cpLoc').value;
  cgProfile.exp=+document.getElementById('cpExp').value||cgProfile.exp;
  cgProfile.radius=+document.getElementById('cpRadius').value||cgProfile.radius;
  cgProfile.kmPrice=Math.max(0,+document.getElementById('cpKmPrice').value||0);
  cgProfile.priceType=document.getElementById('cpPriceType').value;
  const rv=+document.getElementById('cpRate').value||0;
  if(cgProfile.priceType==='den')cgProfile.dayRate=rv||cgProfile.dayRate;
  else if(cgProfile.priceType==='hod')cgProfile.rate=rv||cgProfile.rate;
  cgProfile.bio=document.getElementById('cpBio').value.trim().slice(0,500);
  // propsat změny do veřejné karty pečovatelky (Jana = id 1 / dle e-mailu)
  const me=CAREGIVERS.find(x=>x.email===auth.email)||CAREGIVERS[0];
  if(me){me.name=cgProfile.name;me.photo=cgProfile.photo||null;me.loc=cgProfile.loc;me.rate=cgProfile.rate;me.exp=cgProfile.exp;me.bio=cgProfile.bio;
    me.radius=cgProfile.radius;me.priceType=cgProfile.priceType;me.dayRate=cgProfile.dayRate;
    me.kmPrice=cgProfile.kmPrice;me.services=cgProfile.services.slice();}
  if(auth.role==='caregiver'){loginAs(cgProfile.name,auth.email,auth.role);}
  if(me&&me.id){apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{
    name:cgProfile.name,loc:cgProfile.loc,rate:cgProfile.rate,exp:me.exp,bio:cgProfile.bio,
    services:cgProfile.services,radius:cgProfile.radius,priceType:cgProfile.priceType,
    dayRate:cgProfile.dayRate,kmPrice:cgProfile.kmPrice,photo:cgProfile.photo||null
  }}));}
  renderCare();
  toast('✓ Profil byl uložen a zveřejněn');
}

/* ---------- EARNINGS CHART ---------- */
const CG_EARNINGS=[
  {m:'Led',v:14200},{m:'Úno',v:15800},{m:'Bře',v:13900},
  {m:'Dub',v:17200},{m:'Kvě',v:16400},{m:'Čvn',v:18650}
];
function renderEarnings(){
  const max=Math.max(...CG_EARNINGS.map(e=>e.v));
  const total=CG_EARNINGS.reduce((s,e)=>s+e.v,0);
  document.getElementById('earnTotal').textContent=total.toLocaleString('cs-CZ')+' Kč';
  const n=CG_EARNINGS.length,yTop=18,yBot=90;
  const pts=CG_EARNINGS.map((e,i)=>({x:(i+0.5)/n*100,y:yBot-(e.v/max)*(yBot-yTop),e,i}));
  const line=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const area=`M${pts[0].x.toFixed(2)} 100 L`+pts.map(p=>`${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L')+` L${pts[n-1].x.toFixed(2)} 100 Z`;
  const dots=pts.map(p=>`<button class="lc-pt ${p.i===n-1?'cur':''}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%" aria-label="${p.e.m}: ${p.e.v.toLocaleString('cs-CZ')} Kč"><span class="lc-tipv">${p.e.v.toLocaleString('cs-CZ')} Kč</span></button>`).join('');
  const labels=CG_EARNINGS.map(e=>`<span>${e.m}</span>`).join('');
  document.getElementById('earnChart').innerHTML=`
    <div class="lc-plot">
      <svg class="lc-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="lcStroke" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#DEBB5A"/><stop offset="1" stop-color="#A98821"/></linearGradient>
          <linearGradient id="lcArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="rgba(201,162,51,.32)"/><stop offset="1" stop-color="rgba(201,162,51,0)"/></linearGradient>
        </defs>
        <path class="lc-area" d="${area}"/>
        <path class="lc-line" d="${line}"/>
      </svg>
      <div class="lc-dots">${dots}</div>
    </div>
    <div class="lc-labels">${labels}</div>`;
}

/* ---------- ORDER DETAIL ---------- */
let curOrder=null;
function openFamilyOrder(oid){
  const o=ORDERS.find(x=>x.oid===oid);if(!o)return;const c=cg(o.cid);
  curOrder={oid:o.oid,cid:o.cid,viewer:'family',title:sName(o.service),status:o.status,rated:!!o.rated,
    cpName:c.name,cpInit:c.init,cpRole:'Pečovatelka',cpChatRole:'caregiver',
    dateLabel:fmtDate(o.date),timeLabel:timeRange(o.time,o.hours),hours:o.hours,price:orderPrice(o),
    rate:c.rate,km:o.km||0,transport:(c.kmPrice&&o.km)?c.kmPrice*o.km:0,addr:o.addr,note:o.note,
    back:'bookings',backLabel:'Zpět na objednávky'};
  renderOrderDetail();go('order-detail');
}
function openCgOrder(i){
  const j=CG_SCHEDULE.slice().sort((a,b)=>a.date.localeCompare(b.date))[i];if(!j)return;
  curOrder={viewer:'caregiver',title:sName(j.service),status:'confirmed',
    cpName:j.fam,cpInit:j.init,cpRole:'Klient',cpChatRole:'family',
    dateLabel:fmtDate(j.date),timeLabel:timeRange(j.time,j.hours),hours:j.hours,price:j.hours*cgProfile.rate,
    rate:cgProfile.rate,transport:0,addr:'Adresa bude sdílena před službou',note:'',
    back:'cg-requests',backLabel:'Zpět na poptávky'};
  renderOrderDetail();go('order-detail');
}
function cancelOrder(oid){
  const o=ORDERS.find(x=>x.oid===oid);if(!o)return;
  o.status='cancelled';
  apiSync(api('/orders/'+oid,{method:'PATCH',body:{status:'cancelled'}}));
  toast('Objednávka byla zrušena','info');
  setTimeout(()=>go('bookings'),700);
}
function renderOrderDetail(){
  const o=curOrder;if(!o)return;
  document.getElementById('odBack').setAttribute('onclick',`go('${o.back}')`);
  document.getElementById('odBackLabel').textContent=o.backLabel;
  const st=ORDER_STATUS[o.status];
  const declined=(o.status==='declined'||o.status==='cancelled');
  const doneCount={pending:1,confirmed:2,done:4,declined:1,cancelled:1}[o.status];
  const steps=[
    {b:'Objednávka vytvořena',s:'Odesláno'},
    {b:'Potvrzeno pečovatelkou',s:o.cpName},
    {b:'Probíhá péče',s:o.dateLabel},
    {b:'Dokončeno',s:'Připraveno k hodnocení'}
  ];
  const chk='<svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="m5 12 5 5 9-11" stroke="#0A5A34" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  let tl=steps.map((step,idx)=>{
    let cls=idx<doneCount?'done':(idx===doneCount&&!declined&&o.status!=='done'?'active':'');
    return `<div class="tl-step ${cls}"><div class="tl-dot">${chk}</div><div class="tl-tx"><b>${step.b}</b><span>${step.s}</span></div></div>`;
  }).join('');
  if(declined)tl+=`<div class="tl-step active" style="padding-top:6px"><div class="tl-dot" style="border-color:#B23A2E;background:#FBF3F1"></div><div class="tl-tx"><b style="color:#B23A2E">${st.label}</b><span>Objednávka neproběhne</span></div></div>`;
  let action;
  if(o.viewer==='caregiver'){action='';}
  else if(o.status==='done'){
    action=o.rated
      ?`<button class="btn btn-ghost btn-block" style="margin-top:10px" disabled>Hodnocení odesláno ✓</button>`
      :`<button class="btn btn-navy btn-block" style="margin-top:10px" onclick="openRating(${o.cid},${o.oid})">Ohodnotit péči</button>`;
  }else if(declined){
    action=`<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openProfile(${o.cid})">Objednat znovu</button>`;
  }else{
    action=`<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="cancelOrder(${o.oid})">Zrušit objednávku</button>`;
  }
  document.getElementById('orderDetailGrid').innerHTML=`
    <div class="pcard">
      <div class="phead" style="margin-bottom:18px">
        <div class="ava">${esc(o.cpInit)}</div>
        <div>
          <h1 style="font-size:24px">${esc(o.title)}</h1>
          <div class="pmeta"><span style="color:var(--muted);font-size:14px">${esc(o.cpRole)}: <b style="color:var(--navy-900)">${esc(o.cpName)}</b></span></div>
          <div style="margin-top:10px"><span class="status ${st.cls}">${st.label}</span></div>
        </div>
      </div>
      <div class="pdiv"></div>
      <h3>Údaje objednávky</h3>
      <div class="od-info">
        <div class="r"><span class="l">Datum</span><span class="v">${o.dateLabel}</span></div>
        <div class="r"><span class="l">Čas</span><span class="v">${o.timeLabel}</span></div>
        <div class="r"><span class="l">Délka péče</span><span class="v">${o.hours} hodin</span></div>
        <div class="r"><span class="l">Adresa</span><span class="v">${esc(o.addr)}</span></div>
        ${o.note?`<div class="r"><span class="l">Poznámka</span><span class="v">${esc(o.note)}</span></div>`:''}
      </div>
      <div class="pdiv"></div>
      <h3>Průběh objednávky</h3>
      <div class="timeline">${tl}</div>
    </div>
    <div class="pcard book-aside">
      <h3 style="margin-bottom:14px">Souhrn</h3>
      <div class="row" style="display:flex;justify-content:space-between;padding:10px 0;font-size:14.5px"><span style="color:var(--muted)">Sazba</span><span style="font-weight:600;color:var(--navy-900)">${o.rate||Math.round(o.price/o.hours)} Kč / hod</span></div>
      <div class="row" style="display:flex;justify-content:space-between;padding:10px 0;font-size:14.5px"><span style="color:var(--muted)">Délka</span><span style="font-weight:600;color:var(--navy-900)">${o.hours} h</span></div>
      ${o.transport>0?`<div class="row" style="display:flex;justify-content:space-between;padding:10px 0;font-size:14.5px"><span style="color:var(--muted)">Doprava</span><span style="font-weight:600;color:var(--navy-900)">${o.transport.toLocaleString('cs-CZ')} Kč (${o.km} km)</span></div>`:''}
      <div class="total-row"><span class="l" style="color:var(--muted)">Celkem</span><span class="big">${o.price.toLocaleString('cs-CZ')} Kč</span></div>
      <button class="btn btn-gold btn-block" style="margin-top:18px" onclick="openChat(${jsq(o.cpName)},${jsq(o.cpInit)},${jsq(o.cpChatRole)})">Napsat zprávu</button>
      ${action}
    </div>`;
}

/* ---------- RATING (4 kritéria) ---------- */
const RATE_CRITERIA=[
  {k:'dochvilnost',l:'Dochvilnost'},
  {k:'komunikace',l:'Komunikace'},
  {k:'pece',l:'Péče'},
  {k:'doporuceni',l:'Doporučení'}
];
let ratingTarget={cid:null,oid:null,scores:{dochvilnost:5,komunikace:5,pece:5,doporuceni:5}};
function openRating(cid,oid){
  ratingTarget={cid,oid,scores:{dochvilnost:5,komunikace:5,pece:5,doporuceni:5}};
  document.getElementById('ratingTitle').textContent='Ohodnotit: '+cg(cid).name;
  document.getElementById('ratingText').value='';
  renderStars();
  document.getElementById('ratingModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeRating(){
  const m=document.getElementById('ratingModal');
  if(m&&m.classList.contains('open')){m.classList.remove('open');document.body.style.overflow='';}
}
/* ---------- POTVRZOVACÍ MODAL ---------- */
let confirmCb=null;
function askConfirm(o){
  o=o||{};
  document.getElementById('confirmTitle').textContent=o.title||'Opravdu pokračovat?';
  document.getElementById('confirmMsg').textContent=o.message||'';
  document.getElementById('confirmIcon').textContent=o.icon||'⚠️';
  const ok=document.getElementById('confirmOkBtn');
  ok.textContent=o.confirmLabel||'Potvrdit';
  ok.className='btn '+(o.danger?'btn-decline':'btn-gold');
  confirmCb=typeof o.onConfirm==='function'?o.onConfirm:null;
  const m=document.getElementById('confirmModal');
  m.classList.add('open');document.body.style.overflow='hidden';
  setTimeout(()=>ok.focus(),60);
}
function closeConfirm(){
  const m=document.getElementById('confirmModal');
  if(m&&m.classList.contains('open')){m.classList.remove('open');document.body.style.overflow='';}
  confirmCb=null;
}
function confirmProceed(){const cb=confirmCb;closeConfirm();if(cb)cb();}
function setStars(crit,n){ratingTarget.scores[crit]=n;renderStars();}
function renderStars(){
  document.getElementById('ratingCriteria').innerHTML=RATE_CRITERIA.map(c=>`
    <div class="rate-row">
      <span class="rr-l">${c.l}</span>
      <span class="rr-stars" role="group" aria-label="${c.l}">${[1,2,3,4,5].map(n=>
        `<button type="button" class="${n<=ratingTarget.scores[c.k]?'on':''}" aria-label="${n} z 5" onclick="setStars('${c.k}',${n})">★</button>`).join('')}</span>
    </div>`).join('');
}
function submitRating(){
  const {cid,oid,scores}=ratingTarget;
  const vals=RATE_CRITERIA.map(c=>scores[c.k]);
  const stars=Math.round(vals.reduce((a,b)=>a+b,0)/vals.length);
  const text=document.getElementById('ratingText').value.trim()||'Spokojenost s péčí.';
  const name=auth.loggedIn?auth.name:'Vy';
  (cgReviews[cid]=cgReviews[cid]||[]).unshift({init:initials(name),name,stars,text,scores:{...scores}});
  const o=ORDERS.find(x=>x.oid===oid);if(o)o.rated=true;
  if(curOrder&&curOrder.oid===oid)curOrder.rated=true;
  apiSync(api('/reviews',{method:'POST',body:{caregiverId:cid,init:initials(name),name,stars,text}}));
  closeRating();
  toast('⭐ Děkujeme za vaše hodnocení!','success');
  if(document.getElementById('view-order-detail')&&document.getElementById('view-order-detail').classList.contains('active'))renderOrderDetail();
}

/* ---------- CHAT ---------- */
let CONVERSATIONS=[];
function chatUnread(){return CONVERSATIONS.reduce((s,c)=>s+(c.unread||0),0);}
let activeChat=null,chatSeq=0,chatTmpSeq=-2;
/* ---- HROMADNÉ ZPRÁVY OD SPRÁVCE (broadcast) ---- */
let BROADCASTS=[]; // {id,audience:'all'|'caregivers'|'families'|'specific',emails:[],text,date,t}
let bcSeq=0;
let bcSeen=[]; // id broadcastů, které už příjemce viděl
function broadcastsFor(){
  if(!auth.loggedIn||auth.role==='admin')return [];
  return BROADCASTS.filter(b=>b.audience==='all'
    ||(b.audience==='caregivers'&&auth.role==='caregiver')
    ||(b.audience==='families'&&auth.role==='family')
    ||(b.audience==='specific'&&(b.emails||[]).includes(auth.email)));
}
/* konverzace „ZENVORIA Podpora" (id -1) — přestaví se podle příjemce, jen ke čtení */
function ensureBroadcastConvo(){
  let c=CONVERSATIONS.find(x=>x.id===-1);
  const list=broadcastsFor();
  if(!auth.loggedIn||auth.role==='admin'||!list.length){
    if(c)CONVERSATIONS=CONVERSATIONS.filter(x=>x.id!==-1);return;
  }
  if(!c){c={id:-1,name:'ZENVORIA Podpora',init:'ZV',role:'admin',readonly:true};CONVERSATIONS.unshift(c);}
  c.msgs=list.map(b=>({me:false,text:b.text,t:b.t}));
  c.readonly=true;
  c.unread=(activeChat===-1)?0:list.filter(b=>!bcSeen.includes(b.id)).length;
}
const CHAT_REPLIES=['Děkuji za zprávu, ozvu se co nejdříve.','Jistě, ráda pomůžu. Domluvíme detaily?',
  'Rozumím, zařídím to. 🙂','To zní dobře, potvrzuji termín.','Díky, budu se těšit!'];
function chatNow(){return new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});}
function openChat(name,init,role){
  let c=CONVERSATIONS.find(x=>x.name===name);
  if(!c){
    c={id:auth.loggedIn?chatTmpSeq--:++chatSeq,name,init:init||initials(name),role:role||'caregiver',msgs:[]};
    CONVERSATIONS.unshift(c);
    if(auth.loggedIn){
      apiSync(api('/conversations',{method:'POST',body:{name,init:c.init,role:c.role}}).then(r=>{
        if(r&&r.conversation){
          const oldId=c.id;
          c.id=r.conversation.id;
          chatSeq=Math.max(chatSeq,c.id);
          if(activeChat===oldId)activeChat=c.id;
          renderChat();
        }
      }));
    }
  }
  activeChat=c.id;go('chat');
  setTimeout(()=>document.getElementById('chatInput')?.focus(),140);
}
function makeChatAvatar(text){
  const el=document.createElement('div');
  el.className='ava';
  el.textContent=text||'';
  return el;
}
function renderChat(){
  ensureBroadcastConvo();
  if(!CONVERSATIONS.find(c=>c.id===activeChat))activeChat=CONVERSATIONS[0]&&CONVERSATIONS[0].id;
  const listEl=document.getElementById('chatList');
  listEl.textContent='';
  const listHead=document.createElement('div');
  listHead.className='chat-list-h';
  listHead.textContent='Konverzace';
  listEl.appendChild(listHead);
  CONVERSATIONS.forEach(c=>{
    const last=c.msgs[c.msgs.length-1];
    const btn=document.createElement('button');
    btn.className='chat-li'+(c.id===activeChat?' on':'');
    btn.addEventListener('click',()=>selectChat(c.id));
    btn.appendChild(makeChatAvatar(c.init));
    const ci=document.createElement('div');
    ci.className='ci';
    const name=document.createElement('b');
    name.textContent=c.name;
    const preview=document.createElement('span');
    preview.textContent=last?(last.me?'Vy: ':'')+last.text:'Nová konverzace';
    ci.appendChild(name);
    ci.appendChild(preview);
    btn.appendChild(ci);
    listEl.appendChild(btn);
  });
  const c=CONVERSATIONS.find(x=>x.id===activeChat);
  const head=document.getElementById('chatHead'),body=document.getElementById('chatBody');
  if(!c){head.textContent='';body.textContent='';return;}
  c.unread=0;
  if(c.id===-1){broadcastsFor().forEach(b=>{if(!bcSeen.includes(b.id))bcSeen.push(b.id);});persist();}
  head.textContent='';
  head.appendChild(makeChatAvatar(c.init));
  const headMeta=document.createElement('div');
  const headName=document.createElement('b');
  headName.textContent=c.name;
  const headState=document.createElement('span');
  headState.textContent=c.readonly?'Oznámení od ZENVORIA':'Online';
  headMeta.appendChild(headName);
  headMeta.appendChild(headState);
  head.appendChild(headMeta);
  body.textContent='';
  c.msgs.forEach(m=>{
    const row=document.createElement('div');
    row.className='msg '+(m.me?'me':'them');
    row.appendChild(document.createTextNode(m.text));
    const time=document.createElement('span');
    time.className='mt';
    time.textContent=m.t;
    row.appendChild(time);
    body.appendChild(row);
  });
  // u oznámení (jen ke čtení) schovat vstup i akce
  const actions=document.getElementById('chatActions'),form=document.getElementById('chatForm');
  if(actions)actions.style.display=c.readonly?'none':'';
  if(form)form.style.display=c.readonly?'none':'';
  scrollChat();
  updateAuthUI();
}
function sendTerm(){
  const c=CONVERSATIONS.find(x=>x.id===activeChat);if(!c){toast('Vyberte konverzaci.');return;}
  const d=new Date(Date.now()+2*86400000);
  const navrh=`📅 Návrh termínu: ${d.toLocaleDateString('cs-CZ',{day:'numeric',month:'long'})} v 10:00 (4 h). Vyhovuje?`;
  const sent={me:true,text:navrh,t:chatNow()};
  c.msgs.push(sent);renderChat();
  if(auth.loggedIn&&c.id>0)apiSync(api('/conversations/'+c.id+'/messages',{method:'POST',body:sent}));
  setTimeout(()=>{
    const reply={me:false,text:'Termín mi vyhovuje, potvrzuji. 🙂',t:chatNow()};
    c.msgs.push(reply);renderChat();
    if(auth.loggedIn&&c.id>0)apiSync(api('/conversations/'+c.id+'/messages',{method:'POST',body:reply}));
  },1300);
}
function videoCall(){toast('📹 Videohovory spouštíme již brzy.');}
function scrollChat(){const b=document.getElementById('chatBody');if(b)b.scrollTop=b.scrollHeight;}
function selectChat(id){activeChat=id;renderChat();document.getElementById('chatInput')?.focus();}
function sendChat(e){
  e.preventDefault();
  const inp=document.getElementById('chatInput');const text=inp.value.trim();if(!text)return false;
  const c=CONVERSATIONS.find(x=>x.id===activeChat);if(!c)return false;
  const sent={me:true,text,t:chatNow()};
  c.msgs.push(sent);inp.value='';renderChat();
  if(auth.loggedIn&&c.id>0)apiSync(api('/conversations/'+c.id+'/messages',{method:'POST',body:sent}));
  const body=document.getElementById('chatBody');
  const typing=document.createElement('div');typing.className='typing';
  typing.textContent=c.name.split(/\s+/)[0]+' píše…';body.appendChild(typing);scrollChat();
  setTimeout(()=>{
    const reply={me:false,text:CHAT_REPLIES[Math.floor(Math.random()*CHAT_REPLIES.length)],t:chatNow()};
    c.msgs.push(reply);renderChat();
    if(auth.loggedIn&&c.id>0)apiSync(api('/conversations/'+c.id+'/messages',{method:'POST',body:reply}));
  },1300);
  return false;
}

/* ---------- PERSISTENCE ---------- */
/* ====================================================================
   API KLIENT + NAPOJENÍ NA SERVER (Supabase přes náš /api)
   Data žijí v databázi; persist() už nepíše do localStorage.
   ==================================================================== */
function getCookie(name){
  const safe=String(name||'').replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const m=document.cookie.match(new RegExp('(?:^|; )'+safe+'=([^;]*)'));
  return m?decodeURIComponent(m[1]):'';
}
async function api(path,opts){
  const method=((opts&&opts.method)||'GET').toUpperCase();
  const headers=Object.assign({'Content-Type':'application/json'},(opts&&opts.headers)||{});
  if(['POST','PUT','PATCH','DELETE'].includes(method)){
    const csrf=getCookie('zv_csrf');
    if(csrf)headers['X-CSRF-Token']=csrf;
  }
  const res=await fetch('/api'+path,{
    method,
    headers,
    credentials:'include',
    body:opts&&opts.body!=null?JSON.stringify(opts.body):undefined
  });
  let data=null;try{data=await res.json();}catch(e){}
  if(!res.ok){
    const err=new Error((data&&data.error)||('Chyba '+res.status));
    if(data&&typeof data==='object'){
      if(data.reason)err.reason=data.reason;
      if(data.codeSent!=null)err.codeSent=data.codeSent;
    }
    throw err;
  }
  return data;
}
/* fire-and-forget zápis na server s hláškou při chybě */
function apiSync(p){return Promise.resolve(p).catch(e=>{console.error('[api]',e);toast('⚠️ Uložení do databáze se nezdařilo: '+e.message,'declined');});}
/* persist() je teď no-op — stav se ukládá přímo přes konkrétní /api volání */
function persist(){}

/* odvodí cgStatusMap / cgPlanMap z dat (pečovatelky + žádosti) */
function deriveCgMaps(){
  cgStatusMap={};cgPlanMap={};
  CAREGIVERS.forEach(c=>{if(c.email){cgStatusMap[c.email]=c.verified?'verified':'pending';cgPlanMap[c.email]=c.plan||'start';}});
  VERIFICATIONS.forEach(v=>{if(!v.email)return;
    if(v.status==='submitted'&&cgStatusMap[v.email]!=='verified')cgStatusMap[v.email]='submitted';
    if(v.status==='rejected'&&cgStatusMap[v.email]!=='verified')cgStatusMap[v.email]='rejected';});
}
/* načte celý stav z databáze do klientských polí */
async function bootstrap(){
  const d=await api('/bootstrap');
  CAREGIVERS=d.caregivers||[];syncCgPhotoToList();
  ORDERS=d.orders||[];
  CG_REQUESTS=d.requests||[];
  CG_SCHEDULE=d.schedule||[];
  VERIFICATIONS=d.verifications||[];
  USERS=d.users||[];
  cgReviews=d.cgReviews||{};
  CONVERSATIONS=d.conversations||[];
  BROADCASTS=d.broadcasts||[];
  if(d.planPrices)Object.assign(planPrices,d.planPrices);planPrices.start=0;
  // seq čítače z maxim (kdyby něco generovalo id lokálně)
  orderSeq=ORDERS.reduce((m,o)=>Math.max(m,o.oid||0),0);
  reqSeq=CG_REQUESTS.reduce((m,r)=>Math.max(m,r.id||0),0);
  cgSeq=CAREGIVERS.reduce((m,c)=>Math.max(m,c.id||0),0);
  verSeq=VERIFICATIONS.reduce((m,v)=>Math.max(m,v.id||0),0);
  chatSeq=CONVERSATIONS.reduce((m,c)=>Math.max(m,c.id||0),0);
  bcSeq=BROADCASTS.reduce((m,b)=>Math.max(m,b.id||0),0);
  // profil přihlášené pečovatelky z její karty
  if(auth.loggedIn&&auth.role==='caregiver'){
    const me=CAREGIVERS.find(c=>c.email===auth.email);
    if(me){Object.assign(cgProfile,{name:me.name,bio:me.bio,loc:me.loc,rate:me.rate,services:me.services,langs:me.langs,photo:me.photo||cgProfile.photo});
      if(Array.isArray(me.avail)){cgSlots=me.avail;cgAvail=me.avail.map(s=>!!(s.r||s.o||s.v));}}
  }
  deriveCgMaps();
}
/* ---------- INIT ---------- */
async function initApp(){
  try{
    const url=new URL(window.location.href);
    const reset=url.searchParams.get('reset');
    if(reset)resetPwToken=reset;
    const changeEmail=url.searchParams.get('changeEmail');
    if(changeEmail)changeEmailToken=changeEmail;
  }catch(e){}
  initTheme();
  // rok v patičce ať se aktualizuje sám
  {const fy=document.getElementById('footYear');if(fy)fy.textContent=new Date().getFullYear();}
  // reveal hned na začátku — statické prvky (hero karty atd.) se schovají okamžitě,
  // takže neproblikne obsah dřív, než se napojí scroll efekt. Dynamický obsah doplní druhé volání níže.
  initReveal();
  // Pokud přicházíme z odkazu pro reset hesla, přepni na okno okamžitě
  // a token rovnou ověř — ať se nezobrazuje úvodní stránka ani formulář
  // dřív, než víme, jestli je odkaz platný.
  if(resetPwToken){
    await go('reset-password');
    // Schovej políčka, dokud token neověříme, ať neproblikne formulář.
    document.getElementById('resetPwFields').style.display='none';
    document.getElementById('resetPwDone').style.display='none';
    document.getElementById('resetPwInvalid').style.display='none';
    try{
      await api('/auth/reset-password/validate',{method:'POST',body:{token:resetPwToken}});
      resetPwTokenValid=true;
      document.getElementById('resetPwFields').style.display='';
    }catch(e){
      resetPwTokenValid=false;
      document.getElementById('resetPwInvalid').style.display='block';
      document.getElementById('resetPwInvalidText').textContent=(e&&e.message)||'Požádejte prosím o nový odkaz pro obnovu hesla.';
    }
  }
  if(changeEmailToken){
    await go('change-email');
    document.getElementById('changeEmailStepNew').style.display='none';
    document.getElementById('changeEmailStepCode').style.display='none';
    document.getElementById('changeEmailDone').style.display='none';
    document.getElementById('changeEmailInvalid').style.display='none';
    try{
      const r=await api('/auth/change-email/validate',{method:'POST',body:{token:changeEmailToken}});
      changeEmailTokenValid=true;
      changeEmailCurrent=r.currentEmail||'';
      changeEmailPending=r.newEmail||'';
      document.getElementById('changeEmailCurrent').textContent=changeEmailCurrent||'-';
      if(r.codeSent&&changeEmailPending){
        document.getElementById('changeEmailTarget').textContent=changeEmailPending;
        document.getElementById('changeEmailStepCode').style.display='';
      }else{
        document.getElementById('changeEmailStepNew').style.display='';
      }
    }catch(e){
      changeEmailTokenValid=false;
      document.getElementById('changeEmailInvalid').style.display='block';
      document.getElementById('changeEmailInvalidText').textContent=(e&&e.message)||'Pozadejte prosim o novy odkaz pro zmenu e-mailu.';
    }
  }
  try{const m=await api('/auth/me');
    if(m.user){auth.loggedIn=true;auth.name=m.user.name;auth.email=m.user.email;auth.role=m.user.role||'family';
      if(m.user.settings)Object.assign(appSettings,m.user.settings);}
  }catch(e){console.warn('auth/me',e.message);}
  try{await bootstrap();}catch(e){console.error('bootstrap',e);toast('⚠️ Nepodařilo se načíst data z databáze. Zkontrolujte připojení.','declined');}
  updateAuthUI();
  renderHome();renderFilters();renderCare();renderCalendar();
  document.querySelectorAll('select').forEach(enhanceSelect);
  initReveal();
  // deep-link: lze otevřít přímo konkrétní stránku přes #hash (bez případného ?query)
  let deep='';
  try{deep=(location.hash||'').replace(/^#/,'').split('?')[0];}catch(e){}
  if(!resetPwToken&&!changeEmailToken&&deep&&deep.indexOf('legal-')===0&&LEGAL[deep.slice(6)])openLegal(deep.slice(6),{direct:true});
  else if(!resetPwToken&&!changeEmailToken&&deep&&(document.getElementById('view-'+deep)||isDeferredView(deep)))await go(deep);
  else if(!resetPwToken&&!changeEmailToken&&auth.loggedIn)await go(landingView());
  // návrat ze Stripe Checkout (#pricing?paid=1 / ?canceled=1)
  if(!resetPwToken&&!changeEmailToken)handleBillingReturn();
  // výchozí stav historie, aby hned fungovalo tlačítko Zpět
  try{
    const active=document.querySelector('.view.active');
    const v=active?active.id.replace('view-',''):'home';
    const hash=(v==='legal'&&legalCurrentKey)?legalHash(legalCurrentKey):v;
    const nextState=v==='legal'?{view:v,legalKey:legalCurrentKey}:{view:v};
    if(!history.state||history.state.view!==v||(v==='legal'&&history.state.legalKey!==legalCurrentKey))history.replaceState(nextState,'','#'+hash);
  }catch(e){}
}
initApp();
