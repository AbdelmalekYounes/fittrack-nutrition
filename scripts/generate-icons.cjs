// Génère les icônes PWA (PNG) de FitTrack Nutrition par manipulation directe de pixels,
// sans dépendance externe (uniquement zlib, intégré à Node) — encodeur PNG minimal RGBA.
// À relancer manuellement si la charte graphique change : `node scripts/generate-icons.cjs`.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PRIMARY = [37, 99, 235]; // var(--color-primary)
const SECONDARY = [22, 163, 74]; // var(--color-secondary)
const WHITE = [255, 255, 255];

function lerp(a, b, t) {
  return Math.round(a + (b - a) * t);
}

function inRoundedRect(px, py, x, y, w, h, r) {
  if (px < x - r || px > x + w + r || py < y - r || py > y + h + r) return false;
  const cx = Math.min(Math.max(px, x), x + w);
  const cy = Math.min(Math.max(py, y), y + h);
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
}

/** Dessine le pictogramme "haltère" (symbole sport) en blanc sur fond dégradé bleu->vert. */
function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const barH = size * 0.12;
  const barY = size * 0.5 - barH / 2;
  const barX = size * 0.28;
  const barW = size * 0.44;
  const weightW = size * 0.14;
  const weightH = size * 0.5;
  const weightY = size * 0.5 - weightH / 2;
  const leftWeightX = size * 0.14;
  const rightWeightX = size * 0.72;
  const radius = size * 0.04;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const t = (x + y) / (2 * size);
      let r = lerp(PRIMARY[0], SECONDARY[0], t);
      let g = lerp(PRIMARY[1], SECONDARY[1], t);
      let b = lerp(PRIMARY[2], SECONDARY[2], t);

      const onBar = inRoundedRect(x, y, barX, barY, barW, barH, radius);
      const onLeftWeight = inRoundedRect(x, y, leftWeightX, weightY, weightW, weightH, radius);
      const onRightWeight = inRoundedRect(x, y, rightWeightX, weightY, weightW, weightH, radius);

      if (onBar || onLeftWeight || onRightWeight) {
        [r, g, b] = WHITE;
      }

      const idx = (y * size + x) * 4;
      pixels[idx] = r;
      pixels[idx + 1] = g;
      pixels[idx + 2] = b;
      pixels[idx + 3] = 255;
    }
  }
  return pixels;
}

// --- Encodeur PNG minimal (RGBA 8 bits, sans filtre, un seul IDAT) ---
const CRC_TABLE = (() => {
  const table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function encodePng(pixels, size) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  // Chaque scanline est préfixée d'un octet de filtre (0 = aucun filtre).
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0;
    pixels.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const idatData = zlib.deflateSync(raw);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idatData),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function generate(size, outPath) {
  const pixels = drawIcon(size);
  const png = encodePng(pixels, size);
  fs.writeFileSync(outPath, png);
  console.log('Généré:', outPath, `(${size}x${size}, ${png.length} octets)`);
}

const outDir = path.join(__dirname, '..', 'public', 'icons');
fs.mkdirSync(outDir, { recursive: true });
generate(192, path.join(outDir, 'icon-192.png'));
generate(512, path.join(outDir, 'icon-512.png'));
generate(180, path.join(outDir, 'apple-touch-icon.png'));
