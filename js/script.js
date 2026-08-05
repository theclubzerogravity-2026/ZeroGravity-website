/* ============================================================
   ZEROGRAVITY — SITE SCRIPT
   Sections: 1) Data  2) Render  3) Image loader  4) Preloader
   5) Cursor  6) Navbar  7) Starfield  8) Reveal-on-scroll
   ============================================================ */

document.getElementById('year').textContent = new Date().getFullYear();

/* ---------- 1) DATA ---------------------------------------
   Edit names / positions / image file names here.
   Drop matching photos into assets/images/core-team/ and
   assets/images/events/ — they appear automatically, no
   HTML/CSS edits needed. File not found = tidy placeholder.
------------------------------------------------------------ */
const LEADERSHIP = [
  { name: 'Pratik Dhakate', year: 'BE', role: 'President', img: 'pratik-dhakate.jpg', linkedin: 'https://www.linkedin.com/in/pratik-dhakate-148304352/' },
  { name: 'Suraj Ahirwal', year: 'TE', role: 'Vice-President', img: 'suraj-ahirwal.png', linkedin: 'https://www.linkedin.com/in/suraj-ahirwal-718697357/' },
  { name: 'Vinit Limkar', year: 'BE', role: 'Chief Coordinator', img: 'vinit-limkar.jpeg', linkedin: 'https://www.linkedin.com/in/vinit-limkar-b7a57a2a5/' },
];

const DEPARTMENTS = [
  { dept: 'Treasurer', head: { name: 'Yash Gaikwad', year: 'TE', img: 'yash.png', linkedin: 'https://www.linkedin.com/in/yash-gaikwad-581916227/' }, co: { name: 'Sanvee Patil', year: 'TE', img: 'sanvee-patil.jpg', linkedin: 'https://www.linkedin.com/in/sanveepatil/' } },
  { dept: 'Execution', head: { name: 'Anushka Murudkar', year: 'BE', img: 'anushka.jpeg', linkedin: 'https://www.linkedin.com/in/anushka-murudkar-86149b354/' }, co: { name: 'Atharva Vaidya', year: 'TE', img: 'atharva-vaidya.png', linkedin: 'https://www.linkedin.com/in/atharva-vaidya-29605a383/' } },
  { dept: 'Documentation', head: { name: 'Mangesh Jagtap', year: 'BE', img: 'mangesh.jpeg', linkedin: 'https://www.linkedin.com/in/mangeshjaghtap1510/' }, co: { name: 'Asmita Ransingh', year: 'TE', img: 'asmita.png', linkedin: 'https://www.linkedin.com/in/asmita-ransing-86234a383/' } },
  { dept: 'Magazine', head: { name: 'Pratik Akhade', year: 'BE', img: 'pratik-akhade.jpg', linkedin: 'https://www.linkedin.com/in/pratik-akhade/' }, co: { name: 'Gauri Padmavar', year: 'TE', img: 'gauri-padmavar.png', linkedin: 'https://www.linkedin.com/in/gauri-padmawar-159b9732b/' } },
  { dept: 'Technical', head: { name: 'Bhaskar Matsagar', year: 'BE', img: 'bhaskar-matsagar.png', linkedin: 'https://www.linkedin.com/in/bhaskar-matsagar-46710432b/' }, co: { name: 'Bhakti Jadhav', year: 'TE', img: 'bhakti.png', linkedin: 'https://www.linkedin.com/in/bhakti-jadhav-b606aa368/' } },
  { dept: 'Event Management', head: { name: 'Prarthana Nannaware', year: 'BE', img: 'prarthana-nannaware.png', linkedin: 'https://www.linkedin.com/in/prarthana-nannaware-a4403328b/' }, co: { name: 'Vedanti Ingale', year: 'TE', img: 'vedanti-ingale.jpg', linkedin: 'https://www.linkedin.com/in/vedanti-ingale-6ba039275/' } },
  { dept: 'Social Media', head: { name: 'Sakshi Chavan', year: 'BE', img: 'sakshi.png', linkedin: 'https://www.linkedin.com/in/sakshichavan07/' }, co: { name: 'Parth Ahire', year: 'TE', img: 'parth-ahire.png', linkedin: 'https://www.linkedin.com/in/parth-ahire-37a262312/' } },
];

