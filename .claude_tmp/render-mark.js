// Renders the current shared geometry (teslaMark.ts) exactly as the components
// draw it, so the result can be inspected as a PNG.
const fs = require('fs');
const path = require('path');
const sharp = require(path.join(__dirname, '..', 'node_modules', 'sharp'));

const src = fs
  .readFileSync(path.join(__dirname, '..', 'src', 'components', 'logo', 'teslaMark.ts'), 'utf8')
  .replace(': Record<string, string>', '')
  .replace(/export const /g, 'const ');
const { MARK, VECTOR_FONT, TESLA_BLUE, TESLA_GOLD } = new Function(
  src + '\nreturn { MARK, VECTOR_FONT, TESLA_BLUE, TESLA_GOLD };'
)();

function subtitle(text, translate, scale) {
  let x = 0;
  const glyphs = [];
  for (const ch of text.toUpperCase()) {
    if (ch === ' ') { x += 3.5; continue; }
    const d = VECTOR_FONT[ch];
    const gx = x;
    x += 5.2;
    if (d) glyphs.push(`<path d="${d}" transform="translate(${gx},0)"/>`);
  }
  return `<g transform="${translate} scale(${scale})" stroke="${TESLA_BLUE}" fill="none" stroke-width="0.6" stroke-linecap="round" stroke-linejoin="round">${glyphs.join('')}</g>`;
}

const w = MARK.wordmark;
const wordmark = ['T_1','T_2','E_1','E_2','E_3','S','L_1','L_2','A_1','A_2']
  .map((k) => `<path d="${w[k]}"/>`).join('');

// Mirrors HeroAnimatedLogo's static structure (no animation layers).
const hero = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="690" viewBox="0 0 200 230">
  <rect width="200" height="230" fill="#0b1220"/>
  <g stroke="${TESLA_BLUE}" stroke-width="6.5" stroke-linecap="round" fill="none">
    <path d="${MARK.bulbOutline}"/>
    <path d="${MARK.highlightArc}" stroke-width="4.5" opacity="0.9" stroke="#55C8FF"/>
    <path d="${MARK.neckLeft}"/>
    <path d="${MARK.neckRight}"/>
    <path d="${MARK.base}" stroke-width="5.5" stroke-linejoin="round"/>
    <path d="${MARK.screws[0]}" stroke-width="5"/>
    <path d="${MARK.screws[1]}" stroke-width="5"/>
    <path d="${MARK.screws[2]}" stroke-width="5"/>
  </g>
  <rect x="${MARK.filament.x}" y="${MARK.filament.y}" width="${MARK.filament.width}" height="${MARK.filament.height}" rx="${MARK.filament.rx}" fill="${TESLA_GOLD}"/>
  <path d="${MARK.tower}" fill="${TESLA_GOLD}"/>
  <g>
    <circle cx="${MARK.hub.cx}" cy="${MARK.hub.cy}" r="${MARK.hub.r}" fill="${TESLA_GOLD}"/>
    <path d="${MARK.blade}" fill="${TESLA_GOLD}"/>
    <path d="${MARK.blade}" fill="${TESLA_GOLD}" transform="rotate(120 ${MARK.hub.cx} ${MARK.hub.cy})"/>
    <path d="${MARK.blade}" fill="${TESLA_GOLD}" transform="rotate(240 ${MARK.hub.cx} ${MARK.hub.cy})"/>
    <circle cx="${MARK.hub.cx}" cy="${MARK.hub.cy}" r="3.5" fill="#ffffff"/>
  </g>
  <g transform="translate(19, 172)">
    <g fill="#f3f4f6">${wordmark}</g>
    ${subtitle('NATIONAL INSTITUTE OF TECHNOLOGY PATNA', 'translate(-14, 40)', 0.98)}
  </g>
</svg>`;

// Mirrors Logo.tsx's MarkIcon crop.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="480" height="480" viewBox="20 4 160 160">
  <rect x="20" y="4" width="160" height="160" fill="#0b1220"/>
  <g stroke="${TESLA_BLUE}" stroke-width="7" stroke-linecap="round" fill="none">
    <path d="${MARK.bulbOutline}"/>
    <path d="${MARK.highlightArc}" stroke-width="5" opacity="0.85"/>
    <path d="${MARK.neckLeft}"/>
    <path d="${MARK.neckRight}"/>
    <path d="${MARK.base}" stroke-width="6" stroke-linejoin="round"/>
    <path d="${MARK.screws[0]}" stroke-width="5.5"/>
    <path d="${MARK.screws[1]}" stroke-width="5.5"/>
    <path d="${MARK.screws[2]}" stroke-width="5.5"/>
  </g>
  <rect x="${MARK.filament.x}" y="${MARK.filament.y}" width="${MARK.filament.width}" height="${MARK.filament.height}" rx="${MARK.filament.rx}" fill="${TESLA_GOLD}"/>
  <path d="${MARK.tower}" fill="${TESLA_GOLD}"/>
  <g>
    <circle cx="${MARK.hub.cx}" cy="${MARK.hub.cy}" r="${MARK.hub.r}" fill="${TESLA_GOLD}"/>
    <path d="${MARK.blade}" fill="${TESLA_GOLD}"/>
    <path d="${MARK.blade}" fill="${TESLA_GOLD}" transform="rotate(120 ${MARK.hub.cx} ${MARK.hub.cy})"/>
    <path d="${MARK.blade}" fill="${TESLA_GOLD}" transform="rotate(240 ${MARK.hub.cx} ${MARK.hub.cy})"/>
    <circle cx="${MARK.hub.cx}" cy="${MARK.hub.cy}" r="3.5" fill="#ffffff"/>
  </g>
</svg>`;

(async () => {
  await sharp(Buffer.from(hero)).png().toFile(path.join(__dirname, 'final-hero.png'));
  await sharp(Buffer.from(icon)).png().toFile(path.join(__dirname, 'final-icon.png'));
  console.log('done');
})();
