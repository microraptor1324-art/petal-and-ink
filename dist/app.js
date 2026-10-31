import { loadArtwork, renderBouquet, exportBouquet, drawFlowerThumbnail } from './renderer.js';
import { plantInkGarden } from './ink.js';
import { createStickerEditor } from './sticker-editor.js';

const DRAFT_KEY = 'petal-and-ink-draft-v1';
const INK_KEY = 'petal-and-ink-paused';
const defaults = { flower: 'rose', support: 'daisy', palette: 'blush', wrap: 'ivory', recipient: '', sender: '', message: 'If I had a flower for every time I thought of you, I could walk in my garden forever.', seed: 72819, stickers: [] };
const $ = (id) => document.getElementById(id);
const choices = { flower: ['rose', 'lily', 'poppy', 'sunflower', 'tulip', 'peony', 'hydrangea', 'orchid'], support: ['daisy', 'violet', 'greenery', 'lavender', 'babysbreath'], palette: ['blush', 'peach', 'lavender'], wrap: ['ivory', 'kraft', 'rose'] };
const flowerNames = { rose: 'garden roses', lily: 'lilies', poppy: 'poppies', sunflower: 'sunflowers', tulip: 'tulips', peony: 'peonies', hydrangea: 'hydrangeas', orchid: 'orchids', daisy: 'daisies', violet: 'violets', greenery: 'greenery', lavender: 'lavender', babysbreath: 'baby’s breath' };
let state = { ...defaults }, ready = false, exporting = false, frame = 0, storageAvailable = true;
try {
  const saved = JSON.parse(localStorage.getItem(DRAFT_KEY) || 'null');
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(choices)) if (choices[key].includes(saved[key])) state[key] = saved[key];
    for (const key of ['recipient', 'sender', 'message']) if (typeof saved[key] === 'string') state[key] = saved[key].slice(0, key === 'message' ? 180 : 35);
    if (Number.isFinite(saved.seed)) state.seed = saved.seed;
  }
} catch { storageAvailable = false; }

function syncControls() {
  for (const key of Object.keys(choices)) {
    document.querySelectorAll(`[data-${key}]`).forEach((button) => {
      const selected = button.dataset[key] === state[key];
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
  }
  for (const key of ['recipient', 'sender', 'message']) if ($(key).value !== state[key]) $(key).value = state[key];
  $('wrapLabel').textContent = state.wrap.charAt(0).toUpperCase() + state.wrap.slice(1);
  $('charCount').textContent = `${state.message.length} / 180`;
}

function saveDraft() {
  const { stickers, ...textDraft } = state;
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(textDraft)); storageAvailable = true; }
  catch { storageAvailable = false; }
  $('draftStatus').textContent = storageAvailable ? '• Your little creation is saved on this device' : 'Draft saving is unavailable in this browser';
}

function redraw() {
  if (!ready) return;
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => {
    try {
      renderBouquet($('bouquetCanvas'), state, { width: 1200, height: 1500 });
      $('bouquetCanvas').setAttribute('aria-label', `Bouquet of ${flowerNames[state.flower]} with ${flowerNames[state.support]}, ${state.wrap} wrapping and ${state.palette} ribbon.${state.recipient ? ` For ${state.recipient}.` : ''} ${state.message}${state.sender ? ` From ${state.sender}.` : ''}${state.stickers.length ? ` With ${state.stickers.length} personal sticker${state.stickers.length === 1 ? '' : 's'}.` : ''}`);
    } catch (error) { $('feedback').textContent = error.message || 'Something went wrong while arranging your blooms. Please try again.'; }
  });
}

