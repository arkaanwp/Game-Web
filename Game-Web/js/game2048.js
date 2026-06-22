// ===== 2048 GAME (with slide animation) =====
function init2048(container) {
  const SIZE = 4, GAP = 8, PAD = 10;

  const COLORS = {
    2:    {bg:'#eee4da',fg:'#776e65'}, 4:    {bg:'#ede0c8',fg:'#776e65'},
    8:    {bg:'#f2b179',fg:'#fff'},    16:   {bg:'#f59563',fg:'#fff'},
    32:   {bg:'#f67c5f',fg:'#fff'},    64:   {bg:'#f65e3b',fg:'#fff'},
    128:  {bg:'#edcf72',fg:'#fff'},    256:  {bg:'#edcc61',fg:'#fff'},
    512:  {bg:'#edc850',fg:'#fff'},    1024: {bg:'#edc53f',fg:'#fff'},
    2048: {bg:'#edc22e',fg:'#fff'},
  };

  container.innerHTML = `
    <style>
      #g2048Wrap{position:relative;width:min(48vh,340px);height:min(48vh,340px);background:#bbada0;border-radius:10px;padding:${PAD}px;flex-shrink:0}
      #g2048Grid{display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);gap:${GAP}px;width:100%;height:100%}
      .g2048-slot{background:rgba(238,228,218,0.35);border-radius:6px}
      #g2048Tiles{position:absolute;inset:${PAD}px;touch-action:none}
      .g2-tile{position:absolute;display:flex;align-items:center;justify-content:center;border-radius:6px;font-family:'Outfit',sans-serif;font-weight:900;user-select:none;transition:left .12s ease,top .12s ease;z-index:2}
      .g2-tile.is-new{animation:t-appear .15s ease forwards}
      .g2-tile.is-merge{animation:t-pop .18s ease forwards}
      @keyframes t-appear{0%{transform:scale(0)}70%{transform:scale(1.1)}100%{transform:scale(1)}}
      @keyframes t-pop{0%{transform:scale(1)}50%{transform:scale(1.25)}100%{transform:scale(1)}}
    </style>
    <div style="display:flex;gap:20px;align-items:flex-start;justify-content:center;flex-wrap:wrap;width:100%;max-width:580px;">
      <div id="g2048Wrap">
        <div id="g2048Grid">${'<div class="g2048-slot"></div>'.repeat(16)}</div>
        <div id="g2048Tiles"></div>
      </div>
      <div style="display:flex;flex-direction:column;gap:12px;min-width:120px;">
        <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;text-align:center;">
          <div style="font-size:.65rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Score</div>
          <div id="g2048Score" style="font-size:1.6rem;font-weight:900;color:#fbbf24;">0</div>
        </div>
        <div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:12px 16px;text-align:center;">
          <div style="font-size:.65rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:2px;">Best</div>
          <div id="g2048Best" style="font-size:1.6rem;font-weight:900;color:#f87171;">${localStorage.getItem('best2048')||0}</div>
        </div>
        <div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07);border-radius:12px;padding:12px;font-size:.72rem;color:rgba(255,255,255,.35);line-height:1.9;text-align:center;">
          ← → ↑ ↓ to move<br/>Swipe on board<br/><b style="color:#fbbf24">Reach 2048!</b>
        </div>
        <div id="g2048Msg" style="display:none;text-align:center;">
          <div id="g2048MsgText" style="font-size:1rem;font-weight:800;margin-bottom:8px;"></div>
          <button onclick="restart2048(document.getElementById('g2048Wrap').closest('.modal-body'))" style="padding:8px 16px;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;border:none;border-radius:8px;font-weight:700;font-size:.9rem;cursor:pointer;width:100%;">Play Again</button>
        </div>
      </div>
    </div>`;

  const tilesEl = document.getElementById('g2048Tiles');
  const wrapEl  = document.getElementById('g2048Wrap');
  const scoreEl = document.getElementById('g2048Score');
  const bestEl  = document.getElementById('g2048Best');
  const msgEl   = document.getElementById('g2048Msg');
  const msgText = document.getElementById('g2048MsgText');

  let tiles = [], nextId = 0, score = 0, best = 0, won = false, busy = false;

  // cell size (computed from actual DOM)
  function cs() { return (tilesEl.offsetWidth - GAP * (SIZE - 1)) / SIZE; }
  function px(i) { return i * (cs() + GAP); }

  function tileStyle(val) {
    const c = COLORS[val] || {bg:'#3c1a00',fg:'#fff'};
    const sz = cs();
    const fs = val >= 1024 ? '1.1rem' : val >= 128 ? '1.35rem' : '1.7rem';
    return {width:sz+'px', height:sz+'px', background:c.bg, color:c.fg, fontSize:fs};
  }

  function createTile(val, x, y, isNew) {
    const el = document.createElement('div');
    el.className = 'g2-tile' + (isNew ? ' is-new' : '');
    const s = tileStyle(val);
    Object.assign(el.style, s, {left: px(x)+'px', top: px(y)+'px'});
    el.textContent = val;
    tilesEl.appendChild(el);
    const t = {id: nextId++, val, x, y, el, remove: false};
    tiles.push(t);
    return t;
  }

  function updateTileStyle(t) {
    const s = tileStyle(t.val);
    Object.assign(t.el.style, s);
    t.el.textContent = t.val;
  }

  function moveTileTo(t, x, y) {
    t.x = x; t.y = y;
    t.el.style.left = px(x) + 'px';
    t.el.style.top  = px(y) + 'px';
  }

  function getGrid() {
    const g = Array.from({length:SIZE}, () => Array(SIZE).fill(null));
    tiles.filter(t => !t.remove).forEach(t => { g[t.y][t.x] = t; });
    return g;
  }

  function reset() {
    tilesEl.innerHTML = ''; tiles = []; score = 0; won = false;
    best = parseInt(localStorage.getItem('best2048')) || 0;
    scoreEl.textContent = '0'; bestEl.textContent = best;
    msgEl.style.display = 'none';
    spawn(); spawn();
  }

  function spawn() {
    const g = getGrid(), empty = [];
    for (let y=0;y<SIZE;y++) for (let x=0;x<SIZE;x++) if (!g[y][x]) empty.push({x,y});
    if (!empty.length) return;
    const {x,y} = empty[Math.floor(Math.random()*empty.length)];
    createTile(Math.random()<0.9?2:4, x, y, true);
  }

  function doMove(dir) {
    if (busy) return;
    const g = getGrid();
    let moved = false;
    const merged = Array.from({length:SIZE},()=>Array(SIZE).fill(false));
    const dying  = [];

    const rowOrder = dir==='down' ? [3,2,1,0] : [0,1,2,3];
    const colOrder = dir==='right'? [3,2,1,0] : [0,1,2,3];
    const dx = dir==='left'?-1:dir==='right'?1:0;
    const dy = dir==='up'  ?-1:dir==='down' ?1:0;

    for (const y of rowOrder) {
      for (const x of colOrder) {
        const t = g[y][x];
        if (!t) continue;
        let cx=x, cy=y;
        while (true) {
          const nx=cx+dx, ny=cy+dy;
          if (nx<0||nx>=SIZE||ny<0||ny>=SIZE) break;
          const nb = g[ny][nx];
          if (nb) {
            // merge?
            if (nb.val===t.val && !merged[ny][nx]) {
              nb.val *= 2;
              score += nb.val;
              merged[ny][nx] = true;
              g[cy][cx] = null;
              t.remove = true;
              t.el.style.zIndex = '3';
              nb.el.style.zIndex = '1';
              moveTileTo(t, nx, ny);
              dying.push({t, nb});
              moved = true;
            }
            break;
          }
          g[ny][nx] = t; g[cy][cx] = null;
          moveTileTo(t, nx, ny);
          cx=nx; cy=ny; moved=true;
        }
      }
    }

    if (moved) {
      busy = true;
      scoreEl.textContent = score;
      if (score > best) { best=score; localStorage.setItem('best2048',best); bestEl.textContent=best; }

      setTimeout(() => {
        // Remove dead tiles, update merged tiles
        dying.forEach(({t, nb}) => {
          t.el.remove();
          tiles = tiles.filter(x => x !== t);
          updateTileStyle(nb);
          nb.el.style.zIndex = '2';
          nb.el.classList.remove('is-merge');
          void nb.el.offsetWidth; // reflow
          nb.el.classList.add('is-merge');
          setTimeout(()=>nb.el.classList.remove('is-merge'), 200);
        });
        spawn();
        busy = false;
        if (!won && tiles.some(t=>t.val===2048)) { won=true; showMsg('🎉 Reached 2048!','#4ade80'); }
        else if (!canMove()) showMsg('😢 Game Over!','#f87171');
      }, 140);
    }
  }

  function canMove() {
    const g = getGrid();
    for (let y=0;y<SIZE;y++) for (let x=0;x<SIZE;x++) {
      if (!g[y][x]) return true;
      if (x<SIZE-1 && g[y][x].val===g[y][x+1]?.val) return true;
      if (y<SIZE-1 && g[y][x].val===g[y+1][x]?.val) return true;
    }
    return false;
  }

  function showMsg(t,c){ msgText.textContent=t; msgText.style.color=c; msgEl.style.display='block'; }

  function handleKey(e) {
    const m={ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'};
    if(m[e.code]){ doMove(m[e.code]); e.preventDefault(); }
  }
  document.addEventListener('keydown', handleKey);

  // Touch swipe
  let ts=null;
  wrapEl.addEventListener('touchstart',e=>{ts=e.touches[0];e.preventDefault();},{passive:false});
  wrapEl.addEventListener('touchend',e=>{
    if(!ts)return;
    const dx=e.changedTouches[0].clientX-ts.clientX;
    const dy=e.changedTouches[0].clientY-ts.clientY;
    if(Math.abs(dx)>Math.abs(dy)) doMove(dx>0?'right':'left');
    else doMove(dy>0?'down':'up');
    ts=null;
  },{passive:true});

  document.getElementById('modalClose').addEventListener('click',()=>document.removeEventListener('keydown',handleKey),{once:true});
  document.getElementById('modalRestart').addEventListener('click',()=>document.removeEventListener('keydown',handleKey),{once:true});

  reset();
}
