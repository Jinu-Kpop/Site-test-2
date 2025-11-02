/* ===========================
   Main interactive behaviors
   =========================== */

/* Helper: query */
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

/* Elements */
const welcome = $('#welcome');
const enterBtn = $('#enterBtn');
const skipBtn = $('#skipBtn');
const site = $('#site');
const bgAudio = document.getElementById('bgAudio'); // music player inside main
const playBtn = $('#playBtn');
const playIcon = $('#playIcon');
const pauseIcon = $('#pauseIcon');
const progress = $('#progress');
const timeLabel = $('#timeLabel');
const volume = $('#volume');
const muteBtn = $('#muteBtn');
const loopBtn = $('#loopBtn');
const themeToggle = $('#themeToggle');
const scrollTopBtn = $('#scrollTop');
const mainContent = $('#mainContent');
const revealEls = $$('.reveal');
const yearSpan = $('#year');

/* set current year */
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

/* ===== Welcome / enter logic ===== */
function openSite(withFast = false){
  // animate welcome out
  welcome.style.transition = 'opacity 480ms ease, transform 480ms ease';
  welcome.style.opacity = '0';
  welcome.style.transform = 'scale(0.98) translateY(-8px)';
  setTimeout(()=> {
    welcome.classList.add('hidden');
    site.classList.remove('hidden');
    site.setAttribute('aria-hidden', 'false');

    // Start the audio only if allowed and after user gesture
    try {
      bgAudio.volume = parseFloat(volume.value || 0.6);
      bgAudio.loop = true;
      if(!withFast) bgAudio.play().catch(()=>{/* ignore autoplay block */});
    } catch(e){}
    // allow body scrolling on main (when small device)
    document.body.style.overflow = '';
  }, 480);
}

enterBtn.addEventListener('click', () => openSite(false));
skipBtn.addEventListener('click', () => openSite(true));

/* ===== Background Canvas (welcome + site) ===== */
function makeStarfield(canvas, opts={stars:150, twinkle:true}){
  const ctx = canvas.getContext('2d');
  let w = canvas.width = window.innerWidth;
  let h = canvas.height = window.innerHeight;
  let stars = [];
  const mouse = {x: w/2, y: h/2};
  let t = 0;

  function spawn(){
    for(let i=0;i<opts.stars;i++){
      stars.push({
        x: Math.random()*w,
        y: Math.random()*h,
        r: Math.random()*1.6 + 0.3,
        vx: (Math.random()-0.5)*0.2,
        vy: (Math.random()-0.5)*0.2,
        baseAlpha: Math.random()*0.6 + 0.2
      });
    }
  }
  spawn();

  window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; });
  window.addEventListener('resize', ()=> {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
    stars = [];
    spawn();
  });

  function draw(){
    ctx.clearRect(0,0,w,h);
    // subtle gradient overlay
    const g = ctx.createLinearGradient(0,0,0,h);
    g.addColorStop(0, 'rgba(10,30,60,0.35)');
    g.addColorStop(1, 'rgba(2,6,12,0.6)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,w,h);

    stars.forEach((s, i) => {
      // move toward & away from mouse slightly
      const dx = (mouse.x - s.x) * 0.0008;
      const dy = (mouse.y - s.y) * 0.0008;
      s.x += s.vx + dx;
      s.y += s.vy + dy;

      // wrap
      if(s.x < -10) s.x = w + 10;
      if(s.x > w + 10) s.x = -10;
      if(s.y < -10) s.y = h + 10;
      if(s.y > h + 10) s.y = -10;

      ctx.beginPath();
      const alpha = s.baseAlpha * (0.8 + 0.2*Math.sin((t + i)*0.02));
      ctx.fillStyle = `rgba(255,255,255,${alpha})`;
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fill();
    });

    t += 1;
    requestAnimationFrame(draw);
  }
  draw();
}

/* Initialize two canvases (welcome + background) */
document.addEventListener('DOMContentLoaded', ()=>{
  const welcomeCanvas = $('#welcome-canvas');
  const bgCanvas = $('#bg-canvas');

  if (welcomeCanvas) makeStarfield(welcomeCanvas, {stars:180});
  if (bgCanvas) {
    // place canvas behind content full-screen
    bgCanvas.style.position = 'fixed';
    bgCanvas.style.inset = '0';
    bgCanvas.style.zIndex = '0';
    document.getElementById('site').appendChild(bgCanvas);
    makeStarfield(bgCanvas, {stars:120});
  }
});