const PR_TEAM = [
  { name: 'Sumit Mate', year: 'BE', role: 'PR Head', img: 'sumit-mate.jpg', linkedin: 'https://www.linkedin.com/in/sumit-mate-a2510232b/' },
  { name: 'Ayush Karanjkhele', year: 'BE', role: 'PR Head', img: 'ayush-karanjkhele.png', linkedin: 'https://www.linkedin.com/in/ayush-karanjkhele-615292325/' },
  { name: 'Aishwarya Gikwad', year: 'BE', role: 'PR Head', img: 'aishwarya-gikwad.jpg', linkedin: 'https://www.linkedin.com/in/aishwarya-gaikwad-a3154236a/' },
];

const EVENTS = [
  {
    tag: 'FLAGSHIP · 2-DAY EVENT', title: 'TechnoSpark',
    desc: 'A two-day celebration of technology and teamwork featuring expert IT seminars, hands-on workshops, project competitions, coding challenges, indoor games, and sports events including Box Cricket, Badminton, Chess, Carrom, and more.',
    img: 'Technospark/WhatsApp Image 2026-08-02 at 16.38.46 (1).jpeg',
    gallery: [
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.46 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.46.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.47 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.47 (2).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.47.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.48.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.49.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.38.51.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.01.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.09.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.12.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.13 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.13.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.14.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.15 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.15.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.16 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.16 (2).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.16.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.17.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.18 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.18.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.35 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.35.jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.36 (1).jpeg",
      "Technospark/WhatsApp Image 2026-08-02 at 16.39.36.jpeg"
    ]
  },
  {
    tag: 'TALKS', title: 'Sessions',
    desc: 'Expert sessions on placement preparation, Git & GitHub, AI, emerging technologies, resume building, interview skills, and inspiring talks by startup founders and industry professionals.',
    img: 'GitHub/WhatsApp Image 2026-08-02 at 16.34.23.jpeg',
    gallery: [
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.23.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.27 (1).jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.27.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.28 (1).jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.28 (2).jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.28 (3).jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.28.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.29.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.30 (1).jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.30.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.31.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.34.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.36 (1).jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.36.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.37.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.38.jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.39 (1).jpeg",
      "GitHub/WhatsApp Image 2026-08-02 at 16.34.39.jpeg"
    ]
  },
  {
    tag: 'INDUCTION', title: 'Oath Ceremony',
    desc: 'An engaging induction for newly recruited members featuring networking, interactive games, team-building activities, and the official ZeroGravity Oath Ceremony welcoming them into the core team.',
    img: 'Oath/WhatsApp Image 2026-08-02 at 16.31.19 (1).jpeg',
    gallery: [
      "Oath/WhatsApp Image 2026-08-02 at 16.31.19 (1).jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.31.19.jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.31.48.jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.31.49.jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.31.50.jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.31.52 (1).jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.31.52.jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.32.01.jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.32.02 (1).jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.32.02.jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.32.05 (1).jpeg",
      "Oath/WhatsApp Image 2026-08-02 at 16.32.05.jpeg"
    ]
  },
  {
    tag: 'IDEATION', title: 'Innovio',
    desc: 'A premier inter-college project showcase where teams present innovative ideas, working prototypes, and real-world solutions while competing for recognition, prizes, and expert feedback.',
    img: 'Innovio/WhatsApp Image 2026-08-02 at 15.26.58.jpeg',
    gallery: [
      "Innovio/WhatsApp Image 2026-08-02 at 15.26.58.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 15.27.10.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 15.27.12.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 15.27.13.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 15.27.15 (1).jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 15.27.15.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.22.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.30.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.38.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.39.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.42.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.44 (1).jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.44.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.45 (1).jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.45.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.46 (1).jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.46 (2).jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.46.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.47 (1).jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.47.jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.48 (1).jpeg",
      "Innovio/WhatsApp Image 2026-08-02 at 16.54.48.jpeg"
    ]
  }
];

/* ---------- 2) RENDER --------------------------------------- */
const PHOTO_ICON = `<span class="ph-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M4 7h3l2-2h6l2 2h3v12H4V7z"/><circle cx="12" cy="13" r="3.5"/></svg></span>`;

function memberPhoto(person, tierLabel) {
  return `<div class="member-photo" data-img="assets/images/core-team/${person.img}">
    ${PHOTO_ICON}
    <span class="ph-label">${tierLabel || 'ADD PHOTO'}</span>
  </div>`;
}

