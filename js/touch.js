/* =====================================================================
   Nightwatch of the Islands — touch.js
   Mobile controls: floating virtual joystick (left thumb) + action
   buttons (right thumb). Everything is translated into synthetic
   KeyboardEvents, so the whole existing input pipeline is reused.
   Enabled on coarse-pointer devices, or force with ?touch=1.
   ===================================================================== */
(function () {
  'use strict';

  const wantTouch =
    (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) ||
    'ontouchstart' in window ||
    /[?&]touch=1/.test(location.search);
  if (!wantTouch) return;

  document.body.classList.add('touch');

  const press = k => window.dispatchEvent(new KeyboardEvent('keydown', { key: k }));
  const release = k => window.dispatchEvent(new KeyboardEvent('keyup', { key: k }));
  const tap = k => { press(k); setTimeout(() => release(k), 40); };

  /* ------------------------- build the overlay ----------------------- */
  const ui = document.createElement('div');
  ui.id = 'touchUI';
  ui.innerHTML =
    '<div id="joyZone"><div id="joyBase"><div id="joyKnob"></div></div></div>' +
    '<div id="tbtns">' +
    '  <div class="trow">' +
    '    <button class="tbtn small" data-tap="l" title="Lantern">&#127982;</button>' +   // 🏮
    '    <button class="tbtn small" data-tap="q" title="Lantern mode">&#9681;</button>' + // ◐
    '    <button class="tbtn small" data-tap="r" title="Blessing">&#10010;</button>' +    // ✚
    '  </div>' +
    '  <div class="trow">' +
    '    <button class="tbtn" data-hold="shift" title="Shield (hold)">&#128737;</button>' + // 🛡
    '    <button class="tbtn" data-tap="e" title="Talk / open">&#128172;</button>' +        // 💬
    '  </div>' +
    '  <div class="trow">' +
    '    <button class="tbtn big" data-tap=" " title="Attack">&#9876;</button>' +           // ⚔
    '  </div>' +
    '</div>' +
    '<div id="rotateHint">&#8635; Rotate your device — the islands are wider than they are tall</div>';
  document.getElementById('wrap').appendChild(ui);

  /* ----------------------------- buttons ----------------------------- */
  ui.querySelectorAll('.tbtn').forEach(btn => {
    const tapKey = btn.dataset.tap, holdKey = btn.dataset.hold;
    btn.addEventListener('pointerdown', e => {
      e.preventDefault(); e.stopPropagation();
      btn.classList.add('on');
      if (holdKey) press(holdKey);
      if (tapKey) tap(tapKey);
    });
    const off = e => {
      btn.classList.remove('on');
      if (holdKey) release(holdKey);
    };
    btn.addEventListener('pointerup', off);
    btn.addEventListener('pointercancel', off);
    btn.addEventListener('pointerleave', off);
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });

  /* ---------------------- floating joystick -------------------------- */
  const zone = ui.querySelector('#joyZone');
  const base = ui.querySelector('#joyBase');
  const knob = ui.querySelector('#joyKnob');
  const DIRS = { left: 'arrowleft', right: 'arrowright', up: 'arrowup', down: 'arrowdown' };
  let joyId = null, cx = 0, cy = 0;
  const held = new Set();

  function setDirs(want) {
    for (const d of held) if (!want.has(d)) { release(DIRS[d]); held.delete(d); }
    for (const d of want) if (!held.has(d)) { press(DIRS[d]); held.add(d); }
  }

  zone.addEventListener('pointerdown', e => {
    if (joyId !== null) return;
    e.preventDefault();
    joyId = e.pointerId;
    cx = e.clientX; cy = e.clientY;
    try { zone.setPointerCapture(joyId); } catch (err) { /* synthetic pointers can't be captured */ }
    base.style.display = 'block';
    base.style.left = (cx - zone.getBoundingClientRect().left) + 'px';
    base.style.top = (cy - zone.getBoundingClientRect().top) + 'px';
    knob.style.transform = 'translate(-50%,-50%)';
  });
  zone.addEventListener('pointermove', e => {
    if (e.pointerId !== joyId) return;
    e.preventDefault();
    let dx = e.clientX - cx, dy = e.clientY - cy;
    const mag = Math.hypot(dx, dy);
    const lim = 46;
    if (mag > lim) { dx = dx / mag * lim; dy = dy / mag * lim; }
    knob.style.transform = 'translate(calc(-50% + ' + dx + 'px), calc(-50% + ' + dy + 'px))';
    const want = new Set();
    if (mag > 12) {
      const nx = dx / (mag > lim ? lim : mag) * (mag > lim ? 1 : mag / lim);
      // 8-way: a component counts when it carries enough of the vector
      const c = Math.cos(Math.atan2(dy, dx)), s = Math.sin(Math.atan2(dy, dx));
      if (c > 0.4) want.add('right');
      if (c < -0.4) want.add('left');
      if (s > 0.4) want.add('down');
      if (s < -0.4) want.add('up');
    }
    setDirs(want);
  });
  const joyEnd = e => {
    if (e.pointerId !== joyId) return;
    joyId = null;
    base.style.display = 'none';
    setDirs(new Set());
  };
  zone.addEventListener('pointerup', joyEnd);
  zone.addEventListener('pointercancel', joyEnd);

  // safety: anything that steals focus releases everything
  window.addEventListener('blur', () => { setDirs(new Set()); });
})();
