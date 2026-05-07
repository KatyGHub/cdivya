/**
 * cipher.js — Substitution cipher decoder.
 * New random cipher key every session.
 * 3 funny messages about Divya, one picked at random.
 */

const MESSAGES = [
  "DIVYA MAKES THINGS BEAUTIFUL AND PEOPLE FEEL SEEN",
  "SHE WILL REDESIGN YOUR LOGO WHETHER YOU WANT IT OR NOT",
  "HER CAMERA ROLL HAS NO BAD PHOTOS ONLY MISSED ANGLES",
  "EVERY DECK SHE TOUCHES BECOMES SOMETHING PEOPLE ACTUALLY READ",
  "SHE CAN SPOT A WRONG FONT FROM A MOVING VEHICLE NEVER FORGET",
];

const WIN_MESSAGES = [
  "🎉 Cracked it! Divya would've done it in half the time.",
  "🔓 Decoded! You may now enter the inner circle.",
  "✨ Genius unlocked. Divya is still faster though.",
  "🎊 Cipher broken! You've earned Divya's respect. Maybe.",
];

function shuffleAlphabet() {
  const alpha = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  // Fisher-Yates — ensure no letter maps to itself
  let key;
  do {
    key = [...alpha];
    for (let i=key.length-1;i>0;i--) {
      const j=Math.floor(Math.random()*(i+1));
      [key[i],key[j]]=[key[j],key[i]];
    }
  } while (key.some((v,i)=>v===alpha[i]));
  // cipher[i] = the letter that ALPHA[i] is encoded AS
  const cipher={};
  alpha.forEach((a,i)=>{ cipher[a]=key[i]; });
  return cipher;
}

