/* =====================================================================
   Nightwatch of the Islands — game.js
   Engine: physics, combat, lantern & magic, enemies, puzzles, NPCs,
   parchment map with fog-of-war, inventory, saves, 9 lives, rendering.
   ===================================================================== */
(function () {
  'use strict';

  const D = window.DATA, SPR = window.SPRITES;
  const TILE = 32, COLS = 25, ROWS = 15, W = COLS * TILE, H = ROWS * TILE;
  const SAVE_KEY = 'nightwatch_save_v1';

  const cv = document.getElementById('game');
  const ctx = cv.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const lightCv = document.createElement('canvas');
  lightCv.width = W; lightCv.height = H;
  const lctx = lightCv.getContext('2d');

  const $ = id => document.getElementById(id);
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const dist = (ax, ay, bx, by) => Math.hypot(ax - bx, ay - by);
  // deterministic decoration hash
  const hash = (x, y) => { let h = (x * 374761393 + y * 668265263) ^ 88339; h = (h ^ (h >> 13)) * 1274126177; return ((h ^ (h >> 16)) >>> 0) / 4294967295; };

  /* ================================ AUDIO ============================ */
  const AU = { ctx: null, sfxGain: null, t: 0 };
  // mixer settings persist alongside the save
  const AUDIO_KEY = 'nightwatch_audio_v1';
  const AUDIO = Object.assign({ music: 55, sfx: 80, muted: false }, (() => {
    try { return JSON.parse(localStorage.getItem(AUDIO_KEY)) || {}; } catch (e) { return {}; }
  })());
  function applyAudio() {
    if (AU.sfxGain) AU.sfxGain.gain.setTargetAtTime(AUDIO.muted ? 0 : AUDIO.sfx / 100, AU.ctx.currentTime, 0.05);
    if (window.MUSIC) MUSIC.setVolume(AUDIO.muted ? 0 : AUDIO.music / 100 * 0.9);
    try { localStorage.setItem(AUDIO_KEY, JSON.stringify(AUDIO)); } catch (e) { /* private mode */ }
  }
  function audioInit() {
    if (AU.ctx) { if (AU.ctx.state === 'suspended') AU.ctx.resume(); return; }
    try {
      AU.ctx = new (window.AudioContext || window.webkitAudioContext)();
      AU.sfxGain = AU.ctx.createGain();
      AU.sfxGain.connect(AU.ctx.destination);
      if (window.MUSIC) MUSIC.init(AU.ctx);
      applyAudio();
    } catch (e) { AU.ctx = null; }
  }
  // browsers gate audio behind a user gesture — the first click/tap anywhere
  // (including on the title screen) strikes up the band
  document.addEventListener('pointerdown', audioInit, { once: true });
  function tone(freq, dur, type, vol, slide) {
    if (!AU.ctx) return;
    const t0 = AU.ctx.currentTime;
    const o = AU.ctx.createOscillator(), g = AU.ctx.createGain();
    o.type = type || 'square'; o.frequency.setValueAtTime(freq, t0);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t0 + dur);
    g.gain.setValueAtTime((vol || 0.08), t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(AU.sfxGain || AU.ctx.destination);
    o.start(t0); o.stop(t0 + dur + 0.02);
  }
  const sfx = {
    sword: () => { tone(190, 0.08, 'sawtooth', 0.05, -120); tone(420, 0.05, 'square', 0.03, -200); },
    hit: () => tone(140, 0.12, 'square', 0.07, -60),
    hurt: () => { tone(220, 0.18, 'sawtooth', 0.08, -140); tone(520, 0.1, 'triangle', 0.05, 240); }, // a small indignant yowl
    meow: () => { tone(640, 0.16, 'triangle', 0.06, 260); setTimeout(() => tone(840, 0.14, 'triangle', 0.05, -300), 90); },
    pickup: () => { tone(660, 0.07, 'square', 0.05); setTimeout(() => tone(880, 0.09, 'square', 0.05), 60); },
    chest: () => { tone(392, 0.1, 'triangle', 0.07); setTimeout(() => tone(523, 0.1, 'triangle', 0.07), 100); setTimeout(() => tone(659, 0.16, 'triangle', 0.08), 200); },
    plate: () => tone(160, 0.12, 'sine', 0.09, -30),
    reject: () => { tone(180, 0.14, 'square', 0.06, -90); setTimeout(() => tone(120, 0.18, 'square', 0.06, -40), 110); },
    door: () => { tone(90, 0.3, 'sawtooth', 0.07, 40); setTimeout(() => tone(140, 0.2, 'square', 0.05), 180); },
    beacon: () => { [262, 330, 392, 523].forEach((f, i) => setTimeout(() => tone(f, 0.5, 'triangle', 0.08), i * 130)); },
    sling: () => tone(300, 0.06, 'square', 0.04, 200),
    lantern: () => tone(520, 0.08, 'sine', 0.05, 120),
    kill: () => { tone(360, 0.1, 'sawtooth', 0.05, -260); setTimeout(() => tone(620, 0.1, 'sine', 0.04, 200), 60); }
  };

  /* ================================ INPUT ============================ */
  const keys = {};
  let interactQueued = false;
  window.addEventListener('keydown', e => {
    const k = e.key.toLowerCase();
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(e.key.toLowerCase()) || e.key === ' ') e.preventDefault();
    if (e.repeat) { keys[k] = true; return; }
    keys[k] = true;
    onKeyPress(k, e);
  });
  window.addEventListener('keyup', e => { keys[e.key.toLowerCase()] = false; });
  // alt-tabbing away with a key held would leave it stuck down forever
  window.addEventListener('blur', () => { Object.keys(keys).forEach(k => { keys[k] = false; }); });
  const mv = {
    left: () => keys['arrowleft'] || keys['a'],
    right: () => keys['arrowright'] || keys['d'],
    up: () => keys['arrowup'] || keys['w'],
    down: () => keys['arrowdown'] || keys['s'],
    shield: () => keys['shift']
  };

  /* ============================ GAME STATE =========================== */
  const G = {
    started: false, over: false, won: false,
    screenId: null, screen: null, tiles: null, meta: null,
    enemies: [], npcs: [], pickups: [], chests: [], projectiles: [], particles: [],
    plates: [], glyphs: [], doorTiles: [], beaconTile: null,
    plateProgress: 0,
    entryPos: null,
    time: 0, toast: '', toastT: 0,
    paused: false
  };

  const P = {
    x: 0, y: 0, w: 16, h: 12, // collision box (feet)
    dir: 'down', moving: false, frame: 0, frameT: 0,
    hearts: 6, maxHearts: 6, magic: 100, maxMagic: 100, lives: 9,
    lanternOn: false, mode: 'reveal', // reveal | repel | empower
    attackT: 0, attackCd: 0, invulnT: 0, shielding: false,
    inventory: ['claws', 'lantern', 'map'],
    weapon: 'claws', shield: null,
    kb: { x: 0, y: 0, t: 0 }
  };

  // persistent world flags (saved)
  const F = {
    beacons: { temple: false, harbour: false, north: false },
    explored: [],
    persist: {},      // per-screen: {chests:[], pickups:[], doorOpen, plates, revealed:[]}
    met: {},          // npc id -> true
    blessed: false,
    bossDown: false,  // the Siege Wraith of St Elmo
    completed: false, // has the player ever returned the dawn?
    codex: [],
    storySeen: {}
  };
  function persistOf(id) {
    if (!F.persist[id]) F.persist[id] = { chests: [], pickups: [], doorOpen: false, plates: false, revealed: [] };
    return F.persist[id];
  }

  const MODES = {
    reveal: { label: 'Reveal', color: '#7fd9e8', radius: 150, drain: 4 },
    repel: { label: 'Repel', color: '#6a9dff', radius: 125, drain: 7 },
    empower: { label: 'Empower', color: '#ffd76a', radius: 135, drain: 5 }
  };
  const SOLID = new Set(['#', 'T', 't', '%', 'n', '+', '~', 'B', 'b']);

  /* =========================== SCREEN LOADING ======================== */
  function gridPosOf(id) {
    for (let r = 0; r < D.WORLD.rows; r++)
      for (let c = 0; c < D.WORLD.cols; c++)
        if (D.WORLD.grid[r][c] === id) return { r, c };
    return null;
  }

  function loadScreen(id, entry) {
    const sc = D.SCREENS[id];
    if (!sc) { console.error('[nightwatch] unknown screen', id); return; }
    if (sc.rows.length !== ROWS) console.error('[nightwatch] screen ' + id + ' has ' + sc.rows.length + ' rows (want ' + ROWS + ')');
    sc.rows.forEach((row, i) => { if (row.length !== COLS) console.error('[nightwatch] screen ' + id + ' row ' + i + ' len ' + row.length + ' (want ' + COLS + '): "' + row + '"'); });

    G.screenId = id; G.screen = sc; G.meta = sc;
    const per = persistOf(id);
    G.enemies = []; G.npcs = []; G.pickups = []; G.chests = []; G.projectiles = []; G.particles = [];
    G.plates = []; G.glyphs = []; G.doorTiles = []; G.beaconTile = null; G.plateProgress = 0;

    const tiles = [];
    let chestIdx = 0, pickIdx = 0, npcIdx = 0;
    for (let y = 0; y < ROWS; y++) {
      const line = (sc.rows[y] || '').padEnd(COLS, '#').slice(0, COLS);
      const out = [];
      for (let x = 0; x < COLS; x++) {
        let ch = line[x];
        const px = x * TILE + TILE / 2, py = y * TILE + TILE / 2;
        switch (ch) {
          case 'S': if (!G.won) G.enemies.push(makeShade(px, py, sc.region === 'north')); ch = sc.floor; break;
          case 'Z': if (!G.won) G.enemies.push(makeSentinel(px, py)); ch = sc.floor; break;
          case 'N': {
            const nid = (sc.npcs || [])[npcIdx++];
            if (nid) G.npcs.push({ id: nid, x: px, y: py, spr: (D.DIALOGUE[nid] || {}).sprite || 'fisher' });
            ch = (id === 'mdina') ? '=' : sc.floor; break;
          }
          case 'C': {
            const content = (sc.chests || [])[chestIdx];
            G.chests.push({ x, y, idx: chestIdx, content, open: per.chests.includes(chestIdx) });
            chestIdx++; ch = sc.floor; break;
          }
          case 'F': case 'H': case 'M': {
            if (!per.pickups.includes(pickIdx)) G.pickups.push({ x: px, y: py, kind: ch, idx: pickIdx });
            pickIdx++; ch = ch === 'F' ? sc.floor : sc.floor; break;
          }
          case '@': if (!entry) entry = { x: px - P.w / 2, y: py - P.h / 2 }; ch = sc.floor; break;
          case 'P': G.plates.push({ x, y, latched: false }); break;
          case 'G': G.glyphs.push({ x, y }); break;
          case 'D': G.doorTiles.push({ x, y }); break;
          case 'b': G.beaconTile = { x, y, id: sc.beacon }; break;
          case 'O': ch = sc.floor; break;
        }
        out.push(ch);
      }
      tiles.push(out);
    }
    G.tiles = tiles;

    // already-solved door / plates
    if (per.doorOpen) openDoors(false);
    if (per.plates) { G.plates.forEach(p => p.latched = true); }
    if (sc.doorRule === 'clear' && per.doorOpen) { /* enemies may respawn but gate stays open */ }

    if (entry) { P.x = entry.x; P.y = entry.y; }
    G.entryPos = { x: P.x, y: P.y };

    if (!F.explored.includes(id)) { F.explored.push(id); }
    $('zonename').textContent = sc.name;
    saveGame();
  }

  function openDoors(announce) {
    const per = persistOf(G.screenId);
    per.doorOpen = true;
    G.doorTiles.forEach(d => { G.tiles[d.y][d.x] = (G.screenId === 'mdina') ? '=' : '='; });
    if (announce) { sfx.door(); toast('Stone grinds aside — the way is open.'); }
  }

  /* ============================== ENTITIES =========================== */
  function makeShade(x, y, swift) {
    return { kind: 'shade', x, y, w: 18, h: 16, hp: swift ? 1 : 2, dmg: 1, speed: swift ? 58 : 38, swift: !!swift, frameT: 0, frame: 0, hurtT: 0 };
  }
  function makeSentinel(x, y) { return { kind: 'sentinel', x, y, w: 20, h: 18, hp: 5, dmg: 2, speed: 30, dir: 1, frameT: 0, frame: 0, hurtT: 0, home: x }; }
  // The Siege Wraith — shadow of a drowned siege commander, bars St Elmo's light
  function makeWraith(x, y) {
    return {
      kind: 'wraith', x, y, w: 30, h: 26, hp: 14, maxHp: 14, dmg: 2, speed: 32,
      state: 'chase', t: 3.0, vx: 0, vy: 0, hitDuringDash: false, summonT: 6,
      frameT: 0, frame: 0, hurtT: 0
    };
  }
  function spawnWraith() {
    G.enemies.push(makeWraith(12 * TILE, 9 * TILE));
    sfx.door(); sfx.hurt();
    burst(12 * TILE, 9 * TILE, '#4c3585', 24);
    toast('"WHO LIGHTS MY WATCH?" — the Siege Wraith rises from the harbour stones!');
  }

  /* ============================ COLLISION ============================ */
  function tileAt(tx, ty) {
    if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return '#';
    return G.tiles[ty][tx];
  }
  function isSolidTile(tx, ty) {
    const ch = tileAt(tx, ty);
    if (ch === 'D') return true;
    if (ch === 'h') return !persistOf(G.screenId).revealed.includes(ty * COLS + tx);
    return SOLID.has(ch);
  }
  function rectFree(x, y, w, h) {
    const x0 = Math.floor(x / TILE), y0 = Math.floor(y / TILE);
    const x1 = Math.floor((x + w - 1) / TILE), y1 = Math.floor((y + h - 1) / TILE);
    for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) if (isSolidTile(tx, ty)) return false;
    return true;
  }
  function moveRect(e, dx, dy) {
    if (dx !== 0 && rectFree(e.x + dx, e.y, e.w, e.h)) e.x += dx;
    if (dy !== 0 && rectFree(e.x, e.y + dy, e.w, e.h)) e.y += dy;
  }
  // enemies store CENTRE coords; collide their box per-axis
  function moveCenter(en, dx, dy) {
    const bx = en.x - en.w / 2, by = en.y - en.h / 2;
    if (dx !== 0 && rectFree(bx + dx, by, en.w, en.h)) en.x += dx;
    if (dy !== 0 && rectFree(bx, by + dy, en.w, en.h)) en.y += dy;
  }

  /* ============================== PLAYER ============================= */
  function onKeyPress(k, e) {
    if (!G.started || G.over) return;
    if ($('dialog') && !$('dialog').classList.contains('hidden')) {
      if (k === 'e' || k === 'enter' || k === ' ') advanceDialog();
      return;
    }
    if (panelLocked()) return; // story/codex/end answer only to their buttons
    if (k === 'm') { toggleModal('mapModal'); return; }
    if (k === 'i') { toggleModal('invModal'); return; }
    if (k === 'escape') { closeModals(); return; }
    if (G.paused) return;
    if (k === 'l') {
      P.lanternOn = !P.lanternOn;
      if (P.lanternOn && P.magic <= 2) { P.lanternOn = false; toast('The lantern gutters — no magic left. Wait, or find a vial.'); }
      else { sfx.lantern(); toast(P.lanternOn ? 'The lantern burns — ' + MODES[P.mode].label + '.' : 'The lantern sleeps.'); }
      updateHUD();
    }
    if (k === 'q') {
      const order = ['reveal', 'repel', 'empower'];
      P.mode = order[(order.indexOf(P.mode) + 1) % 3];
      sfx.lantern(); toast('Lantern mode: ' + MODES[P.mode].label + '.');
      updateHUD();
    }
    if (k === 'e') interactQueued = true;
    if (k === ' ') tryAttack();
    if (k === 'r') castBlessing();
  }

  function castBlessing() {
    if (P.hearts >= P.maxHearts) { toast('Your wounds are already closed.'); return; }
    if (P.magic < 40) { sfx.reject(); toast("The Saint's Blessing asks forty measures of magic."); return; }
    P.magic -= 40;
    P.hearts = clamp(P.hearts + 4, 0, P.maxHearts);
    P.invulnT = Math.max(P.invulnT, 1);
    burst(P.x + P.w / 2, P.y, '#ffd76a', 14);
    sfx.chest();
    toast("Saint's Blessing — warmth closes your wounds. (+2 hearts)");
    updateHUD();
  }

  function tryAttack() {
    if (P.attackCd > 0 || P.shielding || G.paused) return;
    const wep = D.ITEMS[P.weapon];
    P.attackCd = 0.34; P.attackT = 0.16;
    if (wep.ranged) {
      sfx.sling();
      const v = dirVec(P.dir);
      G.projectiles.push({ x: P.x + P.w / 2, y: P.y + P.h / 2 - 6, vx: v.x * 230, vy: v.y * 230, life: 1.2 });
      return;
    }
    sfx.sword();
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2 - 4;
    const v = dirVec(P.dir);
    const hx = cx + v.x * (wep.reach || 20), hy = cy + v.y * (wep.reach || 20);
    let hitAny = false;
    G.enemies.forEach(en => {
      if (en.hp <= 0) return;
      if (dist(hx, hy, en.x, en.y) < 24) { damageEnemy(en, wep.dmg, v); hitAny = true; }
    });
    if (hitAny) sfx.hit();
  }

  function damageEnemy(en, dmg, v) {
    if (en.kind === 'wraith' && en.state === 'stagger') dmg *= 2; // punish window
    en.hp -= dmg; en.hurtT = 0.18;
    if (en.kind !== 'wraith') { en.x += (v ? v.x : 0) * 10; en.y += (v ? v.y : 0) * 10; }
    if (en.hp <= 0) {
      sfx.kill();
      P.magic = clamp(P.magic + 6, 0, P.maxMagic); // the lantern drinks the shadow
      burst(en.x, en.y, '#7fd9e8', 10);
      if (en.kind === 'wraith') {
        F.bossDown = true;
        burst(en.x, en.y, '#4c3585', 30); burst(en.x, en.y, '#ffd76a', 20);
        sfx.beacon();
        toast('The Siege Wraith breaks like a wave on the bastion. The watch-light is yours to give.');
        saveGame();
      }
      checkClearRule();
    }
  }

  function checkClearRule() {
    if (G.meta.doorRule === 'clear' && !persistOf(G.screenId).doorOpen) {
      const alive = G.enemies.filter(e => e.hp > 0).length;
      if (alive === 0) { openDoors(true); toast('The fort gate answers — the quarter is clear!'); }
    }
  }

  function dirVec(d) { return d === 'left' ? { x: -1, y: 0 } : d === 'right' ? { x: 1, y: 0 } : d === 'up' ? { x: 0, y: -1 } : { x: 0, y: 1 }; }

  function hurtPlayer(dmg, fromX, fromY) {
    if (P.invulnT > 0 || G.over) return;
    // shield: block attacks from the front
    if (P.shielding && P.shield) {
      const v = dirVec(P.dir);
      const dx = (fromX - (P.x + P.w / 2)), dy = (fromY - (P.y + P.h / 2));
      const len = Math.hypot(dx, dy) || 1;
      if ((dx / len) * v.x + (dy / len) * v.y > 0.35) {
        sfx.hit(); burst(P.x + P.w / 2 + v.x * 12, P.y + v.y * 12, '#b9c2cc', 5);
        P.kb = { x: -v.x * 60, y: -v.y * 60, t: 0.12 };
        return;
      }
    }
    P.hearts -= dmg; P.invulnT = 1.0;
    sfx.hurt();
    const dx = (P.x + P.w / 2) - fromX, dy = (P.y + P.h / 2) - fromY;
    const len = Math.hypot(dx, dy) || 1;
    P.kb = { x: dx / len * 140, y: dy / len * 140, t: 0.16 };
    burst(P.x + P.w / 2, P.y, '#e84545', 8);
    if (P.hearts <= 0) loseLife();
    updateHUD();
  }

  function loseLife() {
    P.lives -= 1;
    updateHUD();
    if (P.lives <= 0) {
      G.over = true;
      P.lives = 9; P.hearts = P.maxHearts; P.magic = P.maxMagic; // continue mercy
      saveGame();
      showStoryThen('gameover', () => showEnd('The Ninth Life', 'The night has taken all nine.',
        'Your progress is saved — the lantern waits at your last camp with nine fresh lives. There is no shame in a strategic nap.'));
      return;
    }
    toast('A life is spent — ' + P.lives + ' remain. The lantern rekindles you.');
    sfx.meow();
    P.hearts = P.maxHearts; P.magic = Math.max(P.magic, P.maxMagic / 2); P.invulnT = 2;
    P.x = G.entryPos.x; P.y = G.entryPos.y;
    // shadows reform
    loadScreen(G.screenId, { x: P.x, y: P.y });
  }

  /* ============================ INTERACTION ========================== */
  function tryInteract() {
    const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
    // NPCs
    for (const n of G.npcs) {
      if (dist(cx, cy, n.x, n.y) < 34) { startDialog(n.id); return; }
    }
    // chests
    for (const c of G.chests) {
      if (!c.open && dist(cx, cy, c.x * TILE + 16, c.y * TILE + 16) < 36) { openChest(c); return; }
    }
    // beacon
    if (G.beaconTile) {
      const b = G.beaconTile;
      if (dist(cx, cy, b.x * TILE + 16, b.y * TILE + 16) < 44 && !F.beacons[b.id]) {
        if (P.lanternOn && P.mode === 'empower') lightBeacon(b);
        else { sfx.reject(); toast('The beacon is cold. Light your lantern (L) and set it to Empower (Q).'); }
        return;
      }
    }
  }

  function openChest(c) {
    c.open = true;
    persistOf(G.screenId).chests.push(c.idx);
    sfx.chest();
    const id = c.content;
    if (!id) { toast('Empty. Even the moths have moved out.'); return; }
    if (D.CODEX[id]) {
      if (!F.codex.includes(id)) F.codex.push(id);
      showCodex(D.CODEX[id].title, D.CODEX[id].body);
    } else if (D.ITEMS[id]) {
      const it = D.ITEMS[id];
      if (id === 'charm') { P.maxMagic += 50; P.magic = P.maxMagic; }
      else if (id === 'heart_container') { P.maxHearts += 2; P.hearts = P.maxHearts; }
      if (!P.inventory.includes(id)) P.inventory.push(id);
      if (it.type === 'weapon') { P.weapon = id; }
      if (it.type === 'shield') { P.shield = id; }
      showCodex(it.name + ' — ' + it.era, it.desc + (it.type === 'weapon' ? '<br><br><b>Equipped.</b> Swap arms any time in your Satchel (I).' : it.type === 'shield' ? '<br><br><b>Equipped.</b> Hold Shift to raise it.' : ''));
    }
    updateHUD();
    saveGame();
  }

  function lightBeacon(b) {
    // St Elmo's light is held by the Siege Wraith until it falls
    if (b.id === 'harbour' && !F.bossDown) {
      if (G.enemies.some(e => e.kind === 'wraith' && e.hp > 0)) { sfx.reject(); toast('The Wraith still bars the watch-light!'); }
      else spawnWraith();
      return;
    }
    F.beacons[b.id] = true;
    P.magic = clamp(P.magic - 20, 0, P.maxMagic);
    sfx.beacon();
    burst(b.x * TILE + 16, b.y * TILE + 8, '#ffd76a', 26);
    const lit = Object.values(F.beacons).filter(Boolean).length;
    updateHUD();
    saveGame();
    if (lit === 1) showStoryThen('beacon1');
    else if (lit === 2) showStoryThen('beacon2');
    else if (lit >= 3) {
      G.won = true;
      F.completed = true;
      G.enemies = []; // the night lifts — the Nightborne thin into mist
      saveGame();
      showStoryThen('victory', () => {
        const codexTotal = Object.keys(D.CODEX).length;
        const fullCodex = F.codex.length >= codexTotal;
        const fullZones = F.explored.length >= 15;
        const flawless = P.lives >= 9;
        // a closing line that reflects HOW the player won (testers wanted the
        // ending to acknowledge them) — and points to what a return run offers
        let line;
        if (fullCodex && fullZones && flawless)
          line = 'A flawless Nightwatch — every stone of Malta walked, every memory recovered, and not one of your nine lives spent. The Council of Nine will sing of this until the next long night.';
        else if (fullCodex && fullZones)
          line = 'You walked every zone and read every chest — the whole island remembered. A Nightwatch the Council of Nine will not forget.';
        else if (fullZones)
          line = 'You crossed the whole island to bring back the dawn — though some chests stay sealed, their histories still waiting to be read.';
        else
          line = 'The dawn is yours, Xemx — though corners of the island stay dark to you still. There is always another Nightwatch.';
        showEnd('Dawn Returns', 'The Nightwatch is over.',
          'Beacons lit: 3 of 3 · Codex entries: ' + F.codex.length + ' of ' + codexTotal +
          ' · Lives remaining: ' + P.lives + ' of 9 · Zones explored: ' + F.explored.length + ' of 15.<br><br>' +
          line + '<br><br>Grazzi ħafna, Xemx. Malta remembers her cats. <b>The islanders have words for you — walk in the dawn and seek them out.</b>');
        $('dawnBtn').classList.remove('hidden');
      });
    }
  }

  /* ============================== PLATES ============================= */
  function updatePlates() {
    if (!G.meta.plateOrder || persistOf(G.screenId).plates) return;
    const cx = P.x + P.w / 2, cy = P.y + P.h;
    G.plates.forEach((p, k) => {
      const on = Math.floor(cx / TILE) === p.x && Math.floor(cy / TILE) === p.y;
      if (on && !p.latched) {
        const expected = G.meta.plateOrder[G.plateProgress];
        if (k === expected) {
          p.latched = true; G.plateProgress++; sfx.plate();
          burst(p.x * TILE + 16, p.y * TILE + 16, '#ffd76a', 6);
          if (G.plateProgress >= G.meta.plateOrder.length) {
            persistOf(G.screenId).plates = true;
            openDoors(true);
            toast('The standing-stones remember the counting. The temple door opens!');
            saveGame();
          }
        } else {
          sfx.reject();
          G.plates.forEach(q => q.latched = false); G.plateProgress = 0;
          toast('The stones forget. Reveal (Q) the carved counting and tread in order.');
        }
      }
    });
  }

  /* ============================== DIALOGUE =========================== */
  let dlg = null;
  function startDialog(id) {
    const d = D.DIALOGUE[id]; if (!d) return;
    let lines;
    if (G.won && d.won) lines = d.won; // victory epilogue takes precedence in the dawn
    else if (id === 'knight1' && persistOf('valletta').doorOpen && d.cleared) lines = F.met[id] ? d.cleared : d.first;
    else lines = F.met[id] ? d.again : d.first;
    dlg = { id, lines, i: 0 };
    $('dlgWho').textContent = d.name;
    $('dlgText').textContent = mobilize(lines[0]);
    $('dialog').classList.remove('hidden');
    syncPause();
  }
  function advanceDialog() {
    if (!dlg) return;
    dlg.i++;
    if (dlg.i >= dlg.lines.length) {
      const id = dlg.id;
      $('dialog').classList.add('hidden');
      syncPause();
      if (!F.met[id]) {
        F.met[id] = true;
        if (id === 'fisher1') { toast('Toni gives you a fish for the road.'); P.hearts = clamp(P.hearts + 2, 0, P.maxHearts); sfx.pickup(); }
        if (id === 'elder2' && !F.blessed) {
          F.blessed = true; P.lives = 9; P.hearts = P.maxHearts; P.magic = P.maxMagic;
          toast('The blessing of the Nine — lives, wounds and magic restored.'); sfx.beacon();
        }
        saveGame();
      }
      dlg = null;
      updateHUD();
      return;
    }
    $('dlgText').textContent = mobilize(dlg.lines[dlg.i]);
  }
  $('dialog').addEventListener('click', advanceDialog);

  /* ============================== UPDATE ============================= */
  function update(dt) {
    G.time += dt;
    if (G.paused || !G.started || G.over) return;

    // ---- player movement
    let dx = 0, dy = 0;
    if (mv.left()) dx -= 1; if (mv.right()) dx += 1;
    if (mv.up()) dy -= 1; if (mv.down()) dy += 1;
    P.shielding = mv.shield() && !!P.shield;
    const speed = P.shielding ? 52 : 92;
    if (dx || dy) {
      const len = Math.hypot(dx, dy);
      if (Math.abs(dx) > Math.abs(dy)) P.dir = dx < 0 ? 'left' : 'right';
      else if (dy !== 0) P.dir = dy < 0 ? 'up' : 'down';
      moveRect(P, dx / len * speed * dt, dy / len * speed * dt);
      P.moving = true;
      P.frameT += dt;
      if (P.frameT > 0.14) { P.frameT = 0; P.frame = 1 - P.frame; }
    } else P.moving = false;

    // knockback
    if (P.kb.t > 0) { moveRect(P, P.kb.x * dt, P.kb.y * dt); P.kb.t -= dt; }

    P.attackCd = Math.max(0, P.attackCd - dt);
    P.attackT = Math.max(0, P.attackT - dt);
    P.invulnT = Math.max(0, P.invulnT - dt);

    // ---- lantern & magic
    if (P.lanternOn) {
      P.magic -= MODES[P.mode].drain * dt;
      if (P.magic <= 0) { P.magic = 0; P.lanternOn = false; toast('The lantern gutters out — its magic is spent.'); }
      // reveal hidden paths & remember them
      if (P.mode === 'reveal') {
        const per = persistOf(G.screenId);
        const pr = MODES.reveal.radius;
        const cx = P.x + P.w / 2, cy = P.y + P.h / 2;
        const tx0 = clamp(Math.floor((cx - pr) / TILE), 0, COLS - 1), tx1 = clamp(Math.floor((cx + pr) / TILE), 0, COLS - 1);
        const ty0 = clamp(Math.floor((cy - pr) / TILE), 0, ROWS - 1), ty1 = clamp(Math.floor((cy + pr) / TILE), 0, ROWS - 1);
        for (let ty = ty0; ty <= ty1; ty++) for (let tx = tx0; tx <= tx1; tx++) {
          if (G.tiles[ty][tx] === 'h' && dist(cx, cy, tx * TILE + 16, ty * TILE + 16) < pr) {
            const key = ty * COLS + tx;
            if (!per.revealed.includes(key)) { per.revealed.push(key); burst(tx * TILE + 16, ty * TILE + 16, '#7fd9e8', 6); toast('A hidden way shimmers into sight!'); }
          }
        }
      }
    } else {
      P.magic = clamp(P.magic + 8 * dt, 0, P.maxMagic);
    }

    // ---- enemies
    const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2;
    G.enemies.forEach(en => {
      if (en.hp <= 0) return;
      en.frameT += dt; if (en.frameT > 0.22) { en.frameT = 0; en.frame = 1 - en.frame; }
      en.hurtT = Math.max(0, en.hurtT - dt);
      const dd = dist(en.x, en.y, pcx, pcy);
      if (en.kind === 'shade') {
        let vx = 0, vy = 0;
        const repelled = P.lanternOn && P.mode === 'repel' && dd < MODES.repel.radius + 20;
        if (repelled) { vx = (en.x - pcx) / dd * 70; vy = (en.y - pcy) / dd * 70; }
        else if (dd < 180 && dd > 2) { vx = (pcx - en.x) / dd * en.speed; vy = (pcy - en.y) / dd * en.speed; }
        en.x = clamp(en.x + vx * dt, 8, W - 8); en.y = clamp(en.y + vy * dt, 8, H - 8);
      } else if (en.kind === 'wraith') {
        // chase -> tell (shake) -> dash -> stagger if it missed (punish window)
        en.t -= dt;
        if (en.state === 'chase') {
          if (dd > 2) { en.x += (pcx - en.x) / dd * en.speed * dt; en.y += (pcy - en.y) / dd * en.speed * dt; }
          en.summonT -= dt;
          if (en.summonT <= 0) {
            en.summonT = 7;
            if (G.enemies.filter(e => e.kind === 'shade' && e.hp > 0).length < 2) {
              const sx = Math.random() < 0.5 ? 3 * TILE : 21 * TILE;
              G.enemies.push(makeShade(sx, 10 * TILE));
              burst(sx, 10 * TILE, '#4c3585', 8);
            }
          }
          if (en.t <= 0) { en.state = 'tell'; en.t = 0.7; }
        } else if (en.state === 'tell') {
          if (en.t <= 0) {
            en.state = 'dash'; en.t = 0.9; en.hitDuringDash = false;
            const dl = dist(en.x, en.y, pcx, pcy) || 1;
            en.vx = (pcx - en.x) / dl * 250; en.vy = (pcy - en.y) / dl * 250;
            sfx.sling();
          }
        } else if (en.state === 'dash') {
          en.x = clamp(en.x + en.vx * dt, 24, W - 24); en.y = clamp(en.y + en.vy * dt, 24, H - 24);
          if (en.t <= 0) {
            en.state = en.hitDuringDash ? 'chase' : 'stagger';
            en.t = en.hitDuringDash ? 3.2 : 1.7;
            if (en.state === 'stagger') { sfx.plate(); burst(en.x, en.y, '#b9c2cc', 8); }
          }
        } else if (en.state === 'stagger') {
          if (en.t <= 0) { en.state = 'chase'; en.t = 3.2; }
        }
      } else { // sentinel patrols, charges when close — armoured, so walls stop it
        if (dd < 95) { const v = en.speed * 1.6; moveCenter(en, (pcx - en.x) / dd * v * dt, (pcy - en.y) / dd * v * dt); }
        else {
          const step = en.dir * en.speed * dt;
          const px0 = en.x;
          moveCenter(en, step, 0);
          if (en.x === px0 || Math.abs(en.x - en.home) > 70) en.dir *= -1;
        }
      }
      const reach = en.kind === 'wraith' ? 26 : 18;
      if (dd < reach && en.state !== 'stagger') {
        hurtPlayer(en.kind === 'wraith' && en.state === 'dash' ? 3 : en.dmg, en.x, en.y);
        if (en.kind === 'wraith' && en.state === 'dash') en.hitDuringDash = true;
      }
    });

    // ---- projectiles (sling stones)
    G.projectiles = G.projectiles.filter(pr => {
      pr.x += pr.vx * dt; pr.y += pr.vy * dt; pr.life -= dt;
      if (pr.life <= 0) return false;
      if (isSolidTile(Math.floor(pr.x / TILE), Math.floor(pr.y / TILE))) { burst(pr.x, pr.y, '#9b8d6d', 4); return false; }
      for (const en of G.enemies) {
        if (en.hp > 0 && dist(pr.x, pr.y, en.x, en.y) < 14) {
          damageEnemy(en, D.ITEMS.sling.dmg, { x: Math.sign(pr.vx), y: Math.sign(pr.vy) });
          sfx.hit(); return false;
        }
      }
      return true;
    });

    // ---- pickups
    G.pickups = G.pickups.filter(pk => {
      if (dist(pk.x, pk.y, pcx, pcy) < 18) {
        persistOf(G.screenId).pickups.push(pk.idx);
        sfx.pickup();
        if (pk.kind === 'F') { P.hearts = clamp(P.hearts + 4, 0, P.maxHearts); toast('Fresh lampuki! (+2 hearts) A cat eats well in Marsaxlokk.'); }
        if (pk.kind === 'H') { P.hearts = clamp(P.hearts + 2, 0, P.maxHearts); toast('A warm heart. (+1)'); }
        if (pk.kind === 'M') { P.magic = clamp(P.magic + 35, 0, P.maxMagic); toast('A vial of moon-oil. (+35 magic)'); }
        updateHUD();
        return false;
      }
      return true;
    });

    updatePlates();

    if (interactQueued) { interactQueued = false; tryInteract(); }

    // ---- context hint
    contextHint(pcx, pcy);

    // ---- particles
    G.particles = G.particles.filter(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.t -= dt; return p.t > 0; });
    // ambient fireflies (night) / golden dawn-motes around Xemx (after victory)
    if (G.won) {
      if (G.particles.length < 26 && Math.random() < 0.35) {
        G.particles.push({ x: P.x + P.w / 2 + (Math.random() - 0.5) * 22, y: P.y + (Math.random() - 0.5) * 16, vx: (Math.random() - 0.5) * 10, vy: -8 - Math.random() * 12, t: 0.6 + Math.random() * 0.5, c: '#ffd76a' });
      }
    } else if (G.particles.length < 12 && Math.random() < 0.05) {
      G.particles.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * 14, vy: (Math.random() - 0.5) * 10, t: 4 + Math.random() * 3, c: '#cfe8a0', fly: true });
    }

    // ---- screen transitions (border tiles stop movement ~1px from the
    // edge, so trigger inside a 4px band; entry points are inset 8px)
    if (P.x < 4) tryTransition(-1, 0);
    else if (P.x + P.w > W - 4) tryTransition(1, 0);
    else if (P.y < 4) tryTransition(0, -1);
    else if (P.y + P.h > H - 4) tryTransition(0, 1);

    // toast decay
    if (G.toastT > 0) { G.toastT -= dt; if (G.toastT <= 0) { G.toast = ''; } }

    // magic drains/regenerates continuously — keep the bar live
    $('magicfill').style.width = (P.magic / P.maxMagic * 100) + '%';
  }

  function tryTransition(dx, dy) {
    const pos = gridPosOf(G.screenId);
    if (!pos) return;
    const nr = pos.r + dy, nc = pos.c + dx;
    if (nr < 0 || nc < 0 || nr >= D.WORLD.rows || nc >= D.WORLD.cols) { P.x = clamp(P.x, 0, W - P.w); P.y = clamp(P.y, 0, H - P.h); return; }
    const nid = D.WORLD.grid[nr][nc];
    if (!nid) { P.x = clamp(P.x, 0, W - P.w); P.y = clamp(P.y, 0, H - P.h); return; }
    const entry = {
      x: dx === -1 ? W - P.w - 8 : dx === 1 ? 8 : P.x,
      y: dy === -1 ? H - P.h - 8 : dy === 1 ? 8 : P.y
    };
    loadScreen(nid, entry);
  }

  // On touch devices, translate keyboard-key hints into the on-screen
  // button glyphs the player actually sees (🏮 ◐ 💬 ✚ ⚔ 🛡 / Map / Satchel).
  const TOUCH_REPL = [
    [/\bPress L, and Q\b/g, 'Tap 🏮, then ◐'],
    [/\bPress Space\b/g, 'Tap ⚔'],
    [/\bHold Shift\b/g, 'Hold 🛡'],
    [/\bPress M\b/g, 'Tap the Map button'],
    [/\bpress Q\b/g, 'tap ◐'],
    [/\bpress R\b/g, 'tap ✚'],
    [/\bpress E\b/g, 'tap 💬'],
    [/\bthen E\b/g, 'then 💬'],
    [/\bSpace\b/g, 'the ⚔ button'],
    [/\bShift\b/g, 'the 🛡 button'],
    [/\(L\)/g, '(🏮)'],
    [/\(Q\)/g, '(◐)'],
    [/\(E\)/g, '(💬)'],
    [/\(R\)/g, '(✚)'],
    [/\(M\)/g, '(Map)'],
    [/\(I\)/g, '(Satchel)'],
    [/(^|[^A-Za-z])E — /g, '$1💬 — ']
  ];
  function mobilize(t) {
    if (!t || !document.body.classList.contains('touch')) return t || '';
    let s = t;
    for (let i = 0; i < TOUCH_REPL.length; i++) s = s.replace(TOUCH_REPL[i][0], TOUCH_REPL[i][1]);
    return s;
  }
  function setHint(t) { $('hint').textContent = mobilize(t); }

  function contextHint(pcx, pcy) {
    if (G.toast) { setHint(G.toast); return; }
    let msg = '';
    // teach the Reveal art: a hidden path or temple glyph is nearby and the
    // lantern is not yet revealing it (the #1 thing testers got stuck on)
    if (!(P.lanternOn && P.mode === 'reveal')) {
      const tx = Math.floor(pcx / TILE), ty = Math.floor(pcy / TILE);
      let secret = false;
      for (let yy = ty - 2; yy <= ty + 2 && !secret; yy++)
        for (let xx = tx - 2; xx <= tx + 2 && !secret; xx++) {
          const ch = tileAt(xx, yy);
          if (ch === 'h' && !persistOf(G.screenId).revealed.includes(yy * COLS + xx)) secret = true;
          else if (ch === 'G') secret = true;
        }
      if (secret) msg = 'Something hides nearby — light the lantern (L) and cycle it to Reveal (Q).';
    }
    for (const n of G.npcs) if (dist(pcx, pcy, n.x, n.y) < 34) msg = 'E — talk to ' + (D.DIALOGUE[n.id] || {}).name;
    for (const c of G.chests) if (!c.open && dist(pcx, pcy, c.x * TILE + 16, c.y * TILE + 16) < 36) msg = 'E — open the chest';
    if (G.beaconTile && !F.beacons[G.beaconTile.id] && dist(pcx, pcy, G.beaconTile.x * TILE + 16, G.beaconTile.y * TILE + 16) < 44) {
      if (G.beaconTile.id === 'harbour' && !F.bossDown && G.enemies.some(e => e.kind === 'wraith' && e.hp > 0))
        msg = 'The Siege Wraith bars the watch-light — strike it down! (it is open to harm after a missed charge)';
      else msg = (P.lanternOn && P.mode === 'empower') ? 'E — give fire to the beacon' : 'The beacon is cold — lantern on (L), Empower (Q), then E';
    }
    setHint(msg);
  }

  function toast(t) { G.toast = t; G.toastT = 3.2; setHint(t); }
  function burst(x, y, c, n) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, s = 30 + Math.random() * 60;
      G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, t: 0.4 + Math.random() * 0.4, c });
    }
  }

  /* ============================== RENDER ============================= */
  const REGION = {
    north: { floor: '#5c7a48', floor2: '#557244', sand: '#d9bd85', wall: '#b5a784', detail: '#6e8a56' },
    west: { floor: '#c9a96a', floor2: '#c1a162', sand: '#dec48c', wall: '#b5a784', detail: '#b0905a' },
    center: { floor: '#5e8050', floor2: '#567848', sand: '#d9bd85', wall: '#b5a784', detail: '#6e9058' },
    harbour: { floor: '#8a8472', floor2: '#827c6a', sand: '#d2b888', wall: '#cabb96', detail: '#979078' },
    south: { floor: '#a08a58', floor2: '#988252', sand: '#dec48c', wall: '#bcab82', detail: '#ab9560' },
    se: { floor: '#9a8a62', floor2: '#92825a', sand: '#e0c894', wall: '#bcab82', detail: '#a6955f' },
    under: { floor: '#4a4038', floor2: '#443a32', sand: '#5a5046', wall: '#2e2620', detail: '#564a3e' }
  };

  function drawTile(x, y, ch, pal) {
    const px = x * TILE, py = y * TILE;
    const rnd = hash(x, y);
    switch (ch) {
      case '.': {
        ctx.fillStyle = (x + y) % 2 ? pal.floor : pal.floor2;
        ctx.fillRect(px, py, TILE, TILE);
        if (rnd > 0.82) { ctx.fillStyle = pal.detail; ctx.fillRect(px + 6 + rnd * 14 | 0, py + 8 + rnd * 10 | 0, 3, 2); ctx.fillRect(px + 18 - rnd * 8 | 0, py + 20, 2, 3); }
        break;
      }
      case ',': {
        ctx.fillStyle = pal.sand; ctx.fillRect(px, py, TILE, TILE);
        if (rnd > 0.6) { ctx.fillStyle = 'rgba(120,95,50,.35)'; ctx.fillRect(px + rnd * 24 | 0, py + (rnd * 53 % 1) * 24 | 0, 2, 2); }
        break;
      }
      case '~': {
        ctx.fillStyle = '#1d3a55'; ctx.fillRect(px, py, TILE, TILE);
        const ph = Math.sin(G.time * 1.6 + x * 0.9 + y * 1.7);
        ctx.fillStyle = 'rgba(80,140,180,.5)';
        if (ph > 0.3) ctx.fillRect(px + 4, py + 10 + (ph * 4 | 0), 12, 2);
        if (ph < -0.4) ctx.fillRect(px + 16, py + 22, 10, 2);
        break;
      }
      case '#': {
        ctx.fillStyle = pal.wall; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = 'rgba(0,0,0,.22)';
        ctx.fillRect(px, py + 15, TILE, 2); ctx.fillRect(px + (y % 2 ? 10 : 20), py, 2, 15); ctx.fillRect(px + (y % 2 ? 22 : 8), py + 17, 2, 15);
        ctx.fillStyle = 'rgba(255,255,255,.10)'; ctx.fillRect(px, py, TILE, 2);
        break;
      }
      case 'T': {
        ctx.fillStyle = pal.floor; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#8d8268'; ctx.fillRect(px + 2, py + 2, 28, 28);
        ctx.fillStyle = '#a99c7e'; ctx.fillRect(px + 4, py + 4, 24, 10);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(px + 4, py + 24, 24, 4);
        break;
      }
      case 't': {
        ctx.fillStyle = (x + y) % 2 ? pal.floor : pal.floor2; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#5e3c1a'; ctx.fillRect(px + 13, py + 18, 6, 12);
        ctx.fillStyle = '#3c5c34'; ctx.beginPath(); ctx.arc(px + 16, py + 12, 11, 0, 7); ctx.fill();
        ctx.fillStyle = '#4a7040'; ctx.beginPath(); ctx.arc(px + 12, py + 9, 6, 0, 7); ctx.fill();
        break;
      }
      case '%': case 'h': {
        const revealed = ch === 'h' && persistOf(G.screenId).revealed.includes(y * COLS + x);
        if (revealed) {
          ctx.fillStyle = pal.floor2; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = 'rgba(127,217,232,.28)'; ctx.fillRect(px + 2, py + 2, 28, 28);
          ctx.fillStyle = 'rgba(127,217,232,.5)'; ctx.fillRect(px + 13, py + 13, 6, 6);
        } else {
          ctx.fillStyle = '#2e4a2a'; ctx.fillRect(px, py, TILE, TILE);
          ctx.fillStyle = '#3c5c34';
          ctx.fillRect(px + 2 + rnd * 6, py + 3, 10, 10); ctx.fillRect(px + 16, py + 12 + rnd * 6, 12, 11);
          ctx.fillStyle = '#243c20'; ctx.fillRect(px + 6, py + 18, 11, 10);
          if (ch === 'h' && P.lanternOn && P.mode === 'reveal') { ctx.fillStyle = 'rgba(127,217,232,.18)'; ctx.fillRect(px, py, TILE, TILE); }
        }
        break;
      }
      case '=': {
        ctx.fillStyle = '#c4b58e'; ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = 'rgba(90,75,45,.45)'; ctx.lineWidth = 1;
        ctx.strokeRect(px + 0.5, py + 0.5, TILE - 1, TILE - 1);
        ctx.strokeRect(px + 0.5, py + 0.5, TILE / 2, TILE / 2);
        break;
      }
      case '-': {
        drawTile(x, y, '~', pal);
        ctx.fillStyle = '#8a5a2c'; ctx.fillRect(px, py + 4, TILE, 24);
        ctx.fillStyle = 'rgba(0,0,0,.25)'; for (let i = 0; i < 4; i++) ctx.fillRect(px + i * 8 + 6, py + 4, 1, 24);
        break;
      }
      case 'n': {
        ctx.fillStyle = pal.floor; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#d8c9a3'; ctx.fillRect(px + 1, py + 6, 30, 26);
        ctx.fillStyle = '#b5a077'; ctx.fillRect(px + 1, py + 2, 30, 5);
        ctx.fillStyle = '#7c3b2a'; ctx.fillRect(px + 12, py + 18, 8, 14);   // famous painted door
        ctx.fillStyle = '#3e5a76'; ctx.fillRect(px + 4, py + 10, 6, 6); ctx.fillRect(px + 22, py + 10, 6, 6);
        break;
      }
      case '+': {
        ctx.fillStyle = pal.floor; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#cabb96'; ctx.fillRect(px + 1, py + 4, 30, 28);
        ctx.fillStyle = '#b0a07a'; ctx.fillRect(px + 1, py + 4, 30, 4);
        ctx.fillStyle = '#8a6a1f'; ctx.fillRect(px + 14, py + 8, 4, 12); ctx.fillRect(px + 10, py + 12, 12, 4);
        break;
      }
      case 'G': {
        ctx.fillStyle = (x + y) % 2 ? pal.floor : pal.floor2; ctx.fillRect(px, py, TILE, TILE);
        if (P.lanternOn && P.mode === 'reveal') {
          ctx.fillStyle = 'rgba(127,217,232,.85)';
          const gi = G.glyphs.findIndex(g => g.x === x && g.y === y);
          let label = '?';
          if (G.meta.plateOrder && gi >= 0) label = ['I', 'II', 'III'][G.meta.plateOrder.indexOf(gi)] || '?';
          ctx.font = 'bold 16px serif'; ctx.textAlign = 'center';
          ctx.fillText(label, px + 16, py + 22);
          ctx.strokeStyle = 'rgba(127,217,232,.5)'; ctx.strokeRect(px + 3.5, py + 3.5, 25, 25);
        }
        break;
      }
      case 'P': {
        ctx.fillStyle = (x + y) % 2 ? pal.floor : pal.floor2; ctx.fillRect(px, py, TILE, TILE);
        const plate = G.plates.find(p => p.x === x && p.y === y);
        ctx.fillStyle = plate && plate.latched ? '#ffd76a' : '#8d8268';
        ctx.fillRect(px + 6, py + 6, 20, 20);
        ctx.fillStyle = plate && plate.latched ? '#c89a2e' : '#6e6253';
        ctx.fillRect(px + 9, py + 9, 14, 14);
        break;
      }
      case 'D': {
        ctx.fillStyle = pal.wall; ctx.fillRect(px, py, TILE, TILE);
        ctx.fillStyle = '#5e3c1a'; ctx.fillRect(px + 3, py + 3, 26, 29);
        ctx.fillStyle = '#8a5a2c'; ctx.fillRect(px + 5, py + 5, 10, 27); ctx.fillRect(px + 17, py + 5, 10, 27);
        ctx.fillStyle = '#3a2a14'; ctx.fillRect(px + 14, py + 16, 4, 6);
        break;
      }
      case 'B': {
        ctx.fillStyle = (G.screenId === 'mdina') ? '#c4b58e' : ((x + y) % 2 ? pal.floor : pal.floor2);
        ctx.fillRect(px, py, TILE, TILE);
        ctx.drawImage(SPR.beaconLit[Math.floor(G.time * 5) % 2], px, py, TILE, TILE);
        break;
      }
      case 'b': {
        ctx.fillStyle = (x + y) % 2 ? pal.floor : pal.floor2; ctx.fillRect(px, py, TILE, TILE);
        const lit = G.beaconTile && F.beacons[G.beaconTile.id];
        const fr = Math.floor(G.time * 5) % 2;
        ctx.drawImage(lit ? SPR.beaconLit[fr] : SPR.beaconDark[fr], px - 4, py - 8, 40, 40);
        break;
      }
      default: {
        ctx.fillStyle = (x + y) % 2 ? pal.floor : pal.floor2; ctx.fillRect(px, py, TILE, TILE);
      }
    }
  }

  function render() {
    const pal = REGION[G.meta ? G.meta.region : 'center'] || REGION.center;
    ctx.clearRect(0, 0, W, H);
    if (!G.tiles) return;

    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) drawTile(x, y, G.tiles[y][x], pal);

    // chests
    G.chests.forEach(c => ctx.drawImage(c.open ? SPR.chestOpen : SPR.chestClosed, c.x * TILE, c.y * TILE, TILE, TILE));

    // pickups (bob)
    G.pickups.forEach(pk => {
      const bob = Math.sin(G.time * 4 + pk.idx) * 2;
      const ic = pk.kind === 'F' ? SPR.icons.fish : pk.kind === 'H' ? SPR.icons.heart : SPR.icons.vial;
      ctx.drawImage(ic, pk.x - 10, pk.y - 10 + bob, 20, 20);
    });

    // npcs
    G.npcs.forEach(n => {
      const spr = SPR[n.spr] || SPR.fisher;
      ctx.drawImage(spr, n.x - 14, n.y - 22, 28, 28);
      // a soft prompt glimmer
      if (!F.met[n.id]) { ctx.fillStyle = 'rgba(232,195,114,' + (0.5 + 0.4 * Math.sin(G.time * 3)) + ')'; ctx.fillRect(n.x - 2, n.y - 30, 4, 4); }
    });

    // enemies
    G.enemies.forEach(en => {
      if (en.hp <= 0) return;
      const arr = en.kind === 'shade' ? SPR.shade : SPR.sentinel;
      ctx.globalAlpha = en.hurtT > 0 ? 0.5 : (en.kind === 'shade' ? (en.swift ? 0.8 : 0.88) : 1);
      let s = en.kind === 'shade' ? (en.swift ? 22 : 28) : en.kind === 'wraith' ? 56 : 34;
      let ox = 0;
      if (en.kind === 'wraith') {
        if (en.state === 'tell') ox = Math.sin(G.time * 42) * 2.5;          // telegraph shake
        if (en.state === 'stagger') ctx.globalAlpha = 0.55 + Math.sin(G.time * 10) * 0.15;
        // dark aura
        const ag = ctx.createRadialGradient(en.x, en.y, 4, en.x, en.y, 46);
        ag.addColorStop(0, 'rgba(76,53,133,.4)'); ag.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = ag; ctx.fillRect(en.x - 46, en.y - 46, 92, 92);
      }
      ctx.drawImage(arr[en.frame], en.x - s / 2 + ox, en.y - s / 2 - 4, s, s);
      ctx.globalAlpha = 1;
    });

    // projectiles
    ctx.fillStyle = '#9b8d6d';
    G.projectiles.forEach(pr => ctx.fillRect(pr.x - 2, pr.y - 2, 4, 4));

    // player
    drawPlayer();

    // attack arc
    if (P.attackT > 0 && !D.ITEMS[P.weapon].ranged) {
      const v = dirVec(P.dir);
      const cx0 = P.x + P.w / 2 + v.x * 16, cy0 = P.y + P.h / 2 - 4 + v.y * 16;
      ctx.strokeStyle = 'rgba(246,231,196,' + (P.attackT / 0.16) + ')';
      ctx.lineWidth = 3;
      ctx.beginPath();
      const base = Math.atan2(v.y, v.x);
      ctx.arc(P.x + P.w / 2, P.y + P.h / 2 - 4, 20, base - 0.8, base + 0.8);
      ctx.stroke();
      ctx.fillStyle = 'rgba(246,231,196,.25)';
      ctx.beginPath(); ctx.arc(cx0, cy0, 8, 0, 7); ctx.fill();
    }

    // shield raised
    if (P.shielding && P.shield) {
      const v = dirVec(P.dir);
      ctx.drawImage(SPR.icons.buckler, P.x + P.w / 2 + v.x * 12 - 8, P.y + P.h / 2 - 10 + v.y * 12, 16, 16);
    }

    // particles
    G.particles.forEach(p => {
      ctx.globalAlpha = clamp(p.t, 0, 1) * (p.fly ? 0.7 : 1);
      ctx.fillStyle = p.c;
      const s = p.fly ? 2 : 3;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
      ctx.globalAlpha = 1;
    });

    renderDarkness();

    // boss health bar
    const boss = G.enemies.find(e => e.kind === 'wraith' && e.hp > 0);
    if (boss) {
      const bw = 320, bx = (W - bw) / 2, by = 64;
      ctx.fillStyle = 'rgba(7,8,16,.75)'; ctx.fillRect(bx - 8, by - 22, bw + 16, 40);
      ctx.fillStyle = '#bfae8a'; ctx.font = 'italic 13px serif'; ctx.textAlign = 'center';
      ctx.fillText('THE SIEGE WRAITH — drowned commander of the night', W / 2, by - 7);
      ctx.fillStyle = '#241a3e'; ctx.fillRect(bx, by, bw, 10);
      ctx.fillStyle = boss.state === 'stagger' ? '#ffd76a' : '#7f6ae8';
      ctx.fillRect(bx, by, bw * (boss.hp / boss.maxHp), 10);
      ctx.strokeStyle = '#a98c4b'; ctx.strokeRect(bx - 0.5, by - 0.5, bw + 1, 11);
    }
  }

  function drawPlayer() {
    const fr = P.moving ? P.frame : 0;
    const spr = SPR.cat[P.dir][fr];
    if (P.invulnT > 0 && Math.floor(G.time * 12) % 2) ctx.globalAlpha = 0.45;
    // small shadow
    ctx.fillStyle = 'rgba(0,0,0,.3)';
    ctx.beginPath(); ctx.ellipse(P.x + P.w / 2, P.y + P.h, 9, 3.4, 0, 0, 7); ctx.fill();
    ctx.drawImage(spr, P.x + P.w / 2 - 16, P.y + P.h - 28, 32, 32);
    ctx.globalAlpha = 1;
  }

  function renderDarkness() {
    const lit = Object.values(F.beacons).filter(Boolean).length;
    let alpha = G.won ? 0 : [0.84, 0.76, 0.68][lit] !== undefined ? [0.84, 0.76, 0.68][lit] : 0;
    if (G.meta && G.meta.dark) alpha = Math.min(0.95, alpha + G.meta.dark);
    if (alpha <= 0.01) {
      // golden daylight wash after victory
      ctx.fillStyle = 'rgba(255,210,120,.10)'; ctx.fillRect(0, 0, W, H);
      return;
    }
    lctx.clearRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'source-over';
    lctx.fillStyle = 'rgba(8,10,28,' + alpha + ')';
    lctx.fillRect(0, 0, W, H);
    lctx.globalCompositeOperation = 'destination-out';

    const cut = (x, y, r, strength) => {
      const g = lctx.createRadialGradient(x, y, 2, x, y, r);
      g.addColorStop(0, 'rgba(0,0,0,' + (strength || 1) + ')');
      g.addColorStop(0.6, 'rgba(0,0,0,' + ((strength || 1) * 0.55) + ')');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      lctx.fillStyle = g;
      lctx.beginPath(); lctx.arc(x, y, r, 0, 7); lctx.fill();
    };

    const pcx = P.x + P.w / 2, pcy = P.y + P.h / 2 - 6;
    const flick = 1 + Math.sin(G.time * 9) * 0.04;
    if (P.lanternOn) cut(pcx, pcy, MODES[P.mode].radius * flick, 1);
    else cut(pcx, pcy, 58, 0.85); // a cat sees in the dark

    // braziers, lit beacon
    for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
      if (G.tiles[y][x] === 'B') cut(x * TILE + 16, y * TILE + 12, 70 * flick, 0.9);
    }
    if (G.beaconTile && F.beacons[G.beaconTile.id]) cut(G.beaconTile.x * TILE + 16, G.beaconTile.y * TILE + 4, 150 * flick, 1);
    G.particles.forEach(p => { if (p.fly) cut(p.x, p.y, 10, 0.5); });

    ctx.drawImage(lightCv, 0, 0);

    // coloured glow of the lantern mode
    if (P.lanternOn) {
      const g2 = ctx.createRadialGradient(pcx, pcy, 4, pcx, pcy, MODES[P.mode].radius * 0.8);
      g2.addColorStop(0, MODES[P.mode].color + '44');
      g2.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }
  }

  /* ================================ HUD ============================== */
  function buildLives() {
    const el = $('lives'); el.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const c = document.createElement('canvas');
      c.width = 16; c.height = 16;
      c.getContext('2d').drawImage(SPR.catFace, 0, 0);
      el.appendChild(c);
    }
  }
  function updateHUD() {
    // lives
    [...$('lives').children].forEach((c, i) => c.classList.toggle('lost', i >= P.lives));
    // hearts
    const he = $('hearts'); he.innerHTML = '';
    for (let i = 0; i < P.maxHearts / 2; i++) {
      const v = P.hearts - i * 2;
      const s = document.createElement('span');
      s.className = 'h' + (v >= 2 ? '' : v === 1 ? ' half' : ' empty');
      s.textContent = '♥';
      he.appendChild(s);
    }
    // magic
    $('magicfill').style.width = (P.magic / P.maxMagic * 100) + '%';
    // slots
    const draw = (slot, icon) => {
      const c = $(slot).querySelector('canvas'), cc = c.getContext('2d');
      cc.clearRect(0, 0, 16, 16);
      if (icon) cc.drawImage(icon, 0, 0);
    };
    draw('slotWeapon', SPR.icons[D.ITEMS[P.weapon].icon]);
    draw('slotShield', P.shield ? SPR.icons[D.ITEMS[P.shield].icon] : null);
    draw('slotLantern', SPR.icons.lantern);
    $('slotLantern').classList.toggle('lit', P.lanternOn);
    $('slotLantern').style.borderColor = P.lanternOn ? MODES[P.mode].color : '';
    $('slotLantern').title = 'Lantern — ' + MODES[P.mode].label + (P.lanternOn ? ' (lit)' : ' (out)');
    // persistent lantern-mode read-out (always visible, not just a toast)
    const lm = $('lantmode');
    if (lm) {
      if (P.lanternOn) { lm.textContent = MODES[P.mode].label; lm.style.color = MODES[P.mode].color; }
      else { lm.textContent = 'Lantern off'; lm.style.color = '#8d815f'; }
    }
    // beacons
    $('beaconctr').textContent = '☀ ' + Object.values(F.beacons).filter(Boolean).length + ' / 3';
  }

  /* ============================= MAP MODAL =========================== */
  function drawMap() {
    const mc = $('mapCanvas'), m = mc.getContext('2d');
    m.clearRect(0, 0, mc.width, mc.height);
    // parchment
    m.fillStyle = '#e4d4ae'; m.fillRect(0, 0, mc.width, mc.height);
    for (let i = 0; i < 260; i++) { m.fillStyle = 'rgba(120,90,30,' + (hash(i, 7) * 0.05) + ')'; m.fillRect(hash(i, 1) * mc.width, hash(i, 2) * mc.height, 3, 3); }
    // sea hatching around the island
    m.strokeStyle = 'rgba(90,120,150,.35)'; m.lineWidth = 1;
    for (let i = 0; i < 16; i++) { m.beginPath(); m.moveTo(10, 20 + i * 26); m.lineTo(36 + (i % 3) * 8, 24 + i * 26); m.stroke(); m.beginPath(); m.moveTo(mc.width - 40, 14 + i * 27); m.lineTo(mc.width - 12, 18 + i * 27); m.stroke(); }
    // island
    m.beginPath();
    D.MAP_OUTLINE.forEach((p, i) => i ? m.lineTo(p[0], p[1]) : m.moveTo(p[0], p[1]));
    m.closePath();
    m.fillStyle = '#d8c294'; m.fill();
    m.strokeStyle = '#6e5526'; m.lineWidth = 2.5; m.stroke();
    // title
    m.fillStyle = '#5b4317'; m.font = 'italic 19px serif'; m.textAlign = 'left';
    m.fillText('MELITA — the Island of Malta', 18, 30);
    m.font = '11px serif';
    m.fillText('as surveyed for the Order, anno 1565', 18, 46);

    // zones
    m.textAlign = 'center';
    Object.entries(D.MAP_POS).forEach(([id, p]) => {
      const known = F.explored.includes(id);
      if (!known) return;
      const sc = D.SCREENS[id];
      // beacon screens get a flame mark
      const binfo = Object.entries(D.BEACON_INFO).find(([, b]) => b.screen === id);
      if (binfo) {
        const lit = F.beacons[binfo[0]];
        m.fillStyle = lit ? '#c8801a' : '#6e5526';
        m.beginPath(); m.arc(p[0], p[1], 5, 0, 7); m.fill();
        if (lit) { m.fillStyle = '#e8a52e'; m.beginPath(); m.moveTo(p[0], p[1] - 11); m.lineTo(p[0] + 4, p[1] - 3); m.lineTo(p[0] - 4, p[1] - 3); m.closePath(); m.fill(); }
      } else {
        m.fillStyle = '#6e5526'; m.beginPath(); m.arc(p[0], p[1], 3, 0, 7); m.fill();
      }
      m.fillStyle = '#4a3a1a'; m.font = 'bold 10px serif';
      m.fillText(sc.name.split(',')[0].split('&')[0].trim(), p[0], p[1] + 16);
    });

    // player
    const pp = D.MAP_POS[G.screenId];
    if (pp) {
      m.drawImage(SPR.catFace, pp[0] - 9, pp[1] - 22, 18, 18);
      m.strokeStyle = '#a32638'; m.lineWidth = 1.5;
      m.beginPath(); m.arc(pp[0], pp[1], 8 + Math.sin(Date.now() / 300) * 1.5, 0, 7); m.stroke();
    }
    // legend
    m.textAlign = 'left'; m.fillStyle = '#5b4317'; m.font = '11px serif';
    m.fillText('● zone   ▲ beacon (gold = relit)   ' + F.explored.length + ' of 15 zones charted', 18, mc.height - 14);
  }

  /* ========================== INVENTORY MODAL ======================== */
  function drawInventory() {
    const grid = $('invGrid'); grid.innerHTML = '';
    P.inventory.forEach(id => {
      const it = D.ITEMS[id]; if (!it) return;
      const div = document.createElement('div');
      div.className = 'invItem' + ((id === P.weapon || id === P.shield) ? ' equipped' : '');
      const c = document.createElement('canvas'); c.width = 16; c.height = 16;
      c.getContext('2d').drawImage(SPR.icons[it.icon], 0, 0);
      const nm = document.createElement('div'); nm.className = 'nm'; nm.textContent = it.name;
      const era = document.createElement('div'); era.className = 'era'; era.textContent = it.era;
      div.appendChild(c); div.appendChild(nm); div.appendChild(era);
      div.onclick = () => {
        $('invDesc').innerHTML = '<b>' + it.name + '</b> (' + it.era + ') — ' + it.desc;
        if (it.type === 'weapon') { P.weapon = id; drawInventory(); updateHUD(); }
        if (it.type === 'shield') { P.shield = id; drawInventory(); updateHUD(); }
      };
      grid.appendChild(div);
    });
    // codex tally
    $('invDesc').innerHTML = 'Codex entries recovered: <b>' + F.codex.length + ' / ' + Object.keys(D.CODEX).length +
      '</b>. Click a weapon or shield to equip it. Beacons relit: <b>' + Object.values(F.beacons).filter(Boolean).length + ' / 3</b>.';
  }

  /* ============================ MODAL MGMT =========================== */
  // single source of truth: the game is paused whenever ANY blocking
  // overlay is visible (review finding: Escape/M/I over a story scroll
  // used to unpause the world underneath and shades mauled the reader)
  const PANELS = ['dialog', 'story', 'codex', 'mapModal', 'invModal', 'end', 'title'];
  function syncPause() { G.paused = PANELS.some(id => !$(id).classList.contains('hidden')); }
  // panels that carry callbacks/decisions close ONLY via their own buttons
  function panelLocked() {
    return ['story', 'codex', 'end'].some(id => !$(id).classList.contains('hidden'));
  }

  function toggleModal(id) {
    if (!G.started || G.over || panelLocked() || !$('dialog').classList.contains('hidden')) return;
    const el = $(id);
    const open = !el.classList.contains('hidden');
    closeModals();
    if (!open) {
      if (id === 'mapModal') drawMap();
      if (id === 'invModal') drawInventory();
      el.classList.remove('hidden');
    }
    syncPause();
  }
  function closeModals() {
    ['mapModal', 'invModal'].forEach(id => $(id).classList.add('hidden'));
    syncPause();
  }

  function showCodex(title, body) {
    $('codexTitle').textContent = title;
    $('codexBody').innerHTML = mobilize(body);
    $('codex').classList.remove('hidden');
    syncPause();
  }

  // Hall of Records — a re-readable gallery of every history the player has
  // recovered, reachable from the title screen once any codex is collected
  // (a small completion reward; testers asked for "mini unlockable things").
  function collectedCodexIds() {
    const ids = new Set(F.codex || []);
    const s = loadGame();
    if (s && s.flags && Array.isArray(s.flags.codex)) s.flags.codex.forEach(id => ids.add(id));
    return [...ids].filter(id => D.CODEX[id]);
  }
  function openHall() {
    const ids = collectedCodexIds();
    const total = Object.keys(D.CODEX).length;
    let html = '<p style="color:#7a6230;margin-bottom:.8rem">' + ids.length + ' of ' + total + ' histories recovered.</p>';
    if (!ids.length) {
      html += '<p>No histories yet. Open the chests scattered across the islands to recover them.</p>';
    } else {
      ids.forEach(id => {
        const c = D.CODEX[id];
        html += '<h3 style="color:#5b4317;margin:.9rem 0 .15rem">' + c.title + '</h3>' +
                '<p style="margin-bottom:.5rem">' + c.body + '</p>';
      });
    }
    $('hallBody').innerHTML = html;
    $('hall').classList.remove('hidden');
  }
  function closeHall() { $('hall').classList.add('hidden'); }
  let storyCallback = null;
  function showStoryThen(key, cb) {
    const s = D.STORY[key]; if (!s) { if (cb) cb(); return; }
    F.storySeen[key] = true;
    $('storyTitle').textContent = s.title;
    $('storyBody').innerHTML = s.body;
    $('story').classList.remove('hidden');
    storyCallback = cb || null;
    syncPause();
  }
  function showEnd(title, sub, body) {
    $('endTitle').textContent = title;
    $('endSub').textContent = sub;
    $('endBody').innerHTML = body;
    $('dawnBtn').classList.add('hidden'); // shown only on the victory path
    $('end').classList.remove('hidden');
    $('hud').classList.add('hidden');
    syncPause();
  }

  /* ============================ SAVE / LOAD ========================== */
  function saveGame() {
    if (!G.started) return;
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify({
        v: 1,
        player: {
          x: P.x, y: P.y, dir: P.dir, hearts: P.hearts, maxHearts: P.maxHearts,
          magic: P.magic, maxMagic: P.maxMagic, lives: P.lives,
          inventory: P.inventory, weapon: P.weapon, shield: P.shield, mode: P.mode
        },
        screenId: G.screenId,
        flags: F
      }));
    } catch (e) { /* private mode etc. */ }
  }
  function loadGame() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) { return null; }
  }

  function applySave(s) {
    Object.assign(P, {
      x: s.player.x, y: s.player.y, dir: s.player.dir || 'down',
      hearts: s.player.hearts, maxHearts: s.player.maxHearts,
      magic: s.player.magic, maxMagic: s.player.maxMagic, lives: s.player.lives,
      inventory: s.player.inventory, weapon: s.player.weapon, shield: s.player.shield,
      mode: s.player.mode || 'reveal', lanternOn: false
    });
    Object.assign(F, s.flags);
    G.started = true; G.over = false; G.won = Object.values(F.beacons).filter(Boolean).length >= 3;
    loadScreen(s.screenId, { x: s.player.x, y: s.player.y });
  }

  /* ============================== FLOW =============================== */
  function newGame() {
    localStorage.removeItem(SAVE_KEY);
    Object.assign(P, {
      hearts: 6, maxHearts: 6, magic: 100, maxMagic: 100, lives: 9,
      lanternOn: false, mode: 'reveal', inventory: ['claws', 'lantern', 'map'],
      weapon: 'claws', shield: null, invulnT: 0, attackCd: 0, attackT: 0, dir: 'down'
    });
    Object.assign(F, {
      beacons: { temple: false, harbour: false, north: false },
      explored: [], persist: {}, met: {}, blessed: false, bossDown: false, codex: [], storySeen: {}
    });
    G.started = true; G.over = false; G.won = false;
    loadScreen(D.WORLD.start, null);
    showStoryThen('intro', () => { sfx.meow(); toast('Talk to Toni on the quay — press E. The Map and Satchel buttons are in the top bar.'); });
    $('hud').classList.remove('hidden');
    buildLives(); updateHUD();
  }

  function continueGame(s) {
    applySave(s);
    $('hud').classList.remove('hidden');
    buildLives(); updateHUD();
    G.paused = false;
    toast('The lantern stirs. Welcome back, Xemx.');
  }

  // buttons — starting anew over an existing save asks for a second click
  let eraseArmed = false, eraseTimer = null;
  $('startBtn').onclick = () => {
    audioInit();
    if (loadGame() && !eraseArmed) {
      eraseArmed = true;
      $('startBtn').textContent = 'Erase saved Nightwatch — click again';
      clearTimeout(eraseTimer);
      eraseTimer = setTimeout(() => { eraseArmed = false; $('startBtn').textContent = 'New Nightwatch'; }, 5000);
      return;
    }
    clearTimeout(eraseTimer);
    eraseArmed = false; $('startBtn').textContent = 'New Nightwatch';
    $('title').classList.add('hidden'); newGame();
  };
  $('continueBtn').onclick = () => { audioInit(); const s = loadGame(); if (s) { $('title').classList.add('hidden'); continueGame(s); } };
  $('storyBtn').onclick = () => { $('story').classList.add('hidden'); syncPause(); const cb = storyCallback; storyCallback = null; if (cb) cb(); };
  $('codexBtn').onclick = () => { $('codex').classList.add('hidden'); syncPause(); };
  $('hallBtn').onclick = () => { audioInit(); openHall(); };
  $('hallX').onclick = () => closeHall();
  $('hallClose').onclick = () => closeHall();
  $('hall').addEventListener('click', e => { if (e.target === $('hall')) closeHall(); });
  $('mapBtn').onclick = () => toggleModal('mapModal');
  $('invBtn').onclick = () => toggleModal('invModal');
  $('mapClose').onclick = () => closeModals();
  $('invClose').onclick = () => closeModals();
  $('mapX').onclick = () => closeModals();
  $('invX').onclick = () => closeModals();
  // tapping the dark backdrop (outside the parchment) also closes — the
  // close control was hard to find on mobile, so give several ways out
  ['mapModal', 'invModal'].forEach(id => {
    $(id).addEventListener('click', e => { if (e.target === $(id)) closeModals(); });
  });

  // on touch, the HUD "· M" / "· I" key suffixes mean nothing — drop them
  const IS_TOUCH = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    'ontouchstart' in window || /[?&]touch=1/.test(location.search);
  if (IS_TOUCH) {
    $('mapBtn').textContent = 'Map';
    $('invBtn').textContent = 'Satchel';
  }
  $('endBtn').onclick = () => {
    $('end').classList.add('hidden');
    $('title').classList.remove('hidden');
    G.started = false; G.over = false;
    const s = loadGame();
    $('continueBtn').classList.toggle('hidden', !s);
    $('completeBadge').classList.toggle('hidden', !(s && s.flags && s.flags.completed));
    $('hallBtn').classList.toggle('hidden', !(s && s.flags && Array.isArray(s.flags.codex) && s.flags.codex.length));
  };
  // "Walk in the Dawn" — return to the now-sunlit island for a free-roam
  // epilogue; the islanders have victory words and the dawn is yours to wander
  $('dawnBtn').onclick = () => {
    $('end').classList.add('hidden');
    $('hud').classList.remove('hidden');
    G.over = false; G.won = true; G.enemies = [];
    syncPause();
    toast('Walk in the dawn, Xemx — seek out the islanders. (Saved.)');
    saveGame();
  };

  // ---- viewport fit: mobile 100vh includes the area hidden under the
  // browser URL bar, which clipped the HUD top and hint bottom. Track the
  // REAL visible height and let CSS size the game from --appH instead.
  function fitViewport() {
    const h = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
    document.documentElement.style.setProperty('--appH', h + 'px');
  }
  window.addEventListener('resize', fitViewport);
  if (window.visualViewport) window.visualViewport.addEventListener('resize', fitViewport);
  window.addEventListener('orientationchange', () => setTimeout(fitViewport, 250));
  fitViewport();

  // fullscreen (Android hides the URL bar entirely; iPhone Safari has no
  // Fullscreen API — there, "Add to Home Screen" gives the chromeless view)
  const fsBtn = $('fsBtn');
  if (fsBtn) {
    if (!document.documentElement.requestFullscreen) fsBtn.style.display = 'none';
    else fsBtn.onclick = () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen().catch(() => {});
      setTimeout(fitViewport, 300);
    };
  }

  // ---- PWA: service worker + install prompt ("downloadable app")
  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
  }
  let installPrompt = null;
  window.addEventListener('beforeinstallprompt', e => {
    e.preventDefault();
    installPrompt = e;
    const b = $('installBtn');
    if (b) b.style.display = 'flex';
  });
  window.addEventListener('appinstalled', () => { const b = $('installBtn'); if (b) b.style.display = 'none'; });
  if ($('installBtn')) $('installBtn').onclick = () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    installPrompt.userChoice.finally(() => { installPrompt = null; $('installBtn').style.display = 'none'; });
  };

  // audio mixer
  $('volMusic').value = AUDIO.music;
  $('volSfx').value = AUDIO.sfx;
  $('muteChk').checked = AUDIO.muted;
  $('audioBtn').onclick = () => { audioInit(); $('audioPanel').classList.toggle('hidden'); };
  $('volMusic').addEventListener('input', e => { AUDIO.music = +e.target.value; applyAudio(); });
  $('volSfx').addEventListener('input', e => { AUDIO.sfx = +e.target.value; applyAudio(); sfx.pickup(); });
  $('muteChk').addEventListener('change', e => { AUDIO.muted = e.target.checked; applyAudio(); });
  // give arrow keys back to the cat once a slider has been set
  ['volMusic', 'volSfx'].forEach(id => $(id).addEventListener('change', e => e.target.blur()));
  // keystrokes inside the mixer belong to the mixer, not the game
  $('audioCtl').addEventListener('keydown', e => e.stopPropagation());

  // title: show continue if a save exists
  (function bootTitle() {
    const s = loadGame();
    if (s) $('continueBtn').classList.remove('hidden');
    if (s && s.flags && s.flags.completed) $('completeBadge').classList.remove('hidden');
    if (s && s.flags && Array.isArray(s.flags.codex) && s.flags.codex.length) $('hallBtn').classList.remove('hidden');
  })();

  /* ============================== LOOP =============================== */
  function currentMood() {
    if (!G.started || G.over) return 'title';
    if (G.won) return 'day';
    if (G.enemies.some(e => e.kind === 'wraith' && e.hp > 0)) return 'boss';
    if (G.screenId === 'mdina') return 'mdina';
    if (G.meta && G.meta.region === 'under') return 'under';
    return 'overworld';
  }

  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (AU.ctx && window.MUSIC) MUSIC.setMood(currentMood());
    if (G.started) { update(dt); render(); }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // debug/test handle (used by automated checks; harmless in production).
  // step(n) pumps n fixed 60Hz update ticks — rAF suspends in hidden tabs,
  // so headless checks drive the simulation directly.
  window.NW = {
    G, P, F, loadScreen, checkClearRule, updateHUD, persistOf, lightBeacon, openChest,
    step: n => { for (let i = 0; i < (n || 1); i++) update(1 / 60); }
  };

  // data sanity check at boot (visible in console)
  (function validate() {
    let bad = 0;
    Object.values(D.SCREENS).forEach(sc => {
      if (sc.rows.length !== ROWS) { console.error('[nightwatch] ' + sc.id + ': ' + sc.rows.length + ' rows'); bad++; }
      sc.rows.forEach((r, i) => { if (r.length !== COLS) { console.error('[nightwatch] ' + sc.id + ' row ' + i + ': len ' + r.length); bad++; } });
    });
    console.log('[nightwatch] map validation: ' + (bad ? bad + ' problems' : 'all ' + Object.keys(D.SCREENS).length + ' screens OK'));
  })();
})();