const leadershipRow = document.getElementById('leadershipRow');
leadershipRow.innerHTML = LEADERSHIP.map((p, i) => `
  <div class="lead-card reveal-up" style="--d:${i}; cursor:pointer;" onclick="window.open('${p.linkedin}', '_blank')">
    <span class="corner-bracket tl"></span><span class="corner-bracket br"></span>
    ${memberPhoto(p, p.role.toUpperCase())}
    <h3 class="member-name"><a href="${p.linkedin}" target="_blank" rel="noopener" class="linkedin-link">${p.name}</a> <span style="color:var(--muted-2); font-weight:400; font-size:13px;">(${p.year})</span></h3>
    <p class="member-role">${p.role}</p>
  </div>
`).join('');

const deptGrid = document.getElementById('deptGrid');
const renderDept = d => `
  <div class="dept-card">
    <span class="corner-bracket tl"></span><span class="corner-bracket br"></span>
    <p class="dept-name">${d.dept}</p>
    <div class="dept-pair">
      <div style="cursor:pointer;" onclick="window.open('${d.head.linkedin}', '_blank')">
        ${memberPhoto(d.head, 'HEAD')}
        <h4 class="member-name" style="font-size:15px;"><a href="${d.head.linkedin}" target="_blank" rel="noopener" class="linkedin-link">${d.head.name}</a> <span style="color:var(--muted-2); font-weight:400; font-size:12px;">(${d.head.year})</span></h4>
        <p class="member-role">Head</p>
      </div>
      <div style="cursor:pointer;" onclick="window.open('${d.co.linkedin}', '_blank')">
        ${memberPhoto(d.co, 'CO-HEAD')}
        <h4 class="member-name" style="font-size:15px;"><a href="${d.co.linkedin}" target="_blank" rel="noopener" class="linkedin-link">${d.co.name}</a> <span style="color:var(--muted-2); font-weight:400; font-size:12px;">(${d.co.year})</span></h4>
        <p class="member-role">Co-Head</p>
      </div>
    </div>
  </div>
`;

deptGrid.innerHTML = DEPARTMENTS.slice(0, DEPARTMENTS.length - 1).map(renderDept).join('') + `
  <div class="pr-block">
    <p class="pr-title">Public Relations</p>
    <div class="pr-row">
      ${PR_TEAM.map(p => `
        <div class="pr-card" style="cursor:pointer;" onclick="window.open('${p.linkedin}', '_blank')">
          <span class="corner-bracket tl"></span><span class="corner-bracket br"></span>
          ${memberPhoto(p, 'PR HEAD')}
          <h4 class="member-name" style="font-size:15px;"><a href="${p.linkedin}" target="_blank" rel="noopener" class="linkedin-link">${p.name}</a> <span style="color:var(--muted-2); font-weight:400; font-size:12px;">(${p.year})</span></h4>
          <p class="member-role">${p.role}</p>
        </div>
      `).join('')}
    </div>
  </div>
` + DEPARTMENTS.slice(DEPARTMENTS.length - 1).map(d => renderDept(d).replace('class="dept-card"', 'class="dept-card dept-card--centered"')).join('');

const eventsGrid = document.getElementById('eventsGrid');
eventsGrid.innerHTML = EVENTS.map((e, index) => `
  <article class="event-card" style="cursor:pointer;" onclick="openGallery(${index})">
    <div class="event-media" data-img="assets/images/events/${e.img}">
      ${PHOTO_ICON}
      <span class="ph-label">Photos coming soon</span>
    </div>
    <div class="event-body">
      <span class="event-tag">${e.tag}</span>
      <h3 class="event-title">${e.title}</h3>
      <p class="event-desc">${e.desc}</p>
    </div>
  </article>
`).join('');

/* All cards observed for reveal + hover-cursor after render */
document.querySelectorAll('.lead-card, .dept-card, .pr-card, .event-card').forEach((el, i) => {
  el.style.setProperty('--d', (i % 6));
});

