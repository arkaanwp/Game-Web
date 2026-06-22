// ===== MODAL SYSTEM =====
const gameModal = document.getElementById('gameModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const modalTitle = document.getElementById('modalTitle');
const modalIcon = document.getElementById('modalIcon');
const modalBody = document.getElementById('modalBody');
const modalClose = document.getElementById('modalClose');
const modalRestart = document.getElementById('modalRestart');

let currentGame = null;

// Lazy references — resolved at call time, not at parse time
const GAMES = {
  snake:  { title: 'Snake',  icon: '🐍', init: (el) => initSnake(el),  restart: (el) => initSnake(el)  },
  tetris: { title: 'Tetris', icon: '🧱', init: (el) => initTetris(el), restart: (el) => initTetris(el) },
  '2048': { title: '2048',   icon: '🔢', init: (el) => init2048(el),   restart: (el) => init2048(el)   }
};

function openGame(id) {
  currentGame = id;
  const g = GAMES[id];
  modalTitle.textContent = g.title;
  modalIcon.textContent  = g.icon;
  modalBody.innerHTML    = '';
  gameModal.classList.add('active');
  modalBackdrop.classList.add('active');
  document.body.style.overflow = 'hidden';
  g.init(modalBody);
}

function closeGame() {
  gameModal.classList.remove('active');
  modalBackdrop.classList.remove('active');
  document.body.style.overflow = '';
  modalBody.innerHTML = '';
  currentGame = null;
}

modalClose.addEventListener('click', closeGame);
modalBackdrop.addEventListener('click', closeGame);
modalRestart.addEventListener('click', () => {
  if (!currentGame) return;
  modalBody.innerHTML = '';
  GAMES[currentGame].restart(modalBody);
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeGame();
});

// ===== PARTICLES =====
(function createParticles() {
  const container = document.getElementById('bgParticles');
  if (!container) return;
  for (let i = 0; i < 18; i++) {
    const p = document.createElement('div');
    const size = Math.random() * 4 + 1;
    Object.assign(p.style, {
      position: 'absolute',
      width: size + 'px', height: size + 'px',
      borderRadius: '50%',
      background: `hsl(${Math.random()*60+260},80%,70%)`,
      opacity: Math.random() * 0.25 + 0.05,
      top: Math.random() * 100 + '%',
      left: Math.random() * 100 + '%',
      animation: `particleDrift ${Math.random()*15+10}s ease-in-out infinite alternate`,
      animationDelay: Math.random() * 8 + 's'
    });
    container.appendChild(p);
  }
  const style = document.createElement('style');
  style.textContent = `@keyframes particleDrift{0%{transform:translate(0,0)}100%{transform:translate(${(Math.random()-0.5)*80}px,${(Math.random()-0.5)*80}px)}}`;
  document.head.appendChild(style);
})();

// ===== SCROLL NAV HIGHLIGHT =====
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav-link');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => { if (window.scrollY >= s.offsetTop - 100) current = s.id; });
  navLinks.forEach(l => {
    l.classList.toggle('active', l.getAttribute('href') === '#' + current);
  });
}, { passive: true });

// Stubs (overridden by game scripts)
function restartSnake(el)  { initSnake(el); }
function restartTetris(el) { initTetris(el); }
function restart2048(el)   { init2048(el); }
