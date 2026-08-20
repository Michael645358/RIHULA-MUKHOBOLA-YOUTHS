/* RIHULA V3 Front-end Experience Layer
   UI-only enhancements. Does not alter Supabase, SQL, authentication or finance rules.
*/
(function(){
  'use strict';
  const $=(s,r=document)=>r.querySelector(s);
  const $$=(s,r=document)=>Array.from(r.querySelectorAll(s));

  function toast(message){
    let el=$('#r3Toast');
    if(!el){el=document.createElement('div');el.id='r3Toast';el.className='r3-toast';document.body.appendChild(el)}
    el.textContent=message;el.classList.add('show');clearTimeout(window.__r3ToastTimer);
    window.__r3ToastTimer=setTimeout(()=>el.classList.remove('show'),2600);
  }
  window.rihulaToast=toast;

  function currentUser(){try{return JSON.parse(localStorage.getItem('loggedUser')||'null')}catch(_){return null}}

  function setupTheme(){
    const key='rihula-theme';
    const saved=localStorage.getItem(key);
    if(saved==='dark'||saved==='light') document.documentElement.classList.toggle('r3-dark',saved==='dark');
    const host=$('.admin-top-actions')||$('.pochi-hero-top')||$('header');
    if(!host||$('#r3ThemeToggle')) return;
    const b=document.createElement('button');b.id='r3ThemeToggle';b.type='button';b.className='r3-icon-button';b.title='Toggle appearance';b.setAttribute('aria-label','Toggle appearance');
    const update=()=>b.textContent=document.documentElement.classList.contains('r3-dark')?'☀️':'🌙';update();
    b.onclick=()=>{const dark=!document.documentElement.classList.contains('r3-dark');document.documentElement.classList.toggle('r3-dark',dark);localStorage.setItem(key,dark?'dark':'light');update();toast(dark?'Dark mode enabled':'Light mode enabled')};
    host.appendChild(b);
  }

  function setupUtilityBar(){
    if($('#r3UtilityBar')) return;
    const isMember=!!$('#dashboardScreen');
    const isAdmin=!!$('.admin-dashboard-page');
    if(!isMember&&!isAdmin) return;
    const bar=document.createElement('div');bar.id='r3UtilityBar';bar.className='r3-utility-bar';
    const now=new Date();
    const date=now.toLocaleDateString('en-KE',{weekday:'short',day:'numeric',month:'short'});
    const user=currentUser();
    bar.innerHTML=`<div class="r3-utility-group"><span class="r3-chip">● <strong>${isAdmin?'Control Centre':'RIHULA Member'}</strong></span><span class="r3-chip">📅 ${date}</span></div><div class="r3-utility-group"><span class="r3-chip">🔒 Front-end V3</span></div>`;
    const anchor=isAdmin?$('.admin-content'):$('.dashboard-content');
    if(anchor) anchor.parentNode.insertBefore(bar,anchor);
  }

  function setupMemberNav(){
    if(!$('#dashboardScreen')||$('#r3BottomNav')) return;
    document.body.classList.add('r3-member-page');
    const nav=document.createElement('nav');nav.id='r3BottomNav';nav.className='r3-bottom-nav';nav.setAttribute('aria-label','Member navigation');
    const items=[
      ['⌂','Home','showDashboard'],['▣','Savings','showHistory'],['＋','Contribute','showContribute'],['♧','Community','showGroupMembers'],['◯','Account','showProfile']
    ];
    items.forEach(([icon,label,fn],i)=>{const b=document.createElement('button');b.type='button';b.innerHTML=`<span class="r3-nav-icon">${icon}</span><span>${label}</span>`;b.onclick=()=>{if(typeof window[fn]==='function')window[fn]();setActive(i)};nav.appendChild(b)});
    document.body.appendChild(nav);
    function setActive(i){$$('button',nav).forEach((b,n)=>b.classList.toggle('active',n===i))}
    setActive(0);
  }

  function setupInstallPrompt(){
    if($('#r3InstallCard')||location.protocol==='file:') return;
    let deferred;
    window.addEventListener('beforeinstallprompt',e=>{
      e.preventDefault();deferred=e;
      const card=document.createElement('div');card.id='r3InstallCard';card.className='r3-install-card';
      card.innerHTML='<div class="r3-install-copy"><strong>Install RIHULA</strong><small>Use the association app like a normal phone app.</small></div><button id="r3InstallBtn">Install</button><button id="r3InstallClose" class="r3-icon-button" aria-label="Close">×</button>';
      document.body.appendChild(card);requestAnimationFrame(()=>card.classList.add('show'));
      $('#r3InstallBtn').onclick=async()=>{deferred.prompt();await deferred.userChoice;deferred=null;card.remove()};
      $('#r3InstallClose').onclick=()=>card.remove();
    });
  }

  function setupReveal(){
    const targets=$$('.card,.dashboard-card,.stat-card,.admin-panel-card,.admin-stat-card,.admin-tool,.featured-update,.achievements-section,.personal-summary-card');
    targets.forEach(el=>{if(el.classList.contains('r3-reveal'))return;el.classList.add('r3-reveal')});
    if(!('IntersectionObserver' in window)){targets.forEach(el=>el.classList.add('r3-visible'));return}
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('r3-visible');io.unobserve(e.target)}}),{threshold:.08});
    targets.forEach(el=>io.observe(el));
  }

  function setupSmartWelcome(){
    const el=$('#welcomeName');if(!el||!currentUser())return;
    const user=currentUser();
    const first=(user.name||'Member').trim().split(/\s+/)[0];
    const hour=new Date().getHours();
    const greeting=hour<12?'Good morning':hour<17?'Good afternoon':hour<21?'Good evening':'Good night';
    if(!el.textContent.includes(first)) el.innerHTML=`<div style="line-height:1.25"><div style="font-size:clamp(24px,6vw,34px);font-weight:850">${greeting}, ${escapeHtml(first)} 👋</div><div style="font-size:14px;opacity:.86;margin-top:5px">Your RIHULA space is ready.</div></div>`;
  }

  function escapeHtml(v){return String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}

  function enhanceAnnouncements(){
    const containers=['#notificationsContainer','#announcementsOnlyContainer'];
    containers.forEach(sel=>{const el=$(sel);if(!el)return;el.setAttribute('aria-live','polite')});
  }

  function setupKeyboard(){
    document.addEventListener('keydown',e=>{if(e.key==='Escape'){const nav=$('#r3BottomNav');if(nav)nav.classList.remove('open')}});
  }

  function boot(){
    setupTheme();setupUtilityBar();setupMemberNav();setupInstallPrompt();setupReveal();setupSmartWelcome();enhanceAnnouncements();setupKeyboard();
    if('serviceWorker' in navigator){navigator.serviceWorker.addEventListener('message',e=>{if(e.data?.type==='RIHULA_UPDATE')toast('A new RIHULA version is ready.')})}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
