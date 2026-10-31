import { drawStickers, retainStickerImages } from './stickers.js';

const ATLASES = [
  { url: new URL('./assets/flower-atlas.png', import.meta.url).href, flowers: ['rose', 'lily', 'poppy', 'sunflower', 'daisy', 'violet'] },
  { url: new URL('./assets/flower-atlas-extra.png', import.meta.url).href, flowers: ['tulip', 'peony', 'hydrangea', 'orchid', 'lavender', 'babysbreath'] },
];
const MAIN_FLOWERS = ['rose', 'lily', 'poppy', 'sunflower', 'tulip', 'peony', 'hydrangea', 'orchid'];
const SUPPORT_FLOWERS = ['daisy', 'violet', 'greenery', 'lavender', 'babysbreath'];
const ART_WIDTH = 1000;
const ART_HEIGHT = 1250;
const SERIF = '"StudioSerif", Georgia, serif';
const SANS = '"StudioSans", Arial, sans-serif';
const HAND = '"StudioHand", cursive';

const PALETTES = {
  blush: { accent: '#a24e68', light: '#e8beca', ink: '#604149' },
  peach: { accent: '#bc7658', light: '#edc4ac', ink: '#6b4c40' },
  lavender: { accent: '#8c779e', light: '#d4c8df', ink: '#54465e' },
};

const WRAPS = {
  ivory: ['#fffaf0', '#e8ddc8', '#d7c7ac'],
  kraft: ['#d7bc93', '#b99770', '#9f7d58'],
  rose: ['#f4dce0', '#dcb9c1', '#c99ca7'],
};

let artworkPromise;
let sprites;

function context2d(canvas, options = {}) {
  let ctx;
  try {
    ctx = canvas.getContext('2d', { colorSpace: 'srgb', ...options });
  } catch {
    ctx = canvas.getContext('2d', options);
  }
  if (!ctx) throw new Error('Your browser could not open the bouquet canvas. Please try another browser.');
  return ctx;
}

function randomFrom(seed) {
  let value = (Number.isFinite(Number(seed)) ? Number(seed) : 17) >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let n = value;
    n = Math.imul(n ^ (n >>> 15), n | 1);
    n ^= n + Math.imul(n ^ (n >>> 7), n | 61);
    return ((n ^ (n >>> 14)) >>> 0) / 4294967296;
  };
}