/* ---------- 3) IMAGE-OR-PLACEHOLDER LOADER ------------------ */
function tryLoadImage(el) {
  const src = el.getAttribute('data-img');
  if (!src) return;
  const img = new Image();
  img.onload = () => {
    el.style.backgroundImage = `url('${src}')`;
    el.classList.add('is-loaded');
  };
  img.onerror = () => { /* keep placeholder — file not added yet */ };
  img.src = src;
}
document.querySelectorAll('[data-img]').forEach(tryLoadImage);

/* ---------- 4) PRELOADER ------------------------------------ */
(function preloader() {
  const pre = document.getElementById('preloader');
  const inner = document.getElementById('preloaderInner');
  const lockup = document.getElementById('preloaderLockup');
  const astronaut = document.getElementById('preloaderAstronaut');
  const glow = astronaut.querySelector('.astronaut-glow');
  const lineZero = document.getElementById('lineZero');
  const lineGravity = document.getElementById('lineGravity');
  const words = document.querySelectorAll('.preloader-word');
  const navLogo = document.getElementById('clubLogo');

  const textZero = 'ZERO';
  const textGravity = 'GRAVITY';
  const letters = [];

  function createLetters(text, container) {
    for (let i = 0; i < text.length; i++) {
      const span = document.createElement('span');
      span.textContent = text[i];
      span.className = 'preloader-letter';
      container.appendChild(span);
      letters.push(span);
    }
  }
  createLetters(textZero, lineZero);
  createLetters(textGravity, lineGravity);

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    astronaut.classList.add('is-visible');
    letters.forEach(l => l.classList.add('is-active'));
    setTimeout(() => {
      pre.classList.add('is-hidden');
      document.body.style.overflow = '';
      revealHero();
    }, 5000);
    document.body.style.overflow = 'hidden';
    return;
  }

  document.body.style.overflow = 'hidden';
  let start = performance.now();
  let phase = 0;

  letters.forEach((l) => {
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.max(window.innerWidth, window.innerHeight) * 0.8;
    const tx = Math.cos(angle) * dist;
    const ty = Math.sin(angle) * dist;
    const rot = (Math.random() - 0.5) * 180;
    l.style.transform = `translate(${tx}px, ${ty}px) rotate(${rot}deg) scale(0.5)`;
    l.style.transition = 'transform 1.8s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 1.8s, color 0.8s ease, text-shadow 0.8s ease';
  });

  function tick(now) {
    const elapsed = now - start;
    
    if (phase === 0 && elapsed > 50) {
      phase = 1;
      letters.forEach((l, i) => {
        setTimeout(() => {
          l.classList.add('is-active');
          setTimeout(() => {
            l.style.color = 'var(--white)';
            l.style.textShadow = '0 0 10px var(--white)';
            setTimeout(() => {
              l.style.color = '';
              l.style.textShadow = '';
            }, 1200);
          }, 1600);
        }, i * 150 + Math.random() * 100);
      });
    }

    if (phase === 1 && elapsed > 3500) {
      phase = 2;
      lockup.classList.add('is-pulsing');
      document.getElementById('lineGravity').classList.remove('accent-outline');
      setTimeout(() => lockup.classList.remove('is-pulsing'), 300);
    }

    if (phase === 2 && elapsed > 4000) {
      phase = 3;
      astronaut.style.transition = 'transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s';
      astronaut.classList.add('is-visible');
      astronaut.style.transform = 'translateY(0) scale(1)';
      setTimeout(() => glow.classList.add('is-breathing'), 500);
    }

    if (phase === 3 && elapsed > 5500) {
      phase = 4;
      words.forEach((w, i) => {
        setTimeout(() => w.classList.add('is-active'), i * 500);
      });
      lockup.classList.add('is-pulsing');
      setTimeout(() => lockup.classList.remove('is-pulsing'), 300);
    }

    if (phase === 4 && elapsed > 8500) {
      phase = 5;
      words.forEach(w => w.classList.add('is-done'));
      glow.classList.remove('is-breathing');
      glow.style.opacity = '0';
      
      if (navLogo) {
        const targetRect = navLogo.getBoundingClientRect();
        const startRect = lockup.getBoundingClientRect();
        const scaleX = targetRect.width / startRect.width;
        const scaleY = targetRect.height / startRect.height;
        const scale = Math.min(scaleX, scaleY);
        
        const tx = (targetRect.left + targetRect.width / 2) - (startRect.left + startRect.width / 2);
        const ty = (targetRect.top + targetRect.height / 2) - (startRect.top + startRect.height / 2);
        
        lockup.style.transform = `translate(${tx}px, ${ty}px) scale(${scale})`;
        lockup.style.opacity = '0';
      } else {
        lockup.style.transform = `scale(1.1)`;
        lockup.style.opacity = '0';
      }
      
      pre.style.background = 'transparent';
      inner.style.transition = 'opacity 1s ease';
      inner.style.opacity = '0';
    }

    if (elapsed > 10000) {
      pre.classList.add('is-hidden');
      document.body.style.overflow = '';
      revealHero();
      return;
    }

    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
})();

