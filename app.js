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
const LOCATION_OPTIONS=[
  'Praha','Praha-východ','Praha-západ','Beroun','Benešov','Brno','Brno-venkov','Bruntál',
  'České Budějovice','Český Krumlov','Děčín','Frýdek-Místek','Havlíčkův Brod','Hradec Králové',
  'Cheb','Chomutov','Jablonec nad Nisou','Jeseník','Jičín','Jihlava','Jindřichův Hradec','Karlovy Vary',
  'Karviná','Kladno','Klatovy','Kolín','Kutná Hora','Liberec','Litoměřice','Louny','Mělník','Mladá Boleslav',
  'Most','Náchod','Nový Jičín','Nymburk','Olomouc','Opava','Ostrava','Pardubice','Pelhřimov','Písek',
  'Plzeň','Prachatice','Prostějov','Přerov','Příbram','Rakovník','Rychnov nad Kněžnou','Semily','Sokolov',
  'Strakonice','Svitavy','Šumperk','Tábor','Tachov','Teplice','Trutnov','Třebíč','Uherské Hradiště',
  'Ústí nad Labem','Ústí nad Orlicí','Vsetín','Vyškov','Zlín','Znojmo','Žďár nad Sázavou'
];
const VALUES=['Lidskost','Důvěra','Respekt','Bezpečí','Profesionalita'];
const VAL_SUBS=['Empatie a srdce','Prověřeno a ověřeno','Důstojnost vždy','Pojištěno a chráněno','Zkušenost a péče'];
const VAL_ICONS=['M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10Z','M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z','m5 12 4 4 10-10','M12 2 4 5v6c0 5 3.5 9 8 11 4.5-2 8-6 8-11V5l-8-3Z','M12 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM5 21c0-4 3-7 7-7s7 3 7 7'];

