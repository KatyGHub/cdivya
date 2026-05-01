/**
 * crossword.js
 * Pre-designed 9-row × 10-col crossword.
 * Clues are hidden (blurred) until the user clicks to reveal them.
 * Replace WORD_DATA entries when CSV arrives.
 *
 * Grid layout (verified, no conflicts):
 *      0  1  2  3  4  5  6  7  8  9
 *  0   .  .  .  .  D  E  S  I  G  N
 *  1   .  .  .  .  I  V  .  D  .  .
 *  2   .  .  .  .  V  I  B  E  S  .
 *  3   .  .  S  T  Y  L  E  A  .  .
 *  4   .  .  I  O  A  .  .  .  .  .
 *  5   .  .  N  N  I  S  H  I  .  .
 *  6   B  R  A  N  D  .  .  .  .  .
 *  7   P  I  X  E  L  .  .  .  .  .
 *  8   P  H  O  T  O  .  .  .  .  .
 */

const ROWS = 9, COLS = 10;

// Intersection-verified word data
const WORD_DATA = [
  // ACROSS
  { id:1,  word:'DESIGN',  row:0, col:4, dir:'across', clue:'What Divya does best. And second best. And third.' },
  { id:2,  word:'VIBES',   row:2, col:4, dir:'across', clue:'What she brings into every room, unannounced.' },
  { id:3,  word:'STYLE',   row:3, col:2, dir:'across', clue:"She has it. You know it. Please don't compete." },
  { id:4,  word:'NISHI',   row:5, col:3, dir:'across', clue:'The person whose calls are forever dodged on this page.' },
  { id:5,  word:'BRAND',   row:6, col:0, dir:'across', clue:"She'll fix yours. Unprompted. Against your will." },
  { id:6,  word:'PIXEL',   row:7, col:0, dir:'across', clue:'The smallest unit of her obsession.' },
  { id:7,  word:'PHOTO',   row:8, col:0, dir:'across', clue:"She takes 40 before you've even smiled." },
  // DOWN
  { id:8,  word:'DIVYA',   row:0, col:4, dir:'down',   clue:'The whole reason this website exists. Duh.' },
  { id:9,  word:'EVIL',    row:0, col:5, dir:'down',   clue:'What her talent feels like when you try to compete.' },
  { id:10, word:'IDEA',    row:0, col:7, dir:'down',   clue:'She has one. Then ten more. Then a full brand kit.' },
  { id:11, word:'TONNE',   row:3, col:3, dir:'down',   clue:'How much coffee powers this operation.' },
  { id:12, word:'SIN',     row:3, col:2, dir:'down',   clue:'Using Comic Sans. An unforgivable one.' },
];

// Build the answer grid
function buildAnswerGrid() {
  const grid = Array.from({length:ROWS},()=>Array(COLS).fill(null));
  WORD_DATA.forEach(({word,row,col,dir})=>{
    for (let i=0;i<word.length;i++) {
      const r = dir==='down'   ? row+i : row;
      const c = dir==='across' ? col+i : col;
      if (r<ROWS&&c<COLS) grid[r][c] = word[i];
    }
  });
  return grid;
}

// Assign clue numbers to cells
function buildNumberMap() {
  const map = {};
  WORD_DATA.forEach(({id,row,col})=>{
    const key=`${row},${col}`;
    if (!map[key]) map[key]=[];
    map[key].push(id);
  });
  return map;
}

