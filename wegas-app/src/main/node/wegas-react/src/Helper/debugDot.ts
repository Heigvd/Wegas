export function debugDot(id: string, x: number, y: number, color: string) {
  let bip = document.getElementById(id);
  if (bip == null) {
    bip = document.createElement('div');
    bip.id = id;
    document.body.appendChild(bip);
  }
  bip.style.setProperty('position', 'fixed');
  bip.style.setProperty('background-color', color);
  bip.style.setProperty('width', '20px');
  bip.style.setProperty('height', '20px');
  bip.style.setProperty('z-index', '10000');
  bip.style.setProperty('left', x - 10 + 'px');
  bip.style.setProperty('top', y - 10 + 'px');
}
