// ===== TETRIS GAME =====
function initTetris(container) {
  const COLS=10, ROWS=20, CELL=30;
  const W=COLS*CELL, H=ROWS*CELL;

  const PIECES = [
    { shape:[[1,1,1,1]],            color:'#22d3ee' }, // I
    { shape:[[1,1],[1,1]],          color:'#facc15' }, // O
    { shape:[[0,1,0],[1,1,1]],      color:'#a855f7' }, // T
    { shape:[[0,1,1],[1,1,0]],      color:'#4ade80' }, // S
    { shape:[[1,1,0],[0,1,1]],      color:'#f87171' }, // Z
    { shape:[[1,0,0],[1,1,1]],      color:'#fb923c' }, // J
    { shape:[[0,0,1],[1,1,1]],      color:'#60a5fa' }, // L
  ];

  container.innerHTML = `
    <div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;justify-content:center;">
      <div>
        <canvas id="tetrisCanvas" width="${W}" height="${H}" style="border-radius:12px;border:2px solid rgba(255,255,255,.08);background:#1e1b4b;display:block;max-height:65vh;width:auto;"></canvas>
      </div>
      <div style="display:flex;flex-direction:column;gap:16px;min-width:120px;">
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:.7rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Score</div>
          <div id="tetrisScore" style="font-size:1.8rem;font-weight:900;color:#a78bfa;">0</div>
        </div>
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:.7rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Level</div>
          <div id="tetrisLevel" style="font-size:1.8rem;font-weight:900;color:#22d3ee;">1</div>
        </div>
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;text-align:center;">
          <div style="font-size:.7rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px;">Lines</div>
          <div id="tetrisLines" style="font-size:1.8rem;font-weight:900;color:#4ade80;">0</div>
        </div>
        <div style="background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:16px;">
          <div style="font-size:.7rem;color:rgba(255,255,255,.4);font-weight:700;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;text-align:center;">Next</div>
          <canvas id="tetrisNext" width="90" height="90" style="display:block;margin:auto;"></canvas>
        </div>
        <div style="font-size:.7rem;color:rgba(255,255,255,.3);text-align:center;line-height:1.6;">
          ← → Move<br>↑ Rotate<br>↓ Soft Drop<br>Space Hard Drop<br>P Pause
        </div>
        <div id="tetrisMsg" style="display:none;text-align:center;">
          <div style="color:#f87171;font-weight:800;font-size:1rem;margin-bottom:8px;">Game Over!</div>
          <button onclick="restartTetris(document.getElementById('tetrisCanvas').closest('.modal-body'))" style="padding:8px 18px;background:linear-gradient(135deg,#7C3AED,#EC4899);color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;">Restart</button>
        </div>
      </div>
    </div>`;

  const canvas = document.getElementById('tetrisCanvas');
  const ctx = canvas.getContext('2d');
  const nextCanvas = document.getElementById('tetrisNext');
  const nCtx = nextCanvas.getContext('2d');
  const scoreEl = document.getElementById('tetrisScore');
  const levelEl = document.getElementById('tetrisLevel');
  const linesEl = document.getElementById('tetrisLines');
  const msgEl   = document.getElementById('tetrisMsg');

  let board, piece, next, score, level, lines, falling, paused, alive;

  function reset() {
    board = Array.from({length:ROWS}, ()=>Array(COLS).fill(null));
    score=0; level=1; lines=0; paused=false; alive=true;
    scoreEl.textContent='0'; levelEl.textContent='1'; linesEl.textContent='0';
    msgEl.style.display='none';
    next = randPiece(); piece = spawnPiece();
    if(falling) clearInterval(falling);
    falling = setInterval(drop, getSpeed());
    render();
  }

  function getSpeed() { return Math.max(80, 500 - (level-1)*50); }
  function randPiece() { return PIECES[Math.floor(Math.random()*PIECES.length)]; }

  function spawnPiece() {
    const p = next;
    next = randPiece();
    const col = Math.floor((COLS - p.shape[0].length)/2);
    return { shape: p.shape, color: p.color, x: col, y: 0 };
  }

  function rotate(m) {
    return m[0].map((_,i)=>m.map(r=>r[i]).reverse());
  }

  function valid(s, ox, oy) {
    return s.every((row,dy)=>row.every((c,dx)=>{
      if(!c) return true;
      const nx=ox+dx, ny=oy+dy;
      return nx>=0&&nx<COLS&&ny<ROWS&&(ny<0||!board[ny][nx]);
    }));
  }

  function drop() {
    if (!alive || paused) return;
    if (valid(piece.shape, piece.x, piece.y+1)) { piece.y++; }
    else { lock(); }
    render();
  }

  function lock() {
    piece.shape.forEach((row,dy)=>row.forEach((c,dx)=>{
      if(c) { if(piece.y+dy<0){endGame();return;} board[piece.y+dy][piece.x+dx]=piece.color; }
    }));
    clearLines(); piece = spawnPiece();
    if(!valid(piece.shape, piece.x, piece.y)) endGame();
  }

  function clearLines() {
    let cleared=0;
    for(let y=ROWS-1;y>=0;y--){
      if(board[y].every(c=>c)){
        board.splice(y,1); board.unshift(Array(COLS).fill(null)); cleared++; y++;
      }
    }
    if(cleared){
      lines+=cleared; linesEl.textContent=lines;
      const pts=[0,100,300,500,800][cleared]*level;
      score+=pts; scoreEl.textContent=score;
      const newLevel=Math.floor(lines/10)+1;
      if(newLevel>level){ level=newLevel; levelEl.textContent=level; clearInterval(falling); falling=setInterval(drop,getSpeed()); }
    }
  }

  function endGame() { alive=false; clearInterval(falling); msgEl.style.display='block'; }

  function hardDrop() {
    while(valid(piece.shape, piece.x, piece.y+1)) piece.y++;
    lock(); render();
  }

  function render() {
    ctx.clearRect(0,0,W,H);
    // Grid
    ctx.strokeStyle='rgba(255,255,255,0.04)'; ctx.lineWidth=0.5;
    for(let x=0;x<COLS;x++){ctx.beginPath();ctx.moveTo(x*CELL,0);ctx.lineTo(x*CELL,H);ctx.stroke();}
    for(let y=0;y<ROWS;y++){ctx.beginPath();ctx.moveTo(0,y*CELL);ctx.lineTo(W,y*CELL);ctx.stroke();}
    // Board
    board.forEach((row,y)=>row.forEach((c,x)=>{
      if(c){ drawBlock(ctx,x,y,c,CELL); }
    }));
    // Ghost
    let gy=piece.y;
    while(valid(piece.shape,piece.x,gy+1)) gy++;
    piece.shape.forEach((row,dy)=>row.forEach((c,dx)=>{
      if(c){ ctx.fillStyle='rgba(255,255,255,0.1)'; ctx.fillRect((piece.x+dx)*CELL+1,(gy+dy)*CELL+1,CELL-2,CELL-2); }
    }));
    // Piece
    piece.shape.forEach((row,dy)=>row.forEach((c,dx)=>{
      if(c) drawBlock(ctx, piece.x+dx, piece.y+dy, piece.color, CELL);
    }));
    // Next
    nCtx.clearRect(0,0,90,90);
    nCtx.fillStyle='rgba(255,255,255,0.03)'; nCtx.fillRect(0,0,90,90);
    const ns=next.shape, nc=22;
    const ox=Math.floor((90-ns[0].length*nc)/2);
    const oy=Math.floor((90-ns.length*nc)/2);
    ns.forEach((row,dy)=>row.forEach((c,dx)=>{ if(c) drawBlock(nCtx,0,0,next.color,nc,ox+dx*nc,oy+dy*nc); }));
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

  function drawBlock(c,x,y,color,size,ax,ay){
    const bx=ax!==undefined?ax:x*size;
    const by=ay!==undefined?ay:y*size;
    c.save();
    c.fillStyle=color;
    c.shadowColor=color; c.shadowBlur=8;
    roundRect(c, bx+1, by+1, size-2, size-2, 4); c.fill();
    c.fillStyle='rgba(255,255,255,0.25)';
    c.fillRect(bx+2,by+2,size-4,3);
    c.restore();
  }

  function handleKey(e) {
    if(!alive) return;
    if(e.code==='KeyP'){ paused=!paused; return; }
    if(paused) return;
    if(e.code==='ArrowLeft'&&valid(piece.shape,piece.x-1,piece.y)) piece.x--;
    else if(e.code==='ArrowRight'&&valid(piece.shape,piece.x+1,piece.y)) piece.x++;
    else if(e.code==='ArrowDown') drop();
    else if(e.code==='ArrowUp'){
      const r=rotate(piece.shape);
      if(valid(r,piece.x,piece.y)) piece.shape=r;
      else if(valid(r,piece.x+1,piece.y)){piece.shape=r;piece.x++;}
      else if(valid(r,piece.x-1,piece.y)){piece.shape=r;piece.x--;}
    }
    else if(e.code==='Space'){ hardDrop(); e.preventDefault(); return; }
    else return;
    render();
    if(['ArrowLeft','ArrowRight','ArrowDown','ArrowUp'].includes(e.code)) e.preventDefault();
  }

  document.addEventListener('keydown', handleKey);
  document.getElementById('modalClose').addEventListener('click',()=>{ clearInterval(falling); document.removeEventListener('keydown',handleKey); },{once:true});
  document.getElementById('modalRestart').addEventListener('click',()=>{ clearInterval(falling); document.removeEventListener('keydown',handleKey); },{once:true});

  reset();
}