function revealHero() {
  document.querySelectorAll('.hero .reveal-up').forEach(el => el.classList.add('in-view'));
}

/* ---------- 5) CUSTOM CURSOR --------------------------------- */
(function cursor() {
  /* Disable on touch/small screens */
  if (window.matchMedia('(max-width: 860px)').matches) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  if (!dot || !ring) return;

  /* Hide system cursor only after confirming custom cursor is ready */
  document.body.classList.add('custom-cursor-active');

  let mx = 0, my = 0, rx = 0, ry = 0;
  const hero = document.getElementById('hero');
  const heroSpotlight = document.getElementById('heroSpotlight');

  window.addEventListener('mousemove', (e) => {
    mx = e.clientX; my = e.clientY;
    dot.style.left = mx + 'px'; dot.style.top = my + 'px';
    dot.classList.remove('is-hidden');
    ring.classList.remove('is-hidden');
    
    if (heroSpotlight && hero) {
      const rect = hero.getBoundingClientRect();
      heroSpotlight.style.setProperty('--cx', (mx - rect.left) + 'px');
      heroSpotlight.style.setProperty('--cy', (my - rect.top) + 'px');
    }
  });

  function loop() {
    rx += (mx - rx) * 0.16;
    ry += (my - ry) * 0.16;
    ring.style.left = rx + 'px'; ring.style.top = ry + 'px';
    requestAnimationFrame(loop);
  }
  loop();

  const hoverables = 'a, button, .btn, .lead-card, .dept-card, .pr-card, .event-card, input, textarea';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest(hoverables)) ring.classList.add('is-hover');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest(hoverables)) ring.classList.remove('is-hover');
  });
  document.addEventListener('mouseleave', () => {
    dot.classList.add('is-hidden'); ring.classList.add('is-hidden');
  });
  document.addEventListener('mouseenter', () => {
    dot.classList.remove('is-hidden'); ring.classList.remove('is-hidden');
  });
})();

/* ---------- 6) NAVBAR + MOBILE MENU --------------------------- */
const navbar = document.getElementById('navbar');
window.addEventListener('scroll', () => {
  navbar.classList.toggle('is-scrolled', window.scrollY > 40);
}, { passive: true });

const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');
hamburger.addEventListener('click', () => {
  const open = hamburger.classList.toggle('is-open');
  mobileMenu.classList.toggle('is-open', open);
  hamburger.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});
document.querySelectorAll('.mobile-link, .mobile-cta').forEach(link => {
  link.addEventListener('click', () => {
    hamburger.classList.remove('is-open');
    mobileMenu.classList.remove('is-open');
    document.body.style.overflow = '';
  });
});