let CAREGIVERS=[];
let cgSeq=0;
/* tarif přihlášené pečovatelky podle e-mailu */
let cgPlanMap={};
const PLANS={
  start:{name:'START',
    feats:['Profil v aplikaci','Ověření identity','Přijímání rezervací','Kalendář dostupnosti','Chat s rodinami','Hodnocení klientů']},
  premium:{name:'PREMIUM',
    feats:['Vše ze START','Vyšší zobrazení ve vyhledávání','Odznak PREMIUM','Neomezené poptávky','Statistiky profilu','Prioritní podpora','Video představení']}
};
/* odkazy na sociální sítě Zenvoria — nastavuje admin v sekci Sociální sítě */
let socialLinks={facebook:'',instagram:''};
/* otevře nastavený profil sítě v nové záložce; když není nastaven, upozorní */
function openSocial(net){
  const url=socialLinks&&socialLinks[net];
  if(url){window.open(url,'_blank','noopener');return;}
  if(auth.loggedIn&&auth.role==='admin'){toast('Adresa zatím není nastavená — doplňte ji v sekci Sociální sítě.');go('admin-social');}
  else toast('Tento profil zatím není k dispozici.');
}
/* ceny tarifů (Kč/měsíc). Cenu obou tarifů nastavuje admin v sekci Tarify. */
let planPrices={start:190,premium:390};
let signupPlan={plan:'start',days:0};
const planPrice=k=>planPrices[k]||0;
const planPriceLabel=k=>planPrice(k)>0?planPrice(k).toLocaleString('cs-CZ')+' Kč / měsíc':'Zdarma';
/* SVG diamant se zeleným obrysem (ostrý, škálovatelný) */
const diamondSVG=(s,col)=>`<svg width="${s||14}" height="${s||14}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M12 22 2.5 9.5 6 3.5H18l3.5 6L12 22Z" stroke="${col||'#0A5A34'}" stroke-width="1.6" stroke-linejoin="round"/><path d="M2.5 9.5h19M6 3.5 9 9.5M18 3.5 15 9.5M9 9.5 12 3.5 15 9.5M9 9.5 12 22 15 9.5" stroke="${col||'#0A5A34'}" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
/* ikona tarifu: PREMIUM = zelený SVG diamant, START = zelený SVG puntík */
const planIcon=(k,h)=>k==='premium'?diamondSVG(h||16,'#13A552'):`<svg width="${h||16}" height="${h||16}" viewBox="0 0 24 24" style="vertical-align:-2px"><circle cx="12" cy="12" r="9" fill="#13A552"/></svg>`;

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
const state={caregiverId:1,bkService:'osobni',bkHours:4,profileToken:null,profileKind:null};
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
/* ---- veřejné (deep-link) URL účtu podle náhodného tokenu: #u-<token> ---- */
function accountHash(token){ return 'u-'+token; }
function parseAccountToken(deep){
  const m=/^u-([A-Za-z0-9]+)/.exec(deep||'');
  return m?m[1]:null;
}
/* hash a stav historie pro dané view (centrálně, ať je URL konzistentní) */
function hashForView(v){
  if(v==='legal'&&legalCurrentKey)return legalHash(legalCurrentKey);
  if(v==='profile'&&state.profileToken)return accountHash(state.profileToken);
  return v;
}
function stateForView(v){
  if(v==='legal')return {view:v,legalKey:legalCurrentKey};
  if(v==='profile')return {view:v,caregiverId:state.caregiverId,token:state.profileToken,kind:state.profileKind};
  return {view:v};
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
  if(v==='chat')enterChat();
  if(v==='fam-dash')renderFamilyDash();
  if(v==='admin-dash')renderAdminDash();
  if(v==='admin-verify')renderAdminVerify();
  if(v==='admin-caregivers')renderAdminCaregivers();
  if(v==='admin-users')renderAdminUsers();
  if(v==='admin-orders')renderAdminOrders();
  if(v==='admin-audit')renderAdminAudit();
  if(v==='admin-plans')renderAdminPlans();
  if(v==='admin-social')renderAdminSocial();
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
      // replaceState prováděj JEN když je co čistit (jinak by přepsal historii a rozbil tlačítko Zpět)
      if(url.searchParams.has('reset')||url.searchParams.has('changeEmail')){
        url.searchParams.delete('reset');
        url.searchParams.delete('changeEmail');
        history.replaceState(stateForView(v),'',url.pathname+(url.search?url.search:'')+'#'+hashForView(v));
      }
      resetPwToken='';
      changeEmailToken='';
    }catch(e){}
  }
  // Napojení na historii prohlížeče → funguje tlačítko Zpět/Vpřed.
  if(!fromPop){
    try{
      const cur=history.state&&history.state.view;
      const changed=cur!==v
        ||(v==='legal'&&history.state&&history.state.legalKey!==legalCurrentKey)
        ||(v==='profile'&&history.state&&history.state.token!==state.profileToken);
      if(changed)history.pushState(stateForView(v),'','#'+hashForView(v));
    }catch(e){}
  }
  // čeká-li nová verze, navigace je přirozený okamžik k obnovení na novou verzi
  if(typeof updatePending!=='undefined'&&updatePending)applyUpdateIfSafe();
}
// Zpět/Vpřed v prohlížeči přepíná views (bez dalšího zápisu do historie).
window.addEventListener('popstate',function(e){
  const v=(e.state&&e.state.view)||'home';
  if(v==='legal'&&e.state&&e.state.legalKey&&LEGAL[e.state.legalKey]){
    openLegal(e.state.legalKey,{fromPop:true,direct:true});
    return;
  }
  if(v==='profile'&&e.state){
    if(e.state.kind==='account'&&e.state.token){openProfileByToken(e.state.token,true);return;}
    if(e.state.caregiverId!=null&&cg(e.state.caregiverId)){openProfile(e.state.caregiverId,true);return;}
    if(e.state.token){openProfileByToken(e.state.token,true);return;}
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
  if(e.key==='Escape'){toggleMenu(false);closeRating();closeConfirm();closePay();closeVerifyValidModal();closeAccountMenu();closeAllDD();return;}
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
  if(!sel||sel.dataset.enh)return;
  sel.dataset.enh='1';
  const wrap=document.createElement('div');
  wrap.className='dd'+(sel.closest('.sort-row')?' dd-bordered':(sel.classList.contains('inp')?' dd-inp':(sel.classList.contains('phone-prefix')?' dd-phone':'')));
  const btn=document.createElement('button'); btn.type='button'; btn.className='dd-btn'; btn.setAttribute('aria-haspopup','listbox');
  const lbl=document.createElement('span'); lbl.className='dd-lbl';
  const car=document.createElement('span'); car.className='dd-car';
  car.innerHTML='<svg width="15" height="15" viewBox="0 0 24 24" fill="none"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  btn.appendChild(lbl); btn.appendChild(car);
  const menu=document.createElement('div'); menu.className='dd-menu'; menu.setAttribute('role','listbox');
  const sync=()=>{lbl.textContent=sel.options[sel.selectedIndex]?sel.options[sel.selectedIndex].text:'';};
  const build=()=>{
    menu.innerHTML='';
    Array.from(sel.options).forEach((o,i)=>{
      const it=document.createElement('div'); it.className='dd-opt'+(i===sel.selectedIndex?' sel':''); it.textContent=o.text; it.setAttribute('role','option');
      it.onclick=()=>{sel.selectedIndex=i;sync();menu.querySelectorAll('.dd-opt').forEach(x=>x.classList.remove('sel'));it.classList.add('sel');wrap.classList.remove('open');sel.dispatchEvent(new Event('change',{bubbles:true}));};
      menu.appendChild(it);
    });
  };
  btn.onclick=e=>{e.stopPropagation();const op=wrap.classList.contains('open');closeAllDD();if(!op)wrap.classList.add('open');};
  wrap.appendChild(btn); wrap.appendChild(menu); build();
  sel.style.display='none'; sel.parentNode.insertBefore(wrap,sel.nextSibling); sync();
  // refresh popisku + zvýraznění (po programové změně hodnoty)
  sel._ddRefresh=()=>{build();sync();const items=menu.querySelectorAll('.dd-opt');items.forEach((x,i)=>x.classList.toggle('sel',i===sel.selectedIndex));};
  sel.addEventListener('change',sel._ddRefresh);
}
function ddRefresh(){document.querySelectorAll('select[data-enh]').forEach(s=>s._ddRefresh&&s._ddRefresh());}
document.addEventListener('click',e=>{if(!e.target.closest('.dd'))closeAllDD();});

function locNorm(v){
  return String(v||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}
function getLocationMatches(query){
  const q=locNorm(query).trim();
  if(!q)return LOCATION_OPTIONS.slice(0,10);
  const starts=[],word=[],contains=[];
  LOCATION_OPTIONS.forEach(name=>{
    const n=locNorm(name);
    if(n.startsWith(q))starts.push(name);
    else if(n.split(/[\s-]+/).some(part=>part.startsWith(q)))word.push(name);
    else if(n.includes(q))contains.push(name);
  });
  const primary=starts.concat(word);
  return (primary.length?primary:contains).slice(0,8);
}
let locationAutocompleteSeq=0;
async function fetchLocationMatches(query){
  const q=String(query||'').trim();
  if(q.length<2)return { items: [], source: 'empty' };
  const seq=++locationAutocompleteSeq;
  try{
    const res=await fetch('/api/locations/autocomplete?q='+encodeURIComponent(q),{credentials:'include',cache:'no-store'});
    let data=null;try{data=await res.json();}catch(e){}
    if(seq!==locationAutocompleteSeq)return null;
    if(res.ok&&data&&Array.isArray(data.items)){
      return {
        items:data.items.map(item=>item&&item.label).filter(Boolean),
        source:data.source||'remote'
      };
    }
  }catch(e){}
  if(seq!==locationAutocompleteSeq)return null;
  return { items:getLocationMatches(q), source:'fallback' };
}
function closeLocationMenus(){document.querySelectorAll('.loc-ac.open').forEach(el=>el.classList.remove('open'));}
function bindLocationAutocomplete(inputId,onPick){
  const input=document.getElementById(inputId);
  if(!input||input.dataset.locAc)return;
  input.dataset.locAc='1';
  const wrap=document.createElement('div');
  wrap.className='loc-ac';
  input.parentNode.insertBefore(wrap,input);
  wrap.appendChild(input);
  const menu=document.createElement('div');
  menu.className='loc-ac-menu';
  wrap.appendChild(menu);
  let active=-1;
  let current=[];
  let timer=null;
  const syncActive=()=>{menu.querySelectorAll('.loc-ac-opt').forEach((el,i)=>el.classList.toggle('active',i===active));};
  const render=(items,emptyText)=>{
    current=items.slice();
    active=-1;
    if(!items.length){
      menu.innerHTML=`<div class="loc-ac-empty">${esc(emptyText||'Nenalezena zadna odpovidajici lokalita.')}</div>`;
      wrap.classList.add('open');
      return;
    }
    menu.innerHTML=items.map((name,i)=>`<div class="loc-ac-opt" data-i="${i}">${esc(name)}</div>`).join('');
    menu.querySelectorAll('.loc-ac-opt').forEach(el=>{
      el.addEventListener('mousedown',e=>{
        e.preventDefault();
        const idx=Number(el.dataset.i);
        input.value=current[idx]||input.value;
        closeLocationMenus();
        if(onPick)onPick();
      });
    });
    wrap.classList.add('open');
  };
  const refresh=async()=>{
    const value=input.value.trim();
    if(!value){wrap.classList.remove('open');return;}
    const result=await fetchLocationMatches(value);
    if(result==null||value!==input.value.trim())return;
    let emptyText='Nenalezena zadna odpovidajici lokalita.';
    if(result.source==='missing-key')emptyText='Geoapify API key neni nastaveny na serveru.';
    else if(/^\d[\d\s]*$/.test(value)&&result.source==='fallback')emptyText='Vyhledani podle PSC bude fungovat po nastaveni Geoapify API klice.';
    render(result.items||[],emptyText);
  };
  input.addEventListener('focus',refresh);
  input.addEventListener('input',()=>{
    if(timer)clearTimeout(timer);
    timer=setTimeout(refresh,180);
  });
  input.addEventListener('keydown',e=>{
    if((e.key==='ArrowDown'||e.key==='ArrowUp')&&!wrap.classList.contains('open')){
      if(timer)clearTimeout(timer);
      timer=setTimeout(refresh,0);
      return;
    }
    if(!wrap.classList.contains('open')||!current.length)return;
    if(e.key==='ArrowDown'){e.preventDefault();active=Math.min(active+1,current.length-1);syncActive();}
    else if(e.key==='ArrowUp'){e.preventDefault();active=Math.max(active-1,0);syncActive();}
    else if(e.key==='Enter'&&active>=0){e.preventDefault();input.value=current[active];closeLocationMenus();if(onPick)onPick();}
    else if(e.key==='Escape'){wrap.classList.remove('open');}
  });
  input.addEventListener('blur',()=>setTimeout(()=>wrap.classList.remove('open'),120));
}
function initLocationAutocomplete(){
  bindLocationAutocomplete('cpLoc',()=>syncCgPreview());
  bindLocationAutocomplete('vfLoc');
}
document.addEventListener('click',e=>{if(!e.target.closest('.loc-ac'))closeLocationMenus();});

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
function toast(msg,type,icon){const t=document.getElementById('toast');
  const ic=icon!=null?icon:(type==='success'?checkCircleSVG(20):(type==='error'||type==='declined')?warnSVG(20):infoSVG(20));
  t.innerHTML=`<span class="toast-ic" aria-hidden="true">${ic}</span><span class="toast-msg">${msg}</span>`;
  t.className='toast show'+(type?' '+type:'');
  clearTimeout(toastT);toastT=setTimeout(()=>{t.className='toast';},3600);}
/* SVG obálka (zlatá – dědí currentColor z .toast-ic) pro toasty o e-mailu */
function envelopeSVG(){return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><rect x="3" y="5" width="18" height="14" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="m4 7 8 6 8-6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>';}
/* SVG zámek (zlatý) pro toasty o hesle */
function lockSVG(){return '<svg width="19" height="19" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><rect x="4.5" y="10" width="15" height="10" rx="2.5" stroke="currentColor" stroke-width="1.7"/><path d="M8 10V7.5a4 4 0 0 1 8 0V10" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="15" r="1.4" fill="currentColor"/></svg>';}
/* SVG osoba (zlatá) pro uvítací toasty po přihlášení */
function userSVG(s){s=s||19;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle"><circle cx="12" cy="8" r="3.6" stroke="currentColor" stroke-width="1.7"/><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>`;}
/* malé inline SVG ikonky pro chipy/odznaky (dědí currentColor) */
function capSVG(s){s=s||14;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M12 4 2 9l10 5 8-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M20 10v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6 11.5V16c0 1.3 2.7 2.4 6 2.4s6-1.1 6-2.4v-4.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function speechSVG(s){s=s||14;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M4 5h16v11H9l-5 4V5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/></svg>`;}
function carSVG(s){s=s||14;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M5 11l1.6-4.6A2 2 0 0 1 8.5 5h7a2 2 0 0 1 1.9 1.4L19 11M4.5 11h15v5h-15v-5Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><circle cx="8" cy="16.4" r="1.5" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="16.4" r="1.5" stroke="currentColor" stroke-width="1.5"/></svg>`;}
function starFillSVG(s){s=s||13;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="currentColor" style="vertical-align:-2px"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.8 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3Z"/></svg>`;}
/* ikony pro potvrzovací modal / bannery (dědí currentColor) */
function svgWrap(s,inner){s=s||30;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-3px">${inner}</svg>`;}
function trashSVG(s){return svgWrap(s,'<path d="M5 7h14M10 7V5h4v2M6 7l1 13h10l1-13" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M10 11v6M14 11v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>');}
function pauseSVG(s){return svgWrap(s,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M10 9v6M14 9v6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>');}
function checkCircleSVG(s){return svgWrap(s,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="m8 12 2.6 2.6L16 9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>');}
function warnSVG(s){return svgWrap(s,'<path d="M12 3.5 21 19H3L12 3.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M12 10v4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="16.6" r="1.1" fill="currentColor"/>');}
function downloadSVG(s){return svgWrap(s,'<path d="M12 4v10m0 0 4-4m-4 4-4-4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M5 18h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>');}
function arrowDownSVG(s){return svgWrap(s,'<path d="M12 5v14m0 0 5-5m-5 5-5-5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>');}
function docSVG(s){return svgWrap(s,'<path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v4h4" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9.5 12h5M9.5 15.5h5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>');}
function shieldSVG(s){return svgWrap(s,'<path d="M12 3 5 6v5.5c0 4.5 3 7.5 7 9 4-1.5 7-4.5 7-9V6l-7-3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="m9 11.5 2 2 3.6-3.9" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>');}
function clipboardSVG(s){return svgWrap(s,'<rect x="5" y="4.5" width="14" height="16.5" rx="2.3" stroke="currentColor" stroke-width="1.7"/><rect x="9" y="3" width="6" height="3.2" rx="1.1" stroke="currentColor" stroke-width="1.7"/><path d="M9 11h6M9 15h4" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>');}
function editSVG(s){return svgWrap(s,'<path d="M5 19h14" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M14.5 5.5l3 3L9 17l-3.5.5.5-3.5 8.5-8.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>');}
function selfieSVG(s){return svgWrap(s,'<rect x="3.5" y="6" width="17" height="13" rx="2.5" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12.5" r="3" stroke="currentColor" stroke-width="1.7"/><path d="M8 6l1.2-2h5.6L16 6" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>');}
function idCardSVG(s){return svgWrap(s,'<rect x="3" y="5.5" width="18" height="13" rx="2.3" stroke="currentColor" stroke-width="1.7"/><circle cx="8.5" cy="11" r="2" stroke="currentColor" stroke-width="1.6"/><path d="M5.5 16c.5-1.6 1.6-2.4 3-2.4s2.5.8 3 2.4M14 9.5h4M14 12.5h4M14 15h2.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>');}
function paperclipSVG(s){return svgWrap(s,'<path d="M18 7.5 9.5 16a3 3 0 0 1-4.2-4.2l8-8a4.5 4.5 0 0 1 6.4 6.4l-8 8a6 6 0 0 1-8.5-8.5l7.3-7.3" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>');}
function phoneSVG(s){return svgWrap(s,'<path d="M6 3h3l1.5 5-2 1.5a11 11 0 0 0 5 5l1.5-2 5 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>');}
function handWaveSVG(s){return svgWrap(s,'<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V10m0-1V4.5a1.5 1.5 0 0 1 3 0V10m0-1.5V5a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a7 7 0 0 1-6-3.4L4 14.2a1.6 1.6 0 0 1 2.6-1.8L8 14" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>');}
function infoSVG(s){return svgWrap(s,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 11v5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="7.8" r="1.1" fill="currentColor"/>');}
function sparkleSVG(s){s=s||15;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M12 3c.6 3.8 1.7 4.9 5.5 5.5C13.7 9.1 12.6 10.2 12 14c-.6-3.8-1.7-4.9-5.5-5.5C10.3 7.9 11.4 6.8 12 3Z" fill="currentColor"/><path d="M18 13c.3 1.9.9 2.5 2.8 2.8-1.9.3-2.5.9-2.8 2.7-.3-1.8-.9-2.4-2.7-2.7 1.8-.3 2.4-.9 2.7-2.8Z" fill="currentColor"/></svg>`;}
function clockSVG(s){s=s||14;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-3px;margin-right:5px"><circle cx="12" cy="12" r="9" stroke="#C9A233" stroke-width="1.7"/><path d="M12 7.5V12l3 1.8" stroke="#C9A233" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function smileSVG(s){s=s||20;return `<span style="color:#C9A233">${svgWrap(s,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 14a4 4 0 0 0 7 0" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="9" cy="10" r="1.1" fill="currentColor"/><circle cx="15" cy="10" r="1.1" fill="currentColor"/>')}</span>`;}
/* prostá fajfka (bez kruhu) pro inline ✓ v UI */
function checkSVG(s){s=s||13;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M5 12.5l4.2 4.2L19 6.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
/* SVG hvězda – výplň (on) i obrys (prázdná) pro hodnocení */
function starOutlineSVG(s){s=s||13;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 17.8 6.8 19.1l1-5.8L3.5 9.2l5.9-.9L12 3Z" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>`;}
/* řetězec N hvězd (zlatá výplň) pro zobrazení hodnocení */
function starsRow(n,s){n=Math.max(0,Math.round(n||0));return starFillSVG(s).repeat(n);}
function imageSVG(s){return svgWrap(s,'<rect x="3.5" y="5" width="17" height="14" rx="2.3" stroke="currentColor" stroke-width="1.7"/><circle cx="8.5" cy="10" r="1.6" stroke="currentColor" stroke-width="1.5"/><path d="m5 17 4.5-4.5 3 3L16 12l3.5 3.5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>');}
function pdfSVG(s){return svgWrap(s,'<path d="M7 3h7l4 4v14H7V3Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M14 3v4h4" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M9 16.5h1.2a1.2 1.2 0 0 0 0-2.4H9v4M14.6 14.1v4M13.4 16h1.6M16.4 14.1h1.8M16.4 16h1.4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>');}

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
function getSearchLocations(){
  const seen=new Set();
  CAREGIVERS.forEach(c=>{
    const loc=String((c&&c.loc)||'').trim();
    if(!loc||!c.verified||c.suspended)return;
    seen.add(loc);
  });
  return Array.from(seen).sort((a,b)=>a.localeCompare(b,'cs'));
}
function renderSearchLocations(){
  const sel=document.getElementById('loc');
  if(!sel)return;
  const current=sel.value||'';
  const locations=getSearchLocations();
  sel.innerHTML=['<option value="">Všechny lokality</option>']
    .concat(locations.map(loc=>`<option value="${esc(loc)}">${esc(loc)}</option>`))
    .join('');
  sel.value=locations.includes(current)?current:'';
  if(sel._ddRefresh)sel._ddRefresh();
}
function renderFilters(){
  renderSearchLocations();
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
          <div class="care-meta"><span class="stars">${starFillSVG()}</span><b style="color:var(--navy-900)">${c.rating}</b><span>(${c.reviews}) · ${c.exp} let praxe</span></div>
        </div>
      </div>
      <div class="care-tags">
        ${cgBadges(c)}
        ${c.services.map(s=>`<span class="chip">${sName(s)}</span>`).join('')}
        ${c.kmPrice>0?`<span class="chip">${carSVG()} ${c.kmPrice} Kč/km</span>`:''}
      </div>
      <div class="care-foot">
        <div class="price">${priceShort(c)}</div>
        <button class="btn btn-gold" style="padding:9px 16px" onclick="event.stopPropagation();openProfile(${c.id})">Zobrazit profil</button>
      </div>
    </div>`).join('');
}

/* ---------- PROFILE ---------- */
async function openProfile(id,fromPop){
  if(!document.getElementById('profileGrid')&&isDeferredView('profile')){
    try{
      await ensureDeferredViewsLoaded();
    }catch(e){
      toast('Nepodařilo se načíst profil pečovatelky.','declined');
      return;
    }
  }
  state.caregiverId=id;const c=cg(id);
  const grid=document.getElementById('profileGrid');
  if(!c||!grid)return;
  state.profileToken=c.publicId||null;state.profileKind='caregiver';
  const revs=[...(cgReviews[id]||[]),...REVIEWS];
  const revCount=c.reviews+((cgReviews[id]||[]).length);
  grid.innerHTML=`
    <div class="pcard">
      <div class="phead">
        ${avaHtml(c.init,c.photo)}
        <div>
          <h1>${esc(c.name)}</h1>
          <div class="pmeta">
            <span class="stars">${starsRow(5)} <b style="color:var(--navy-900)">${c.rating}</b> <span style="color:var(--muted)">(${c.reviews} hodnocení)</span></span>
          </div>
          <div class="presence" id="profilePresence" hidden><span class="pres-dot"></span><span class="pres-txt"></span></div>
          <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap">
            ${cgBadges(c)}
            ${c.cert?`<span class="chip">${capSVG()} Ověřené vzdělání</span>`:''}
            ${(c.langs||[]).map(l=>`<span class="chip plang">${speechSVG()} <span class="plang-full">${esc(l)}</span><span class="plang-short">${esc(langAbbr(l))}</span></span>`).join('')}
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
      <div class="pservices" style="display:flex;flex-wrap:wrap;gap:8px;margin-top:6px">
        ${c.services.map(s=>`<span class="chip gold">${sName(s)}</span>`).join('')}
      </div>
      <div class="pdiv"></div>
      <h3>Hodnocení (${revCount})</h3>
      ${revs.map(r=>`<div class="rev"><div class="ava">${esc(r.init)}</div><div><div class="rb">${esc(r.name)} <span class="stars" style="font-size:12px">${starsRow(r.stars,12)}</span></div><div class="rt">${esc(r.text)}</div></div></div>`).join('')}
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
      <button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openChat(${c.id},${jsq(c.name)},${jsq(c.init)},'caregiver')">Napsat zprávu</button>
    </div>`;
  go('profile',fromPop);
  startProfilePresence(id);
}

/* ---------- PRESENCE (online / naposledy aktivní) ---------- */
let profilePresenceTimer=null;
/* text „naposledy…" ze serverem spočítaného počtu sekund (odolné vůči hodinám klienta) */
function agoTextCz(sec){
  let s=Math.max(0,Math.floor(sec||0));
  if(s<60)return 'před chvílí';
  const m=Math.floor(s/60);if(m<60)return `před ${m} min`;
  const h=Math.floor(m/60);if(h<24)return `před ${h} h`;
  const d=Math.floor(h/24);if(d===1)return 'včera';
  if(d<30)return `před ${d} dny`;
  return 'před delší dobou';
}
function presenceAgo(p){return agoTextCz(p&&p.secondsAgo!=null?p.secondsAgo:0);}
/* naplní element {.pres-dot,.pres-txt}; vrátí false, když stav neznáme */
function applyPresence(el,p){
  if(!el)return false;
  const dot=el.querySelector('.pres-dot'),txt=el.querySelector('.pres-txt');
  if(!p||(!p.online&&!p.lastSeen)){el.hidden=true;return false;}
  const online=!!p.online;
  el.classList.toggle('is-online',online);
  el.classList.toggle('is-offline',!online);
  if(dot)dot.setAttribute('aria-hidden','true');
  if(txt)txt.textContent=online?'Online':('Naposledy aktivní '+presenceAgo(p));
  el.hidden=false;return true;
}
async function fetchCaregiverPresence(id){
  try{const r=await fetch('/api/presence/caregiver/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw 0;return await r.json();}
  catch(e){return null;}
}
async function refreshProfilePresence(id){
  const el=document.getElementById('profilePresence');
  if(!el||state.caregiverId!==id||activeView()!=='profile')return;
  applyPresence(el,await fetchCaregiverPresence(id));
}
function startProfilePresence(id){
  if(profilePresenceTimer){clearInterval(profilePresenceTimer);profilePresenceTimer=null;}
  refreshProfilePresence(id);
  profilePresenceTimer=setInterval(()=>{
    if(activeView()!=='profile'||state.caregiverId!==id){clearInterval(profilePresenceTimer);profilePresenceTimer=null;return;}
    refreshProfilePresence(id);
  },60000);
}

/* --- heartbeat: dej serveru vědět, že jsem aktivní --- */
let presencePingTimer=null;
async function presencePing(){
  if(!auth.loggedIn)return;
  if(document.visibilityState&&document.visibilityState!=='visible')return;
  try{await fetch('/api/presence/ping',{method:'POST',credentials:'same-origin',cache:'no-store'});}catch(e){}
}
function initPresencePing(){
  presencePing();
  if(presencePingTimer)clearInterval(presencePingTimer);
  presencePingTimer=setInterval(presencePing,45000);
  document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')presencePing();});
}
/* průběžně obnovuj seznam konverzací (nepřečtené) i mimo chat */
let chatWatchTimer=null;
function initChatWatch(){
  if(chatWatchTimer)clearInterval(chatWatchTimer);
  if(auth.loggedIn)loadConversations();
  chatWatchTimer=setInterval(()=>{if(auth.loggedIn&&activeView()!=='chat')loadConversations();},20000);
}

/* --- presence protistran v chatu (uložená na objektu konverzace) --- */
let chatPresenceTimer=null;
let chatTyping={cid:null,on:false,_t:null};
async function fetchChatPresence(){
  const targets=CONVERSATIONS.filter(c=>c.id>0&&!c.readonly&&c.role!=='admin');
  if(!targets.length)return;
  try{
    const r=await api('/presence/chat',{method:'POST',body:{items:targets.map(c=>({name:c.name,role:c.role||'caregiver'}))}});
    const byKey={};(r.items||[]).forEach(p=>{byKey[(p.role||'')+'|'+(p.name||'')]=p;});
    targets.forEach(c=>{const p=byKey[(c.role||'caregiver')+'|'+c.name];if(p)c.presence=p;});
    applyChatPresenceToDom();
  }catch(e){}
}
function applyChatPresenceToDom(){
  document.querySelectorAll('#chatList .chat-li[data-cid]').forEach(btn=>{
    const dot=btn.querySelector('.chat-li-dot');if(!dot)return;
    const c=CONVERSATIONS.find(x=>String(x.id)===btn.dataset.cid);const p=c&&c.presence;
    if(p&&(p.online||p.lastSeen)){dot.hidden=false;dot.classList.toggle('is-online',!!p.online);dot.classList.toggle('is-offline',!p.online);}
    else dot.hidden=true;
  });
  const head=document.getElementById('chatHead'),st=document.getElementById('chatHeadState');
  if(head&&st&&head.dataset.presRead!=='1'){
    const dot=st.querySelector('.pres-dot'),txt=st.querySelector('.pres-txt');
    // „píše…" má přednost před presence
    if(chatTyping.on&&chatTyping.cid===activeChat){if(dot)dot.hidden=true;if(txt)txt.textContent='píše…';return;}
    const c=CONVERSATIONS.find(x=>String(x.id)===head.dataset.cid);const p=c&&c.presence;
    if(p&&(p.online||p.lastSeen)){
      if(dot){dot.hidden=false;dot.classList.toggle('is-online',!!p.online);dot.classList.toggle('is-offline',!p.online);}
      if(txt)txt.textContent=p.online?'Online':('Naposledy aktivní '+presenceAgo(p));
    }else{
      if(dot)dot.hidden=true;if(txt)txt.textContent='';
    }
  }
}
function startChatPresence(){
  fetchChatPresence();
  if(chatPresenceTimer)clearInterval(chatPresenceTimer);
  chatPresenceTimer=setInterval(()=>{
    if(activeView()!=='chat'){clearInterval(chatPresenceTimer);chatPresenceTimer=null;return;}
    fetchChatPresence();
  },60000);
}
/* --- realtime přes SSE (okamžité zprávy, psaní, živá presence) --- */
let es=null;
function sortConvs(a,b){if(a.id===-1)return -1;if(b.id===-1)return 1;return (Date.parse(b.lastAt||0)||0)-(Date.parse(a.lastAt||0)||0);}
function handleRealtime(msg){
  if(!msg||!msg.type)return;
  if(msg.type==='message'){
    const c=CONVERSATIONS.find(x=>x.id===msg.conversationId);
    if(!c){loadConversations();return;}
    if(!c.msgs.some(m=>m.id===msg.message.id))c.msgs.push(msg.message);
    c.last=msg.message.text;c.lastAt=msg.message.createdAt;
    if(activeChat===c.id&&activeView()==='chat'){c.unread=0;api('/conversations/'+c.id+'/read',{method:'POST'}).catch(()=>{});}
    else c.unread=(c.unread||0)+1;
    CONVERSATIONS.sort(sortConvs);
    if(activeView()==='chat')renderChat();else updateAuthUI();
    return;
  }
  if(msg.type==='typing'){
    if(msg.conversationId!==activeChat)return;
    chatTyping.cid=msg.conversationId;chatTyping.on=!!msg.on;
    clearTimeout(chatTyping._t);
    if(msg.on)chatTyping._t=setTimeout(()=>{chatTyping.on=false;applyChatPresenceToDom();},5000);
    applyChatPresenceToDom();
    return;
  }
  if(msg.type==='presence'){
    const c=CONVERSATIONS.find(x=>x.id===msg.conversationId);
    if(!c)return;
    c.presence={online:!!msg.online,lastSeen:msg.lastSeen||null,secondsAgo:msg.secondsAgo||0};
    if(activeView()==='chat')applyChatPresenceToDom();
    return;
  }
}
function initRealtime(){
  if(!auth.loggedIn){teardownRealtime();return;}
  if(es)return;
  try{es=new EventSource('/api/stream');}catch(e){es=null;return;}
  es.onmessage=ev=>{try{handleRealtime(JSON.parse(ev.data));}catch(e){}};
}
function teardownRealtime(){if(es){try{es.close();}catch(e){}es=null;}}
/* odeslání indikátoru „píše…" (throttle) */
let _typingLastSent=0,_typingOffTimer=null;
function sendTyping(on){
  const c=CONVERSATIONS.find(x=>x.id===activeChat);
  if(!c||!(c.id>0)||c.readonly)return;
  api('/conversations/'+c.id+'/typing',{method:'POST',body:{on:!!on}}).catch(()=>{});
}
function onChatTypingInput(){
  const now=Date.now();
  if(now-_typingLastSent>2000){_typingLastSent=now;sendTyping(true);}
  clearTimeout(_typingOffTimer);
  _typingOffTimer=setTimeout(()=>{_typingLastSent=0;sendTyping(false);},3000);
}

/* otevři veřejný profil podle náhodného tokenu (#u-<token>) — pečovatelka i rodina */
async function openProfileByToken(token,fromPop){
  token=String(token||'').replace(/[^A-Za-z0-9]/g,'');
  if(!token){go('search');return;}
  // pečovatelku, kterou už máme načtenou, otevři rovnou (bez dotazu na server)
  const local=CAREGIVERS.find(x=>x.publicId===token);
  if(local){return openProfile(local.id,fromPop);}
  let data;
  try{
    const r=await fetch('/api/u/'+encodeURIComponent(token),{credentials:'same-origin'});
    if(!r.ok)throw 0;
    data=await r.json();
  }catch(e){toast('Profil nenalezen.','declined');go('search');return;}
  if(data.kind==='caregiver'&&cg(data.id))return openProfile(data.id,fromPop);
  if(data.kind==='account'&&data.profile)return renderPublicAccount(data.profile,token,fromPop);
  toast('Profil nenalezen.','declined');go('search');
}

/* přihlášený uživatel otevře svůj vlastní veřejný profil */
function openMyPublicProfile(){
  try{closeAccountMenu();}catch(e){}
  if(auth.publicId)openProfileByToken(auth.publicId);
  else toast('Veřejný profil zatím není k dispozici.','declined');
}

/* minimální veřejná vizitka účtu (rodina): jméno, foto, role, člen od */
async function renderPublicAccount(p,token,fromPop){
  if(!document.getElementById('profileGrid')&&isDeferredView('profile')){
    try{await ensureDeferredViewsLoaded();}catch(e){toast('Nepodařilo se načíst profil.','declined');return;}
  }
  const grid=document.getElementById('profileGrid');
  if(!grid)return;
  state.caregiverId=null;state.profileToken=token;state.profileKind='account';
  const roleLabel=p.role==='caregiver'?'Pečovatelka':'Rodina';
  const since=p.memberSince?('Člen od '+String(p.memberSince).slice(0,4)):'';
  grid.innerHTML=`
    <div class="pcard">
      <div class="phead">
        ${avaHtml(p.init||initials(p.name),p.photo)}
        <div>
          <h1>${esc(p.name||'Uživatel')}</h1>
          <div class="pmeta" style="margin-top:12px">
            <span class="chip gold">${roleLabel}</span>
            ${since?`<span class="chip">${esc(since)}</span>`:''}
          </div>
        </div>
      </div>
    </div>`;
  go('profile',fromPop);
}

/* ---------- BOOKING ---------- */
let pendingBookingId=null;
/* po přihlášení/registraci dokonči odloženou objednávku; vrací true, pokud něco čekalo */
function resumePendingBooking(){
  if(pendingBookingId==null||!auth.loggedIn||auth.role!=='family')return false;
  const id=pendingBookingId;pendingBookingId=null;
  toast('Hotovo! Teď můžete dokončit objednávku.');
  openBooking(id);
  return true;
}
function openBooking(id){
  if(!auth.loggedIn){
    pendingBookingId=id;
    toast('Pro objednání služby se prosím přihlaste.');
    go('login');
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
      <div style="font-size:12.5px;color:#A2B0A6">${esc(c.loc)} · ${starFillSVG(11)} ${c.rating}</div></div>
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
  if(!date){toast('Vyberte prosím datum péče.');document.getElementById('bkDate').focus();return;}
  if(date<todayISO()){toast('Datum nemůže být v minulosti.');document.getElementById('bkDate').focus();return;}
  if(!time){toast('Vyberte prosím čas.');document.getElementById('bkTime').focus();return;}
  if(addr.length<5){toast('Zadejte prosím platnou adresu.');document.getElementById('bkAddr').focus();return;}
  const note=document.getElementById('bkNote').value.trim();
  const hours=state.bkHours;
  const km=Math.max(0,+document.getElementById('bkKm').value||0);
  if(!auth.loggedIn){toast('Pro objednávku se prosím přihlaste.');go('login');return;}
  api('/orders',{method:'POST',body:{cid:c.id,service:state.bkService,hours,date,time,addr,note,km}})
    .then(r=>{const o=r.order;
      ORDERS.unshift({oid:o.oid,cid:c.id,service:state.bkService,hours,date,time,addr,note,km,status:'pending'});
      orderSeq=Math.max(orderSeq,o.oid);
      toast(`Objednávka u <b>${esc(c.name)}</b> odeslána — čeká na potvrzení`,'success');
      setTimeout(()=>go('bookings'),900);
    })
    .catch(e=>toast('Objednávku se nepodařilo odeslat: '+e.message,'declined'));
}

/* ---------- DATE HELPER ---------- */
function todayISO(){
  const d=new Date();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');
  return `${d.getFullYear()}-${m}-${day}`;
}

/* ---------- AUTH ---------- */
let regRole='family';
const auth={loggedIn:false,name:'',email:'',role:'family',photo:null,publicId:null};
const DEFERRED_VIEW_IDS=new Set([
  'profile','booking','bookings',
  'cg-dashboard','cg-requests','cg-calendar','cg-profile','cg-verify',
  'chat',
  'order-detail','login','forgot','reset-password','change-email','register',
  'fam-dash','admin-dash','admin-verify','admin-caregivers','admin-users','admin-orders','admin-audit','admin-broadcast','admin-plans','admin-social',
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
      initLocationAutocomplete();
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
/* JS řetězec bezpečný uvnitř dvojitých uvozovek atributu (onclick="…") —
   JSON.stringify dá "…" a esc je změní na &quot;, prohlížeč je dekóduje zpět */
function jsq(v){return esc(JSON.stringify(String(v==null?'':v)));}
function initials(name){
  const p=name.trim().split(/\s+/);
  return ((p[0]?.[0]||'')+(p[1]?.[0]||'')).toUpperCase()||'Z';
}
/* avatar: foto, nebo iniciály (velikost řeší kontextové CSS) */
function avaHtml(init,photo,extra){
  extra=extra||'';
  return photo
    ? `<div class="ava"${extra?` style="${extra}"`:''}><img src="${esc(photo)}" alt="" loading="lazy" decoding="async"></div>`
    : `<div class="ava"${extra?` style="${extra}"`:''}>${init}</div>`;
}
/* profilová fotka uživatele podle e-mailu (z uživatelů nebo z karty pečovatelky) */
function userPhotoByEmail(email){
  if(!email)return null;
  const u=(typeof USERS!=='undefined'&&USERS||[]).find(x=>x.email===email);
  if(u&&u.photo)return u.photo;
  const c=(typeof CAREGIVERS!=='undefined'&&CAREGIVERS||[]).find(x=>x.email===email);
  return (c&&c.photo)||null;
}
function setAva(el,photo,init){
  if(!el)return;
  el.style.backgroundImage='';el.style.color='';
  if(photo){el.innerHTML=`<img src="${esc(photo)}" alt="" loading="lazy" decoding="async">`;}
  else{el.textContent=init;}
}
/* propíše profilovou fotku pečovatelky do seznamu (Jana = id 1) */
/* propíše fotku PŘIHLÁŠENÉ pečovatelky do její vlastní karty (ne cizí, ne u hosta) */
function syncCgPhotoToList(){
  if(auth.role!=='caregiver'||!auth.email)return;
  const me=CAREGIVERS.find(x=>x.email===auth.email);
  if(me&&cgProfile.photo)me.photo=cgProfile.photo;
}

/* ---- session ---- */
function loginAs(name,email,role,photo,publicId){
  auth.loggedIn=true;auth.name=name;auth.email=email;auth.role=role||'family';
  if(photo!==undefined)auth.photo=photo||null;
  if(publicId!==undefined)auth.publicId=publicId||null;
  updateAuthUI();
  try{presencePing();}catch(e){}
  try{loadConversations();}catch(e){}
  try{initRealtime();}catch(e){}
}
async function logout(){
  try{await api('/auth/logout',{method:'POST'});}catch(e){}
  auth.loggedIn=false;auth.name='';auth.email='';auth.role='family';auth.publicId=null;
  teardownRealtime();CONVERSATIONS=[];
  closeAccountMenu();
  await apiSync(bootstrap());
  updateAuthUI();renderCare();
  toast('Byli jste odhlášeni.');
  go('home');
}

/* ---------- NASTAVENÍ ---------- */
async function forceLogout(reason){
  auth.loggedIn=false;auth.name='';auth.email='';auth.role='family';auth.photo=null;auth.publicId=null;
  teardownRealtime();CONVERSATIONS=[];
  closeAccountMenu();
  await apiSync(bootstrap());
  updateAuthUI();renderCare();
  if(reason)toast(reason,'declined');
  go('home');
}
let appSettings={email:true,requests:true,chat:true,reminders:true};
function renderSettings(){
  ['email','requests','chat','reminders'].forEach(k=>{
    const el=document.getElementById('nt'+k.charAt(0).toUpperCase()+k.slice(1));
    if(el)el.checked=!!appSettings[k];
  });
  const name=auth.loggedIn?auth.name:'Host';
  document.getElementById('setName').textContent=name;
  document.getElementById('setEmail').textContent=auth.loggedIn?auth.email:'—';
  document.getElementById('setRole').textContent=auth.role==='caregiver'?'Účet pečovatelky':(auth.role==='admin'?'Správce systému':'Účet rodiny');
  const photo=auth.photo||(auth.role==='caregiver'?cgProfile.photo:null);
  setAva(document.getElementById('setAva'),photo,initials(name));
  const rm=document.getElementById('setPhotoRemove');if(rm)rm.style.display=photo?'':'none';
}
/* nahrání/odebrání profilovky uživatele (Nastavení) — uloží se k uživateli a propíše do avatarů */
function onUserPhoto(e){
  const file=e.target.files&&e.target.files[0];if(!file)return;
  if(!file.type.startsWith('image/')){toast('Vyberte prosím obrázek.','declined');return;}
  const reader=new FileReader();
  reader.onload=function(){
    const img=new Image();
    img.onload=function(){
      const max=400;let w=img.width,h=img.height;
      if(w>h){if(w>max){h=Math.round(h*max/w);w=max;}}else{if(h>max){w=Math.round(w*max/h);h=max;}}
      const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(img,0,0,w,h);
      const data=c.toDataURL('image/webp',0.85);
      auth.photo=data;
      if(auth.role==='caregiver'){cgProfile.photo=data;const me=CAREGIVERS.find(x=>x.email===auth.email);if(me){me.photo=data;apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{photo:data}}));}syncCgPhotoToList();}
      apiSync(api('/users/me/photo',{method:'PATCH',body:{photo:data}}));
      updateAuthUI();renderSettings();renderCare();
      toast('Profilová fotka nahrána','success');
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
function removeUserPhoto(){
  auth.photo=null;
  const inp=document.getElementById('setPhotoInput');if(inp)inp.value='';
  if(auth.role==='caregiver'){cgProfile.photo=null;const me=CAREGIVERS.find(x=>x.email===auth.email);if(me){me.photo=null;apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{photo:null}}));}syncCgPhotoToList();}
  apiSync(api('/users/me/photo',{method:'PATCH',body:{photo:null}}));
  updateAuthUI();renderSettings();renderCare();
  toast('Profilová fotka odebrána');
}
function toggleSetting(key,el){appSettings[key]=el.checked;if(auth.loggedIn)apiSync(api('/users/me/settings',{method:'PATCH',body:{settings:appSettings}}));toast('Nastavení uloženo');}
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
    toast('Heslo bylo změněno');
  }catch(e2){err.textContent=e2.message||'Změna hesla se nezdařila.';}
  return false;
}
async function requestEmailChange(){
  const err=document.getElementById('emailChangeReqErr');
  if(err)err.textContent='';
  try{
    await api('/auth/change-email/request',{method:'POST'});
    toast('Poslali jsme potvrzovaci odkaz na puvodni e-mail.');
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
    toast(resend?'Poslali jsme novy overovaci kod.':'Poslali jsme overovaci kod na novy e-mail.',null,envelopeSVG());
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
    toast('E-mail byl zmenen.');
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
    toast('Data byla exportována');
  }catch(e){toast('Export se nezdařil');}
}
function deleteAccount(){
  askConfirm({title:'Smazat účet?',icon:trashSVG(),
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
    const u=chatUnread();
    msgBtn.hidden=!(hasChat&&u>0);
    const badge=document.getElementById('msgBadge');
    msgBtn.classList.toggle('has-unread',hasChat&&u>0);
    if(badge){badge.hidden=!(hasChat&&u>0);badge.textContent=u>9?'9+':u;}
    msgBtn.setAttribute('aria-label',u>0?`Zprávy — ${u} nepřečtené`:'Zprávy');
  }
  if(inn){
    setAva(document.getElementById('avatarInit'), auth.photo||(auth.role==='caregiver'?cgProfile.photo:null), initials(auth.name));
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
        +mi("go('admin-social')",'Sociální sítě','<circle cx="6" cy="12" r="2.2" stroke="#7A736A" stroke-width="1.6"/><circle cx="17" cy="6.5" r="2.2" stroke="#7A736A" stroke-width="1.6"/><circle cx="17" cy="17.5" r="2.2" stroke="#7A736A" stroke-width="1.6"/><path d="m8 11 7-3.4M8 13l7 3.4" stroke="#7A736A" stroke-width="1.6"/>')
      : auth.role==='caregiver'
      ? mi("go('cg-dashboard')",'Přehled',gridIcon)
        +mi("go('cg-requests')",'Poptávky','<path d="M3 6h18v12H3z" stroke="#7A736A" stroke-width="1.6"/><path d="m3 7 9 6 9-6" stroke="#7A736A" stroke-width="1.6"/>')
        +mi("go('chat')",zpr,chatIcon)
        +mi("go('cg-profile')",'Můj profil','<circle cx="12" cy="8" r="3.4" stroke="#7A736A" stroke-width="1.6"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#7A736A" stroke-width="1.6"/>')
      : mi("go('bookings')",'Moje objednávky','<rect x="4" y="5" width="16" height="16" rx="2" stroke="#7A736A" stroke-width="1.6"/><path d="M4 9h16M8 3v4M16 3v4" stroke="#7A736A" stroke-width="1.6" stroke-linecap="round"/>')
        +mi("go('chat')",zpr,chatIcon)
        +mi("openMyPublicProfile()",'Můj veřejný profil','<circle cx="12" cy="8" r="3.4" stroke="#7A736A" stroke-width="1.6"/><path d="M5 20c0-3.5 3-6 7-6s7 2.5 7 6" stroke="#7A736A" stroke-width="1.6"/>')
        +mi("go('search')",'Hledat péči','<circle cx="11" cy="11" r="7" stroke="#7A736A" stroke-width="1.6"/><path d="m20 20-3-3" stroke="#7A736A" stroke-width="1.6" stroke-linecap="round"/>');
  }
  const mm=document.getElementById('mmAuth');
  const greet=document.getElementById('homeGreeting');
  if(inn&&auth.role==='family'){greet.hidden=false;greet.innerHTML=`<span style="color:#C9A233">${handWaveSVG(16)}</span> Vítejte zpět, <b style="color:var(--navy-900)">${esc(auth.name.split(/\s+/)[0])}</b>`;}
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
    loginAs(r.user.name,r.user.email,r.user.role,r.user.photo,r.user.publicId);
    if(r.user.settings)Object.assign(appSettings,r.user.settings);
    await apiSync(bootstrap());updateAuthUI();renderCare();
    toast(`Vítejte zpět, <b>${esc(auth.name.split(/\s+/)[0])}</b>!`,null,userSVG());
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
  const prefix=(document.getElementById('regPhonePrefix')?.value||'+420').trim();
  const phFull=phone.value.trim()?`${prefix} ${phone.value.trim()}`:'';
  const eBad=!isEmail(email.value),phBad=!isPhone(phFull),pBad=!isStrongPassword(pw.value),tBad=!terms.checked;
  setFieldError('rf-name',nBad);setFieldError('rf-email',eBad);setFieldError('rf-phone',phBad);
  setFieldError('rf-pw',pBad);setFieldError('rf-terms',tBad);
  const firstBad=[[nBad,name],[eBad,email],[phBad,phone],[pBad,pw]].find(x=>x[0]);
  if(firstBad){firstBad[1].focus();return false;}
  if(tBad){document.getElementById('regTerms').focus();return false;}
  try{
    const r=await api('/auth/register',{method:'POST',body:{name:name.value.trim(),email:email.value.trim().toLowerCase(),password:pw.value,role:regRole}});
    loginAs(r.user.name,r.user.email,r.user.role,r.user.photo,r.user.publicId);
    await apiSync(bootstrap());updateAuthUI();renderCare();
    toast(regRole==='caregiver'?'Účet pečovatelky vytvořen. Dokončete prosím ověření.':'Účet vytvořen. Vítejte v ZENVORIA!','success');
    if(!resumePendingBooking())go(landingView());
  }catch(err){
    setFieldError('rf-email',true);
    document.getElementById('rf-email-err')&&(document.getElementById('rf-email-err').textContent=err.message);
    toast(''+(err.message||'Registrace se nezdařila.'),'declined');
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
      toast('Odeslali jsme odkaz pro obnovu hesla.',null,envelopeSVG());
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
    toast('Nové heslo bylo uloženo.',null,lockSVG());
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
    html+=`<div class="day ${has?'has':''} ${today?'today':''}" ${has?'role="button" tabindex="0"':''} aria-label="${lbl}" onclick="${has?`toast('Máte naplánovanou službu ${d}. ${MONTHS[calMonth].toLowerCase()}')`:''}">${d}</div>`;
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
  const name=auth.loggedIn?auth.name:'Uživatel';
  setAva(document.getElementById('famDashAva'),auth.photo,initials(name));
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
        <div class="ost"><span class="status ok">${starFillSVG(11)} ${nc.rating}</span></div>
      </div>`:'<div class="empty" style="padding:14px">Zatím nemáte naplánovanou péči.</div>'}
      <div class="qa" style="margin-top:10px">
        <button class="qa-item" onclick="go('bookings')"><span class="qa-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C9A233" stroke-width="1.6"/><path d="M12 7v5l3 2" stroke="#C9A233" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg></span><span class="qa-l">Historie péče (${done} dokončených)</span><span class="qa-ar">›</span></button>
        <button class="qa-item" onclick="toast('SOS linka 24/7: +420 800 999 111')"><span class="qa-ic"><svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C9A233" stroke-width="1.6"/><circle cx="12" cy="12" r="3.4" stroke="#C9A233" stroke-width="1.6"/><path d="m5.4 5.4 4 4M18.6 5.4l-4 4M18.6 18.6l-4-4M5.4 18.6l4-4" stroke="#C9A233" stroke-width="1.6" stroke-linecap="round"/></svg></span><span class="qa-l">SOS linka 24/7</span><span class="qa-ar">›</span></button>
      </div>`;
  }
  const rec=CAREGIVERS.slice().filter(c=>c.verified&&!c.suspended).sort((a,b)=>(b.plan==='premium')-(a.plan==='premium')||b.rating-a.rating).slice(0,3);
  document.getElementById('famRecommended').innerHTML=rec.map(c=>`
    <div class="order" style="cursor:pointer" role="button" tabindex="0" onclick="openProfile(${c.id})">
      ${avaHtml(c.init,c.photo)}
      <div class="od"><b>${esc(c.name)}</b><div class="det">${esc(c.loc)} · ${c.exp} let praxe</div></div>
      <div class="ost"><span class="status ok">${starFillSVG(11)} ${c.rating}</span><div class="pr">${c.rate} Kč</div></div>
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
  if(c.rating>=4.85)b.push(`<span class="chip badge-top">${starFillSVG()} Top hodnocení</span>`);
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
    :`<div class="verify-banner wait" style="margin-bottom:24px"><span class="vb-ic" style="color:var(--gold-deep)">${userSVG(26)}</span><div class="vb-t"><b>Jste pečovatelka?</b><span>Zaregistrujte se a vyberte si tarif. Ceník je informativní.</span></div></div>`;
  document.getElementById('planGrid').innerHTML=['start','premium'].map(key=>{
    const p=PLANS[key];const featured=key==='premium';
    let action;
    if(isCg){action=cur===key
      ?(key==='premium'
        ? '<div class="plan-current">'+checkSVG()+' Váš aktuální tarif</div><button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openBillingPortal(this)">Spravovat předplatné</button>'
        : '<div class="plan-current">'+checkSVG()+' Váš aktuální tarif</div>')
      :(key==='premium'
        ? `<button class="btn btn-gold btn-block" onclick="startPremiumCheckout(this)">Zaplatit a aktivovat PREMIUM</button>`
        : `<button class="btn btn-ghost btn-block" onclick="setPlan('start')">Přejít na START</button>`);}
    else{action=`<button class="btn ${featured?'btn-gold':'btn-ghost'} btn-block" onclick="go('register');pickRole('caregiver')">Začít s ${p.name}</button>`;}
    return `<div class="plan-card ${featured?'featured':''}">
      ${featured?'<span class="pl-tag">NEJOBLÍBENĚJŠÍ</span>':''}
      <h3>${planIcon(key,22)} ${p.name}</h3>
      <div class="pl-price">${planPrice(key)>0?planPrice(key).toLocaleString('cs-CZ')+' Kč <span>/ měsíc</span>':'Zdarma'}</div>
      <div class="pl-sub">${featured?'Pro pečovatelky, které chtějí být více vidět.':(planPrice('start')>0?'Pro pečovatelky, které začínají.':'Základní tarif zdarma — automaticky po ověření.')}</div>
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
    toast(key==='premium'?'Aktivován tarif PREMIUM!':'Tarif změněn na START.',key==='premium'?null:undefined,key==='premium'?diamondSVG(20,'#13A552'):undefined);};
  if(key==='start'&&cgPlan()==='premium'){
    askConfirm({title:'Přejít na START?',icon:arrowDownSVG(),
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
    toast(''+(e.message||'Platba se nezdařila.'),'declined');
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
    toast(''+(e.message||'Správu předplatného se nepodařilo otevřít.'),'declined');
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
  toast('Platba proběhla. Aktivuji PREMIUM…');
  // webhook může chvíli trvat — pár pokusů obnovit data
  for(let i=0;i<5;i++){
    await new Promise(r=>setTimeout(r,1500));
    try{await bootstrap();updateAuthUI();renderCare();renderPricing();}catch(e){}
    if(cgPlan()==='premium'){toast('Aktivován tarif PREMIUM!');return;}
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
  else{toast('Přihlaste se jako pečovatelka a dokončete ověření.');go('login');}
}
const VER_BANNER={
  verified:{cls:'ok',ic:`<span style="color:#2E7D46">${checkCircleSVG(28)}</span>`,t:'Jste ověřená pečovatelka',s:'Váš profil je viditelný rodinám ve vyhledávání.'},
  submitted:{cls:'wait',ic:`<span style="color:#B7791F">${svgWrap(28,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4.5l2.8 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>')}</span>`,t:'Žádost čeká na schválení',s:'Správce kontroluje vaše doklady, zpravidla do 48 hodin.'},
  rejected:{cls:'bad',ic:`<span style="color:#C0473B">${warnSVG(28)}</span>`,t:'Žádost byla zamítnuta',s:'Upravte prosím údaje a odešlete znovu.'},
  pending:{cls:'wait',ic:`<span style="color:#C9A233">${editSVG(28)}</span>`,t:'Dokončete své ověření',s:'Vyplňte formulář a nahrejte osvědčení, abyste se zobrazili rodinám.'}
};
let verifyDocName='';
let verifySelfieName='';
let verifyDocData='';
let verifySelfieData='';
let verifyIdFrontName='';
let verifyIdFrontData='';
let verifyIdBackName='';
let verifyIdBackData='';
/* služby vybrané ve formuláři ověření */
let verifyExtraCerts=[];
let verifyValidTarget='primary';
let verifyServices=[];
function renderVerifyServiceChips(){
  const wrap=document.getElementById('vfServices');if(!wrap)return;
  const locked=(cgStatus()==='verified'||cgStatus()==='submitted');
  wrap.innerHTML=SERVICES.map(s=>
    `<button type="button" class="cg-serv ${verifyServices.includes(s.id)?'on':''}" ${locked?'disabled':''} onclick="toggleVerifyService('${s.id}')">${s.name}</button>`).join('');
}
function toggleVerifyService(id){
  const i=verifyServices.indexOf(id);
  if(i<0)verifyServices.push(id);else verifyServices.splice(i,1);
  renderVerifyServiceChips();
}
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

/* přehled už odeslané žádosti (jen ke čtení) — pečovatelka nemůže poslat novou, ale vidí svou */
function submittedVerificationCard(v){
  const svc=(v.services||[]).map(s=>`<span class="chip">${esc(sName(s))}</span>`).join('');
  const row=(l,r)=>`<div class="vsum-row"><span class="vsum-l">${l}</span><span class="vsum-r">${r}</span></div>`;
  const clock=svgWrap(30,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4.5l2.8 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>');
  return `
    <div class="vsum-head">
      <span class="vsum-ic" style="color:#B7791F">${clock}</span>
      <div>
        <h3 style="margin:0">Odeslaná žádost o ověření</h3>
        <span style="color:var(--muted);font-size:13px">Dokud ji správce nevyřídí, nelze odeslat novou.</span>
      </div>
    </div>
    <div class="vsum">
      ${row('Stav','<span class="badge wait">Čeká na schválení</span>')}
      ${row('Odesláno',esc(fmtDate(v.date)))}
      ${row('Jméno',esc(v.name||'—'))}
      ${row('Lokalita',esc(v.loc||'—'))}
    </div>
    <button type="button" class="btn btn-ghost btn-block" style="margin-top:18px" onclick="toggleMyVerifyDetail(this)">Zobrazit podrobnosti</button>
    <div id="cgVerifyDetail" style="display:none;margin-top:8px">
      <div class="vsum">
        ${row('Telefon',esc(v.phone||'—'))}
        ${row('Doklad',esc(v.docType||'—')+(v.docNum?' · č. '+esc(v.docNum):''))}
        ${row('Osvědčení',esc(v.cert||'—')+(v.issuer?'<br><span style="font-weight:400;color:var(--muted);font-size:13px">'+esc(v.issuer)+'</span>':''))}
        ${v.validUntil?row('Platnost do',esc(v.validUntil)):''}
        ${v.fileName?row('Nahraný doklad',esc(v.fileName)):''}
        ${v.refs?row('Reference',esc(v.refs)):''}
        ${v.note?row('Poznámka',esc(v.note)):''}
      </div>
      ${svc?`<div class="vsum-block"><div class="vsum-l" style="margin-bottom:10px">Nabízené služby</div><div style="display:flex;flex-wrap:wrap;gap:8px">${svc}</div></div>`:''}
    </div>`;
}
function toggleMyVerifyDetail(btn){
  const d=document.getElementById('cgVerifyDetail');if(!d)return;
  const show=d.style.display==='none';
  d.style.display=show?'':'none';
  btn.textContent=show?'Skrýt žádost':'Zobrazit žádost';
}
/* ---- ověřená pečovatelka: správa / přidávání osvědčení ---- */
let addCertDocName='',addCertDocData='',addCertValid='';
function myCertifications(){
  const all=[];const seen=new Set();
  VERIFICATIONS.filter(x=>x.email===auth.email&&(x.status==='approved'||x.status==='verified')).forEach(v=>{
    const certs=Array.isArray(v.certifications)&&v.certifications.length?v.certifications:(v.cert?[{name:v.cert,issuer:v.issuer,validUntil:v.validUntil,fileName:v.fileName}]:[]);
    certs.forEach((c,i)=>{
      if(!c||!c.name)return;
      const k=(c.name||'').toLowerCase()+'|'+(c.issuer||'').toLowerCase();
      if(seen.has(k))return;seen.add(k);
      all.push({name:c.name,issuer:c.issuer,validUntil:c.validUntil,fileName:c.fileName,verId:v.id,fileKey:i===0?'doc':('certs:'+(i-1))});
    });
  });
  return all;
}
async function openMyCert(i){
  const c=myCertifications()[i];if(!c)return;
  const title=esc(c.name)+(c.issuer?' — '+esc(c.issuer):'')+(c.validUntil?' (platnost '+esc(c.validUntil)+')':'');
  const sf=await fetchVerFiles(c.verId);
  let data=null;
  if(c.fileKey==='doc')data=sf.doc||DOC_BLOBS[c.verId+':doc'];
  else{const m=String(c.fileKey).match(/^certs:(\d+)$/);if(m)data=(sf.certs&&sf.certs[+m[1]])||DOC_BLOBS[c.verId+':doc:'+m[1]];}
  if(data)openFileViewer(data,title,c.fileName,()=>downloadVerData(data,c.fileName||'osvedceni'));
  else toast('Doklad k tomuto osvědčení není k dispozici.','declined');
}
function renderVerifiedPanel(){
  const certs=myCertifications();
  const pend=VERIFICATIONS.find(v=>v.email===auth.email&&v.status==='submitted');
  const row=(l,r)=>`<div class="vsum-row"><span class="vsum-l">${l}</span><span class="vsum-r">${r}</span></div>`;
  const certRows=certs.length?certs.map((c,i)=>`<div class="vsum-row cert-row" role="button" tabindex="0" onclick="openMyCert(${i})" title="Zobrazit doklad"><span class="vsum-l" style="color:var(--navy-900);font-weight:600">${esc(c.name)}</span><span class="vsum-r" style="display:inline-flex;align-items:center;gap:8px;font-weight:400;color:var(--muted)">${esc(c.issuer||'—')}${c.validUntil?` · ${esc(c.validUntil)}`:''} ${eyeSVG(14)}</span></div>`).join(''):'<div class="vsum-row"><span class="vsum-l">Zatím žádné</span></div>';
  const addBlock=pend
    ? `<div class="verify-banner wait" style="margin-top:18px"><span class="vb-ic" style="color:#B7791F">${svgWrap(26,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="M12 8v4.5l2.8 1.6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>')}</span><div class="vb-t"><b>Nové osvědčení čeká na schválení</b><span>Správce ho zkontroluje, zpravidla do 48 hodin.</span></div></div>`
    : `<div class="pdiv"></div>
      <h3 style="margin-bottom:4px">Přidat osvědčení</h3>
      <p style="color:var(--muted);font-size:13px;margin-bottom:14px">Po schválení správcem se přidá k vašemu profilu.</p>
      <div class="grid2">
        <div><label class="lbl">Název osvědčení</label><input class="inp" id="acName" placeholder="Kurz první pomoci"></div>
        <div><label class="lbl">Vystavil (instituce)</label><input class="inp" id="acIssuer" placeholder="Český červený kříž"></div>
      </div>
      <div class="grid2" style="margin-top:14px">
        <div><label class="lbl">Platnost do (volitelné)</label><input type="hidden" id="acValid" value="${esc(addCertValid)}"><button type="button" class="inp date-trigger" id="acValidBtn" onclick="openVerifyValidModal('addcert')">${fmtVerifyValidDate(addCertValid)}</button></div>
        <div></div>
      </div>
      <div style="margin-top:14px">
        <label class="lbl">Doklad (sken / foto / PDF)</label>
        <label class="doc-drop"><span id="acDocText"><b>Nahrát soubor</b> — obrázek nebo PDF</span>
          <input type="file" accept="image/*,.pdf,.doc,.docx,.odt,.rtf,.txt,.heic" hidden id="acDoc" onchange="onAddCertDoc(event)"></label>
      </div>
      <div class="set-err" id="acErr" style="margin-top:12px"></div>
      <button type="button" class="btn btn-gold" style="margin-top:16px" id="acSubmit" onclick="addCertification()">Přidat osvědčení</button>`;
  return `
    <div class="vsum-head">
      <span class="vsum-ic" style="color:#2E7D46">${svgWrap(28,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.7"/><path d="m8 12 2.6 2.6L16 9.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>')}</span>
      <div><h3 style="margin:0">Jste ověřená pečovatelka</h3>
        <span style="color:var(--muted);font-size:13px">Váš profil je viditelný rodinám ve vyhledávání.</span></div>
    </div>
    <div class="vsum-l" style="margin-bottom:8px">Vaše osvědčení</div>
    <div class="vsum">${certRows}</div>
    ${addBlock}`;
}
function onAddCertDoc(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  addCertDocName=f.name;addCertDocData='';
  document.getElementById('acDocText').innerHTML=`${paperclipSVG(15)} <b>${esc(f.name)}</b> — připraveno`;
  readVerifyFile(f,res=>{addCertDocName=res.name;addCertDocData=res.data;document.getElementById('acDocText').innerHTML=`${paperclipSVG(15)} <b>${esc(res.name)}</b> — připraveno`;});
}
async function addCertification(){
  const g=id=>(document.getElementById(id)||{}).value||'';
  const err=document.getElementById('acErr');if(err)err.textContent='';
  const name=g('acName').trim(),issuer=g('acIssuer').trim(),validUntil=addCertValid||g('acValid').trim();
  if(!name){if(err){err.textContent='Zadejte název osvědčení.';}return;}
  if(!issuer){if(err){err.textContent='Zadejte instituci, která osvědčení vystavila.';}return;}
  if(!addCertDocName){if(err){err.textContent='Nahrajte doklad k osvědčení.';}return;}
  const btn=document.getElementById('acSubmit');if(btn){btn.disabled=true;btn.textContent='Odesílám…';}
  try{
    const r=await api('/certifications',{method:'POST',body:{name,issuer,validUntil,fileName:addCertDocName,fileData:addCertDocData}});
    if(r&&r.verification){VERIFICATIONS.unshift(r.verification);verSeq=Math.max(verSeq,r.verification.id||0);}
    addCertDocName='';addCertDocData='';addCertValid='';
    toast('Osvědčení odesláno správci ke schválení.','success');
    renderCgVerify();renderNav();
  }catch(ex){
    if(btn){btn.disabled=false;btn.textContent='Přidat osvědčení';}
    if(err)err.textContent=(ex&&ex.message)||'Osvědčení se nepodařilo odeslat.';
  }
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
  const form=document.getElementById('cgVerifyForm');
  const submittedBox=document.getElementById('cgVerifySubmitted');
  const aside=document.getElementById('cgVerifyAside');
  const vpanel=document.getElementById('cgVerifiedPanel');
  const hide=el=>{if(el)el.style.display='none';};
  hide(vpanel);
  // Ověřená pečovatelka → schovej formulář i pravý panel, ukaž správu osvědčení
  if(st==='verified'){
    addCertDocName='';addCertDocData='';addCertValid='';
    hide(form);hide(submittedBox);hide(aside);
    if(vpanel){vpanel.style.display='';vpanel.innerHTML=renderVerifiedPanel();ddRefresh();}
    return;
  }
  if(aside)aside.style.display='';
  // Máš-li odeslanou (čekající) žádost → skryj formulář a ukaž její přehled (jen ke čtení)
  const mine=VERIFICATIONS.find(v=>v.email===auth.email&&v.status==='submitted');
  if(st==='submitted'&&mine&&submittedBox){
    if(form)form.style.display='none';
    submittedBox.style.display='';
    submittedBox.innerHTML=submittedVerificationCard(mine);
    ddRefresh();
    return;
  }
  if(form)form.style.display='';
  if(submittedBox)submittedBox.style.display='none';
  // prefill
  const setv=(id,val)=>{const el=document.getElementById(id);if(el)el.value=val;};
  setv('vfName',auth.name||cgProfile.name);
  setv('vfLoc',cgProfile.loc||'Praha 6');
  setv('vfValid','');
  setv('vfCert','');
  setv('vfIssuer','');
  setVerifyPhoneValue('');
  verifyExtraCerts=[];
  verifyDocName='';verifyDocData='';
  renderVerifyExtraCerts();
  refreshVerifyValidTrigger();
  document.getElementById('vfDocText').innerHTML='<b>Nahrát soubor</b> — PDF, Word, obrázek nebo sken dokladu';
  document.getElementById('vfSelfieText').innerHTML='<b>Nahrát selfie</b> — potvrzení, že s registrací souhlasíte';
  document.getElementById('vfIdFrontText').innerHTML='<b>Přední strana</b> — foto nebo sken';
  document.getElementById('vfIdBackText').innerHTML='<b>Zadní strana</b> — foto nebo sken';
  verifyDocName='';verifySelfieName='';verifyDocData='';verifySelfieData='';
  verifyIdFrontName='';verifyIdFrontData='';verifyIdBackName='';verifyIdBackData='';
  verifyServices=(cgProfile.services||[]).slice();
  renderVerifyServiceChips();
  const btn=document.getElementById('vfSubmitBtn');
  const locked=(st==='verified'||st==='submitted');
  if(form)form.querySelectorAll('input,textarea,select,button').forEach(el=>el.disabled=locked);
  if(btn){btn.disabled=locked;btn.textContent=st==='rejected'?'Odeslat znovu':'Odeslat k ověření';}
  document.getElementById('vfErr').textContent='';
  ddRefresh();
}
function onVerifyDoc(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifyDocName=f.name;verifyDocData='';
  document.getElementById('vfDocText').innerHTML=`${paperclipSVG(15)} <b>${esc(f.name)}</b> — připraveno k odeslání`;
  readVerifyFile(f,res=>{verifyDocName=res.name;verifyDocData=res.data;document.getElementById('vfDocText').innerHTML=`${paperclipSVG(15)} <b>${esc(res.name)}</b> — připraveno k odeslání`;});
}
function onVerifySelfie(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifySelfieName=f.name;verifySelfieData='';
  document.getElementById('vfSelfieText').innerHTML=`${selfieSVG(15)} <b>${esc(f.name)}</b> — selfie připraveno`;
  readVerifyFile(f,res=>{verifySelfieName=res.name;verifySelfieData=res.data;document.getElementById('vfSelfieText').innerHTML=`${selfieSVG(15)} <b>${esc(res.name)}</b> — selfie připraveno`;});
}
function onVerifyIdFront(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifyIdFrontName=f.name;verifyIdFrontData='';
  document.getElementById('vfIdFrontText').innerHTML=`${idCardSVG(15)} <b>${esc(f.name)}</b>`;
  readVerifyFile(f,res=>{verifyIdFrontName=res.name;verifyIdFrontData=res.data;document.getElementById('vfIdFrontText').innerHTML=`${idCardSVG(15)} <b>${esc(res.name)}</b>`;});
}
function onVerifyIdBack(e){
  const f=e.target.files&&e.target.files[0];if(!f)return;
  verifyIdBackName=f.name;verifyIdBackData='';
  document.getElementById('vfIdBackText').innerHTML=`${idCardSVG(15)} <b>${esc(f.name)}</b>`;
  readVerifyFile(f,res=>{verifyIdBackName=res.name;verifyIdBackData=res.data;document.getElementById('vfIdBackText').innerHTML=`${idCardSVG(15)} <b>${esc(res.name)}</b>`;});
}
function getVerifyPhoneValue(){
  const prefix=(document.getElementById('vfPhonePrefix')?.value||'+420').trim();
  const local=(document.getElementById('vfPhone')?.value||'').trim();
  return `${prefix} ${local}`.trim();
}
function setVerifyPhoneValue(phone){
  const raw=String(phone||'').trim();
  const prefixEl=document.getElementById('vfPhonePrefix');
  const phoneEl=document.getElementById('vfPhone');
  if(!prefixEl||!phoneEl)return;
  const match=raw.match(/^(\+\d{1,4})\s*(.*)$/);
  if(match){
    prefixEl.value=Array.from(prefixEl.options).some(o=>o.value===match[1])?match[1]:'+420';
    phoneEl.value=match[2]||'';
    return;
  }
  prefixEl.value='+420';
  phoneEl.value=raw;
}
function renderVerifyExtraCerts(){
  const wrap=document.getElementById('vfExtraCerts');if(!wrap)return;
  wrap.innerHTML=verifyExtraCerts.map((item,idx)=>`
    <div class="pcard" style="padding:18px 18px 16px;margin-top:${idx?12:0}px">
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px">
        <b>Další osvědčení ${idx+2}</b>
        <button type="button" class="btn btn-ghost" onclick="removeVerifyExtraCertification(${idx})">Odebrat</button>
      </div>
      <div class="grid2" style="margin-top:6px">
        <div><label class="lbl">Název osvědčení nebo kurzu</label><input class="inp" value="${esc(item.name||'')}" oninput="updateVerifyExtraCertification(${idx},'name',this.value)" placeholder="Kurz pečovatelství č. ..."></div>
        <div><label class="lbl">Vystaveno (instituce)</label><input class="inp" value="${esc(item.issuer||'')}" oninput="updateVerifyExtraCertification(${idx},'issuer',this.value)" placeholder="Diakonie ČCE"></div>
      </div>
      <div style="margin-top:14px">
        <label class="lbl">Platnost do</label>
        <button type="button" class="inp date-trigger" onclick="openVerifyValidModal(${idx})">${fmtVerifyValidDate(item.validUntil)}</button>
      </div>
      <div style="margin-top:14px">
        <label class="lbl">Doklad k tomuto osvědčení</label>
        <label class="doc-drop">
          <span>${item.docName?`${paperclipSVG(15)} <b>${esc(item.docName)}</b> — připraveno k odeslání`:'<b>Nahrát soubor</b> — PDF, Word, obrázek nebo sken dokladu'}</span>
          <input type="file" accept="image/*,.pdf,.doc,.docx,.odt,.rtf,.txt,.heic" hidden onchange="onVerifyExtraDoc(event,${idx})">
        </label>
      </div>
    </div>`).join('');
}
function addVerifyExtraCertification(){
  verifyExtraCerts.push({name:'',issuer:'',validUntil:'',docName:'',docData:''});
  renderVerifyExtraCerts();
}
function removeVerifyExtraCertification(idx){
  verifyExtraCerts.splice(idx,1);
  renderVerifyExtraCerts();
}
function updateVerifyExtraCertification(idx,key,value){
  if(!verifyExtraCerts[idx])return;
  verifyExtraCerts[idx][key]=value;
}
function onVerifyExtraDoc(e,idx){
  const item=verifyExtraCerts[idx];
  const f=e.target.files&&e.target.files[0];
  if(!item||!f)return;
  item.docName=f.name;item.docData='';
  renderVerifyExtraCerts();
  readVerifyFile(f,res=>{if(!verifyExtraCerts[idx])return;verifyExtraCerts[idx].docName=res.name;verifyExtraCerts[idx].docData=res.data;renderVerifyExtraCerts();});
}
function getVerifyCertifications(){
  const first={
    name:(document.getElementById('vfCert')?.value||'').trim(),
    issuer:(document.getElementById('vfIssuer')?.value||'').trim(),
    validUntil:(document.getElementById('vfValid')?.value||'').trim(),
    fileName:verifyDocName||''
  };
  return [first].concat(verifyExtraCerts.map(item=>({
    name:String(item.name||'').trim(),
    issuer:String(item.issuer||'').trim(),
    validUntil:String(item.validUntil||'').trim(),
    fileName:String(item.docName||'').trim()
  }))).filter(item=>item.name||item.issuer||item.validUntil);
}
function summarizeVerifyCertifications(certs){
  if(!certs.length)return '';
  return certs.length===1?certs[0].name:`${certs[0].name} + ${certs.length-1} další`;
}
/* „pilulka" dokumentu v admin kartě žádosti — klik otevře náhled na stránce */
function docPill(id,which,icon,label){
  return `<a role="button" tabindex="0" class="doc-pill" onclick="viewVer(${id},'${which}')">${icon}<span>${esc(label)}</span>${eyeSVG(13)}</a>`;
}
function certDocPill(id,idx,icon,label){
  return `<a role="button" tabindex="0" class="doc-pill" onclick="viewVerCert(${id},${idx})">${icon}<span>${esc(label)}</span>${eyeSVG(13)}</a>`;
}
function eyeSVG(s){s=s||14;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="1.7"/></svg>`;}
function chevDownSVG(s){s=s||16;return `<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;}
function verifyCertDetails(v){
  const certs=Array.isArray(v&&v.certifications)&&v.certifications.length?v.certifications:[{name:v&&v.cert,issuer:v&&v.issuer,validUntil:v&&v.validUntil}];
  return certs.filter(item=>item&&item.name).map(item=>`${esc(item.name)} — ${esc(item.issuer||'—')}${item.validUntil?` (platnost ${esc(item.validUntil)})`:''}${item.fileName?` · doklad ${esc(item.fileName)}`:''}`).join('<br>');
}
function adminDoneVerifyDocs(v){
  const certs=Array.isArray(v.certifications)&&v.certifications.length?v.certifications:[{name:v.cert,issuer:v.issuer,validUntil:v.validUntil,fileName:v.fileName}];
  const docs=[];
  if(v.idFront)docs.push(docPill(v.id,'idfront',idCardSVG(14),'Doklad - predni'));
  if(v.idBack)docs.push(docPill(v.id,'idback',idCardSVG(14),'Doklad - zadni'));
  if(v.selfie)docs.push(docPill(v.id,'selfie',selfieSVG(14),'Selfie'));
  certs.forEach((item,idx)=>{
    if(!item||!item.fileName)return;
    docs.push(idx===0
      ? docPill(v.id,'doc',docIcon(item.fileName),item.name||'Osvědčení')
      : certDocPill(v.id,idx,docIcon(item.fileName),item.name||('Osvědčení '+(idx+1))));
  });
  return docs.join('');
}
const ADM_VER_DONE_OPEN={};
function toggleAdminDoneVerify(id){
  ADM_VER_DONE_OPEN[id]=!ADM_VER_DONE_OPEN[id];
  renderAdminVerify();
}
function renderAdminDoneVerifyDetail(v){
  const svc=(v.services||[]).map(s=>`<span class="chip">${esc(sName2(s))}</span>`).join('');
  const docs=adminDoneVerifyDocs(v);
  return `
    <div class="vreq-fields vdone-fields">
      <div class="vreq-field"><div class="vreq-k">${shieldSVG(14)} Identita</div><div class="vreq-v">${esc(v.docType||'—')}${v.docNum?` · č. ${esc(v.docNum)}`:''}${v.phone?` · ${esc(v.phone)}`:''}</div></div>
      <div class="vreq-field"><div class="vreq-k">${capSVG(14)} Osvědčení</div><div class="vreq-v">${verifyCertDetails(v)||'—'}</div></div>
      ${(v.services||[]).length?`<div class="vreq-field"><div class="vreq-k">Nabízené služby</div><div class="vreq-chips">${svc}</div></div>`:''}
      ${v.refs?`<div class="vreq-field"><div class="vreq-k">Reference</div><div class="vreq-v">${esc(v.refs)}</div></div>`:''}
      ${v.note?`<div class="vreq-field"><div class="vreq-k">Poznámka pečovatelky</div><div class="vreq-v">${esc(v.note)}</div></div>`:''}
      ${v.reason?`<div class="vreq-field"><div class="vreq-k">Důvod rozhodnutí</div><div class="vreq-v">${esc(v.reason)}</div></div>`:''}
      <div class="vreq-field"><div class="vreq-k">Podáno</div><div class="vreq-v">${fmtDate(v.date)}</div></div>
    </div>
    ${docs?`<div class="vreq-docs vdone-docs">${docs}</div>`:''}`;
}
function fmtVerifyValidDate(iso){
  const m=String(iso||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  return m?`${m[3]}.${m[2]}.${m[1]}`:'Vybrat datum';
}
function refreshVerifyValidTrigger(){
  const val=document.getElementById('vfValid')?.value||'';
  const btn=document.getElementById('vfValidBtn');
  if(btn)btn.textContent=fmtVerifyValidDate(val);
}
function ensureVerifyValidOptions(){
  const day=document.getElementById('vfValidDay');
  const month=document.getElementById('vfValidMonth');
  const year=document.getElementById('vfValidYear');
  if(!day||day.dataset.ready)return;
  day.dataset.ready='1';
  day.innerHTML='<option value="">--</option>'+Array.from({length:31},(_,i)=>`<option value="${i+1}">${i+1}</option>`).join('');
  month.innerHTML='<option value="">--</option>'+['leden','únor','březen','duben','květen','červen','červenec','srpen','září','říjen','listopad','prosinec'].map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
  const now=new Date().getFullYear();
  year.innerHTML='<option value="">--</option>'+Array.from({length:41},(_,i)=>`<option value="${now-20+i}">${now-20+i}</option>`).join('');
  [day,month,year].forEach(enhanceSelect);
  ddRefresh();
}
function openVerifyValidModal(idx){
  ensureVerifyValidOptions();
  verifyValidTarget=typeof idx==='number'?idx:(idx==='addcert'?'addcert':'primary');
  const val=verifyValidTarget==='primary'
    ?(document.getElementById('vfValid')?.value||'')
    :(verifyValidTarget==='addcert'?addCertValid
    :((verifyExtraCerts[verifyValidTarget]&&verifyExtraCerts[verifyValidTarget].validUntil)||''));
  const m=String(val).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  document.getElementById('vfValidDay').value=m?String(Number(m[3])):'';
  document.getElementById('vfValidMonth').value=m?String(Number(m[2])):'';
  document.getElementById('vfValidYear').value=m?m[1]:'';
  const modal=document.getElementById('verifyDateModal');
  if(modal){modal.classList.add('open');document.body.style.overflow='hidden';}
}
function closeVerifyValidModal(){
  const modal=document.getElementById('verifyDateModal');
  if(modal&&modal.classList.contains('open')){modal.classList.remove('open');document.body.style.overflow='';}
}
function applyVerifyValidDate(){
  const day=document.getElementById('vfValidDay')?.value||'';
  const month=document.getElementById('vfValidMonth')?.value||'';
  const year=document.getElementById('vfValidYear')?.value||'';
  const value=(!day||!month||!year)?'':`${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  if(verifyValidTarget==='primary'){
    const hidden=document.getElementById('vfValid');
    if(hidden)hidden.value=value;
    refreshVerifyValidTrigger();
  }else if(verifyValidTarget==='addcert'){
    addCertValid=value;
    const hidden=document.getElementById('acValid');if(hidden)hidden.value=value;
    const btn=document.getElementById('acValidBtn');if(btn)btn.textContent=fmtVerifyValidDate(value);
  }else if(verifyExtraCerts[verifyValidTarget]){
    verifyExtraCerts[verifyValidTarget].validUntil=value;
    renderVerifyExtraCerts();
  }
  closeVerifyValidModal();
}
function clearVerifyValidDate(){
  if(verifyValidTarget==='primary'){
    const hidden=document.getElementById('vfValid');
    if(hidden)hidden.value='';
    refreshVerifyValidTrigger();
  }else if(verifyValidTarget==='addcert'){
    addCertValid='';
    const hidden=document.getElementById('acValid');if(hidden)hidden.value='';
    const btn=document.getElementById('acValidBtn');if(btn)btn.textContent=fmtVerifyValidDate('');
  }else if(verifyExtraCerts[verifyValidTarget]){
    verifyExtraCerts[verifyValidTarget].validUntil='';
    renderVerifyExtraCerts();
  }
  if(document.getElementById('vfValidDay'))document.getElementById('vfValidDay').value='';
  if(document.getElementById('vfValidMonth'))document.getElementById('vfValidMonth').value='';
  if(document.getElementById('vfValidYear'))document.getElementById('vfValidYear').value='';
  closeVerifyValidModal();
}
function setVerifyValidToday(){
  const now=new Date();
  document.getElementById('vfValidDay').value=String(now.getDate());
  document.getElementById('vfValidMonth').value=String(now.getMonth()+1);
  document.getElementById('vfValidYear').value=String(now.getFullYear());
}
/* zviditelní chybu ověřovacího formuláře — text u tlačítka + toast + odscrolluje k ní */
function verifyError(el,msg){
  if(el){el.textContent=msg;el.scrollIntoView({behavior:'smooth',block:'center'});}
  toast(msg,'declined');
}
async function submitVerify(e){
  e.preventDefault();
  const g=id=>document.getElementById(id).value.trim();
  const err=document.getElementById('vfErr');err.textContent='';
  const btn=document.getElementById('vfSubmitBtn');
  const name=g('vfName'),phone=getVerifyPhoneValue(),docNum=g('vfDocNum');
  const certifications=getVerifyCertifications();
  const services=verifyServices.filter((id,idx,arr)=>arr.indexOf(id)===idx&&SERVICES.some(s=>s.id===id));
  if(name.split(/\s+/).filter(Boolean).length<2){verifyError(err,'Zadejte celé jméno a příjmení.');return false;}
  if(!g('vfLoc')){verifyError(err,'Zadejte lokalitu (město nebo okres).');return false;}
  if(!isPhone(phone)){verifyError(err,'Zadejte platné telefonní číslo.');return false;}
  if(!docNum){verifyError(err,'Zadejte číslo dokladu totožnosti.');return false;}
  if(!verifyIdFrontName){verifyError(err,'Nahrajte prosím přední stranu dokladu totožnosti.');return false;}
  if(!verifyIdBackName){verifyError(err,'Nahrajte prosím zadní stranu dokladu totožnosti.');return false;}
  if(!verifySelfieName){verifyError(err,'Nahrajte prosím selfie pro ověření totožnosti.');return false;}
  if(!certifications.length){verifyError(err,'Uveďte alespoň jedno osvědčení nebo kurz.');return false;}
  if(certifications.some(item=>!item.name)){verifyError(err,'Doplňte název u každého osvědčení.');return false;}
  if(certifications.some(item=>!item.issuer)){verifyError(err,'Doplňte instituci u každého osvědčení.');return false;}
  if(certifications.some(item=>!item.fileName)){verifyError(err,'Nahrajte doklad u každého osvědčení.');return false;}
  if(!services.length){verifyError(err,'Vyberte alespoň jednu nabízenou službu.');return false;}
  if(!document.getElementById('vfRules').checked){verifyError(err,'Potvrďte prosím pravdivost údajů a souhlas s pravidly.');return false;}
  if(VERIFICATIONS.some(v=>v.email===auth.email&&v.status==='submitted')){verifyError(err,'Už máte žádost čekající na schválení.');return false;}
  const rec={
    name,email:auth.email,init:initials(name),loc:g('vfLoc'),
    rate:+g('vfRate')||240,exp:+g('vfExp')||0,phone,
    docType:document.getElementById('vfDocType').value==='pas'?'Cestovni pas':'Obcansky prukaz',docNum,
    idFront:verifyIdFrontName,idBack:verifyIdBackName,selfie:verifySelfieName,
    services,cert:summarizeVerifyCertifications(certifications),issuer:(certifications[0]&&certifications[0].issuer)||'',validUntil:(certifications[0]&&certifications[0].validUntil)||'',certifications,
    fileName:verifyDocName,refs:g('vfRefs'),note:g('vfNote'),bio:cgProfile.bio,
    files:{idfront:verifyIdFrontData||'',idback:verifyIdBackData||'',selfie:verifySelfieData||'',doc:verifyDocData||'',certs:verifyExtraCerts.map(it=>it.docData||'').filter(Boolean)},
    status:'submitted',date:new Date().toISOString().slice(0,10)
  };
  if(btn){btn.disabled=true;btn.dataset.label=btn.textContent;btn.textContent='Odesilam...';}
  try{
    const r=await api('/verifications',{method:'POST',body:rec});
    const saved=(r&&r.verification)||Object.assign({id:++verSeq},rec);
    if(saved.id>verSeq)verSeq=saved.id;
    VERIFICATIONS.unshift(saved);
    if(verifyDocData)DOC_BLOBS[saved.id+':doc']=verifyDocData;
    verifyExtraCerts.forEach((item,idx)=>{if(item.docData)DOC_BLOBS[saved.id+':doc:'+idx]=item.docData;});
    if(verifySelfieData)DOC_BLOBS[saved.id+':selfie']=verifySelfieData;
    if(verifyIdFrontData)DOC_BLOBS[saved.id+':idfront']=verifyIdFrontData;
    if(verifyIdBackData)DOC_BLOBS[saved.id+':idback']=verifyIdBackData;
    cgStatusMap[auth.email]='submitted';
    cgProfile.services=services.slice();
    verifyDocName='';verifySelfieName='';verifyDocData='';verifySelfieData='';
    verifyIdFrontName='';verifyIdFrontData='';verifyIdBackName='';verifyIdBackData='';
    persist();
    renderNav();
    toast('Děkujeme! Vaši žádost jsme odeslali ke schválení.','success');
    // krátká pauza, ať uživatel poděkování uvidí, pak zpět na úvodní stránku
    setTimeout(()=>go(landingView()),1200);
  }catch(ex){
    verifyError(err,(ex&&ex.message)?ex.message:'Žádost se nepodařilo odeslat. Zkuste to prosím znovu.');
  }finally{
    if(btn){btn.disabled=false;if(btn.dataset.label)btn.textContent=btn.dataset.label;}
  }
  return false;
}

/* ---- ADMIN: dashboard ---- */
function renderAdminDash(){
  setAva(document.getElementById('admDashAva'),auth.photo,initials(auth.name||'Správce systému'));
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
        ${avaHtml(v.init,userPhotoByEmail(v.email))}
        <div class="ri"><b>${esc(v.name)}</b><div class="rd">${esc(v.loc)} · ${v.exp} let praxe · ${fmtDate(v.date)}</div><span class="rs">${esc(v.cert)}</span></div>
        <div class="req-actions"><button class="btn btn-sm btn-gold" onclick="go('admin-verify')">Zkontrolovat</button></div>
      </div>`).join('')
    :'<div class="empty">Žádné čekající žádosti.</div>';
}

/* ---- ADMIN: fronta ověření ---- */
function verBadge(st){
  const ic=st==='approved'?checkSVG(14)
    :st==='rejected'?'<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
    :svgWrap(14,'<circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 8v4.5l2.8 1.6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>');
  const label=st==='approved'?'Schváleno':st==='rejected'?'Zamítnuto':'Čeká';
  return `<span class="res-badge">${ic} ${label}</span>`;
}
function renderAdminVerify(){
  const q=VERIFICATIONS.filter(v=>v.status==='submitted');
  const done=VERIFICATIONS.filter(v=>v.status!=='submitted');
  document.getElementById('admVerCount').textContent=q.length;
  document.getElementById('admVerQueue').innerHTML=q.length?q.map(v=>`
    <div class="req vreq" style="align-items:flex-start">
      ${avaHtml(v.init,userPhotoByEmail(v.email))}
      <div class="ri">
        <div class="vreq-top">
          <div><b>${esc(v.name)}</b><div class="rd">${esc(v.loc)} - sazba ${v.rate} Kc/hod - ${v.exp} let praxe</div></div>
          <div class="req-actions">
            <button class="btn btn-sm btn-ghost" onclick="downloadWithFx(this,()=>downloadDossier(${v.id}))">${downloadSVG(15)}Stahnout .zip</button>
            <button class="btn btn-sm btn-gold" onclick="approveVerification(${v.id})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 5 5 9-11" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>Schvalit</button>
            <button class="btn btn-sm btn-decline" onclick="rejectVerification(${v.id})"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>Zamitnout</button>
          </div>
        </div>
        <div class="vreq-fields">
          <div class="vreq-field"><div class="vreq-k">${shieldSVG(14)} Identita</div><div class="vreq-v">${esc(v.docType||'-')}${v.docNum?' - c. '+esc(v.docNum):''}${v.phone?' - '+esc(v.phone):''}</div></div>
          <div class="vreq-field"><div class="vreq-k">${capSVG(14)} Osvedceni</div><div class="vreq-v">${verifyCertDetails(v)}</div></div>
          <div class="vreq-field"><div class="vreq-k">Nabizene sluzby</div><div class="vreq-chips">${v.services.map(s=>`<span class="chip">${esc(sName2(s))}</span>`).join('')}</div></div>
          ${v.refs?`<div class="vreq-field"><div class="vreq-k">Reference</div><div class="vreq-v">${esc(v.refs)}</div></div>`:''}
          ${v.note?`<div class="vreq-field"><div class="vreq-k">Poznamka</div><div class="vreq-v" style="font-style:italic">"${esc(v.note)}"</div></div>`:''}
        </div>
        <div class="vreq-docs">
          ${v.idFront?docPill(v.id,'idfront',idCardSVG(14),'Doklad - predni'):''}
          ${v.idBack?docPill(v.id,'idback',idCardSVG(14),'Doklad - zadni'):''}
          ${v.selfie?docPill(v.id,'selfie',selfieSVG(14),'Selfie'):''}
          ${v.fileName?docPill(v.id,'doc',docIcon(v.fileName),'Osvedceni'):''}
        </div>
        <span class="rs">Podano ${fmtDate(v.date)}</span>
      </div>
    </div>`).join(''):'<div class="empty">'+clockSVG(15)+' Zadne cekajici zadosti.</div>';
  document.getElementById('admVerDone').innerHTML=done.length?`
    <table class="adm-table"><thead><tr><th>Pecovatelka</th><th>Osvedceni</th><th>Datum</th><th style="text-align:right">Vysledek</th></tr></thead><tbody>
    ${done.slice().reverse().map(v=>{
      const open=!!ADM_VER_DONE_OPEN[v.id];
      return `<tr class="adm-ver-row ${open?'open':''}">
        <td>
          <button type="button" class="adm-ver-toggle" onclick="toggleAdminDoneVerify(${v.id})" aria-expanded="${open?'true':'false'}">
            <span class="adm-ver-toggle-ic">${chevDownSVG(16)}</span>
            <span class="u-cell">${avaHtml(esc(v.init),userPhotoByEmail(v.email))}<span><b>${esc(v.name)}</b><span>${esc(v.loc)}</span></span></span>
          </button>
        </td>
        <td>${esc(v.cert||'—')}</td><td>${fmtDate(v.date)}</td>
        <td style="text-align:right">${verBadge(v.status)}</td>
      </tr>
      ${open?`<tr class="adm-ver-detail-row"><td colspan="4"><div class="adm-ver-detail">${renderAdminDoneVerifyDetail(v)}</div></td></tr>`:''}`;
    }).join('')}</tbody></table>`:'<div class="empty">Zatím žádné zpracované žádosti.</div>';
}
/* ====== ZIP + XLSX generĂˇtor (bez knihoven, offline) ====== */
const CRC_TABLE=(()=>{let c,t=[];for(let n=0;n<256;n++){c=n;for(let k=0;k<8;k++)c=(c&1)?(0xEDB88320^(c>>>1)):(c>>>1);t[n]=c>>>0;}return t;})();
function crc32(buf){let c=0xFFFFFFFF;for(let i=0;i<buf.length;i++)c=CRC_TABLE[(c^buf[i])&0xFF]^(c>>>8);return (c^0xFFFFFFFF)>>>0;}
function concatBytes(arrs){let len=arrs.reduce((s,a)=>s+a.length,0),out=new Uint8Array(len),o=0;arrs.forEach(a=>{out.set(a,o);o+=a.length;});return out;}
function dataURLtoBytes(d){const b64=d.slice(d.indexOf(',')+1);const bin=atob(b64);const u=new Uint8Array(bin.length);for(let j=0;j<bin.length;j++)u[j]=bin.charCodeAt(j);return u;}
/* ZIP se â€žstore" metodou (bez komprese); files=[{name,data:Uint8Array}] -> Uint8Array */
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
   title:'A to je vše! '+smileSVG(20),
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
   title:'A můžete pomáhat! '+smileSVG(20),
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
async function downloadDossier(id){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  const enc=new TextEncoder();
  const certs=Array.isArray(v.certifications)&&v.certifications.length?v.certifications:[{name:v.cert,issuer:v.issuer,validUntil:v.validUntil,fileName:v.fileName}];
  const rows=[
    ['ZENVORIA — žádost o ověření pečovatelky',''],
    ['',''],
    ['Jméno',v.name],['E-mail',v.email],['Telefon',v.phone||''],
    ['Lokalita',v.loc],['Hodinová sazba (Kč)',String(v.rate)],['Praxe (let)',String(v.exp)],
    ['Doklad totožnosti',(v.docType||'')+(v.docNum?' č. '+v.docNum:'')],['Doklad přední (soubor)',v.idFront||''],['Doklad zadní (soubor)',v.idBack||''],['Selfie (soubor)',v.selfie||''],
    ['Osvědčení',certs.map(item=>`${item.name||''}${item.issuer?` — ${item.issuer}`:''}${item.validUntil?` (${item.validUntil})`:''}`).join(' | ')],['Vystavil',v.issuer||''],['Platnost do',v.validUntil||''],
    ['Doklad (soubor)',v.fileName||''],['Služby',(v.services||[]).map(sName2).join(', ')],
    ['Reference',v.refs||''],['Poznámka',v.note||''],
    ['Podáno',v.date||''],['Stav',v.status||'']
  ];
  const files=[{name:'udaje.xlsx',data:xlsxFromRows(rows)}];
  // skutečné přílohy ze serveru (admin); fallback DOC_BLOBS (stejná session)
  const sf=await fetchVerFiles(id);
  const pick=k=>sf[k]||DOC_BLOBS[id+':'+k]||null;
  const addFile=(data,nm,k)=>{
    if(data){files.push({name:'prilohy/'+(nm||k),data:dataURLtoBytes(data)});}
    else if(nm){files.push({name:'prilohy/'+nm.replace(/\.[^.]+$/,'')+'.txt',data:enc.encode('Soubor není k dispozici (demo).')});}
  };
  addFile(pick('idfront'),v.idFront,'doklad-predni');
  addFile(pick('idback'),v.idBack,'doklad-zadni');
  addFile(pick('selfie'),v.selfie,'selfie');
  addFile(pick('doc'),(certs[0]&&certs[0].fileName)||v.fileName,'osvedceni-1');
  (sf.certs||[]).forEach((d,i)=>{const nm=(certs[i+1]&&certs[i+1].fileName)||('osvedceni-'+(i+2));addFile(d||DOC_BLOBS[id+':doc:'+i],nm,'osvedceni-'+(i+2));});
  const zip=zipStore(files);
  const blob=new Blob([zip],{type:'application/zip'});
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='overeni-'+slug(v.name)+'.zip';
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  toast('Stahuji složku '+a.download);
}
/* ikona podle přípony souboru (SVG) */
function docIcon(name){
  const e=(name||'').toLowerCase().split('.').pop();
  if(['jpg','jpeg','png','gif','webp','heic','bmp'].includes(e))return imageSVG(14);
  if(e==='pdf')return pdfSVG(14);
  if(['doc','docx','odt','rtf'].includes(e))return editSVG(14);
  if(e==='txt')return docSVG(14);
  return paperclipSVG(14);
}
/* stažení nahraného dokladu / selfie pro kontrolu adminem */
/* přílohy žádosti ze serveru (data URL) — cache, ať se nestahují opakovaně */
const VER_FILES_CACHE={};
async function fetchVerFiles(id){
  if(VER_FILES_CACHE[id])return VER_FILES_CACHE[id];
  try{const r=await api('/verifications/'+id+'/files');const f=(r&&r.files)||{};VER_FILES_CACHE[id]=f;return f;}catch(e){return {};}
}
/* otevře přílohu žádosti v náhledu na stránce (obrázek / PDF) místo stahování */
async function viewVer(id,which){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  const labels={idfront:'Doklad - predni strana',idback:'Doklad - zadni strana',selfie:'Selfie',doc:'Osvedceni'};
  const name=which==='selfie'?v.selfie:(which==='idfront'?v.idFront:(which==='idback'?v.idBack:v.fileName));
  const sf=await fetchVerFiles(id);
  const data=sf[which]||DOC_BLOBS[id+':'+which];
  if(!data){toast('Soubor neni k dispozici (zadost byla podana pred ulozenim priloh).','declined');return;}
  openFileViewer(data,labels[which]||name||'Nahled',name,()=>downloadVerData(data,name||which));
}
async function viewVerCert(id,idx){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  const certs=Array.isArray(v.certifications)&&v.certifications.length?v.certifications:[{name:v.cert,issuer:v.issuer,validUntil:v.validUntil,fileName:v.fileName}];
  const item=certs[idx];if(!item)return;
  const sf=await fetchVerFiles(id);
  const data=idx===0?(sf.doc||DOC_BLOBS[id+':doc']):((sf.certs&&sf.certs[idx-1])||DOC_BLOBS[id+':doc:'+(idx-1)]);
  if(!data){toast('Soubor neni k dispozici (zadost byla podana pred ulozenim priloh).','declined');return;}
  const name=item.fileName||('osvedceni-'+(idx+1));
  openFileViewer(data,item.name||'Osvedceni',name,()=>downloadVerData(data,name));
}
function downloadVerData(data,fname){
  const a=document.createElement('a');a.href=data;a.download=fname||'soubor';
  document.body.appendChild(a);a.click();a.remove();
}
/* lehký modal pro náhled obrázku/PDF přímo na stránce */
function openFileViewer(data,title,fname,onDownload){
  const isPdf=/^data:application\/pdf/i.test(data);
  const ov=document.createElement('div');ov.className='file-viewer';
  const body=isPdf?`<iframe src="${data}"></iframe>`:`<img src="${data}" alt="${esc(title||'')}">`;
  ov.innerHTML=`<div class="fv-card" onclick="event.stopPropagation()">
    <div class="fv-head"><b>${esc(title||'Náhled')}</b>
      <div style="display:flex;gap:8px;align-items:center">
        <button type="button" class="btn btn-ghost btn-sm fv-dl">${downloadSVG(14)} Stáhnout</button>
        <button type="button" class="fv-close" aria-label="Zavřít">×</button>
      </div>
    </div>
    <div class="fv-body">${body}</div>
  </div>`;
  const close=()=>{ov.remove();document.body.style.overflow='';};
  ov.onclick=close;
  ov.querySelector('.fv-close').onclick=close;
  ov.querySelector('.fv-dl').onclick=()=>{if(onDownload)onDownload();};
  document.addEventListener('keydown',function esc2(e){if(e.key==='Escape'){close();document.removeEventListener('keydown',esc2);}});
  document.body.appendChild(ov);document.body.style.overflow='hidden';
}
async function downloadVer(id,which){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  const name=which==='selfie'?v.selfie:(which==='idfront'?v.idFront:(which==='idback'?v.idBack:v.fileName));
  const sf=await fetchVerFiles(id);
  const data=sf[which]||DOC_BLOBS[id+':'+which];
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
  toast('Stahuji '+fname);
}
function approveVerification(id){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  askConfirm({
    title:'Schválit ověření?',
    message:`${v.name} bude označena jako ověřená a zveřejněna v katalogu pečovatelek.`,
    icon:checkCircleSVG(),confirmLabel:'Schválit a zveřejnit',
    onConfirm:()=>doApproveVerification(id)
  });
}
function doApproveVerification(id){
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
  toast(`<b>${esc(v.name)}</b> byla ověřena a zveřejněna.`,'success');
}
function rejectVerification(id){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  askConfirm({
    title:'Zamítnout žádost?',
    message:`Žádost ${v.name} bude zamítnuta. Uvedený důvod uvidí pečovatelka.`,
    icon:warnSVG(),danger:true,confirmLabel:'Zamítnout žádost',
    input:{label:'Důvod zamítnutí',value:'Nečitelné nebo neplatné osvědčení.',placeholder:'Napište důvod, který uvidí pečovatelka…'},
    onConfirm:(reason)=>doRejectVerification(id,reason)
  });
}
function doRejectVerification(id,reason){
  const v=VERIFICATIONS.find(x=>x.id===id);if(!v)return;
  v.status='rejected';v.reason=(reason||'').trim()||'Bez uvedení důvodu.';
  cgStatusMap[v.email]='rejected';
  apiSync(api('/verifications/'+id+'/reject',{method:'POST',body:{reason:v.reason}}));
  renderAdminVerify();renderNav();
  toast(`Žádost <b>${esc(v.name)}</b> byla zamítnuta.`,'error');
}

/* ---- ADMIN: pečovatelky ---- */
function renderAdminCaregivers(){
  document.getElementById('admCgCount').textContent=CAREGIVERS.length;
  document.getElementById('admCgBody').innerHTML=CAREGIVERS.map(c=>{
    const badge=c.suspended?'<span class="badge off">Pozastavena</span>':(c.verified?'<span class="badge gold">'+checkSVG(12)+' Ověřená</span>':'<span class="badge wait">Neověřená</span>');
    const isPrem=c.plan==='premium';
    const planBadge=isPrem?`<span class="badge gold">${diamondSVG(11)} PREMIUM</span>`:'<span class="badge">START</span>';
    return `<tr>
      <td><div class="u-cell">${avaHtml(c.init,c.photo||userPhotoByEmail(c.email))}<div><b>${esc(c.name)}</b><span>${starFillSVG(11)} ${c.rating} · ${c.exp} let praxe</span></div></div></td>
      <td>${esc(c.loc)}</td><td>${c.rate} Kč</td><td>${badge}</td>
      <td>${planBadge}${(isPrem&&c.trialUntil)?`<div style="font-size:11.5px;color:var(--muted);margin-top:3px">do ${fmtDate(c.trialUntil)}</div>`:''}</td>
      <td><div class="adm-actions" style="justify-content:flex-end">
        <button class="btn btn-sm btn-gold" onclick="openCgAdmin(${c.id})">Zobrazit</button>
      </div></td>
    </tr>`;}).join('');
}
/* admin: ruční nastavení předplatného pečovatelky (PREMIUM / START) */
function setCgPlan(id,plan){
  const c=CAREGIVERS.find(x=>x.id===id);if(!c)return;
  const toPrem=plan==='premium';
  const doIt=()=>{
    c.plan=plan;
    apiSync(api('/caregivers/'+id,{method:'PATCH',body:{plan}}));
    renderAdminCaregivers();renderCare();
    toast(toPrem?`${esc(c.name)} má nyní PREMIUM.`:`PREMIUM u ${esc(c.name)} zrušeno.`,'success');
  };
  askConfirm({
    title:toPrem?'Nastavit PREMIUM?':'Zrušit PREMIUM?',
    icon:diamondSVG(20),
    message:toPrem
      ?`${esc(c.name)} získá vyšší zobrazení ve vyhledávání a odznak PREMIUM. Nastavujete ručně (bez platby přes Stripe).`
      :`${esc(c.name)} se vrátí do bezplatného tarifu START. Případné aktivní předplatné přes Stripe tím nezrušíte — spravujte ho ve Stripe.`,
    confirmLabel:toPrem?'Nastavit PREMIUM':'Zrušit PREMIUM',
    danger:!toPrem,onConfirm:doIt});
}
/* ---- ADMIN: správcovský modal pečovatelky ---- */
let cgAdminId=null;
function openCgAdmin(id){
  const c=CAREGIVERS.find(x=>x.id===id);if(!c)return;
  cgAdminId=id;
  document.getElementById('cgAdminTitle').textContent=c.name;
  document.getElementById('cgAdminSub').textContent=`${c.loc||''} · ${c.exp} let praxe · ${c.rate} Kč/hod`;
  setAva(document.getElementById('cgAdminAva'),c.photo||userPhotoByEmail(c.email),c.init);
  const isPrem=c.plan==='premium';
  const statusBadge=c.suspended?'<span class="badge off">Pozastavená</span>':(c.verified?`<span class="badge gold">${checkSVG(11)} Ověřená</span>`:'<span class="badge wait">Neověřená</span>');
  const planBadge=isPrem?`<span class="badge gold">${diamondSVG(11)} PREMIUM</span>`:'<span class="badge">START</span>';
  document.getElementById('cgAdminBadges').innerHTML=statusBadge+planBadge;
  const validTxt=isPrem?(c.trialUntil?('platí do '+fmtDate(c.trialUntil)):'platí neomezeně'):'bezplatný tarif';
  document.getElementById('cgAdminCurrent').innerHTML=`${planIcon(isPrem?'premium':'start',15)}<span>Aktuálně <b>${isPrem?'PREMIUM':'START'}</b> · ${esc(validTxt)}</span>`;
  const planEl=document.getElementById('cgAdminPlan');
  if(planEl){planEl.value=c.plan==='premium'?'premium':'start';if(planEl._ddRefresh)planEl._ddRefresh();}
  const untilEl=document.getElementById('cgAdminUntil');
  if(untilEl)untilEl.value=c.trialUntil?String(c.trialUntil).slice(0,10):'';
  cgAdminToggleUntil();
  const susBtn=document.getElementById('cgAdminSuspendBtn');
  if(susBtn){susBtn.textContent=c.suspended?'Obnovit pečovatelku':'Pozastavit';susBtn.className='btn '+(c.suspended?'btn-accept':'btn-decline');}
  const unvBtn=document.getElementById('cgAdminUnverifyBtn');
  if(unvBtn)unvBtn.style.display=c.verified?'':'none';
  // předplatné zobrazit sbalené — editor se odkryje až přes „Upravit předplatné"
  const ed=document.getElementById('cgAdminEditor');if(ed)ed.hidden=true;
  const eb=document.getElementById('cgAdminEditBtn');if(eb)eb.style.display='';
  const m=document.getElementById('cgAdminModal');if(m){m.classList.add('open');document.body.style.overflow='hidden';}
}
function cgAdminEditPlan(){
  const c=CAREGIVERS.find(x=>x.id===cgAdminId);if(!c)return;
  const planEl=document.getElementById('cgAdminPlan');
  if(planEl){planEl.value=c.plan==='premium'?'premium':'start';if(planEl._ddRefresh)planEl._ddRefresh();}
  const untilEl=document.getElementById('cgAdminUntil');
  if(untilEl)untilEl.value=c.trialUntil?String(c.trialUntil).slice(0,10):'';
  cgAdminToggleUntil();
  const ed=document.getElementById('cgAdminEditor');if(ed)ed.hidden=false;
  const eb=document.getElementById('cgAdminEditBtn');if(eb)eb.style.display='none';
}
function cgAdminCancelEdit(){
  const ed=document.getElementById('cgAdminEditor');if(ed)ed.hidden=true;
  const eb=document.getElementById('cgAdminEditBtn');if(eb)eb.style.display='';
}
function closeCgAdmin(){const m=document.getElementById('cgAdminModal');if(m&&m.classList.contains('open')){m.classList.remove('open');document.body.style.overflow='';}}
function cgAdminToggleUntil(){
  const prem=(document.getElementById('cgAdminPlan')||{}).value==='premium';
  const w=document.getElementById('cgAdminUntilWrap');
  const inp=document.getElementById('cgAdminUntil');
  const hint=w?w.querySelector('.cga-hint'):null;
  if(inp)inp.disabled=!prem;
  if(w)w.classList.toggle('is-disabled',!prem);
  if(hint)hint.textContent=prem?'Prázdné = neomezeně':'Nastavíte po přepnutí na PREMIUM';
}
function cgAdminSavePlan(){
  const c=CAREGIVERS.find(x=>x.id===cgAdminId);if(!c)return;
  const plan=(document.getElementById('cgAdminPlan')||{}).value==='premium'?'premium':'start';
  const until=(document.getElementById('cgAdminUntil')||{}).value||'';
  const body={plan};
  body.trialUntil=(plan==='premium'&&until)?new Date(until+'T23:59:59').toISOString():null;
  c.plan=plan;c.trialUntil=body.trialUntil;
  apiSync(api('/caregivers/'+c.id,{method:'PATCH',body}));
  renderAdminCaregivers();renderCare();openCgAdmin(c.id);
  toast('Předplatné uloženo.','success');
}
function cgAdminSuspend(){
  const c=CAREGIVERS.find(x=>x.id===cgAdminId);if(!c)return;
  c.suspended=!c.suspended;
  const u=USERS.find(x=>String(x.email||'').toLowerCase()===String(c.email||'').toLowerCase());
  if(u)u.status=c.suspended?'suspended':'active';
  apiSync(api('/caregivers/'+c.id,{method:'PATCH',body:{suspended:c.suspended}}));
  renderAdminCaregivers();renderAdminUsers();renderCare();openCgAdmin(c.id);
  toast(c.suspended?`${esc(c.name)} pozastavena.`:`${esc(c.name)} obnovena.`);
}
function cgAdminUnverify(){
  const c=CAREGIVERS.find(x=>x.id===cgAdminId);if(!c)return;
  c.verified=false;
  apiSync(api('/caregivers/'+c.id,{method:'PATCH',body:{verified:false}}));
  renderAdminCaregivers();renderCare();openCgAdmin(c.id);
  toast(`Ověření u ${esc(c.name)} odebráno.`);
}
function cgAdminRemove(){
  const id=cgAdminId;const c=CAREGIVERS.find(x=>x.id===id);if(!c)return;
  closeCgAdmin();
  removeCaregiver(id);
}
function toggleSuspendCg(id){
  const c=CAREGIVERS.find(x=>x.id===id);if(!c)return;
  const doIt=()=>{c.suspended=!c.suspended;
    const u=USERS.find(x=>String(x.email||'').toLowerCase()===String(c.email||'').toLowerCase());
    if(u)u.status=c.suspended?'suspended':'active';
    apiSync(api('/caregivers/'+id,{method:'PATCH',body:{suspended:c.suspended}}));
    renderAdminCaregivers();renderAdminUsers();renderCare();
    toast(c.suspended?`${esc(c.name)} pozastavena.`:`${esc(c.name)} obnovena.`);};
  if(!c.suspended){
    askConfirm({title:'Pozastavit pečovatelku?',icon:pauseSVG(),
      message:`${esc(c.name)} se přestane zobrazovat rodinám, dokud ji znovu neobnovíte.`,
      confirmLabel:'Pozastavit',danger:true,onConfirm:doIt});
  }else doIt();
}
function removeCaregiver(id){
  const c=CAREGIVERS.find(x=>x.id===id);if(!c)return;
  askConfirm({title:'Odebrat pečovatelku?',icon:trashSVG(),
    message:`Opravdu chcete odebrat pečovatelku ${esc(c.name)}? Tato akce je nevratná.`,
    confirmLabel:'Odebrat',danger:true,onConfirm:()=>{
      CAREGIVERS=CAREGIVERS.filter(x=>x.id!==id);
      if(c.email)cgStatusMap[c.email]='rejected';
      apiSync(api('/caregivers/'+id,{method:'DELETE'}));
      renderAdminCaregivers();renderCare();
      toast(`${esc(c.name)} odebrána.`);
    }});
}

/* ---- ADMIN: uživatelé (rodiny) ---- */
function isUserEffectivelySuspended(u){
  const cg=CAREGIVERS.find(c=>String(c.email||'').toLowerCase()===String(u&&u.email||'').toLowerCase());
  return !!((u&&u.status==='suspended')||(cg&&cg.suspended));
}
function renderAdminUsers(){
  document.getElementById('admUsrCount').textContent=USERS.length;
  document.getElementById('admUsrBody').innerHTML=USERS.map(u=>{
    const suspended=isUserEffectivelySuspended(u);
    const badge=suspended?'<span class="badge off">Pozastaven</span>':'<span class="badge ok">Aktivni</span>';
    return `<tr>
      <td><div class="u-cell">${avaHtml(esc(u.init),u.photo)}<div><b>${esc(u.name)}</b><span>${esc(u.email)}</span></div></div></td>
      <td>${fmtDate(u.joined)}</td><td>${u.orders}</td><td>${badge}</td>
      <td><div class="adm-actions">
        <button class="btn btn-sm ${suspended?'btn-accept':'btn-gold'}" onclick="toggleSuspendUser(${u.id})">${suspended?'Obnovit':'Pozastavit'}</button>
        <button class="btn btn-sm btn-decline" onclick="removeUser(${u.id})">Odebrat</button>
      </div></td>
    </tr>`;}).join('');
}
function toggleSuspendUser(id){
  const u=USERS.find(x=>x.id===id);if(!u)return;
  const cg=CAREGIVERS.find(c=>String(c.email||'').toLowerCase()===String(u.email||'').toLowerCase());
  const suspended=isUserEffectivelySuspended(u);
  const doIt=()=>{
    u.status=suspended?'active':'suspended';
    if(cg)cg.suspended=!suspended;
    apiSync(api('/users/'+u.id,{method:'PATCH',body:{status:u.status}}));
    if(cg)apiSync(api('/caregivers/'+cg.id,{method:'PATCH',body:{suspended:cg.suspended}}));
    renderAdminUsers();renderAdminCaregivers();renderCare();
    toast(u.status==='suspended'?`${esc(u.name)} pozastaven.`:`${esc(u.name)} obnoven.`);
  };
  if(!suspended){
    askConfirm({title:'Pozastavit uzivatele?',icon:pauseSVG(),
      message:`Ucet ${esc(u.name)} bude pozastaven, dokud ho znovu neobnovite.`,
      confirmLabel:'Pozastavit',danger:true,onConfirm:doIt});
  }else doIt();
}
function removeUser(id){
  const u=USERS.find(x=>x.id===id);if(!u)return;
  askConfirm({title:'Odebrat uzivatele?',icon:trashSVG(),
    message:`Opravdu chcete odebrat uzivatele ${esc(u.name)}? Tato akce je nevratna.`,
    confirmLabel:'Odebrat',danger:true,onConfirm:()=>{
      USERS=USERS.filter(x=>x.id!==id);
      apiSync(api('/users/'+id,{method:'DELETE'}));
      renderAdminUsers();
      toast(`${esc(u.name)} odebran.`);
    }});
}
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

/* ---- audit log: čitelné české popisky ---- */
const AUDIT_ACTION_LABELS={
  'auth.login':'Přihlášení',
  'auth.logout':'Odhlášení',
  'auth.register':'Registrace účtu',
  'auth.change_password':'Změna hesla',
  'auth.forgot_password':'Žádost o obnovu hesla',
  'auth.reset_password':'Obnova hesla',
  'auth.change_email.request':'Žádost o změnu e-mailu',
  'auth.change_email.code_sent':'Odeslání ověřovacího kódu (e-mail)',
  'auth.change_email.confirm':'Potvrzení změny e-mailu',
  'admin.user.update':'Úprava uživatele',
  'admin.user.delete':'Odebrání uživatele',
  'admin.caregiver.update':'Úprava pečovatelky',
  'admin.caregiver.delete':'Odebrání pečovatelky',
  'admin.verification.approve':'Schválení ověření',
  'admin.verification.reject':'Zamítnutí ověření',
  'admin.broadcast.create':'Odeslání hromadné zprávy',
  'admin.settings.update':'Změna nastavení'
};
const AUDIT_STATUS_LABELS={success:'Úspěch',failed:'Selhalo',pending:'Probíhá'};
const AUDIT_ROLE_LABELS={admin:'Správce',caregiver:'Pečovatelka',family:'Rodina'};
const AUDIT_TARGET_LABELS={user:'Uživatel',caregiver:'Pečovatelka',verification:'Ověření',setting:'Nastavení',broadcast:'Hromadná zpráva',order:'Objednávka','reset-token':'Token pro obnovu','email-change':'Změna e-mailu'};
const AUDIT_META_KEYS={reason:'Důvod',userFound:'Uživatel nalezen',plan:'Tarif',status:'Stav',amount:'Částka',audience:'Příjemci',key:'Klíč'};
const AUDIT_REASONS={invalid_credentials:'Nesprávné údaje',suspended:'Účet pozastaven',expired:'Platnost vypršela',used:'Již použito',invalid:'Neplatné',not_found:'Nenalezeno'};
const auditActionLabel=a=>AUDIT_ACTION_LABELS[a]||a;
const auditStatusLabel=s=>AUDIT_STATUS_LABELS[s]||s;
const auditRoleLabel=r=>AUDIT_ROLE_LABELS[r]||r;
const auditTargetLabel=t=>AUDIT_TARGET_LABELS[t]||t;
function auditMetaChip(k,v){
  const key=AUDIT_META_KEYS[k]||k;
  let val=String(v);
  if(k==='reason')val=AUDIT_REASONS[v]||v;
  else if(val==='true')val='Ano';else if(val==='false')val='Ne';
  return `<span class="chip">${esc(key)}: ${esc(val)}</span>`;
}
/* cíl: „Uživatel · 3e4f61a2…" (zkráceně, plné ID v title) */
function auditTargetHtml(log){
  if(!log.targetType&&!log.targetId)return '<span>—</span>';
  const typ=log.targetType?esc(auditTargetLabel(log.targetType)):'';
  let id=log.targetId?String(log.targetId):'';
  const full=id;
  if(/^[0-9a-f-]{20,}$/i.test(id))id=id.slice(0,8)+'…';
  const idHtml=id?`<span class="mono" title="${esc(full)}">${esc(id)}</span>`:'';
  return `<span>${[typ,idHtml].filter(Boolean).join(' · ')}</span>`;
}

function renderAdminAuditRows(list){
  const body=document.getElementById('admAuditBody');
  const count=document.getElementById('admAuditCount');
  FILTERED_AUDIT_LOGS=list;
  count.textContent=list.length;
  body.innerHTML=list.length?list.map(log=>{
    const actor=esc(log.actorEmail||log.actorId||'—');
    const meta=log.metadata&&typeof log.metadata==='object'
      ?Object.entries(log.metadata).slice(0,3).map(([k,v])=>auditMetaChip(k,v)).join('')
      :'';
    const statusCls=log.status==='success'?'ok':(log.status==='failed'?'bad':'wait');
    return `<tr>
      <td>
        <b title="${esc(log.action)}">${esc(auditActionLabel(log.action))}</b>
        <div class="audit-meta">
          <span class="badge ${statusCls}">${esc(auditStatusLabel(log.status))}</span>
          ${log.actorRole?`<span class="chip">${esc(auditRoleLabel(log.actorRole))}</span>`:''}
        </div>
      </td>
      <td>
        <span class="mono">${actor}</span>
        ${log.ip?`<span class="small">IP: ${esc(log.ip)}</span>`:''}
      </td>
      <td>
        ${auditTargetHtml(log)}
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
    const hay=[log.action,auditActionLabel(log.action),log.actorEmail,log.actorId,log.targetType,auditTargetLabel(log.targetType),log.targetId,auditRoleLabel(log.actorRole)].filter(Boolean).join(' ').toLowerCase();
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
  toast('Audit logy byly exportovány do CSV.','success');
}

/* ---- ADMIN: ceny tarifů ---- */
function renderAdminPlans(){
  document.getElementById('apStart').value=planPrices.start;
  document.getElementById('apPremium').value=planPrices.premium;
  document.getElementById('apErr').textContent='';
  document.getElementById('adminPlanPreview').innerHTML=['start','premium'].map(k=>`
    <div class="row" style="display:flex;justify-content:space-between;padding:9px 0;font-size:14.5px;border-bottom:1px solid var(--line)">
      <span>${planIcon(k,15)} ${PLANS[k].name}</span>
      <b style="color:var(--navy-900)">${planPriceLabel(k)}</b>
    </div>`).join('');
  const plans=Object.values(cgPlanMap);
  const premCount=plans.filter(p=>p==='premium').length;
  const startCount=plans.filter(p=>p==='start').length;
  const revenue=startCount*planPrice('start')+premCount*planPrice('premium');
  document.getElementById('apPremCount').textContent=premCount;
  document.getElementById('apRevenue').textContent=revenue.toLocaleString('cs-CZ')+' Kč';
  // tarif po registraci
  const spPlanEl=document.getElementById('spPlan'),spDaysEl=document.getElementById('spDays'),spErr=document.getElementById('spErr');
  if(spErr)spErr.textContent='';
  if(spPlanEl){spPlanEl.value=signupPlan.plan==='premium'?'premium':'start';if(spPlanEl._ddRefresh)spPlanEl._ddRefresh();}
  if(spDaysEl)spDaysEl.value=Number(signupPlan.days)||0;
  spToggleDays();
}
function spToggleDays(){
  const p=(document.getElementById('spPlan')||{}).value;
  const w=document.getElementById('spDaysWrap');
  if(w)w.style.display=p==='premium'?'':'none';
}
function saveSignupPlan(e){
  e.preventDefault();
  const plan=(document.getElementById('spPlan')||{}).value==='premium'?'premium':'start';
  let days=parseInt((document.getElementById('spDays')||{}).value,10);
  if(!Number.isFinite(days)||days<0)days=0;days=Math.min(365,days);
  signupPlan={plan,days};
  apiSync(api('/settings/signupPlan',{method:'PUT',body:{value:signupPlan}}));
  toast(plan==='premium'?(days>0?`Nové pečovatelky dostanou PREMIUM na ${days} dní.`:'Nové pečovatelky dostanou PREMIUM (neomezeně).'):'Nové pečovatelky dostanou tarif START.','success');
  return false;
}
function saveAdminPlans(e){
  e.preventDefault();
  const s=+document.getElementById('apStart').value;
  const p=+document.getElementById('apPremium').value;
  const err=document.getElementById('apErr');err.textContent='';
  if(!(s>=0)){err.textContent='Zadejte platnou cenu tarifu START.';return false;}
  if(!(p>=0)){err.textContent='Zadejte platnou cenu tarifu PREMIUM.';return false;}
  planPrices.start=s;planPrices.premium=p;
  apiSync(api('/settings/planPrices',{method:'PUT',body:{value:planPrices}}));
  renderAdminPlans();renderCare();
  toast('Ceny tarifů byly uloženy.');
  return false;
}

/* ---- ADMIN: sociální sítě ---- */
function renderAdminSocial(){
  // stránka je jen pro správce systému
  if(!(auth.loggedIn&&auth.role==='admin')){go(auth.loggedIn?landingView():'home');return;}
  document.getElementById('asFacebook').value=socialLinks.facebook||'';
  document.getElementById('asInstagram').value=socialLinks.instagram||'';
  document.getElementById('asErr').textContent='';
}
/* doplní https:// a ověří, že je to platná webová adresa (prázdné = povoleno) */
function normalizeSocialUrl(v){
  v=(v||'').trim();
  if(!v)return '';
  if(!/^https?:\/\//i.test(v))v='https://'+v;
  try{const u=new URL(v);if(u.protocol!=='http:'&&u.protocol!=='https:')return null;return u.toString();}catch(e){return null;}
}
function saveAdminSocial(e){
  e.preventDefault();
  const err=document.getElementById('asErr');err.textContent='';
  const fb=normalizeSocialUrl(document.getElementById('asFacebook').value);
  const ig=normalizeSocialUrl(document.getElementById('asInstagram').value);
  if(fb===null){err.textContent='Zadejte platnou adresu Facebooku (např. https://facebook.com/zenvoria).';return false;}
  if(ig===null){err.textContent='Zadejte platnou adresu Instagramu (např. https://instagram.com/zenvoria).';return false;}
  socialLinks.facebook=fb;socialLinks.instagram=ig;
  apiSync(api('/settings/socialLinks',{method:'PUT',body:{value:socialLinks}}));
  renderAdminSocial();
  toast('Odkazy na sociální sítě byly uloženy.','success');
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
  toast(`Zpráva odeslána ${aud==='specific'?n+' příjemcům':n}.`);
  return false;
}

/* ---------- CAREGIVER PORTAL ---------- */
const cgProfile={
  name:'',loc:'',rate:0,exp:0,rating:0,reviews:0,photo:null,
  priceType:'hod',dayRate:0,radius:0,kmPrice:0,
  services:[],
  langs:['Čeština'],
  bio:''
};
/* jazyky, které si pečovatelka může nastavit v profilu */
const LANGUAGES=['Čeština','Slovenština','Angličtina','Němčina','Ukrajinština','Ruština','Polština','Vietnamština'];
const LANG_ABBR={'Čeština':'CZ','Slovenština':'SK','Angličtina':'EN','Němčina':'DE','Ukrajinština':'UA','Ruština':'RU','Polština':'PL','Vietnamština':'VN'};
const langAbbr=l=>LANG_ABBR[l]||String(l||'').slice(0,2).toUpperCase();
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
  setAva(document.getElementById('cgDashAva'),cgProfile.photo||auth.photo,initials(cgProfile.name));
  document.getElementById('cgFirst').textContent=cgFirstName().split(/\s+/)[0];
  document.getElementById('cgIntro').textContent=CG_REQUESTS.length
    ?`Máte ${CG_REQUESTS.length} ${CG_REQUESTS.length===1?'novou poptávku':'nové poptávky'} a ${CG_SCHEDULE.length} naplánovaných služeb.`
    :'Aktuálně nemáte žádné nové poptávky.';
  const _now=new Date();
  const earn=(CG_SCHEDULE||[]).reduce((s,j)=>{const d=j.date?new Date(j.date):null;return (d&&!isNaN(d)&&d.getMonth()===_now.getMonth()&&d.getFullYear()===_now.getFullYear())?s+(j.hours||0)*(cgProfile.rate||0):s;},0);
  const stats=[
    {ic:'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6',v:earn.toLocaleString('cs-CZ')+' Kč',l:'Výdělek tento měsíc',t:null},
    {ic:'M8 2v4M16 2v4M4 9h16M4 5h16v15H4z',v:CG_SCHEDULE.length,l:'Nadcházející služby',t:null},
    {svg:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="9" stroke="#C9A233" stroke-width="1.5"/><path d="M8.5 14a4.5 4.5 0 0 0 7 0" stroke="#C9A233" stroke-width="1.5" stroke-linecap="round"/><circle cx="9" cy="10" r="1.1" fill="#C9A233"/><circle cx="15" cy="10" r="1.1" fill="#C9A233"/></svg>',v:cgProfile.rating,l:'Hodnocení ('+cgProfile.reviews+')',t:null},
    {svg:'<svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" stroke="#C9A233" stroke-width="1.5"/><circle cx="12" cy="12" r="3" stroke="#C9A233" stroke-width="1.5"/></svg>',v:'—',l:'Zhlédnutí profilu',t:null}
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
      ${avaHtml(j.init,j.photo)}
      <div class="od"><b>${sName(j.service)}</b><div class="det">${esc(j.fam)} · ${fmtDate(j.date)}<br>${timeRange(j.time,j.hours)}</div></div>
      <div class="ost"><span class="status ok">Potvrzeno</span><div class="pr">${(j.hours*cgProfile.rate).toLocaleString('cs-CZ')} Kč</div></div>
    </div>`).join('');
}
function reqCardHTML(r){
  return `<div class="req">
    ${avaHtml(r.init,r.photo)}
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
  document.getElementById('cgReqFull').innerHTML=CG_REQUESTS.length?CG_REQUESTS.map(reqCardHTML).join(''):'<div class="empty">'+clockSVG(15)+' Žádné nové poptávky.</div>';
  document.getElementById('cgConfirmed').innerHTML=cgScheduleHTML();
}
function acceptRequest(id){
  const i=CG_REQUESTS.findIndex(r=>r.id===id);if(i<0)return;
  const r=CG_REQUESTS.splice(i,1)[0];
  CG_SCHEDULE.push({fam:r.fam,init:r.init,service:r.service,date:r.date,time:r.time,hours:r.hours,photo:r.photo||null});
  if(r.oid){const o=ORDERS.find(x=>x.oid===r.oid);if(o)o.status='confirmed';}
  apiSync(api('/requests/'+id+'/accept',{method:'POST'}));
  toast(`Poptávka od <b>${esc(r.fam)}</b> přijata`,'success');refreshCg();
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
    html+=`<div class="day ${has?'has':''} ${today?'today':''}" ${has?'role="button" tabindex="0"':''} onclick="${has?`toast('Naplánovaná služba ${d}. ${MONTHS[cgCalMonth].toLowerCase()}')`:''}">${d}</div>`;
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
  toast(val?`${DAYS_CZ[i]} — nyní dostupná`:`${DAYS_CZ[i]} — označeno jako nedostupné`,val?'success':undefined);
}
function toggleSlot(i,k){cgSlots[i][k]=!cgSlots[i][k];saveCgAvail();renderCgCalendar();}

/* caregiver profile editing */
let cgLangPickerOpen=false;
let cgServPickerOpen=false;
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
  renderCgLangChips();
  updateCgAvatar();
  syncCgPreview();
  ddRefresh();
}
function updateCgAvatar(){
  const el=document.getElementById('cpAvatar');
  const rm=document.getElementById('cpPhotoRemove');
  const photo=cgProfile.photo||auth.photo||null;
  if(!el)return;
  el.style.backgroundImage='';el.style.color='';
  if(photo){
    el.innerHTML=`<img src="${esc(photo)}" alt="" decoding="async">`;
    if(rm)rm.style.display='';
  }else{
    el.textContent=initials((document.getElementById('cpName')||{}).value||cgProfile.name);
    if(rm)rm.style.display='none';
  }
}
function onCgPhoto(e){
  const file=e.target.files&&e.target.files[0];
  if(!file)return;
  if(!file.type.startsWith('image/')){toast('Vyberte prosím obrázek.');return;}
  const reader=new FileReader();
  reader.onload=function(){
    const img=new Image();
    img.onload=function(){
      const max=400;let w=img.width,h=img.height;
      if(w>h){if(w>max){h=Math.round(h*max/w);w=max;}}else{if(h>max){w=Math.round(w*max/h);h=max;}}
      const c=document.createElement('canvas');c.width=w;c.height=h;
      c.getContext('2d').drawImage(img,0,0,w,h);
      cgProfile.photo=c.toDataURL('image/webp',0.85);
      auth.photo=cgProfile.photo;
      const me=CAREGIVERS.find(x=>x.email===auth.email);
      if(me){me.photo=cgProfile.photo;apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{photo:cgProfile.photo}}));}
      apiSync(api('/users/me/photo',{method:'PATCH',body:{photo:cgProfile.photo}}));
      syncCgPhotoToList();updateCgAvatar();syncCgPreview();updateAuthUI();renderCare();
      toast('Profilová fotka nahrána');
    };
    img.src=reader.result;
  };
  reader.readAsDataURL(file);
}
function removeCgPhoto(){
  cgProfile.photo=null;auth.photo=null;
  const inp=document.getElementById('cpPhotoInput');if(inp)inp.value='';
  const me=CAREGIVERS.find(x=>x.email===auth.email);
  if(me){me.photo=null;apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{photo:null}}));}
  apiSync(api('/users/me/photo',{method:'PATCH',body:{photo:null}}));
  syncCgPhotoToList();updateCgAvatar();syncCgPreview();updateAuthUI();renderCare();
  toast('Profilová fotka odebrána');
}
function renderCgServiceChips(){
  const wrap=document.getElementById('cpServices');
  const summary=document.getElementById('cpServSummary');
  const picker=document.getElementById('cpServPicker');
  const toggle=document.getElementById('cpServToggle');
  if(!wrap)return;
  if(!Array.isArray(cgProfile.services))cgProfile.services=[];
  if(summary)summary.textContent=cgProfile.services.length?cgProfile.services.map(sName).join(', '):'Žádná služba není vybraná';
  if(picker)picker.hidden=!cgServPickerOpen;
  if(toggle){toggle.textContent=cgServPickerOpen?'Zavřít výběr':'Změnit služby';toggle.setAttribute('aria-expanded',cgServPickerOpen?'true':'false');}
  wrap.innerHTML=SERVICES.map(s=>
    `<button type="button" class="cg-serv ${cgProfile.services.includes(s.id)?'on':''}" onclick="toggleCgService('${s.id}')">${s.name}</button>`).join('');
}
function toggleCgServPicker(){
  cgServPickerOpen=!cgServPickerOpen;
  renderCgServiceChips();
}
function toggleCgService(id){
  const i=cgProfile.services.indexOf(id);
  if(i<0)cgProfile.services.push(id);else cgProfile.services.splice(i,1);
  renderCgServiceChips();syncCgPreview();
}
function renderCgLangChips(){
  const wrap=document.getElementById('cpLangs');
  const summary=document.getElementById('cpLangSummary');
  const picker=document.getElementById('cpLangPicker');
  const toggle=document.getElementById('cpLangToggle');
  if(!wrap||!summary||!picker||!toggle)return;
  if(!Array.isArray(cgProfile.langs))cgProfile.langs=[];
  summary.textContent=cgProfile.langs.length?cgProfile.langs.join(', '):'Žádný jazyk není vybraný';
  picker.hidden=!cgLangPickerOpen;
  toggle.textContent=cgLangPickerOpen?'Zavřít výběr':'Změnit jazyk';
  toggle.setAttribute('aria-expanded',cgLangPickerOpen?'true':'false');
  wrap.innerHTML=LANGUAGES.map(l=>
    `<button type="button" class="cg-serv ${cgProfile.langs.includes(l)?'on':''}" onclick="toggleCgLang('${l}')">${esc(l)}</button>`).join('');
}
function toggleCgLangPicker(){
  cgLangPickerOpen=!cgLangPickerOpen;
  renderCgLangChips();
}
function toggleCgLang(l){
  if(!Array.isArray(cgProfile.langs))cgProfile.langs=[];
  const i=cgProfile.langs.indexOf(l);
  if(i<0)cgProfile.langs.push(l);else cgProfile.langs.splice(i,1);
  renderCgLangChips();syncCgPreview();
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
  const servs=cgProfile.services.map(s=>{
    const svc=SERVICES.find(x=>x.id===s);
    const ic=svc?`<svg width="14" height="14" viewBox="0 0 24 24" fill="none" style="vertical-align:-2px;margin-right:5px"><path d="${svc.icon}" stroke="#C9A233" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`:'';
    return `<span class="chip svc-chip">${ic}${sName(s)}</span>`;
  }).join('');
  const langs=(cgProfile.langs||[]).map(l=>`<span class="lang-abbr" title="${esc(l)}">${esc(langAbbr(l))}</span>`).join('');
  const photo=cgProfile.photo||auth.photo||null;
  if(!photo)updateCgAvatar();
  document.getElementById('cgPreview').innerHTML=`
    <div class="care-card" style="cursor:default">
      <div class="care-top">
        <div class="ava">${photo?`<img src="${esc(photo)}" alt="" decoding="async">`:initials(name)}</div>
        <div style="flex:1">
          <div class="care-name">${name}</div>
          <div class="care-loc"><svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 21s-7-4.5-7-11a7 7 0 1 1 14 0c0 6.5-7 11-7 11Z" stroke="#7A736A" stroke-width="1.6"/><circle cx="12" cy="10" r="2.2" stroke="#7A736A" stroke-width="1.6"/></svg>${loc} · dojezd do ${radius} km</div>
          ${langs?`<div class="care-langs">${langs}</div>`:''}
          <div class="care-meta"><span class="stars">${starFillSVG()}</span><b style="color:var(--navy-900)">${cgProfile.rating}</b><span>(${cgProfile.reviews}) · ${exp} let praxe</span></div>
        </div>
      </div>
      <div class="care-tags"><span class="chip badge-id"><img src="verify.webp" alt="" width="14" height="17" style="vertical-align:-3px;margin-right:3px">Ověřená identita</span>${servs}</div>
      <div class="care-foot"><div class="price">${priceHTML}</div><button class="btn btn-gold" style="padding:9px 16px">Zobrazit profil</button></div>
    </div>`;
}
function saveCgProfile(){
  // číslo z pole; prázdné → ponech starou hodnotu, ale 0 se uloží jako 0
  const numOr=(id,fallback)=>{const raw=(document.getElementById(id).value||'').trim();if(raw==='')return fallback;const n=+raw;return Number.isFinite(n)?n:fallback;};
  cgProfile.name=document.getElementById('cpName').value.trim()||cgProfile.name;
  cgProfile.loc=document.getElementById('cpLoc').value;
  cgProfile.exp=numOr('cpExp',cgProfile.exp);
  cgProfile.radius=numOr('cpRadius',cgProfile.radius);
  cgProfile.kmPrice=Math.max(0,numOr('cpKmPrice',0));
  cgProfile.priceType=document.getElementById('cpPriceType').value;
  const rv=numOr('cpRate',null);
  if(rv!==null){if(cgProfile.priceType==='den')cgProfile.dayRate=rv;else if(cgProfile.priceType==='hod')cgProfile.rate=rv;}
  cgProfile.bio=document.getElementById('cpBio').value.trim().slice(0,500);
  // propsat změny do veřejné karty pečovatelky (Jana = id 1 / dle e-mailu)
  if(!Array.isArray(cgProfile.langs))cgProfile.langs=[];
  const me=CAREGIVERS.find(x=>x.email===auth.email)||CAREGIVERS[0];
  if(me){me.name=cgProfile.name;me.photo=cgProfile.photo||null;me.loc=cgProfile.loc;me.rate=cgProfile.rate;me.exp=cgProfile.exp;me.bio=cgProfile.bio;
    me.radius=cgProfile.radius;me.priceType=cgProfile.priceType;me.dayRate=cgProfile.dayRate;
    me.kmPrice=cgProfile.kmPrice;me.services=cgProfile.services.slice();me.langs=cgProfile.langs.slice();}
  if(auth.role==='caregiver'){loginAs(cgProfile.name,auth.email,auth.role,cgProfile.photo);}
  if(me&&me.id){apiSync(api('/caregivers/'+me.id,{method:'PATCH',body:{
    name:cgProfile.name,loc:cgProfile.loc,rate:cgProfile.rate,exp:me.exp,bio:cgProfile.bio,
    services:cgProfile.services,langs:cgProfile.langs,radius:cgProfile.radius,priceType:cgProfile.priceType,
    dayRate:cgProfile.dayRate,kmPrice:cgProfile.kmPrice,photo:cgProfile.photo||null
  }}));}
  // po uložení zavři rozbalené výběry
  cgServPickerOpen=false;cgLangPickerOpen=false;
  renderCgServiceChips();renderCgLangChips();
  renderCare();
  toast('Profil byl uložen a zveřejněn');
}

/* ---------- EARNINGS CHART ---------- */
const CG_MONTHS_SHORT=['Led','Úno','Bře','Dub','Kvě','Čvn','Čvc','Srp','Zář','Říj','Lis','Pro'];
/* reálné výdělky za posledních 6 měsíců z naplánovaných služeb (hodiny × sazba) */
function computeCgEarnings(){
  const now=new Date();const rate=cgProfile.rate||0;
  const buckets=[];const idx={};
  for(let i=5;i>=0;i--){
    const d=new Date(now.getFullYear(),now.getMonth()-i,1);
    const key=d.getFullYear()+'-'+d.getMonth();
    idx[key]=buckets.length;
    buckets.push({m:CG_MONTHS_SHORT[d.getMonth()],v:0});
  }
  (CG_SCHEDULE||[]).forEach(j=>{
    if(!j.date)return;
    const d=new Date(j.date);if(isNaN(d))return;
    const key=d.getFullYear()+'-'+d.getMonth();
    if(idx[key]!==undefined)buckets[idx[key]].v+=(j.hours||0)*rate;
  });
  return buckets;
}
function renderEarnings(){
  const data=computeCgEarnings();
  const max=Math.max(1,...data.map(e=>e.v));
  const total=data.reduce((s,e)=>s+e.v,0);
  document.getElementById('earnTotal').textContent=total.toLocaleString('cs-CZ')+' Kč';
  const n=data.length,yTop=18,yBot=90;
  const pts=data.map((e,i)=>({x:(i+0.5)/n*100,y:yBot-(e.v/max)*(yBot-yTop),e,i}));
  const line=pts.map((p,i)=>`${i?'L':'M'}${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' ');
  const area=`M${pts[0].x.toFixed(2)} 100 L`+pts.map(p=>`${p.x.toFixed(2)} ${p.y.toFixed(2)}`).join(' L')+` L${pts[n-1].x.toFixed(2)} 100 Z`;
  const dots=pts.map(p=>`<button class="lc-pt ${p.i===n-1?'cur':''}" style="left:${p.x.toFixed(2)}%;top:${p.y.toFixed(2)}%" aria-label="${p.e.m}: ${p.e.v.toLocaleString('cs-CZ')} Kč"><span class="lc-tipv">${p.e.v.toLocaleString('cs-CZ')} Kč</span></button>`).join('');
  const labels=data.map(e=>`<span>${e.m}</span>`).join('');
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
    cpName:c.name,cpInit:c.init,cpPhoto:c.photo||o.cgPhoto||null,cpRole:'Pečovatelka',cpChatRole:'caregiver',
    dateLabel:fmtDate(o.date),timeLabel:timeRange(o.time,o.hours),hours:o.hours,price:orderPrice(o),
    rate:c.rate,km:o.km||0,transport:(c.kmPrice&&o.km)?c.kmPrice*o.km:0,addr:o.addr,note:o.note,
    back:'bookings',backLabel:'Zpět na objednávky'};
  renderOrderDetail();go('order-detail');
}
function openCgOrder(i){
  const j=CG_SCHEDULE.slice().sort((a,b)=>a.date.localeCompare(b.date))[i];if(!j)return;
  curOrder={viewer:'caregiver',title:sName(j.service),status:'confirmed',
    cpName:j.fam,cpInit:j.init,cpPhoto:j.photo||null,cpRole:'Klient',cpChatRole:'family',
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
      ?`<button class="btn btn-ghost btn-block" style="margin-top:10px" disabled>Hodnocení odesláno ${checkSVG(13)}</button>`
      :`<button class="btn btn-navy btn-block" style="margin-top:10px" onclick="openRating(${o.cid},${o.oid})">Ohodnotit péči</button>`;
  }else if(declined){
    action=`<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="openProfile(${o.cid})">Objednat znovu</button>`;
  }else{
    action=`<button class="btn btn-ghost btn-block" style="margin-top:10px" onclick="cancelOrder(${o.oid})">Zrušit objednávku</button>`;
  }
  document.getElementById('orderDetailGrid').innerHTML=`
    <div class="pcard">
      <div class="phead" style="margin-bottom:18px">
        ${avaHtml(esc(o.cpInit),o.cpPhoto)}
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
      <button class="btn btn-gold btn-block" style="margin-top:18px" onclick="openChat(${o.viewer==='family'?o.cid:'null'},${jsq(o.cpName)},${jsq(o.cpInit)},${jsq(o.cpChatRole)})">Napsat zprávu</button>
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
  const icEl=document.getElementById('confirmIcon');
  icEl.style.color=o.danger?'#C0473B':'#C9A233';
  icEl.innerHTML=o.icon||warnSVG();
  const ok=document.getElementById('confirmOkBtn');
  ok.textContent=o.confirmLabel||'Potvrdit';
  ok.className='btn '+(o.danger?'btn-decline':'btn-gold');
  // volitelné textové pole (např. důvod zamítnutí)
  const wrap=document.getElementById('confirmInputWrap');
  const inp=document.getElementById('confirmInput');
  if(o.input){
    document.getElementById('confirmInputLabel').textContent=o.input.label||'';
    inp.value=o.input.value||'';
    inp.placeholder=o.input.placeholder||'';
    wrap.style.display='';
  }else{wrap.style.display='none';inp.value='';}
  confirmCb=typeof o.onConfirm==='function'?o.onConfirm:null;
  const m=document.getElementById('confirmModal');
  m.classList.add('open');document.body.style.overflow='hidden';
  setTimeout(()=>{(o.input?inp:ok).focus();},60);
}
function closeConfirm(){
  const m=document.getElementById('confirmModal');
  if(m&&m.classList.contains('open')){m.classList.remove('open');document.body.style.overflow='';}
  confirmCb=null;
}
function confirmProceed(){
  const cb=confirmCb;
  const val=document.getElementById('confirmInput').value;
  closeConfirm();
  if(cb)cb(val);
}
function setStars(crit,n){ratingTarget.scores[crit]=n;renderStars();}
function renderStars(){
  document.getElementById('ratingCriteria').innerHTML=RATE_CRITERIA.map(c=>`
    <div class="rate-row">
      <span class="rr-l">${c.l}</span>
      <span class="rr-stars" role="group" aria-label="${c.l}">${[1,2,3,4,5].map(n=>
        `<button type="button" class="${n<=ratingTarget.scores[c.k]?'on':''}" aria-label="${n} z 5" onclick="setStars('${c.k}',${n})">${starFillSVG(22)}</button>`).join('')}</span>
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
  toast('Děkujeme za vaše hodnocení!','success');
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
function chatNow(){return new Date().toLocaleTimeString('cs-CZ',{hour:'2-digit',minute:'2-digit'});}
/* --- reálný oboustranný chat: data ze serveru --- */
let chatPollTimer=null;
function convClient(cv){
  return {id:cv.id,name:cv.name,init:cv.init||initials(cv.name||''),photo:cv.photo||null,
    role:cv.role||'caregiver',profileToken:cv.profileToken||null,msgs:cv.msgs||[],last:cv.last||'',unread:cv.unread||0,lastAt:cv.lastAt||null};
}
function upsertConversation(cv){
  let c=CONVERSATIONS.find(x=>x.id===cv.id);
  if(c){c.name=cv.name;c.init=cv.init||c.init;c.photo=cv.photo||c.photo;c.role=cv.role||c.role;
    if(cv.profileToken)c.profileToken=cv.profileToken;
    c.last=cv.last!=null?cv.last:c.last;c.unread=cv.unread||0;c.lastAt=cv.lastAt||c.lastAt;if(cv.msgs)c.msgs=cv.msgs;}
  else{CONVERSATIONS.unshift(convClient(cv));}
  return CONVERSATIONS.find(x=>x.id===cv.id);
}
/* klik na avatar v seznamu → veřejný profil protistrany */
function openConvProfile(c){
  if(!c||c.id<=0)return;
  if(c.profileToken){openProfileByToken(c.profileToken);return;}
  if(c.role==='caregiver'){const cg=CAREGIVERS.find(x=>x.name===c.name);if(cg){openProfile(cg.id);return;}}
  toast('Profil není k dispozici.','declined');
}
async function loadConversations(){
  if(!auth.loggedIn)return;
  let list;
  try{const r=await api('/conversations');list=r.conversations||[];}catch(e){return;}
  const keep={};list.forEach(cv=>keep[cv.id]=cv);
  // ponech broadcast pseudo (id<=0) a jen existující reálné konverzace
  CONVERSATIONS=CONVERSATIONS.filter(c=>c.id<=0||keep[c.id]);
  list.forEach(cv=>upsertConversation(cv));
  CONVERSATIONS.sort(sortConvs);
  try{ensureBroadcastConvo();}catch(e){}
  try{updateAuthUI();}catch(e){}
}
async function loadMessages(id){
  if(!(id>0))return;
  const c=CONVERSATIONS.find(x=>x.id===id);if(!c)return;
  try{const r=await api('/conversations/'+id+'/messages');c.msgs=r.messages||[];c.unread=0;}catch(e){}
}
function chatSignature(){
  const c=CONVERSATIONS.find(x=>x.id===activeChat);
  const last=c&&c.msgs.length?c.msgs[c.msgs.length-1]:null;
  const msgSig=c?(c.msgs.length+':'+(last&&last.id||0)):'0';
  return CONVERSATIONS.map(x=>x.id+'/'+(x.unread||0)+'/'+(x.last||'')).join('|')+'#'+activeChat+'#'+msgSig;
}
async function enterChat(){
  renderChat();
  const inp=document.getElementById('chatInput');
  if(inp&&!inp.dataset.typingBound){inp.dataset.typingBound='1';inp.addEventListener('input',onChatTypingInput);}
  try{await loadConversations();}catch(e){}
  if(activeChat==null||!CONVERSATIONS.find(c=>c.id===activeChat))activeChat=CONVERSATIONS[0]&&CONVERSATIONS[0].id;
  if(activeChat>0){try{await loadMessages(activeChat);}catch(e){}}
  renderChat();
  startChatPolling();
}
/* pojistka: pokud vypadne SSE, dober zprávy pollingem (delší interval) */
function startChatPolling(){
  if(chatPollTimer)clearInterval(chatPollTimer);
  chatPollTimer=setInterval(async()=>{
    if(activeView()!=='chat'){clearInterval(chatPollTimer);chatPollTimer=null;return;}
    const before=chatSignature();
    await loadConversations();
    if(activeChat>0)await loadMessages(activeChat);
    if(chatSignature()!==before)renderChat();
  },15000);
}
async function openChat(caregiverId,name,init,role,email){
  if(!auth.loggedIn){toast('Pro poslání zprávy se prosím přihlaste.');go('login');return;}
  const body={};
  if(caregiverId)body.caregiverId=caregiverId;
  else if(email)body.email=email;
  else if(name){body.name=name;body.role=role||'caregiver';}
  else return;
  let conv;
  try{const r=await api('/conversations',{method:'POST',body});conv=r.conversation;}
  catch(e){toast(e.message||'Nepodařilo se otevřít konverzaci.','declined');return;}
  upsertConversation(conv);
  activeChat=conv.id;
  await go('chat');
  if(activeChat>0)await loadMessages(activeChat);
  renderChat();
  setTimeout(()=>document.getElementById('chatInput')?.focus(),140);
}
/* fotka protistrany konverzace — z konverzace, jinak dohledat pečovatelku podle jména */
function convoPhoto(c){
  if(c&&c.photo)return c.photo;
  if(c&&c.role==='caregiver'){const cg=CAREGIVERS.find(x=>x.name===c.name);if(cg&&cg.photo)return cg.photo;}
  return null;
}
function makeChatAvatar(text,photo){
  const el=document.createElement('div');
  el.className='ava';
  if(photo){el.innerHTML=`<img src="${esc(photo)}" alt="" decoding="async">`;}
  else el.textContent=text||'';
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
    const avaWrap=document.createElement('div');
    avaWrap.className='chat-li-ava';
    avaWrap.appendChild(makeChatAvatar(c.init,convoPhoto(c)));
    if(c.id>0&&!c.readonly&&c.role!=='admin'){
      btn.dataset.cid=c.id;
      const dot=document.createElement('span');dot.className='pres-dot chat-li-dot';dot.hidden=true;
      avaWrap.appendChild(dot);
      avaWrap.classList.add('clickable');
      avaWrap.title='Zobrazit profil';
      avaWrap.addEventListener('click',ev=>{ev.stopPropagation();openConvProfile(c);});
    }
    btn.appendChild(avaWrap);
    const ci=document.createElement('div');
    ci.className='ci';
    const name=document.createElement('b');
    name.textContent=c.name;
    const preview=document.createElement('span');
    preview.textContent=last?((last.me?'Vy: ':'')+(last.text||(last.image?'📷 Obrázek':''))):'Nová konverzace';
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
  head.appendChild(makeChatAvatar(c.init,convoPhoto(c)));
  const headMeta=document.createElement('div');
  const headName=document.createElement('b');
  headName.textContent=c.name;
  const headState=document.createElement('span');
  headState.id='chatHeadState';headState.className='chat-head-state';
  if(c.readonly){headState.textContent='Oznámení od ZENVORIA';head.dataset.presRead='1';head.dataset.cid='';}
  else{headState.innerHTML='<span class="pres-dot" hidden></span><span class="pres-txt"></span>';head.dataset.presRead='';head.dataset.cid=c.id;}
  headMeta.appendChild(headName);
  headMeta.appendChild(headState);
  head.appendChild(headMeta);
  body.textContent='';
  c.msgs.forEach(m=>{
    const row=document.createElement('div');
    row.className='msg '+(m.me?'me':'them')+(m.image?' has-img':'');
    if(m.image){
      const im=document.createElement('img');im.className='msg-img';im.src=m.image;im.loading='lazy';im.alt='obrázek';
      im.addEventListener('click',()=>openImgLightbox(m.image));
      im.addEventListener('error',()=>{const ph=document.createElement('span');ph.className='msg-img-broken';ph.textContent='🖼️ obrázek nelze zobrazit';im.replaceWith(ph);});
      row.appendChild(im);
    }
    if(m.text)row.appendChild(document.createTextNode(m.text));
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
  applyChatPresenceToDom();
  startChatPresence();
}
/* odešli text do aktivní konverzace (optimisticky, bez fake odpovědi) */
async function sendChatText(text){
  text=String(text||'').trim();if(!text)return;
  const c=CONVERSATIONS.find(x=>x.id===activeChat);
  if(!c||c.readonly||!(c.id>0)){toast('Vyberte konverzaci.');return;}
  const tmp={id:0,me:true,text,t:chatNow(),pending:true};
  c.msgs.push(tmp);c.last=text;renderChat();
  _typingLastSent=0;clearTimeout(_typingOffTimer);sendTyping(false);
  try{
    const r=await api('/conversations/'+c.id+'/messages',{method:'POST',body:{text,t:tmp.t}});
    const i=c.msgs.indexOf(tmp);if(i>=0)c.msgs[i]=r.message;else c.msgs.push(r.message);
    c.last=text;c.lastAt=r.message.createdAt;renderChat();
  }catch(err){
    const i=c.msgs.indexOf(tmp);if(i>=0)c.msgs.splice(i,1);renderChat();
    toast(err.message||'Zprávu se nepodařilo odeslat.','declined');
  }
}
/* návrh termínu: otevři výběr data/času/délky */
function sendTerm(){
  const c=CONVERSATIONS.find(x=>x.id===activeChat);
  if(!c||c.readonly||!(c.id>0)){toast('Vyberte konverzaci.');return;}
  openTermModal();
}
function openTermModal(){
  const d=new Date(Date.now()+2*86400000);
  const dEl=document.getElementById('termDate'),tEl=document.getElementById('termTime'),hEl=document.getElementById('termHours');
  if(dEl){dEl.min=todayISO();dEl.value=d.toISOString().slice(0,10);}
  if(tEl){tEl.value='10:00';}
  if(hEl){hEl.value='4';if(hEl._ddRefresh)hEl._ddRefresh();}
  const m=document.getElementById('termModal');if(m){m.classList.add('open');document.body.style.overflow='hidden';}
}
function closeTermModal(){
  const m=document.getElementById('termModal');
  if(m&&m.classList.contains('open')){m.classList.remove('open');document.body.style.overflow='';}
}
function hoursLabelCz(h){h=Number(h)||0;const w=h===1?'hodina':((h>=2&&h<=4)?'hodiny':'hodin');return h+' '+w;}
function confirmTerm(){
  const date=(document.getElementById('termDate')||{}).value||'';
  const time=(document.getElementById('termTime')||{}).value||'';
  const hours=(document.getElementById('termHours')||{}).value||'';
  if(!date){toast('Vyberte datum.','declined');return;}
  if(date<todayISO()){toast('Datum nemůže být v minulosti.','declined');return;}
  if(!time){toast('Vyberte čas.','declined');return;}
  const d=new Date(date+'T00:00:00');
  const dateLabel=isNaN(d)?date:d.toLocaleDateString('cs-CZ',{weekday:'long',day:'numeric',month:'long'});
  closeTermModal();
  sendChatText(`📅 Návrh termínu: ${dateLabel} v ${time} (${hoursLabelCz(hours)}). Vyhovuje?`);
}
/* obrázek: zmenši a VŽDY překóduj přes canvas na čisté baseline JPEG
   (žádný fallback na rozbitý originál) → menší přenos i spolehlivé zobrazení */
async function decodeImage(file){
  // createImageBitmap je nejspolehlivější; fallback na <img>
  if(typeof createImageBitmap==='function'){
    try{return await createImageBitmap(file);}catch(e){/* zkus <img> */}
  }
  return await new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(file);const im=new Image();
    im.onload=()=>{URL.revokeObjectURL(url);(im.naturalWidth&&im.naturalHeight)?resolve(im):reject(new Error('decode'));};
    im.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('decode'));};
    im.src=url;
  });
}
async function downscaleImage(file,maxDim){
  const src=await decodeImage(file);
  let w=src.width||src.naturalWidth,h=src.height||src.naturalHeight;
  if(!w||!h)throw new Error('empty');
  if(w>maxDim||h>maxDim){const s=maxDim/Math.max(w,h);w=Math.round(w*s);h=Math.round(h*s);}
  const cv=document.createElement('canvas');cv.width=w;cv.height=h;
  const ctx=cv.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);ctx.drawImage(src,0,0,w,h);
  if(src.close)src.close();
  // WebP = menší soubor → rychlejší načtení; fallback na JPEG, kde WebP canvas neumí
  let out=cv.toDataURL('image/webp',0.82);
  if(!/^data:image\/webp/.test(out))out=cv.toDataURL('image/jpeg',0.85);
  return out;
}
async function onChatImage(input){
  const f=input.files&&input.files[0];input.value='';
  if(!f)return;
  if(!/^image\//.test(f.type||'')){toast('Vyberte prosím obrázek.','declined');return;}
  if(f.size>25*1024*1024){toast('Obrázek je příliš velký (max 25 MB).','declined');return;}
  let dataUrl;
  try{dataUrl=await downscaleImage(f,1280);}catch(e){dataUrl=null;}
  if(!dataUrl){toast('Obrázek se nepodařilo zpracovat. Zkuste jiný.','declined');return;}
  sendChatImage(dataUrl);
}
async function sendChatImage(image){
  const c=CONVERSATIONS.find(x=>x.id===activeChat);
  if(!c||c.readonly||!(c.id>0)){toast('Vyberte konverzaci.');return;}
  const tmp={id:0,me:true,text:'',image,t:chatNow(),pending:true};
  c.msgs.push(tmp);c.last='📷 Obrázek';renderChat();
  try{
    const r=await api('/conversations/'+c.id+'/messages',{method:'POST',body:{image,t:tmp.t}});
    const i=c.msgs.indexOf(tmp);if(i>=0)c.msgs[i]=r.message;else c.msgs.push(r.message);
    c.last='📷 Obrázek';c.lastAt=r.message.createdAt;renderChat();
  }catch(err){
    const i=c.msgs.indexOf(tmp);if(i>=0)c.msgs.splice(i,1);renderChat();
    toast(err.message||'Obrázek se nepodařilo odeslat.','declined');
  }
}
/* --- emoji ve zprávách --- */
const CHAT_EMOJIS=['😀','😃','😄','😁','😊','🙂','😉','😍','🥰','😘','😎','🤗','🤔','😅','😂','🤣','🙃','😌','😴','😇','🥳','😢','😭','😟','😳','🤒','🤕','😷','👍','👎','👌','🙏','👏','💪','🙌','👋','🤝','✌️','❤️','🧡','💛','💚','💙','💜','🤍','💖','✨','🔥','🎉','🎂','🌸','🌷','🌻','☀️','🌙','⭐','✅','❌','❗','❓','⏰','📅','📞','📍','🏠','🚗','💊','🩺','👵','👴','👶','🍲','☕'];
function buildEmojiPicker(){
  const wrap=document.getElementById('emojiPicker');if(!wrap||wrap.dataset.built)return;wrap.dataset.built='1';
  wrap.innerHTML='';
  CHAT_EMOJIS.forEach(e=>{
    const b=document.createElement('button');b.type='button';b.textContent=e;b.setAttribute('aria-label',e);
    b.addEventListener('click',ev=>{ev.stopPropagation();insertEmoji(e);});
    wrap.appendChild(b);
  });
}
function toggleEmojiPicker(ev){
  if(ev)ev.stopPropagation();
  const wrap=document.getElementById('emojiPicker');if(!wrap)return;
  buildEmojiPicker();
  wrap.classList.toggle('open');
}
function closeEmojiPicker(){const w=document.getElementById('emojiPicker');if(w)w.classList.remove('open');}
function insertEmoji(e){
  const inp=document.getElementById('chatInput');if(!inp)return;
  const s=(inp.selectionStart!=null?inp.selectionStart:inp.value.length);
  const en=(inp.selectionEnd!=null?inp.selectionEnd:inp.value.length);
  inp.value=inp.value.slice(0,s)+e+inp.value.slice(en);
  const pos=s+e.length;try{inp.setSelectionRange(pos,pos);}catch(_){ }
  inp.focus();
  try{onChatTypingInput();}catch(_){ }
}
document.addEventListener('click',e=>{if(!e.target.closest('#emojiPicker')&&!e.target.closest('#chatEmojiBtn'))closeEmojiPicker();});
function openImgLightbox(src){
  let ov=document.getElementById('imgLightbox');
  if(!ov){ov=document.createElement('div');ov.id='imgLightbox';ov.className='img-lightbox';ov.addEventListener('click',()=>ov.classList.remove('open'));document.body.appendChild(ov);}
  ov.textContent='';
  const im=document.createElement('img');im.src=src;ov.appendChild(im);
  ov.classList.add('open');
}
function scrollChat(){const b=document.getElementById('chatBody');if(b)b.scrollTop=b.scrollHeight;}
async function selectChat(id){activeChat=id;renderChat();if(id>0)await loadMessages(id);renderChat();document.getElementById('chatInput')?.focus();}
function sendChat(e){
  e.preventDefault();
  const inp=document.getElementById('chatInput');const text=inp.value.trim();if(!text)return false;
  inp.value='';
  sendChatText(text);
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
    cache:'no-store',
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
function apiSync(p){return Promise.resolve(p).catch(e=>{console.error('[api]',e);toast('Uložení do databáze se nezdařilo: '+e.message,'declined');});}
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
  // konverzace se načítají zvlášť přes /api/conversations (ne z bootstrapu) —
  // bootstrap je NESMÍ přepsat na prázdno, jinak by zmizely načtené konverzace
  BROADCASTS=d.broadcasts||[];
  if(d.planPrices)Object.assign(planPrices,d.planPrices);
  if(d.signupPlan)signupPlan={plan:d.signupPlan.plan==='premium'?'premium':'start',days:Number(d.signupPlan.days)||0};
  if(d.socialLinks)Object.assign(socialLinks,d.socialLinks);
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
    if(me){Object.assign(cgProfile,{name:me.name,bio:me.bio,loc:me.loc,rate:me.rate,services:me.services,langs:me.langs,photo:me.photo||cgProfile.photo,
      exp:me.exp!=null?me.exp:cgProfile.exp,radius:me.radius!=null?me.radius:cgProfile.radius,
      priceType:me.priceType||cgProfile.priceType,dayRate:me.dayRate!=null?me.dayRate:cgProfile.dayRate,kmPrice:me.kmPrice!=null?me.kmPrice:cgProfile.kmPrice});
      if(Array.isArray(me.avail)){cgSlots=me.avail;cgAvail=me.avail.map(s=>!!(s.r||s.o||s.v));}}
  }
  deriveCgMaps();
  if(auth.loggedIn){try{loadConversations();}catch(e){}}
}
/* ---------- INIT ---------- */
/* ---------- AUTO-UPDATE: obnovení stránky po novém deployi ---------- */
let appVersion=null;       // verze frontendu při prvním načtení
let updatePending=false;   // zjištěna nová verze → čeká na bezpečný okamžik k reloadu
let updateChecking=false;
async function fetchAppVersion(){
  try{
    const r=await fetch('/api/version',{cache:'no-store',credentials:'same-origin'});
    if(!r.ok)return null;
    const d=await r.json();
    return (d&&d.version)||null;
  }catch(e){return null;}
}
async function checkForUpdate(){
  if(updateChecking)return;
  updateChecking=true;
  try{
    const v=await fetchAppVersion();
    if(!v)return;
    if(appVersion===null){appVersion=v;return;}   // první úspěšná kontrola = výchozí verze
    if(v!==appVersion){updatePending=true;applyUpdateIfSafe();}
  }finally{updateChecking=false;}
}
/* reload jen v bezpečný okamžik — ne když uživatel píše nebo má otevřené modální okno */
function reloadIsSafe(){
  const ae=document.activeElement;
  if(ae&&/^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName)&&ae.type!=='checkbox'&&ae.type!=='radio')return false;
  if(document.body&&document.body.style.overflow==='hidden')return false; // otevřený modal/menu
  return true;
}
function applyUpdateIfSafe(){
  if(!updatePending||!reloadIsSafe())return false;
  location.reload();
  return true;
}
function initAutoUpdate(){
  checkForUpdate();                 // zjisti a ulož aktuální verzi
  setInterval(checkForUpdate,60000); // periodická kontrola každou minutu
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden){applyUpdateIfSafe();checkForUpdate();} });
  window.addEventListener('focus',()=>{applyUpdateIfSafe();checkForUpdate();});
}
/* ---------- ADMIN: automatické obnovení žádostí o ověření (bez ručního refreshe) ---------- */
let lastVerSig=null,lastPendingVer=0,adminPolling=false;
async function pollAdminVerifications(){
  if(adminPolling||!(auth.loggedIn&&auth.role==='admin'))return;
  adminPolling=true;
  try{
    const r=await api('/verifications');
    if(!r||!Array.isArray(r.verifications))return;
    const list=r.verifications;
    const sig=list.map(v=>v.id+':'+v.status).join('|');
    if(sig===lastVerSig)return;
    const firstRun=lastVerSig===null;
    lastVerSig=sig;
    VERIFICATIONS=list;
    verSeq=VERIFICATIONS.reduce((m,v)=>Math.max(m,v.id||0),0);
    list.forEach(v=>{if(v.email){if(v.status==='approved'||v.status==='verified')cgStatusMap[v.email]='verified';else if(v.status==='rejected')cgStatusMap[v.email]='rejected';else if(v.status==='submitted')cgStatusMap[v.email]='submitted';}});
    renderNav();
    const av=activeView();
    if(av==='admin-verify')renderAdminVerify();
    else if(av==='admin-dash')renderAdminDash();
    const pend=pendingVerCount();
    if(!firstRun&&pend>lastPendingVer)toast('Nová žádost o ověření čeká na schválení.',null,shieldSVG(20));
    lastPendingVer=pend;
  }catch(e){}finally{adminPolling=false;}
}
function initAdminPoll(){
  // počáteční stav ze startu, ať se hned nezbytečně nepřekresluje
  lastVerSig=VERIFICATIONS.map(v=>v.id+':'+v.status).join('|');
  lastPendingVer=pendingVerCount();
  setInterval(pollAdminVerifications,12000);            // každých 12 s
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden)pollAdminVerifications(); });
  window.addEventListener('focus',pollAdminVerifications);
}
let authWatchBusy=false;
async function pollAuthSession(){
  if(authWatchBusy||!auth.loggedIn)return;
  authWatchBusy=true;
  try{
    const r=await fetch('/api/auth/me',{credentials:'same-origin',cache:'no-store'});
    if(!r.ok){
      if(r.status===401||r.status===403)await forceLogout('Ucet byl odhlasen spravcem.');
      return;
    }
    const data=await r.json();
    if(!data||!data.user)await forceLogout('Ucet byl odhlasen spravcem.');
  }catch(e){}finally{authWatchBusy=false;}
}
function initAuthWatch(){
  setInterval(pollAuthSession,15000);
  document.addEventListener('visibilitychange',()=>{ if(!document.hidden)pollAuthSession(); });
  window.addEventListener('focus',pollAuthSession);
}
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
    if(m.user){auth.loggedIn=true;auth.name=m.user.name;auth.email=m.user.email;auth.role=m.user.role||'family';auth.photo=m.user.photo||null;auth.publicId=m.user.publicId||null;
      if(m.user.settings)Object.assign(appSettings,m.user.settings);}
  }catch(e){console.warn('auth/me',e.message);}
  try{await bootstrap();}catch(e){console.error('bootstrap',e);toast('Nepodařilo se načíst data z databáze. Zkontrolujte připojení.','declined');}
  updateAuthUI();
  renderHome();renderFilters();renderCare();renderCalendar();
  document.querySelectorAll('select').forEach(enhanceSelect);
  initReveal();
  // deep-link: lze otevřít přímo konkrétní stránku přes #hash (bez případného ?query)
  let deep='';
  try{deep=(location.hash||'').replace(/^#/,'').split('?')[0];}catch(e){}
  if(!resetPwToken&&!changeEmailToken&&deep&&deep.indexOf('legal-')===0&&LEGAL[deep.slice(6)])openLegal(deep.slice(6),{direct:true});
  else if(!resetPwToken&&!changeEmailToken&&deep&&deep.indexOf('u-')===0){await openProfileByToken(parseAccountToken(deep));}
  else if(!resetPwToken&&!changeEmailToken&&deep&&(document.getElementById('view-'+deep)||isDeferredView(deep)))await go(deep);
  else if(!resetPwToken&&!changeEmailToken&&auth.loggedIn)await go(landingView());
  // návrat ze Stripe Checkout (#pricing?paid=1 / ?canceled=1)
  if(!resetPwToken&&!changeEmailToken)handleBillingReturn();
  // výchozí stav historie, aby hned fungovalo tlačítko Zpět
  try{
    const active=document.querySelector('.view.active');
    const v=active?active.id.replace('view-',''):'home';
    const changed=!history.state||history.state.view!==v
      ||(v==='legal'&&history.state.legalKey!==legalCurrentKey)
      ||(v==='profile'&&history.state.token!==state.profileToken);
    if(changed)history.replaceState(stateForView(v),'','#'+hashForView(v));
  }catch(e){}
  initAutoUpdate();
  initAdminPoll();
  initAuthWatch();
  initPresencePing();
  initChatWatch();
  initRealtime();
}
initApp();