function findSprites(image, flowers) {
  const sample = document.createElement('canvas');
  sample.width = image.naturalWidth;
  sample.height = image.naturalHeight;
  const ctx = context2d(sample, { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  const pixels = ctx.getImageData(0, 0, sample.width, sample.height).data;
  const result = {};
  flowers.forEach((type, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const left = Math.floor(column * sample.width / 3);
    const right = Math.floor((column + 1) * sample.width / 3);
    const top = Math.floor(row * sample.height / 2);
    const bottom = Math.floor((row + 1) * sample.height / 2);
    let minX = right;
    let minY = bottom;
    let maxX = left;
    let maxY = top;
    for (let y = top + 2; y < bottom - 2; y += 1) {
      for (let x = left + 2; x < right - 2; x += 1) {
        if (pixels[(y * sample.width + x) * 4 + 3] > 16) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }
    if (maxX <= minX || maxY <= minY) throw new Error(`The ${type} artwork is missing. Please reload to try again.`);
    minX = Math.max(left + 1, minX - 3);
    minY = Math.max(top + 1, minY - 3);
    maxX = Math.min(right - 1, maxX + 3);
    maxY = Math.min(bottom - 1, maxY + 3);
    result[type] = { image, x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  });
  sample.width = 0;
  sample.height = 0;
  return result;
}

/** Load and validate the local, transparent botanical artwork before rendering. */
export async function loadArtwork() {
  if (sprites) return;
  if (!artworkPromise) {
    artworkPromise = (async () => {
      const collections = await Promise.all(ATLASES.map(async (atlas) => {
        const image = new Image();
        image.decoding = 'async';
        await new Promise((resolve, reject) => {
          image.onload = resolve;
          image.onerror = () => reject(new Error('The flower artwork could not load. Check your connection and try again.'));
          image.src = atlas.url;
        });
        if (typeof image.decode === 'function') await image.decode();
        if (image.naturalWidth < 900 || image.naturalHeight < 600) {
          throw new Error('The flower artwork is too small for a clear download. Please reload to try again.');
        }
        return findSprites(image, atlas.flowers);
      }));
      sprites = Object.assign({}, ...collections);
    })().catch((error) => {
      artworkPromise = undefined;
      throw error;
    });
  }
  return artworkPromise;
}

function bloom(ctx, type, x, y, size, angle = 0, opacity = 1) {
  const source = sprites[type];
  if (!source) throw new Error(`The ${type} artwork is unavailable.`);
  const scale = size / Math.max(source.width, source.height);
  const width = source.width * scale;
  const height = source.height * scale;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.globalAlpha = opacity;
  ctx.drawImage(source.image, source.x, source.y, source.width, source.height, -width / 2, -height / 2, width, height);
  ctx.restore();
}

function leaf(ctx, x, y, length, width, angle, shade = 0) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  const gradient = ctx.createLinearGradient(-width * 0.5, 0, width * 0.5, -length);
  gradient.addColorStop(0, shade ? '#637d61' : '#778c6a');
  gradient.addColorStop(0.48, shade ? '#91a181' : '#a7b397');
  gradient.addColorStop(1, shade ? '#4b6953' : '#6f8765');
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-width * 0.75, -length * 0.25, -width * 0.5, -length * 0.7, width * 0.12, -length);
  ctx.bezierCurveTo(width * 0.65, -length * 0.62, width * 0.62, -length * 0.23, 0, 0);
  ctx.fill();
  ctx.strokeStyle = 'rgba(246,248,229,.3)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(-width * 0.08, -length * 0.44, width * 0.12, -length * 0.91);
  ctx.stroke();
  ctx.restore();
}

function stem(ctx, x, y, baseX, baseY, bend, width = 3) {
  const gradient = ctx.createLinearGradient(x, y, baseX, baseY);
  gradient.addColorStop(0, '#9ba57b');
  gradient.addColorStop(0.6, '#6f825e');
  gradient.addColorStop(1, '#61764f');
  ctx.lineCap = 'round';
  ctx.lineWidth = width;
  ctx.strokeStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(baseX, baseY);
  ctx.bezierCurveTo(baseX + bend, baseY - 130, x - bend * 0.35, y + 100, x, y);
  ctx.stroke();
}

function foliage(ctx, random, extra) {
  const branches = [
    [286, 397, -78], [257, 529, -100], [309, 633, -68],
    [700, 403, 91], [741, 532, 119], [694, 641, 76],
    [401, 311, -42], [586, 307, 55],
  ];
  if (extra) branches.push([230, 453, -115], [756, 452, 130], [352, 314, -62], [641, 315, 67]);
  branches.forEach(([targetX, targetY, bend], index) => {
    const x = targetX + (random() - 0.5) * 20;
    const y = targetY + (random() - 0.5) * 24;
    stem(ctx, x, y, 505 + (random() - 0.5) * 22, 816, bend, 2.3);
    for (let part = 0; part < 5; part += 1) {
      const t = 0.14 + part * 0.15;
      const leafX = x + (505 - x) * t;
      const leafY = y + (804 - y) * t;
      const leftSide = (part + index) % 2 === 0;
      leaf(ctx, leafX, leafY, 53 + random() * 32, 18 + random() * 14, (leftSide ? -1 : 1) * (0.62 + random() * 0.42), index % 2);
    }
    leaf(ctx, x, y + 12, 48 + random() * 18, 20, bend < 0 ? -0.2 : 0.25, index % 2);
  });
}

function paperBack(ctx, tones) {
  ctx.save();
  ctx.shadowColor = 'rgba(89,65,42,.09)';
  ctx.shadowBlur = 22;
  ctx.shadowOffsetY = 10;
  const sheet = ctx.createLinearGradient(270, 560, 658, 905);
  sheet.addColorStop(0, tones[0]);
  sheet.addColorStop(0.6, tones[1]);
  sheet.addColorStop(1, tones[2]);
  ctx.fillStyle = sheet;
  ctx.beginPath();
  ctx.moveTo(292, 570);
  ctx.bezierCurveTo(350, 549, 380, 562, 431, 598);
  ctx.bezierCurveTo(495, 561, 590, 540, 701, 578);
  ctx.bezierCurveTo(667, 686, 627, 802, 562, 915);
  ctx.quadraticCurveTo(522, 946, 470, 917);
  ctx.bezierCurveTo(400, 806, 345, 693, 292, 570);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function paperFront(ctx, tones) {
  ctx.save();
  const right = ctx.createLinearGradient(398, 689, 668, 768);
  right.addColorStop(0, tones[2]);
  right.addColorStop(0.38, tones[1]);
  right.addColorStop(1, tones[0]);
  ctx.globalAlpha = 0.97;
  ctx.fillStyle = right;
  ctx.beginPath();
  ctx.moveTo(668, 643);
  ctx.bezierCurveTo(620, 680, 552, 696, 403, 694);
  ctx.bezierCurveTo(432, 762, 456, 842, 480, 914);
  ctx.quadraticCurveTo(515, 935, 556, 910);
  ctx.bezierCurveTo(589, 834, 629, 727, 668, 643);
  ctx.closePath();
  ctx.fill();
  const left = ctx.createLinearGradient(339, 688, 566, 800);
  left.addColorStop(0, tones[0]);
  left.addColorStop(0.64, tones[1]);
  left.addColorStop(1, tones[2]);
  ctx.fillStyle = left;
  ctx.beginPath();
  ctx.moveTo(334, 648);
  ctx.bezierCurveTo(390, 672, 430, 678, 503, 714);
  ctx.bezierCurveTo(553, 741, 557, 810, 568, 892);
  ctx.quadraticCurveTo(536, 937, 486, 921);
  ctx.bezierCurveTo(449, 848, 389, 750, 334, 648);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,248,.48)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(340, 654);
  ctx.bezierCurveTo(401, 678, 448, 694, 499, 718);
  ctx.bezierCurveTo(542, 743, 550, 807, 560, 875);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(117,91,66,.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(611, 712);
  ctx.quadraticCurveTo(563, 786, 545, 888);
  ctx.stroke();
  ctx.restore();
}

function ribbon(ctx, palette) {
  ctx.save();
  ctx.translate(514, 819);
  ctx.rotate(-0.075);
  const band = ctx.createLinearGradient(0, -10, 0, 12);
  band.addColorStop(0, palette.light);
  band.addColorStop(0.5, palette.accent);
  band.addColorStop(1, palette.light);
  ctx.fillStyle = band;
  ctx.beginPath();
  ctx.moveTo(-66, -11);
  ctx.quadraticCurveTo(0, -2, 71, -15);
  ctx.lineTo(67, 8);
  ctx.quadraticCurveTo(0, 20, -60, 10);
  ctx.closePath();
  ctx.fill();
  const silk = ctx.createLinearGradient(-80, -45, 50, 112);
  silk.addColorStop(0, palette.light);
  silk.addColorStop(0.5, palette.accent);
  silk.addColorStop(1, palette.light);
  ctx.fillStyle = silk;
  ctx.beginPath();
  ctx.moveTo(-4, 3);
  ctx.bezierCurveTo(-37, -64, -95, -46, -73, -9);
  ctx.bezierCurveTo(-52, 18, -25, 13, -4, 3);
  ctx.moveTo(4, 2);
  ctx.bezierCurveTo(47, -51, 98, -41, 76, -8);
  ctx.bezierCurveTo(53, 19, 31, 18, 4, 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-8, 5);
  ctx.bezierCurveTo(-16, 40, -49, 74, -43, 119);
  ctx.lineTo(-27, 106);
  ctx.lineTo(-14, 119);
  ctx.bezierCurveTo(-27, 78, 13, 35, 8, 8);
  ctx.moveTo(7, 4);
  ctx.bezierCurveTo(41, 38, 49, 64, 39, 96);
  ctx.lineTo(57, 86);
  ctx.lineTo(66, 98);
  ctx.bezierCurveTo(73, 52, 35, 15, 7, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,245,242,.54)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(-8, 0);
  ctx.bezierCurveTo(-37, -40, -72, -40, -72, -20);
  ctx.moveTo(12, 1);
  ctx.bezierCurveTo(39, -25, 67, -35, 77, -20);
  ctx.stroke();
  ctx.fillStyle = palette.accent;
  ctx.beginPath();
  ctx.ellipse(0, 2, 12, 15, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function fitText(ctx, value, maxWidth, startSize, family, style = '') {
  let size = startSize;
  while (true) {
    ctx.font = `${style} ${size}px ${family}`.trim();
    if (ctx.measureText(value).width <= maxWidth || size <= 10) break;
    size -= 1;
  }
  return size;
}

function wrapText(ctx, value, maxWidth) {
  const lines = [];
  for (const paragraph of value.split('\n')) {
    let line = '';
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const candidate = line ? `${line} ${word}` : word;
      if (ctx.measureText(candidate).width <= maxWidth) {
        line = candidate;
        continue;
      }
      if (line) lines.push(line);
      line = '';
      for (const character of Array.from(word)) {
        if (ctx.measureText(line + character).width > maxWidth && line) {
          lines.push(line);
          line = '';
        }
        line += character;
      }
    }
    lines.push(line);
  }
  return lines;
}

function drawLettering(ctx, state, palette) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = palette.accent;
  ctx.font = `12px ${SANS}`;
  const caption = 'A LITTLE LOVE, IN BLOOM';
  const tracking = 3.2;
  const total = ctx.measureText(caption).width + tracking * (caption.length - 1);
  let x = (ART_WIDTH - total) / 2;
  ctx.textAlign = 'left';
  for (const character of caption) {
    ctx.fillText(character, x, 76);
    x += ctx.measureText(character).width + tracking;
  }
  ctx.textAlign = 'center';
  const recipient = Array.from(String(state.recipient || '').trim().replace(/\s+/g, ' ')).slice(0, 60).join('');
  const heading = recipient ? `For ${recipient}` : 'Just for you';
  ctx.fillStyle = palette.ink;
  fitText(ctx, heading, 770, 49, SERIF, 'italic');
  ctx.fillText(heading, 500, 141);
  ctx.strokeStyle = `${palette.accent}55`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(474, 177);
  ctx.quadraticCurveTo(500, 183, 526, 177);
  ctx.stroke();

  let message = Array.from(String(state.message || '').replace(/\r\n?/g, '\n').trim()).slice(0, 180).join('');
  message = message.split('\n').map(line => line.replace(/[ \t\f\v]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n');
  if (message) {
    function fitMessage(value) {
      let fontSize = 30;
      let lines;
      while (true) {
        ctx.font = `italic ${fontSize}px ${SERIF}`;
        lines = wrapText(ctx, value, 745);
        if (lines.length * fontSize * 1.3 <= 146 || fontSize <= 16) break;
        fontSize -= 1;
      }
      return { fontSize, lines };
    }
    let layout = fitMessage(message);
    if (layout.lines.length * layout.fontSize * 1.3 > 146 && message.includes('\n')) {
      layout = fitMessage(message.replace(/\s*\n+\s*/g, ' '));
    }
    const lineHeight = layout.fontSize * 1.3;
    const top = 1085 - (layout.lines.length - 1) * lineHeight / 2;
    ctx.fillStyle = palette.ink;
    layout.lines.forEach((line, index) => ctx.fillText(line, 500, top + index * lineHeight));
  }

  const sender = Array.from(String(state.sender || '').trim().replace(/\s+/g, ' ')).slice(0, 60).join('');
  if (sender) {
    const signature = `with love, ${sender}`;
    ctx.fillStyle = palette.accent;
    fitText(ctx, signature, 760, 28, HAND);
    ctx.fillText(signature, 500, 1191);
  } else {
    ctx.fillStyle = palette.accent;
    ctx.font = `21px ${SERIF}`;
    ctx.fillText('♡', 500, 1186);
  }
}

/** Draw the complete gift card; this is the shared preview and export renderer. */
export function renderBouquet(canvas, state = {}, { width = 1600, height = 2000 } = {}) {
  if (!sprites) throw new Error('The flowers are still loading. Please try again in a moment.');
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1 || width * height > 12000000) {
    throw new Error('That image size is not supported. Please choose a smaller download.');
  }
  const flower = MAIN_FLOWERS.includes(state.flower) ? state.flower : 'rose';
  const support = SUPPORT_FLOWERS.includes(state.support) ? state.support : 'daisy';
  const palette = PALETTES[state.palette] || PALETTES.blush;
  const tones = WRAPS[state.wrap] || WRAPS.ivory;
  const random = randomFrom(state.seed);
  canvas.width = Math.round(width);
  canvas.height = Math.round(height);
  const ctx = context2d(canvas, { alpha: false });
  ctx.setTransform(width / ART_WIDTH, 0, 0, height / ART_HEIGHT, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = '#fffaf3';
  ctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT);
  const glow = ctx.createRadialGradient(500, 478, 25, 500, 478, 500);
  glow.addColorStop(0, '#ffffff');
  glow.addColorStop(1, '#fffaf300');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, ART_WIDTH, ART_HEIGHT);
  const paperRandom = randomFrom(47);
  ctx.fillStyle = 'rgba(100,78,57,.032)';
  for (let i = 0; i < 2800; i += 1) ctx.fillRect(paperRandom() * ART_WIDTH, paperRandom() * ART_HEIGHT, 0.6, 0.6);

  const main = [
    [382, 352, 175, -0.48], [522, 317, 183, 0.16], [649, 376, 177, 0.39],
    [330, 476, 176, -0.3], [504, 460, 211, 0.07], [659, 504, 179, 0.56],
    [463, 583, 163, -0.22],
  ].map(([x, y, size, angle]) => ({
    x: x + (random() - 0.5) * 35,
    y: y + (random() - 0.5) * 28,
    size: size * (0.88 + random() * 0.22),
    angle: angle + (random() - 0.5) * 0.38,
  }));
  const fillerScale = support === 'lavender' ? 1.45 : support === 'babysbreath' ? 1.22 : 1;
  const fillers = [
    [295, 369, 100], [424, 272, 92], [613, 282, 92],
    [718, 435, 102], [286, 558, 97], [587, 575, 109], [644, 620, 93],
  ].map(([x, y, size]) => ({ x: x + (random() - 0.5) * 24, y: y + (random() - 0.5) * 20, size: size * fillerScale, angle: (random() - 0.5) * 0.6 }));

  paperBack(ctx, tones);
  foliage(ctx, random, support === 'greenery');
  main.forEach((item) => stem(ctx, item.x, item.y + item.size * 0.2, 505 + (random() - 0.5) * 28, 872, (item.x - 500) * 0.22, 3 + random() * 1.5));
  if (support !== 'greenery') fillers.forEach((item) => stem(ctx, item.x, item.y, 505, 835, (item.x - 500) * 0.18, 2));
  if (support !== 'greenery') fillers.slice(0, 5).forEach((item) => bloom(ctx, support, item.x, item.y, item.size, item.angle));
  main.sort((a, b) => a.y - b.y).forEach((item) => bloom(ctx, flower, item.x, item.y, item.size, item.angle));
  if (support !== 'greenery') fillers.slice(5).forEach((item) => bloom(ctx, support, item.x, item.y, item.size, item.angle));
  paperFront(ctx, tones);
  ribbon(ctx, palette);
  drawLettering(ctx, state, palette);
  drawStickers(ctx, state.stickers || [], ART_WIDTH, ART_HEIGHT);
  return canvas;
}

/** Return a lossless 2400 × 3000 PNG of exactly the current composition. */
export async function exportBouquet(state = {}) {
  if (state.stickers != null && !Array.isArray(state.stickers)) throw new Error('Your stickers could not be prepared. Please reload and try again.');
  const snapshot = { ...state, stickers: (state.stickers || []).map(sticker => ({ ...sticker })) };
  const releaseStickers = await retainStickerImages(snapshot.stickers);
  let canvas;
  try {
    await loadArtwork();
    if (document.fonts?.ready) await document.fonts.ready;
    canvas = document.createElement('canvas');
    renderBouquet(canvas, snapshot, { width: 2400, height: 3000 });
    return await new Promise((resolve, reject) => {
      canvas.toBlob((blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Your download could not be created. Please try again.'));
      }, 'image/png');
    });
  } finally {
    releaseStickers();
    if (canvas) {
      canvas.width = 0;
      canvas.height = 0;
    }
  }
}

/** Draw an unfiltered, transparent flower thumbnail for an accessible UI button. */
export function drawFlowerThumbnail(canvas, type) {
  if (!sprites) throw new Error('The flower artwork has not loaded yet.');
  canvas.width = 180;
  canvas.height = 180;
  const ctx = context2d(canvas);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.clearRect(0, 0, 180, 180);
  if (type === 'greenery') {
    stem(ctx, 102, 34, 82, 162, -9, 2.2);
    [[96, 65, -0.7], [94, 86, 0.85], [89, 108, -0.85], [85, 132, 0.8]].forEach(([x, y, angle], index) => leaf(ctx, x, y, 47, 24, angle, index % 2));
    leaf(ctx, 102, 55, 39, 22, 0.1);
  } else {
    bloom(ctx, type, 90, 90, 151);
  }
  return canvas;
}