/* Brand logo → smooth scroll to top */
document.getElementById('brandHome').addEventListener('click', (e) => {
  e.preventDefault();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

/* ---------- 7) STARFIELD CANVAS -------------------------------- */
(function starfield() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('starfield');
  const ctx = canvas.getContext('2d');
  let stars = [];
  let w, h;

  function resize() {
    w = canvas.width = canvas.offsetWidth;
    h = canvas.height = canvas.offsetHeight;
    const count = Math.min(80, Math.floor((w * h) / 9000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() * 1.3 + 0.3,
      speed: Math.random() * 0.15 + 0.03,
      hue: [ '#e8384f', '#3d8bfd', '#ffc72c', '#f4f4f2' ][Math.floor(Math.random() * 4)],
      alpha: Math.random() * 0.6 + 0.2,
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    stars.forEach(s => {
      s.y -= s.speed;
      if (s.y < -2) s.y = h + 2;
      ctx.globalAlpha = s.alpha;
      ctx.fillStyle = s.hue;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();
  draw();
})();

/* ---------- 8) REVEAL-ON-SCROLL --------------------------------- */
(function revealOnScroll() {
  const revealUps = Array.from(document.querySelectorAll('.reveal-up')).filter(el => !el.closest('.hero'));
  const cards = document.querySelectorAll('.lead-card, .dept-card, .pr-card, .event-card');
  const targets = [...revealUps, ...cards];
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
  targets.forEach(t => io.observe(t));
})();

/* ---------- 9) ACTIVE NAV HIGHLIGHT ------------------------------ */
(function activeNav() {
  const sections = document.querySelectorAll('section[id]');
  const navLinks = document.querySelectorAll('.nav-link');
  
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const id = entry.target.id;
        navLinks.forEach(link => {
          const href = link.getAttribute('href');
          if (href === '#' + id) {
            link.style.color = 'var(--white)';
          } else {
            link.style.color = '';
          }
        });
      }
    });
  }, { threshold: 0.3, rootMargin: '-80px 0px -40% 0px' });
  
  sections.forEach(section => sectionObserver.observe(section));
})();

/* ---------- 10) EVENT GALLERY MARQUEE & AUTO-SLIDESHOW ------------------------------ */
const galleryModal = document.getElementById('galleryModal');
const galleryClose = document.getElementById('galleryClose');
const galleryImgWrapper = document.getElementById('galleryImgWrapper');

// 1. Auto-Slideshow on Event Cards
document.querySelectorAll('.event-card').forEach((card, index) => {
  const event = EVENTS[index];
  if (event && event.gallery && event.gallery.length > 0) {
    const mediaEl = card.querySelector('.event-media');
    
    // Create two layers for smooth crossfading
    const layer1 = document.createElement('div');
    const layer2 = document.createElement('div');
    layer1.className = 'crossfade-layer active';
    layer2.className = 'crossfade-layer';
    
    // Set the first image
    layer1.style.backgroundImage = `url('assets/images/events/${event.gallery[0]}')`;
    mediaEl.appendChild(layer1);
    mediaEl.appendChild(layer2);
    mediaEl.style.backgroundImage = 'none'; // Remove direct inline background

    let slideIndex = 0;
    let activeLayer = layer1;
    let inactiveLayer = layer2;
    
    // Preload gallery images to prevent flickering
    event.gallery.forEach(src => {
      const img = new Image();
      img.src = `assets/images/events/${src}`;
    });
    
    // Set interval for smooth crossfade
    setInterval(() => {
      slideIndex = (slideIndex + 1) % event.gallery.length;
      
      // Load the next image into the hidden layer
      inactiveLayer.style.backgroundImage = `url('assets/images/events/${event.gallery[slideIndex]}')`;
      
      // Fade it in by swapping classes
      inactiveLayer.classList.add('active');
      activeLayer.classList.remove('active');
      
      // Mark as loaded so placeholder icon hides
      mediaEl.classList.add('is-loaded');
      
      // Swap layer references
      const temp = activeLayer;
      activeLayer = inactiveLayer;
      inactiveLayer = temp;
    }, 3000);
  }
});

// 2. Marquee Gallery Modal
window.openGallery = function(eventIndex) {
  const event = EVENTS[eventIndex];
  if (!event || !event.gallery || event.gallery.length === 0) return;
  
  const gWrapper = document.getElementById('galleryImgWrapper');
  if (!gWrapper) return;
  
  gWrapper.innerHTML = '';
  
  // Create images for marquee
  const createImg = (imgSrc) => {
    const imgEl = document.createElement('img');
    imgEl.className = 'gallery-img';
    imgEl.src = `assets/images/events/${imgSrc}`;
    // Fallback if image fails
    imgEl.onerror = () => { imgEl.style.display = 'none'; };
    return imgEl;
  };

  // Append images twice for seamless infinite scroll
  event.gallery.forEach(imgSrc => {
    gWrapper.appendChild(createImg(imgSrc));
  });
  event.gallery.forEach(imgSrc => {
    gWrapper.appendChild(createImg(imgSrc));
  });

  const gModal = document.getElementById('galleryModal');
  if (gModal) {
    gModal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    startMarqueeScroll();
  }
};

let marqueeAnimationId;
let isMarqueeHovered = false;

function startMarqueeScroll() {
  const container = document.getElementById('marqueeContainer');
  const wrapper = document.getElementById('galleryImgWrapper');
  if (!container || !wrapper) return;
  
  cancelAnimationFrame(marqueeAnimationId);
  container.scrollLeft = 0;
  
  const speed = 2.0; // Fast manual scroll speed (1.5x)
  
  function scrollLoop() {
    if (!isMarqueeHovered) {
      container.scrollLeft += speed;
      // Reset scroll position for infinite loop when reaching midpoint
      if (container.scrollLeft >= wrapper.scrollWidth / 2) {
        container.scrollLeft = 0;
      }
    }
    marqueeAnimationId = requestAnimationFrame(scrollLoop);
  }
  
  marqueeAnimationId = requestAnimationFrame(scrollLoop);
}

// Pause scrolling on hover
const mContainer = document.getElementById('marqueeContainer');
if (mContainer) {
  mContainer.addEventListener('mouseenter', () => isMarqueeHovered = true);
  mContainer.addEventListener('mouseleave', () => isMarqueeHovered = false);
}

const gClose = document.getElementById('galleryClose');
if (gClose) {
  gClose.addEventListener('click', () => {
    const gModal = document.getElementById('galleryModal');
    if (gModal) gModal.classList.remove('is-open');
    document.body.style.overflow = '';
    cancelAnimationFrame(marqueeAnimationId);
  });
}

/* ============ CINEMATIC MAGAZINE LOGIC ============ */
let flipBookEl = document.getElementById('flipBook');
const flipBookWrapper = document.getElementById('flipBookWrapper');
const magLoading = document.getElementById('magazineLoading');
const magClose = document.getElementById('magazineClose');
const timelineNodes = document.querySelectorAll('.timeline-node');

let pageFlip = null;
let autoplayInterval = null;
let idleTimeout = null;
let currentYear = null;
let isFullscreen = false;
let isSwitching = false;

// Initialize on load
document.addEventListener('DOMContentLoaded', () => {
  // Wait a moment for other animations to settle, then load latest
  setTimeout(() => {
    switchMagazine('2026');
  }, 500);
});

window.switchMagazine = async function(year) {
  if (isSwitching) return;
  if (currentYear === year) {
    // If inline and clicked again, maybe expand
    if (!isFullscreen) toggleFullscreen();
    return;
  }
  
  isSwitching = true;
  currentYear = year;
  updateTimelineUI(year);
  
  if (pageFlip) {
    // Cinematic exit
    flipBookWrapper.classList.remove('is-idle', 'cinematic-entrance');
    
    // Close the book naturally first
    if (pageFlip.getCurrentPageIndex() > 0) {
      pageFlip.flip(0);
    }
    
    // Wait for close animation, then shrink and fade out
    await new Promise(resolve => setTimeout(resolve, 600));
    flipBookWrapper.classList.add('is-closing');
    
    await new Promise(resolve => setTimeout(resolve, 500));
    cleanupBook();
  }
  
  await loadMagazineForYear(year);
  isSwitching = false;
};

function updateTimelineUI(year) {
  timelineNodes.forEach(node => {
    if (node.getAttribute('data-year') === year) {
      node.classList.add('is-active');
    } else {
      node.classList.remove('is-active');
    }
  });
}

function cleanupBook() {
  clearInterval(autoplayInterval);
  clearTimeout(idleTimeout);
  if (pageFlip) {
    pageFlip.destroy();
    pageFlip = null;
  }
  flipBookEl.innerHTML = '';
}

async function loadMagazineForYear(year) {
  flipBookWrapper.style.opacity = '0';
  flipBookWrapper.style.pointerEvents = 'none';
  flipBookWrapper.classList.remove('is-closing', 'cinematic-entrance', 'is-idle');
  
  if (year !== '2024' && year !== '2025' && year !== '2026') {
    magLoading.style.display = 'flex';
    magLoading.innerHTML = `Edition ${year} is Coming Soon!`;
    return;
  }
  
  magLoading.style.display = 'flex';
  magLoading.innerHTML = `<div class="magazine-spinner"></div> Loading Edition ${year}...`;
  
  try {
    const oldBook = document.getElementById('flipBook');
    if (oldBook) oldBook.remove();
    flipBookEl = document.createElement('div');
    flipBookEl.id = 'flipBook';
    flipBookEl.className = 'flip-book hardcover-book';
    const shadow = flipBookWrapper.querySelector('.book-shadow');
    flipBookWrapper.insertBefore(flipBookEl, shadow);

    // Map pdfUrl based on year
    let pdfUrl = 'ZG magazines/ZERO GRAVITY.pdf';
    if (year === '2026') pdfUrl = 'ZG magazines/ZERO GRAVITY 26.pdf';
    else if (year === '2025') pdfUrl = 'ZG magazines/ZERO GRAVITY 25.pdf';
    
    const loadingTask = pdfjsLib.getDocument(pdfUrl);
    
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;
    
    for (let i = 1; i <= numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.25 });
      
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: ctx, viewport: viewport }).promise;
      
      const pageDiv = document.createElement('div');
      pageDiv.className = 'page';
      pageDiv.appendChild(canvas);
      flipBookEl.appendChild(pageDiv);
    }
    
    magLoading.style.display = 'none';
    flipBookWrapper.style.opacity = '1';
    flipBookWrapper.style.pointerEvents = 'auto';
    
    // Initialize StPageFlip
    pageFlip = new St.PageFlip(flipBookEl, {
      width: 600, height: 849,
      size: "stretch",
      minWidth: 472, maxWidth: 1500,
      minHeight: 630, maxHeight: 2025,
      showCover: true,
      maxShadowOpacity: 0.6,
      drawShadow: true,
      mobileScrollSupport: false
    });
    
    pageFlip.loadFromHTML(flipBookEl.querySelectorAll('.page'));
    
    // Trigger Cinematic Entrance
    flipBookWrapper.classList.add('cinematic-entrance');
    
    // Wait for entrance, then gently open the book
    setTimeout(() => {
      if (pageFlip) {
        pageFlip.flip(1); // open cover
        flipBookWrapper.classList.add('is-idle'); // add floating effect
      }
    }, 1300);
    
    startAutoplay();
    
    // Hook up interaction events to pause autoplay
    pageFlip.on('flip', resetIdleTimer);
    flipBookWrapper.addEventListener('mousemove', resetIdleTimer);
    flipBookWrapper.addEventListener('touchstart', resetIdleTimer);
    flipBookWrapper.addEventListener('mousedown', resetIdleTimer);
    
  } catch (error) {
    console.error("Error loading PDF", error);
    magLoading.innerHTML = `Failed to load ${year} edition. Ensure 'ZERO GRAVITY.pdf' exists in 'ZG magazines/'`;
  }
}