export function initCrossword() {
  const modal    = document.getElementById('crosswordModal');
  const overlay  = document.getElementById('crosswordOverlay');
  const closeBtn = document.getElementById('crosswordClose');
  const openCard = document.getElementById('openCrosswordCard');
  const gridEl   = document.getElementById('cwGrid');
  const checkBtn = document.getElementById('cwCheck');
  const clearBtn = document.getElementById('cwClear');
  const statusEl = document.getElementById('cwStatus');
  const acrossEl = document.getElementById('cwCluesAcross');
  const downEl   = document.getElementById('cwCluesDown');
  if (!modal||!gridEl) return;

  const answerGrid = buildAnswerGrid();
  const numMap     = buildNumberMap();
  let selectedWord = null; // { ids, cells } — currently highlighted word

  // Find which words cover each cell
  function getWordIds(r,c) {
    const ids = [];
    WORD_DATA.forEach(w=>{
      for (let i=0;i<w.word.length;i++) {
        const wr=w.dir==='down'?w.row+i:w.row, wc=w.dir==='across'?w.col+i:w.col;
        if (wr===r&&wc===c) { ids.push(w.id); break; }
      }
    });
    return ids;
  }

  function getCells(wordData) {
    return wordData.word.split('').map((_,i)=>{
      const r=wordData.dir==='down'?wordData.row+i:wordData.row;
      const c=wordData.dir==='across'?wordData.col+i:wordData.col;
      return {r,c};
    });
  }

  // ── Render grid ──
  function renderGrid() {
    gridEl.innerHTML='';
    for (let r=0;r<ROWS;r++) {
      for (let c=0;c<COLS;c++) {
        const cell = document.createElement('div');
        cell.classList.add('cw-cell');
        cell.dataset.r=r; cell.dataset.c=c;

        if (answerGrid[r][c]===null) {
          cell.classList.add('blank');
        } else {
          const nums = numMap[`${r},${c}`];
          if (nums?.length) {
            const numEl=document.createElement('span');
            numEl.classList.add('cw-cell-num');
            numEl.textContent=nums.join('/');
            cell.appendChild(numEl);
          }
          const inp=document.createElement('input');
          inp.type='text'; inp.maxLength=1;
          inp.classList.add('cw-cell-input');
          inp.setAttribute('aria-label',`row ${r+1} col ${c+1}`);
          inp.addEventListener('click',()=>selectCell(r,c));
          inp.addEventListener('keydown',(e)=>handleKey(e,r,c));
          cell.appendChild(inp);
          cell.addEventListener('click',()=>selectCell(r,c));
        }
        gridEl.appendChild(cell);
      }
    }
  }

  function getCell(r,c) {
    return gridEl.querySelector(`[data-r="${r}"][data-c="${c}"]`);
  }
  function getInput(r,c) {
    return getCell(r,c)?.querySelector('.cw-cell-input');
  }

  function clearHighlights() {
    gridEl.querySelectorAll('.highlighted,.active').forEach(el=>{
      el.classList.remove('highlighted','active');
    });
    document.querySelectorAll('.cw-clue.active').forEach(el=>el.classList.remove('active'));
  }

  function selectCell(r,c) {
    clearHighlights();
    if (!answerGrid[r][c]) return;

    const ids = getWordIds(r,c);
    if (!ids.length) return;

    // Cycle through words if multiple cover this cell
    let wid = ids[0];
    if (selectedWord && ids.includes(selectedWord.id) && ids.length>1) {
      const next = ids[(ids.indexOf(selectedWord.id)+1)%ids.length];
      wid = next;
    }

    const wordData = WORD_DATA.find(w=>w.id===wid);
    if (!wordData) return;
    selectedWord = { id:wid, cells: getCells(wordData) };

    // Highlight word cells
    selectedWord.cells.forEach(({r:wr,c:wc})=>{
      const cl=getCell(wr,wc);
      if (cl) cl.classList.add('highlighted');
    });
    // Mark active cell
    getCell(r,c)?.classList.add('active');
    getInput(r,c)?.focus();

    // Highlight clue
    const clueEl = document.querySelector(`.cw-clue[data-id="${wid}"]`);
    if (clueEl) {
      clueEl.classList.add('active');
      clueEl.scrollIntoView({block:'nearest',behavior:'smooth'});
    }
  }

  function handleKey(e,r,c) {
    if (!selectedWord) return;
    const wordData = WORD_DATA.find(w=>w.id===selectedWord.id);
    if (!wordData) return;

    if (e.key==='Backspace') {
      const inp=getInput(r,c);
      if (inp&&inp.value) { inp.value=''; return; }
      // Move to prev cell in word
      const cells=selectedWord.cells, idx=cells.findIndex(p=>p.r===r&&p.c===c);
      if (idx>0) { const {r:pr,c:pc}=cells[idx-1]; selectCell(pr,pc); getInput(pr,pc)?.focus(); }
      return;
    }

    if (['ArrowRight','ArrowLeft','ArrowUp','ArrowDown'].includes(e.key)) {
      e.preventDefault();
      const dr={ArrowDown:1,ArrowUp:-1,ArrowRight:0,ArrowLeft:0}[e.key];
      const dc={ArrowRight:1,ArrowLeft:-1,ArrowDown:0,ArrowUp:0}[e.key];
      const nr=r+dr, nc=c+dc;
      if (nr>=0&&nr<ROWS&&nc>=0&&nc<COLS&&answerGrid[nr][nc]) selectCell(nr,nc);
      return;
    }

    if (e.key.length===1&&/[a-zA-Z]/.test(e.key)) {
      e.preventDefault();
      const inp=getInput(r,c);
      if (inp) inp.value=e.key.toUpperCase();
      // Advance to next cell in word
      const cells=selectedWord.cells, idx=cells.findIndex(p=>p.r===r&&p.c===c);
      if (idx<cells.length-1) { const {r:nr,c:nc}=cells[idx+1]; selectCell(nr,nc); getInput(nr,nc)?.focus(); }
    }
  }

  // ── Render clues ──
  function renderClues() {
    const renderList = (container, words) => {
      container.innerHTML='';
      words.forEach(w=>{
        const el=document.createElement('div');
        el.classList.add('cw-clue');
        el.dataset.id=w.id;
        el.innerHTML=`<span class="cw-clue-no">${w.id}</span><span class="cw-clue-text hidden">${w.clue}</span>`;
        // Click to reveal clue
        el.addEventListener('click',()=>{
          el.classList.toggle('revealed');
          selectWordById(w.id);
        });
        container.appendChild(el);
      });
    };
    renderList(acrossEl, WORD_DATA.filter(w=>w.dir==='across'));
    renderList(downEl,   WORD_DATA.filter(w=>w.dir==='down'));
  }

  function selectWordById(id) {
    const w=WORD_DATA.find(x=>x.id===id);
    if (w) selectCell(w.row, w.col);
  }

  // ── Check ──
  function checkAnswers() {
    let correct=0, total=0;
    WORD_DATA.forEach(w=>{
      getCells(w).forEach(({r,c},i)=>{
        const inp=getInput(r,c);
        if (!inp) return;
        total++;
        const cell=getCell(r,c);
        cell.classList.remove('correct','wrong');
        if (inp.value===w.word[i]) { cell.classList.add('correct'); correct++; }
        else if (inp.value) { cell.classList.add('wrong'); }
      });
    });
    if (statusEl) statusEl.textContent = correct===total ? '🎉 Correct! Divya is shook.' : `${correct}/${total} correct. Keep going.`;
  }

  function clearBoard() {
    gridEl.querySelectorAll('.cw-cell-input').forEach(inp=>{ inp.value=''; });
    gridEl.querySelectorAll('.correct,.wrong').forEach(el=>{ el.classList.remove('correct','wrong'); });
    if (statusEl) statusEl.textContent='';
  }

  const openModal  = () => { modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };

  openCard?.addEventListener('click', openModal);
  openCard?.querySelector('.gc-btn')?.addEventListener('click',(e)=>{ e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click',  closeModal);
  checkBtn?.addEventListener('click', checkAnswers);
  clearBtn?.addEventListener('click', clearBoard);
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeModal(); });

  renderGrid();
  renderClues();
}