/* ===== Music player controls ===== */
function formatTime(s){
  if (isNaN(s)) return "0:00";
  const m = Math.floor(s/60);
  const sec = Math.floor(s%60).toString().padStart(2,'0');
  return `${m}:${sec}`;
}
if (bgAudio){
  // default settings
  bgAudio.volume = parseFloat(volume.value || 0.6);
  bgAudio.loop = true;

  // Update duration once loadedmetadata
  bgAudio.addEventListener('loadedmetadata', ()=> {
    progress.max = Math.floor(bgAudio.duration);
    timeLabel.textContent = `${formatTime(0)} / ${formatTime(bgAudio.duration)}`;
  });

  // Update time while playing
  bgAudio.addEventListener('timeupdate', ()=> {
    progress.value = Math.floor(bgAudio.currentTime);
    timeLabel.textContent = `${formatTime(bgAudio.currentTime)} / ${formatTime(bgAudio.duration)}`;
  });

  // Play/pause toggle
  function setPlaying(isPlaying){
    if(isPlaying){
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
    }
  }
  playBtn.addEventListener('click', ()=>{
    if (bgAudio.paused){
      bgAudio.play().catch(()=>{/* autoplay prevented */});
      setPlaying(true);
    } else {
      bgAudio.pause();
      setPlaying(false);
    }
  });

  // progress seeking
  progress.addEventListener('input', (e)=> {
    bgAudio.currentTime = e.target.value;
  });

  // volume
  volume.addEventListener('input', ()=> {
    bgAudio.volume = parseFloat(volume.value);
    if (bgAudio.volume === 0) muteBtn.textContent = '🔈'; else muteBtn.textContent = '🔊';
  });

  // mute toggle
  muteBtn.addEventListener('click', ()=> {
    bgAudio.muted = !bgAudio.muted;
    muteBtn.textContent = bgAudio.muted ? '🔇' : '🔊';
  });

  // loop toggle
  loopBtn.addEventListener('click', ()=> {
    bgAudio.loop = !bgAudio.loop;
    loopBtn.classList.toggle('active', bgAudio.loop);
    loopBtn.setAttribute('aria-pressed', String(bgAudio.loop));
  });

  // sync play/pause icon to actual state
  bgAudio.addEventListener('play', ()=> setPlaying(true));
  bgAudio.addEventListener('pause', ()=> setPlaying(false));
}

/* ===== Intersection observer for reveal animations ===== */
const obs = new IntersectionObserver((entries)=>{
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // unobserve to keep it simple
      obs.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealEls.forEach(el => obs.observe(el));

/* ===== Smooth nav link scrolling & active highlight ===== */
$$('.nav-links a').forEach(a => {
  a.addEventListener('click', (evt)=>{
    evt.preventDefault();
    const id = a.getAttribute('href');
    const target = document.querySelector(id);
    if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ===== Scroll to top & show button ===== */
mainContent.addEventListener('scroll', ()=> {
  if (mainContent.scrollTop > 320) scrollTopBtn.style.display = 'block';
  else scrollTopBtn.style.display = 'none';
});
scrollTopBtn.addEventListener('click', ()=> mainContent.scrollTo({ top: 0, behavior: 'smooth' }));

/* ===== Theme toggle (light/dark subtle) ===== */
let theme = 'dark';
themeToggle.addEventListener('click', ()=> {
  if (theme === 'dark'){
    document.documentElement.style.setProperty('--bg-1','#f0f6ff');
    document.documentElement.style.setProperty('--bg-2','#d9eefc');
    document.documentElement.style.setProperty('--text','#042033');
    theme = 'light';
    themeToggle.setAttribute('aria-pressed','true');
  } else {
    document.documentElement.style.setProperty('--bg-1','#061223');
    document.documentElement.style.setProperty('--bg-2','#0e2c4b');
    document.documentElement.style.setProperty('--text','#dbeeff');
    theme = 'dark';
    themeToggle.setAttribute('aria-pressed','false');
  }
});

/* ===== small accessibility: keyboard enter on brand returns to top ===== */
document.querySelectorAll('.brand').forEach(b => {
  b.addEventListener('click', ()=> mainContent.scrollTo({ top: 0, behavior: 'smooth' }));
  b.addEventListener('keydown', (e) => { if (e.key === 'Enter') mainContent.scrollTo({ top:0, behavior:'smooth' }); });
});

/* allow keyboard ESC to pause music */
document.addEventListener('keydown', (e)=> {
  if (e.key === 'Escape' && bgAudio) {
    if (!bgAudio.paused) bgAudio.pause(); else bgAudio.play().catch(()=>{});
  }
});

/* ===== ensure site works on load if user already pressed enter or skip via fragment (optional) ===== */
if (location.hash === '#quick') {
  // skip welcome if user wants quick load
  openSite(true);
}