function startAutoplay() {
  clearInterval(autoplayInterval);
  autoplayInterval = setInterval(() => {
    if (pageFlip && pageFlip.getCurrentPageIndex() > 0) {
      // If we are on the last page or the last spread, flip back to start
      if (pageFlip.getCurrentPageIndex() >= pageFlip.getPageCount() - 2) {
        pageFlip.flip(0); // loop back
      } else {
        pageFlip.flipNext();
      }
    }
  }, 5000);
}

function resetIdleTimer() {
  clearInterval(autoplayInterval);
  clearTimeout(idleTimeout);
  
  // Wait 10s of no interaction before resuming
  idleTimeout = setTimeout(() => {
    startAutoplay();
  }, 10000);
}

// Click to Fullscreen Transition
flipBookWrapper.addEventListener('click', (e) => {
  if (!isFullscreen) {
    toggleFullscreen();
  }
});

function toggleFullscreen() {
  isFullscreen = !isFullscreen;
  
  if (isFullscreen) {
    // Move to body to escape any stacking context traps
    document.body.appendChild(flipBookWrapper);
    
    document.body.classList.add('is-fullscreen-body');
    flipBookWrapper.classList.add('is-fullscreen');
    flipBookWrapper.classList.remove('is-idle'); // stop floating
    document.body.style.overflow = 'hidden';
    magClose.style.display = 'flex';
  } else {
    // Move back to original stage
    document.querySelector('.magazine-stage').appendChild(flipBookWrapper);
    
    document.body.classList.remove('is-fullscreen-body');
    flipBookWrapper.classList.remove('is-fullscreen');
    flipBookWrapper.classList.add('is-idle'); // resume floating
    document.body.style.overflow = '';
    magClose.style.display = 'none';
  }
}

if (magClose) {
  magClose.addEventListener('click', () => {
    if (isFullscreen) toggleFullscreen();
  });
}

