// Keyboard and mouse state, with mouse positions mapped into the game's 1280x720 view.

export const VIEW_W = 1280;
export const VIEW_H = 720;

export function createInput(canvas, view) {
  const down = new Set();
  const pressed = new Set();
  const mouse = { x: VIEW_W / 2, y: VIEW_H / 2, down: false, clicked: false, rightClicked: false };

  const keyName = (e) => (e.key.length === 1 ? e.key.toLowerCase() : e.key);

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (!down.has(k)) pressed.add(k);
    down.add(k);
    if ([' ', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Tab'].includes(e.key)) e.preventDefault();
  });
  window.addEventListener('keyup', (e) => down.delete(keyName(e)));
  window.addEventListener('blur', () => down.clear());

  const toView = (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = (e.clientX - r.left - view.offX) / view.scale;
    mouse.y = (e.clientY - r.top - view.offY) / view.scale;
  };
  canvas.addEventListener('mousemove', toView);
  canvas.addEventListener('mousedown', (e) => {
    toView(e);
    if (e.button === 2) mouse.rightClicked = true;
    else { mouse.down = true; mouse.clicked = true; }
  });
  window.addEventListener('mouseup', () => { mouse.down = false; });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return {
    mouse,
    isDown: (k) => down.has(k),
    wasPressed: (k) => pressed.has(k),
    anyPressed: (...keys) => keys.some((k) => pressed.has(k)),
    /** Synthetic presses, used by staged scenes and tests. */
    press: (k) => pressed.add(k),
    hold: (k, on) => (on ? down.add(k) : down.delete(k)),
    endFrame() {
      pressed.clear();
      mouse.clicked = false;
      mouse.rightClicked = false;
    },
  };
}