function update(patch) { state = { ...state, ...patch }; syncControls(); redraw(); saveDraft(); $('feedback').textContent = ''; }
const stickerEditor = createStickerEditor({ getStickers: () => state.stickers, onChange: stickers => update({ stickers }) });
for (const key of Object.keys(choices)) document.querySelectorAll(`[data-${key}]`).forEach(button => button.addEventListener('click', () => update({ [key]: button.dataset[key] })));
for (const key of ['recipient', 'sender', 'message']) $(key).addEventListener('input', (event) => update({ [key]: event.target.value }));
$('shuffleButton').addEventListener('click', () => {
  const random = new Uint32Array(1);
  if (globalThis.crypto?.getRandomValues) crypto.getRandomValues(random); else random[0] = Math.floor(Math.random() * 2 ** 32);
  update({ seed: random[0] });
  $('feedback').textContent = 'A fresh arrangement, with the same little feelings.';
});
$('resetButton').addEventListener('click', () => { $('resetDialog').returnValue = 'cancel'; $('resetDialog').showModal(); });
$('resetDialog').addEventListener('close', () => { if ($('resetDialog').returnValue === 'reset') { update({ ...defaults, stickers: [] }); stickerEditor.reset(); } });

$('downloadButton').addEventListener('click', async () => {
  if (!ready || exporting) return;
  exporting = true;
  $('downloadButton').disabled = true;
  $('downloadLabel').textContent = 'Wrapping up your keepsake…';
  $('feedback').textContent = '';
  try {
    const snapshot = { ...state, stickers: state.stickers.map(sticker => ({ ...sticker })) };
    const blob = await exportBouquet(snapshot);
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `petal-and-ink-${snapshot.flower}-${snapshot.support}.png`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
    $('feedback').textContent = 'Your bouquet is ready. A little love to send or keep.';
  } catch (error) {
    $('feedback').textContent = error.message || 'Your keepsake could not be saved. Please try again.';
  } finally {
    exporting = false;
    $('downloadButton').disabled = false;
    $('downloadLabel').textContent = 'Save your bouquet';
  }
});

plantInkGarden($('inkGarden'));
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
let paused = reducedMotion.matches;
try { if (localStorage.getItem(INK_KEY) === 'true') paused = true; } catch { /* Optional preference. */ }
function syncInk() {
  document.body.classList.toggle('ink-paused', paused || document.hidden);
  $('inkToggle').setAttribute('aria-pressed', String(paused));
  $('inkLabel').textContent = reducedMotion.matches ? 'Still ink' : paused ? 'Let the ink flow' : 'Pause the ink';
  $('inkToggle').disabled = reducedMotion.matches;
  $('inkToggle').title = reducedMotion.matches ? 'Animation is off to respect your reduced motion preference' : '';
}
$('inkToggle').addEventListener('click', () => { paused = !paused; syncInk(); try { localStorage.setItem(INK_KEY, String(paused)); } catch { /* Optional preference. */ } });
reducedMotion.addEventListener('change', () => { if (reducedMotion.matches) paused = true; syncInk(); });
document.addEventListener('visibilitychange', syncInk);

async function prepareStudio() {
  $('artLoading').hidden = false;
  try {
    await Promise.all([loadArtwork(), stickerEditor.restore(), Promise.allSettled([document.fonts.load('16px StudioSerif'), document.fonts.load('16px StudioSans'), document.fonts.load('16px StudioHand')])]);
    await document.fonts.ready;
    for (const button of document.querySelectorAll('[data-flower], [data-support]')) {
      const canvas = button.querySelector('canvas');
      if (canvas) drawFlowerThumbnail(canvas, button.dataset.flower || button.dataset.support);
    }
    ready = true;
    redraw();
    $('artLoading').hidden = true;
    $('downloadButton').disabled = false;
    $('shuffleButton').disabled = false;
    stickerEditor.setReady(true);
  } catch (error) {
    $('artLoading').replaceChildren();
    const message = document.createElement('p'); message.textContent = error.message || 'We couldn’t gather your flowers. Please try again.';
    const retry = document.createElement('button'); retry.textContent = 'Try again'; retry.addEventListener('click', prepareStudio);
    $('artLoading').append(message, retry);
  }
}
syncControls(); syncInk();
if (!storageAvailable) $('draftStatus').textContent = 'Draft saving is unavailable in this browser';
prepareStudio();
