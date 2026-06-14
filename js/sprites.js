/* =====================================================================
   Nightwatch of the Islands — sprites.js
   Procedural 16x16 pixel-art sprites, ALTTP-flavoured.
   Each sprite is drawn once onto an offscreen canvas via px() helpers.
   ===================================================================== */
(function () {
  'use strict';

  const S = 16; // base sprite size in pixels

  // ---- shared palette -------------------------------------------------
  const C = {
    outline: '#241409',
    // Xemx the ginger cat
    fur: '#e8923a', furD: '#c06a20', furL: '#f3b264', cream: '#f6e7c4',
    pink: '#e89c9c', eye: '#aef2c8', pupil: '#10301c',
    collar: '#b03030', gold: '#ffd76a', goldD: '#c89a2e',
    // elder cat
    grey: '#9a9aa6', greyD: '#6e6e7c', white: '#f0ede4',
    // people
    steel: '#b9c2cc', steelD: '#7d8893', tabard: '#a32638', cross: '#f2efe6',
    skin: '#e6b88a', blue: '#3e6e9e', blueD: '#2a4d70', cap: '#27374a',
    robe: '#cdb486', robeD: '#a78d5c', shadowface: '#3a2c18',
    // nightborne
    void1: '#241a3e', void2: '#37265e', void3: '#4c3585', wisp: '#7fd9e8',
    // items / wood
    wood: '#8a5a2c', woodD: '#5e3c1a', flint: '#8d927e', flintD: '#62665a'
  };

  // ---- canvas helpers --------------------------------------------------
  function makeSprite(drawFn, w, h) {
    w = w || S; h = h || S;
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    const px = (x, y, col, wd, ht) => { ctx.fillStyle = col; ctx.fillRect(x, y, wd || 1, ht || 1); };
    // mirrored pixel: draws at x and (w-1-x)
    const pxm = (x, y, col, wd, ht) => { px(x, y, col, wd, ht); px(w - x - (wd || 1), y, col, wd, ht); };
    drawFn(px, pxm, ctx, w, h);
    return cv;
  }
  function flipX(src) {
    const cv = document.createElement('canvas');
    cv.width = src.width; cv.height = src.height;
    const ctx = cv.getContext('2d');
    ctx.translate(src.width, 0); ctx.scale(-1, 1); ctx.drawImage(src, 0, 0);
    return cv;
  }

  // ======================================================================
  // XEMX THE CAT
  // ======================================================================
  function catBodyCommon(px, pxm, legShift) {
    // body (rows 9-13), ginger with darker stripes
    px(4, 9, C.outline, 8, 1);
    px(3, 10, C.outline, 1, 3); px(12, 10, C.outline, 1, 3);
    px(4, 10, C.fur, 8, 3);
    px(4, 11, C.furD, 8, 1);            // stripe
    // legs
    const ls = legShift ? 1 : 0;
    px(4 + ls, 13, C.outline, 2, 2); px(10 - ls, 13, C.outline, 2, 2);
    px(4 + ls, 13, C.furD, 2, 1); px(10 - ls, 13, C.furD, 2, 1);
  }

  function catDown(frame) {
    return makeSprite((px, pxm) => {
      // ears
      pxm(2, 0, C.outline, 2, 1); pxm(2, 1, C.outline, 1, 2);
      pxm(3, 1, C.fur); pxm(3, 2, C.pink);
      pxm(4, 1, C.outline, 1, 1);
      // head outline rows 2-8, span cols 2..13
      px(3, 2, C.outline, 2, 1); px(11, 2, C.outline, 2, 1);
      px(5, 3, C.outline, 6, 1);              // brow join
      px(2, 3, C.outline, 1, 5); px(13, 3, C.outline, 1, 5);
      px(3, 3, C.fur, 2, 1); px(11, 3, C.fur, 2, 1);
      px(3, 4, C.fur, 10, 4);                 // face fill
      px(3, 4, C.furD, 1, 1); px(12, 4, C.furD, 1, 1); // temple stripes
      px(6, 4, C.furD, 1, 1); px(9, 4, C.furD, 1, 1);  // forehead stripes
      // eyes (glowing green — a night-cat)
      px(4, 5, C.eye, 2, 2); px(10, 5, C.eye, 2, 2);
      px(5, 6, C.pupil, 1, 1); px(10, 6, C.pupil, 1, 1);
      // muzzle + nose
      px(6, 6, C.cream, 4, 2);
      px(7, 6, C.pink, 2, 1);
      px(7, 8, C.outline, 2, 1);
      // cheeks/whisker pixels
      px(1, 5, C.white, 1, 1); px(14, 5, C.white, 1, 1);
      px(3, 8, C.outline, 10, 1);
      catBodyCommon(px, pxm, frame);
      // red collar with the Guardian's Lantern
      px(5, 9, C.collar, 6, 1);
      px(7, 9, C.gold, 2, 2); px(7, 10, C.goldD, 2, 1);
      // tail curling out to the right
      px(13, 10 + (frame ? 1 : 0), C.furD, 2, 1); px(14, 9 + (frame ? 1 : 0), C.fur, 1, 2);
    });
  }

  function catUp(frame) {
    return makeSprite((px, pxm) => {
      pxm(2, 0, C.outline, 2, 1); pxm(2, 1, C.outline, 1, 2);
      pxm(3, 1, C.fur);
      px(3, 2, C.outline, 10, 1);
      px(2, 3, C.outline, 1, 5); px(13, 3, C.outline, 1, 5);
      px(3, 3, C.fur, 10, 5);                 // back of head
      px(5, 4, C.furD, 6, 1); px(6, 6, C.furD, 4, 1); // head stripes
      px(3, 8, C.outline, 10, 1);
      catBodyCommon(px, pxm, frame);
      px(5, 9, C.collar, 6, 1);
      // tail raised behind (visible from the back)
      px(7, 12, C.outline, 1, 1);
      px(7 + (frame ? 1 : 0), 10, C.fur, 1, 3); px(7 + (frame ? 1 : 0), 9, C.furD, 1, 1);
    });
  }

  function catSide(frame) { // faces RIGHT; flipX for left
    return makeSprite((px) => {
      // ear
      px(8, 0, C.outline, 2, 1); px(8, 1, C.fur, 1, 2); px(9, 1, C.outline, 1, 1);
      px(12, 1, C.outline, 1, 1); px(12, 0, C.outline, 1, 1);
      // head (right side), cols 7..14, rows 2..7
      px(7, 2, C.outline, 7, 1);
      px(6, 3, C.outline, 1, 4); px(14, 3, C.outline, 1, 3);
      px(7, 3, C.fur, 7, 4);
      px(8, 3, C.furD, 1, 1); px(11, 3, C.furD, 1, 1);
      px(11, 4, C.eye, 2, 2); px(12, 5, C.pupil, 1, 1);
      px(13, 6, C.cream, 1, 1); px(14, 6, C.pink, 1, 1);   // nose tip
      px(7, 7, C.outline, 7, 1);
      // body cols 2..11, rows 8..12
      px(2, 8, C.outline, 9, 1);
      px(1, 9, C.outline, 1, 3);
      px(2, 9, C.fur, 9, 3);
      px(3, 10, C.furD, 7, 1);
      px(11, 9, C.outline, 1, 3);
      // collar + lantern at the chest
      px(10, 8, C.collar, 1, 3);
      px(11, 10, C.gold, 2, 2); px(12, 11, C.goldD, 1, 1);
      // legs (alternate)
      const a = frame ? 1 : 0;
      px(3 + a, 12, C.outline, 2, 2); px(8 - a, 12, C.outline, 2, 2);
      px(3 + a, 12, C.furD, 2, 1); px(8 - a, 12, C.furD, 2, 1);
      // tail behind, swishes
      px(0, 6 + a, C.fur, 1, 3); px(1, 8, C.furD, 1, 1); px(0, 5 + a, C.outline, 1, 1);
    });
  }

  // small cat face for the lives HUD
  const catFace = makeSprite((px, pxm) => {
    pxm(2, 1, C.outline, 2, 1); pxm(2, 2, C.outline, 1, 2); pxm(3, 2, C.fur); pxm(3, 3, C.pink);
    px(4, 3, C.outline, 8, 1);
    px(2, 4, C.outline, 1, 8); px(13, 4, C.outline, 1, 8);
    px(3, 4, C.fur, 10, 8);
    px(4, 6, C.eye, 2, 2); px(10, 6, C.eye, 2, 2);
    px(5, 7, C.pupil, 1, 1); px(10, 7, C.pupil, 1, 1);
    px(6, 8, C.cream, 4, 3); px(7, 8, C.pink, 2, 1);
    px(3, 12, C.outline, 10, 1);
  });

  // ======================================================================
  // NPCs
  // ======================================================================
  // Elder cat of Mdina — grey, seated, eyes closed in wisdom
  const elderCat = makeSprite((px, pxm) => {
    pxm(3, 0, C.outline, 2, 1); pxm(3, 1, C.outline, 1, 2); pxm(4, 1, C.grey);
    px(4, 2, C.outline, 8, 1);
    px(3, 3, C.outline, 1, 4); px(12, 3, C.outline, 1, 4);
    px(4, 3, C.grey, 8, 4);
    px(5, 5, C.outline, 2, 1); px(9, 5, C.outline, 2, 1);  // closed eyes
    px(7, 6, C.pink, 2, 1);
    px(1, 5, C.white, 2, 1); px(13, 5, C.white, 2, 1);     // long whiskers
    px(4, 7, C.outline, 8, 1);
    // seated body, tail wrapped around the front
    px(4, 8, C.outline, 8, 1);
    px(3, 9, C.outline, 1, 5); px(12, 9, C.outline, 1, 5);
    px(4, 9, C.grey, 8, 5);
    px(5, 10, C.greyD, 6, 1);
    px(4, 14, C.outline, 8, 1);
    px(2, 13, C.greyD, 4, 1); px(1, 12, C.grey, 2, 1);     // wrapped tail
    // a faint gold sigil on the brow — mark of the Council of Nine
    px(7, 3, C.gold, 2, 1);
  });

  // Knight of the Order — steel helm, crimson tabard, white cross
  const knight = makeSprite((px, pxm) => {
    px(5, 0, C.outline, 6, 1);
    px(4, 1, C.outline, 1, 4); px(11, 1, C.outline, 1, 4);
    px(5, 1, C.steel, 6, 4);
    px(5, 2, C.steelD, 6, 1);                 // visor slit
    px(6, 2, C.outline, 1, 1); px(9, 2, C.outline, 1, 1); // eyes in shadow
    px(7, 0, C.tabard, 2, 1);                 // plume
    px(5, 5, C.outline, 6, 1);
    // tabard torso
    px(4, 6, C.outline, 1, 6); px(11, 6, C.outline, 1, 6);
    px(5, 6, C.tabard, 6, 6);
    px(7, 7, C.cross, 2, 3); px(6, 8, C.cross, 4, 1);      // white cross
    // pauldrons + arms
    px(3, 6, C.steel, 1, 3); px(12, 6, C.steel, 1, 3);
    px(3, 5, C.outline, 1, 1); px(12, 5, C.outline, 1, 1);
    // legs
    px(5, 12, C.outline, 2, 3); px(9, 12, C.outline, 2, 3);
    px(5, 12, C.steelD, 2, 2); px(9, 12, C.steelD, 2, 2);
  });

  // Fisherman of Marsaxlokk — flat cap, sea-blue smock
  const fisher = makeSprite((px) => {
    px(5, 0, C.cap, 6, 1); px(4, 1, C.cap, 8, 1);
    px(5, 2, C.skin, 6, 4);
    px(4, 2, C.outline, 1, 4); px(11, 2, C.outline, 1, 4);
    px(6, 3, C.outline, 1, 1); px(9, 3, C.outline, 1, 1);
    px(6, 5, C.white, 4, 1);                                // white beard
    px(5, 6, C.outline, 6, 1);
    px(4, 7, C.outline, 1, 5); px(11, 7, C.outline, 1, 5);
    px(5, 7, C.blue, 6, 5);
    px(5, 9, C.blueD, 6, 1);
    px(3, 7, C.skin, 1, 3); px(12, 7, C.skin, 1, 3);        // bare arms
    px(5, 12, C.outline, 2, 3); px(9, 12, C.outline, 2, 3);
    px(5, 12, C.woodD, 2, 2); px(9, 12, C.woodD, 2, 2);
  });

  // Temple Keeper — hooded ochre robe, face in shadow
  const keeper = makeSprite((px) => {
    px(5, 0, C.outline, 6, 1);
    px(4, 1, C.outline, 1, 5); px(11, 1, C.outline, 1, 5);
    px(5, 1, C.robe, 6, 1);
    px(5, 2, C.shadowface, 6, 3);                           // hood shadow
    px(6, 3, C.gold, 1, 1); px(9, 3, C.gold, 1, 1);         // gleaming eyes
    px(5, 5, C.robe, 6, 1);
    px(4, 6, C.outline, 1, 8); px(11, 6, C.outline, 1, 8);
    px(5, 6, C.robe, 6, 8);
    px(5, 8, C.robeD, 6, 1); px(5, 11, C.robeD, 6, 1);      // robe folds
    px(7, 6, C.gold, 2, 1);                                 // spiral pendant
    px(5, 14, C.outline, 6, 1);
  });

  // ======================================================================
  // NIGHTBORNE
  // ======================================================================
  function shade(frame) {
    return makeSprite((px, pxm) => {
      const f = frame ? 1 : 0;
      // wispy crown
      pxm(4, 0 + f, C.void2, 1, 1); px(7, 0, C.void2, 2, 1);
      px(4, 1, C.void2, 8, 1);
      px(3, 2, C.void2, 10, 2);
      px(2, 4, C.void1, 12, 6);
      px(3, 3, C.void3, 4, 1);                                // sheen
      // burning cyan eyes
      px(4, 5, C.wisp, 2, 2); px(10, 5, C.wisp, 2, 2);
      px(5, 6, '#0d2c33', 1, 1); px(11, 6, '#0d2c33', 1, 1);
      // ragged skirt, alternates with frame
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 2;
        px(x, 10, C.void1, 2, 2 + ((i + f) % 2));
      }
    });
  }
  function sentinel(frame) {
    return makeSprite((px, pxm) => {
      const f = frame ? 1 : 0;
      // rusted helm of a drowned knight
      px(5, 0, C.steelD, 6, 2); px(5, 1, '#4c4438', 6, 1);
      px(6, 1, C.wisp, 1, 1); px(9, 1, C.wisp, 1, 1);
      // shoulders
      px(2, 2, C.steelD, 3, 2); px(11, 2, C.steelD, 3, 2);
      // void body
      px(3, 2, C.void2, 10, 2);
      px(2, 4, C.void1, 12, 7);
      px(4, 4, C.void3, 3, 1);
      // a dark cross where the tabard once was
      px(7, 5, '#171022', 2, 3); px(6, 6, '#171022', 4, 1);
      for (let i = 0; i < 6; i++) {
        const x = 2 + i * 2;
        px(x, 11, C.void1, 2, 2 + ((i + f) % 2));
      }
    });
  }

  // ======================================================================
  // ITEM ICONS (16x16)
  // ======================================================================
  const icons = {};

  icons.claws = makeSprite((px) => {
    for (let i = 0; i < 3; i++) {
      const ox = 3 + i * 4;
      px(ox, 3, C.white, 1, 2); px(ox + 1, 5, C.white, 1, 3); px(ox + 2, 8, C.white, 1, 3);
      px(ox + 2, 11, C.cream, 1, 2);
    }
  });

  icons.flintKnife = makeSprite((px) => {
    // knapped flint blade
    px(8, 1, C.flint, 2, 1); px(7, 2, C.flint, 3, 2); px(6, 4, C.flint, 3, 3);
    px(8, 2, C.flintD, 1, 2); px(7, 5, C.flintD, 1, 2);
    px(9, 1, '#c9cdbb', 1, 3);                       // edge glint
    // sinew-bound grip
    px(5, 7, C.wood, 3, 2); px(4, 9, C.wood, 3, 2); px(3, 11, C.wood, 3, 2);
    px(5, 8, C.woodD, 2, 1); px(4, 10, C.woodD, 2, 1);
  });

  icons.sling = makeSprite((px) => {
    px(3, 2, C.wood, 1, 5); px(12, 2, C.wood, 1, 5);     // two cords
    px(4, 7, C.wood, 1, 2); px(11, 7, C.wood, 1, 2);
    px(5, 9, '#a3743c', 6, 3); px(6, 12, '#8a5f30', 4, 1); // leather pouch
    px(7, 10, C.flint, 2, 2);                             // the stone
  });

  icons.shortsword = makeSprite((px) => {
    px(7, 0, C.white, 2, 1);
    px(7, 1, C.steel, 2, 8); px(8, 1, '#e6ecf2', 1, 8);   // blade
    px(4, 9, C.gold, 8, 2);                               // crossguard
    px(7, 11, C.woodD, 2, 3);                             // grip
    px(7, 14, C.gold, 2, 2);                              // pommel
  });

  icons.buckler = makeSprite((px, pxm, ctx) => {
    ctx.fillStyle = C.steelD; ctx.beginPath(); ctx.arc(8, 8, 7, 0, 7); ctx.fill();
    ctx.fillStyle = C.tabard; ctx.beginPath(); ctx.arc(8, 8, 5.6, 0, 7); ctx.fill();
    // simplified eight-pointed cross
    px(7, 4, C.cross, 2, 8); px(4, 7, C.cross, 8, 2);
    px(8, 8, C.gold, 1, 1);                               // boss
  });

  icons.lantern = makeSprite((px) => {
    px(7, 0, C.goldD, 2, 1); px(6, 1, C.goldD, 4, 1);     // hanging ring
    px(5, 2, C.gold, 6, 1);
    px(4, 3, C.gold, 1, 8); px(11, 3, C.gold, 1, 8);
    px(5, 3, '#ffedb0', 6, 8);                            // warm glass
    px(7, 6, '#ff9d3a', 2, 3); px(7, 5, '#ffd76a', 2, 1); // flame
    px(5, 11, C.gold, 6, 1); px(6, 12, C.goldD, 4, 1);
  });

  icons.charm = makeSprite((px, pxm, ctx) => {
    // the carved spiral of the Hypogeum
    ctx.strokeStyle = C.robeD; ctx.lineWidth = 1.6;
    ctx.beginPath();
    for (let a = 0; a < 14; a += 0.2) {
      const r = 1 + a * 0.45, x = 8 + Math.cos(a) * r, y = 8 + Math.sin(a) * r;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    px(7, 7, '#9d8aff', 2, 2);                            // dreaming core
  });

  icons.map = makeSprite((px) => {
    px(2, 2, '#e9dcc0', 12, 12);
    px(2, 2, '#b59a5e', 12, 1); px(2, 13, '#b59a5e', 12, 1);
    px(2, 2, '#b59a5e', 1, 12); px(13, 2, '#b59a5e', 1, 12);
    // a tiny Malta
    px(5, 6, '#a3743c', 5, 3); px(8, 8, '#a3743c', 4, 3); px(4, 5, '#a3743c', 3, 2);
    px(10, 4, C.tabard, 1, 1);                            // you are here
  });

  icons.fish = makeSprite((px, pxm, ctx) => {
    ctx.fillStyle = '#7fa8c9'; ctx.beginPath(); ctx.ellipse(7, 8, 5, 3, 0, 0, 7); ctx.fill();
    px(12, 6, '#5d83a3', 3, 2); px(12, 8, '#5d83a3', 3, 2); // tail
    px(4, 7, C.outline, 1, 1);                              // eye
    px(5, 9, '#5d83a3', 5, 1);
  });

  icons.honey = makeSprite((px) => {
    px(5, 3, C.woodD, 6, 1);
    px(4, 4, '#e8a52e', 8, 8); px(5, 12, '#c9881c', 6, 1);
    px(5, 5, '#ffd76a', 3, 2);                             // glow
    px(3, 6, '#e8a52e', 1, 4); px(12, 6, '#e8a52e', 1, 4);
  });

  icons.codex = makeSprite((px) => {
    px(3, 2, '#6e3a1f', 10, 12);
    px(4, 3, '#e9dcc0', 8, 10);
    px(5, 5, '#7a6230', 6, 1); px(5, 7, '#7a6230', 6, 1); px(5, 9, '#7a6230', 4, 1);
    px(7, 12, C.gold, 2, 1);
  });

  icons.heart = makeSprite((px, pxm) => {
    pxm(3, 3, '#e84545', 4, 2); pxm(2, 5, '#e84545', 6, 2);
    px(2, 7, '#e84545', 12, 2); px(4, 9, '#e84545', 8, 2); px(6, 11, '#e84545', 4, 2); px(7, 13, '#e84545', 2, 1);
    pxm(4, 4, '#ff9d9d', 2, 1);
  });

  icons.vial = makeSprite((px) => {
    px(6, 1, C.woodD, 4, 2);
    px(5, 3, '#cfd8df', 6, 1);
    px(4, 4, '#cfd8df', 1, 9); px(11, 4, '#cfd8df', 1, 9);
    px(5, 4, '#5a48c8', 6, 9); px(5, 5, '#9d8aff', 3, 2);
    px(5, 13, '#cfd8df', 6, 1);
  });

  // ======================================================================
  // WORLD OBJECTS
  // ======================================================================
  const chestClosed = makeSprite((px) => {
    px(2, 4, C.outline, 12, 10);
    px(3, 5, C.wood, 10, 4); px(3, 9, C.woodD, 10, 4);
    px(3, 7, C.gold, 10, 1); px(7, 8, C.gold, 2, 3);     // band + lock
  });
  const chestOpen = makeSprite((px) => {
    px(2, 2, C.outline, 12, 4); px(3, 3, C.woodD, 10, 2); // open lid
    px(2, 8, C.outline, 12, 6);
    px(3, 9, '#120c06', 10, 4);
    px(3, 8, C.wood, 10, 1);
  });

  // beacon brazier — two flame frames
  function beacon(lit, frame) {
    return makeSprite((px, pxm, ctx) => {
      // stone pedestal
      px(4, 10, '#cab98e', 8, 4); px(3, 14, '#a8966c', 10, 2);
      px(4, 10, '#e2d4ae', 8, 1);
      px(5, 8, '#6e6253', 6, 2);                           // iron bowl
      if (lit) {
        const f = frame ? 1 : 0;
        px(6, 4 - f, '#ffd76a', 4, 2);
        px(5, 5, '#ff9d3a', 6, 3);
        px(6, 3 - f, '#fff3c4', 2, 1);
        px(7, 6, '#ff6a2a', 3, 2);
      } else {
        px(6, 6, '#2a2438', 4, 2);                          // cold void-smoke
        px(7, 4 + (frame ? 1 : 0), '#372a52', 2, 2);
      }
    });
  }

  const boulder = makeSprite((px, pxm, ctx) => {
    ctx.fillStyle = '#9b8d6d'; ctx.beginPath(); ctx.arc(8, 9, 6.5, 0, 7); ctx.fill();
    ctx.fillStyle = '#b5a784'; ctx.beginPath(); ctx.arc(6.5, 7, 3.5, 0, 7); ctx.fill();
    px(4, 11, '#7c7055', 8, 2); px(9, 6, '#7c7055', 2, 1);
  });

  // ======================================================================
  // EXPORT
  // ======================================================================
  window.SPRITES = {
    size: S,
    cat: {
      down: [catDown(0), catDown(1)],
      up: [catUp(0), catUp(1)],
      right: [catSide(0), catSide(1)],
      left: [flipX(catSide(0)), flipX(catSide(1))]
    },
    catFace,
    elderCat, knight, fisher, keeper,
    shade: [shade(0), shade(1)],
    sentinel: [sentinel(0), sentinel(1)],
    icons,
    chestClosed, chestOpen,
    beaconLit: [beacon(true, 0), beacon(true, 1)],
    beaconDark: [beacon(false, 0), beacon(false, 1)],
    boulder
  };
})();