export function initCipher() {
  const modal     = document.getElementById('cipherModal');
  const overlay   = document.getElementById('cipherOverlay');
  const closeBtn  = document.getElementById('cipherClose');
  const openCard  = document.getElementById('openCipherCard');
  const msgEl     = document.getElementById('cipherMessage');
  const alphaEl   = document.getElementById('cipherAlphabet');
  const hintBtn   = document.getElementById('cipherHint');
  const resetBtn  = document.getElementById('cipherReset');
  const progEl    = document.getElementById('cipherProgress');
  const totalEl   = document.getElementById('cipherTotal');
  const statusEl  = document.getElementById('cipherStatus');
  const confetti  = document.getElementById('confettiCanvas');
  if (!modal||!msgEl) return;

  let cipher={}, decoded={}, plainText='', encodedText='', hintsUsed=0, won=false;

  function init() {
    won = false; hintsUsed = 0;
    cipher = shuffleAlphabet();
    // reverse map: encoded letter → plain letter (for the user to fill in)
    // cipher[plain] = encoded
    // We need: for encoded letter X, what is the plain letter?
    decoded = {};  // decoded[encodedLetter] = userGuess (initially '')

    plainText   = MESSAGES[Math.floor(Math.random()*MESSAGES.length)];
    encodedText = plainText.split('').map(c => c===' ' ? ' ' : cipher[c]).join('');

    // How many unique letters in message
    const uniqueLetters = [...new Set(plainText.replace(/ /g,'').split(''))];
    if (totalEl) totalEl.textContent = uniqueLetters.length;

    renderMessage();
    renderAlphabet();
    updateProgress();
    if (statusEl) statusEl.textContent='';
  }

  function renderMessage() {
    msgEl.innerHTML='';
    const words = encodedText.split(' ');
    const plainWords = plainText.split(' ');

    words.forEach((w,wi)=>{
      const wordEl=document.createElement('div');
      wordEl.classList.add('cipher-word');

      w.split('').forEach((enc,ci)=>{
        const plain = plainWords[wi]?.[ci]||'';
        const charEl=document.createElement('div');
        charEl.classList.add('cipher-char');
        charEl.dataset.enc=enc;

        const encSpan=document.createElement('div');
        encSpan.classList.add('cipher-encoded');
        encSpan.textContent=enc;

        const inp=document.createElement('input');
        inp.type='text'; inp.maxLength=1;
        inp.classList.add('cipher-input');
        inp.dataset.enc=enc;
        inp.dataset.plain=plain;
        inp.setAttribute('aria-label',`encoded letter ${enc}`);

        // Pre-fill if already guessed
        if (decoded[enc]) {
          inp.value=decoded[enc];
          const correct = decoded[enc]===plain;
          inp.classList.toggle('correct', correct);
          inp.classList.toggle('wrong',  !correct);
        }

        inp.addEventListener('input',(e)=>{
          const val=e.target.value.toUpperCase().slice(-1);
          inp.value=val;
          decoded[enc]=val;
          // Update all inputs with same encoded letter
          msgEl.querySelectorAll(`input[data-enc="${enc}"]`).forEach(other=>{
            other.value=val;
            const p=other.dataset.plain;
            other.classList.toggle('correct',val===p&&!!val);
            other.classList.toggle('wrong',  val!==p&&!!val);
          });
          // Update alphabet key
          updateAlphabetKey(enc);
          updateProgress();
          checkWin();
        });

        inp.addEventListener('keydown',(e)=>{
          if (e.key==='Backspace'&&!inp.value) {
            decoded[enc]='';
            msgEl.querySelectorAll(`input[data-enc="${enc}"]`).forEach(o=>{o.value='';o.classList.remove('correct','wrong');});
            updateAlphabetKey(enc);
            updateProgress();
          }
        });

        charEl.appendChild(encSpan);
        charEl.appendChild(inp);
        wordEl.appendChild(charEl);
      });

      msgEl.appendChild(wordEl);
      if (wi<words.length-1) {
        const sp=document.createElement('div');
        sp.classList.add('cipher-char','is-space');
        msgEl.appendChild(sp);
      }
    });
  }

  function renderAlphabet() {
    if (!alphaEl) return;
    alphaEl.innerHTML='';
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').forEach(enc=>{
      const key=document.createElement('div');
      key.classList.add('cipher-key');
      key.dataset.enc=enc;
      const encSpan=document.createElement('div');
      encSpan.classList.add('cipher-key-enc');
      encSpan.textContent=enc;
      const decSpan=document.createElement('div');
      decSpan.classList.add('cipher-key-dec');
      decSpan.textContent=decoded[enc]||'';
      key.appendChild(encSpan);
      key.appendChild(decSpan);
      alphaEl.appendChild(key);
    });
  }

  function updateAlphabetKey(enc) {
    const key=alphaEl?.querySelector(`[data-enc="${enc}"]`);
    if (!key) return;
    const decSpan=key.querySelector('.cipher-key-dec');
    if (decSpan) decSpan.textContent=decoded[enc]||'';

    // Find plain letter from cipher map
    const plain=Object.keys(cipher).find(p=>cipher[p]===enc);
    const isKnown = decoded[enc]===plain&&!!decoded[enc];
    key.classList.toggle('known',isKnown);
  }

  function updateProgress() {
    const unique=[...new Set(plainText.replace(/ /g,'').split(''))];
    const correct=unique.filter(p=>{
      const enc=cipher[p];
      return decoded[enc]===p;
    });
    if (progEl) progEl.textContent=correct.length;
  }

  function checkWin() {
    if (won) return;
    const unique=[...new Set(plainText.replace(/ /g,'').split(''))];
    const allCorrect=unique.every(p=>{ const enc=cipher[p]; return decoded[enc]===p; });
    if (!allCorrect) return;
    won=true;
    if (statusEl) statusEl.textContent=WIN_MESSAGES[Math.floor(Math.random()*WIN_MESSAGES.length)];
    burstConfetti();
  }

  function burstConfetti() {
    if (!confetti) return;
    const ctx=confetti.getContext('2d');
    confetti.width=window.innerWidth; confetti.height=window.innerHeight;
    const COLS=['#FF2D55','#BF5FFF','#00FFBD','#FFB800','#fff'];
    const pieces=Array.from({length:100},()=>({
      x:Math.random()*confetti.width,y:-20,vx:(Math.random()-.5)*3,vy:2+Math.random()*3,
      rot:Math.random()*360,drot:(Math.random()-.5)*5,
      w:4+Math.random()*5,h:8+Math.random()*8,c:COLS[Math.floor(Math.random()*COLS.length)],dead:false,
    }));
    let raf;
    function draw(){
      ctx.clearRect(0,0,confetti.width,confetti.height);
      let alive=0;
      pieces.forEach(p=>{
        if(p.dead)return; p.x+=p.vx;p.y+=p.vy;p.vy+=.1;p.rot+=p.drot;
        if(p.y>confetti.height+20){p.dead=true;return;}
        alive++;
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.rot*Math.PI/180);
        ctx.fillStyle=p.c;ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);ctx.restore();
      });
      if(alive>0)raf=requestAnimationFrame(draw);else ctx.clearRect(0,0,confetti.width,confetti.height);
    }
    draw();
  }

  hintBtn?.addEventListener('click',()=>{
    if (won) return;
    // Find most common unsolved plain letter in message
    const counts={};
    plainText.replace(/ /g,'').split('').forEach(p=>{
      const enc=cipher[p];
      if (decoded[enc]!==p) counts[p]=(counts[p]||0)+1;
    });
    const best=Object.entries(counts).sort((a,b)=>b[1]-a[1])[0];
    if (!best) return;
    const [plain]=best;
    const enc=cipher[plain];
    decoded[enc]=plain;
    msgEl.querySelectorAll(`input[data-enc="${enc}"]`).forEach(inp=>{
      inp.value=plain;
      inp.classList.add('correct'); inp.classList.remove('wrong');
    });
    updateAlphabetKey(enc);
    updateProgress();
    hintsUsed++;
    if (statusEl) statusEl.textContent=`Hint used (${hintsUsed}). Letter "${enc}" = "${plain}". No judgment.`;
    checkWin();
  });

  resetBtn?.addEventListener('click', init);

  const openModal  = () => { init(); modal.classList.add('open'); modal.setAttribute('aria-hidden','false'); document.body.style.overflow='hidden'; };
  const closeModal = () => { modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); document.body.style.overflow=''; };

  openCard?.addEventListener('click', openModal);
  openCard?.querySelector('.gc-btn')?.addEventListener('click',(e)=>{ e.stopPropagation(); openModal(); });
  closeBtn?.addEventListener('click', closeModal);
  overlay?.addEventListener('click',  closeModal);
  document.addEventListener('keydown',(e)=>{ if(e.key==='Escape') closeModal(); });
}
