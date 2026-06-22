// ===== SNAKE GAME =====
function initSnake(container) {
  const CELL = 20, COLS = 20, ROWS = 20;
  const W = COLS * CELL, H = ROWS * CELL;

  container.innerHTML = `
    <div id="snakeWrap" style="display:flex;flex-direction:column;align-items:center;gap:16px;width:100%;">
      <div style="display:flex;gap:24px;align-items:center;">
        <div style="text-align:center;">
          <div style="font-size:.75rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;">Score</div>
          <div id="snakeScore" style="font-size:2rem;font-weight:900;color:#4ade80;">0</div>
        </div>
        <div style="text-align:center;">
          <div style="font-size:.75rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;">Best</div>
          <div id="snakeBest" style="font-size:2rem;font-weight:900;color:#facc15;">${localStorage.getItem('snakeBest')||0}</div>
        </div>
      </div>
      <canvas id="snakeCanvas" width="${W}" height="${H}" style="border-radius:12px;border:2px solid rgba(255,255,255,.08);background:#052e16;max-width:100%;max-height:60vh;"></canvas>
      <div style="color:rgba(255,255,255,.35);font-size:.8rem;text-align:center;">Arrow Keys / WASD to move &nbsp;|&nbsp; Touch: Swipe</div>
      <div id="snakeOverlay" style="display:none;text-align:center;">
        <div style="font-size:1.5rem;font-weight:800;color:#f87171;margin-bottom:8px;">Game Over!</div>
        <div style="color:rgba(255,255,255,.5);margin-bottom:16px;">Press <b>Space</b> or tap button to restart</div>
        <button onclick="restartSnake(document.getElementById('snakeWrap').parentElement)" style="padding:10px 24px;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;border:none;border-radius:10px;font-weight:700;font-size:1rem;cursor:pointer;">Restart</button>
      </div>
    </div>`;

  const canvas = document.getElementById('snakeCanvas');
  const ctx = canvas.getContext('2d');
  const scoreEl = document.getElementById('snakeScore');
  const bestEl  = document.getElementById('snakeBest');
  const overlay = document.getElementById('snakeOverlay');

  let snake, dir, nextDir, food, score, best, loop, alive;

  function reset() {
    snake = [{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    dir = {x:1,y:0}; nextDir = {x:1,y:0};
    food = randFood(); score = 0; alive = true;
    overlay.style.display = 'none';
    scoreEl.textContent = '0';
    best = parseInt(localStorage.getItem('snakeBest')) || 0;
    bestEl.textContent = best;
    if (loop) clearInterval(loop);
    loop = setInterval(tick, 120);
  }

  function randFood() {
    let f;
    do { f = {x: Math.floor(Math.random()*COLS), y: Math.floor(Math.random()*ROWS)}; }
    while (snake.some(s=>s.x===f.x&&s.y===f.y));
    return f;
  }

  function tick() {
    if (!alive) return;
    dir = nextDir;
    const head = {x: snake[0].x+dir.x, y: snake[0].y+dir.y};
    if (head.x<0||head.x>=COLS||head.y<0||head.y>=ROWS||snake.some(s=>s.x===head.x&&s.y===head.y)) {
      alive = false; clearInterval(loop);
      if (score > best) { best = score; localStorage.setItem('snakeBest', best); bestEl.textContent = best; }
      overlay.style.display = 'block'; return;
    }
    snake.unshift(head);
    if (head.x===food.x&&head.y===food.y) {
      score++; scoreEl.textContent = score; food = randFood();
    } else { snake.pop(); }
    draw();
  }

  function roundRect(c, x, y, w, h, r) {
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arcTo(x + w, y, x + w, y + r, r);
    c.lineTo(x + w, y + h - r);
    c.arcTo(x + w, y + h, x + w - r, y + h, r);
    c.lineTo(x + r, y + h);
    c.arcTo(x, y + h, x, y + h - r, r);
    c.lineTo(x, y + r);
    c.arcTo(x, y, x + r, y, r);
    c.closePath();
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    // Grid
    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
    ctx.lineWidth = 0.5;
    for(let x=0;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H);ctx.stroke();}
    for(let y=0;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W,y*CELL);ctx.stroke();}
    // Food
    ctx.save();
    ctx.shadowColor='#4ade80'; ctx.shadowBlur=16;
    ctx.fillStyle='#4ade80';
    ctx.beginPath();
    ctx.arc(food.x*CELL+CELL/2, food.y*CELL+CELL/2, CELL/2-2, 0, Math.PI*2);
    ctx.fill();
    ctx.restore();
    // Snake
    snake.forEach((s,i) => {
      const ratio = i/snake.length;
      const r = Math.round(34 + (74-34)*ratio);
      const g = Math.round(197 + (80-197)*ratio);
      const b = Math.round(94 + (50-94)*ratio);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      roundRect(ctx, s.x*CELL+1, s.y*CELL+1, CELL-2, CELL-2, 5);
      ctx.fill();
    });
  }

  // Keyboard
  document.addEventListener('keydown', handleKey);
  function handleKey(e) {
    if (!alive && e.code==='Space') { reset(); return; }
    const m = {ArrowUp:{x:0,y:-1},ArrowDown:{x:0,y:1},ArrowLeft:{x:-1,y:0},ArrowRight:{x:1,y:0},
               KeyW:{x:0,y:-1},KeyS:{x:0,y:1},KeyA:{x:-1,y:0},KeyD:{x:1,y:0}};
    if (m[e.code]) {
      const nd = m[e.code];
      if (nd.x !== -dir.x || nd.y !== -dir.y) nextDir = nd;
      if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)) e.preventDefault();
    }
  }

  // Touch swipe
  let touchStart = null;
  canvas.addEventListener('touchstart', e=>{ touchStart=e.touches[0]; }, {passive:true});
  canvas.addEventListener('touchend', e=>{
    if(!touchStart) return;
    const dx=e.changedTouches[0].clientX-touchStart.clientX;
    const dy=e.changedTouches[0].clientY-touchStart.clientY;
    if(Math.abs(dx)>Math.abs(dy)){nextDir=dx>0?{x:1,y:0}:{x:-1,y:0};}
    else{nextDir=dy>0?{x:0,y:1}:{x:0,y:-1};}
    touchStart=null;
  }, {passive:true});

  // Cleanup on modal close
  canvas.dataset.cleanup = 'snake';
  document.getElementById('modalClose').addEventListener('click', ()=>{ clearInterval(loop); document.removeEventListener('keydown', handleKey); }, {once:true});
  document.getElementById('modalRestart').addEventListener('click', ()=>{ clearInterval(loop); document.removeEventListener('keydown', handleKey); }, {once:true});

  reset(); draw();
}
