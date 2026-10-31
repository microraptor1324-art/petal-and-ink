import { MAX_STICKERS, importSticker, loadStickerImages, constrainSticker, readStickerDraft, saveStickerDraft, removeUnusedStickerImages } from './stickers.js';

export function createStickerEditor({ getStickers, onChange }) {
  const $ = id => document.getElementById(id);
  let selectedId = null, ready = false, busy = false, restored = false, generation = 0, saveRevision = 0, drag = null;
  const tiles = new Map(), handles = new Map();
  const status = message => { $('stickerStatus').textContent = message; };
  const selected = () => getStickers().find(sticker => sticker.id === selectedId);
  async function persist() {
    const revision = ++saveRevision;
    try { await saveStickerDraft(getStickers()); }
    catch { if (revision === saveRevision) status('Your stickers are here, but this browser couldn’t save them for later. Download your keepsake before closing the tab.'); }
  }
  function commit(stickers, save = true) {
    onChange(stickers);
    sync();
    if (save) void persist();
  }
  function select(id) { selectedId = id; sync(); }
  function patchSelected(patch, save = true) {
    if (!selected()) return;
    commit(getStickers().map(sticker => sticker.id === selectedId ? constrainSticker({ ...sticker, ...patch }) : sticker), save);
  }
  function cardPoint(event) {
    const card = $('keepsake'), rect = card.getBoundingClientRect();
    const transform = getComputedStyle(card).transform;
    const inverse = new DOMMatrix(transform === 'none' ? undefined : transform).inverse();
    const point = new DOMPoint(event.clientX - rect.left - rect.width / 2, event.clientY - rect.top - rect.height / 2).matrixTransform(inverse);
    return { x: point.x / card.offsetWidth + .5, y: point.y / card.offsetHeight + .5 };
  }
  function startDrag(event, id, button) {
    if (event.button !== 0) return;
    event.preventDefault();
    select(id);
    button.focus({ preventScroll: true });
    const point = cardPoint(event), sticker = selected();
    drag = { id, pointer: event.pointerId, offsetX: point.x - sticker.x, offsetY: point.y - sticker.y };
    button.setPointerCapture(event.pointerId);
    button.classList.add('is-dragging');
  }
  function moveDrag(event) {
    if (!drag || event.pointerId !== drag.pointer) return;
    const point = cardPoint(event);
    commit(getStickers().map(sticker => sticker.id === drag.id ? constrainSticker({ ...sticker, x: point.x - drag.offsetX, y: point.y - drag.offsetY }) : sticker), false);
  }
  function endDrag(event, button) {
    if (!drag || event.pointerId !== drag.pointer) return;
    drag = null;
    button.classList.remove('is-dragging');
    if (button.hasPointerCapture(event.pointerId)) button.releasePointerCapture(event.pointerId);
    void persist();
  }
  function move(direction, distance = .015) {
    const sticker = selected(); if (!sticker) return;
    const delta = { left: [-distance, 0], right: [distance, 0], up: [0, -distance * .8], down: [0, distance * .8] }[direction];
    patchSelected({ x: sticker.x + delta[0], y: sticker.y + delta[1] });
  }
  function removeSelected() {
    const index = getStickers().findIndex(sticker => sticker.id === selectedId);
    const remaining = getStickers().filter(sticker => sticker.id !== selectedId);
    selectedId = remaining[Math.min(index, remaining.length - 1)]?.id || null;
    commit(remaining);
    removeUnusedStickerImages(remaining);
    status('Sticker removed.');
  }
  function sync() {
    const stickers = getStickers(), current = selected();
    $('stickerCount').textContent = `${stickers.length} / ${MAX_STICKERS}`;
    $('stickerUploadButton').disabled = !ready || busy || stickers.length >= MAX_STICKERS;
    $('stickerUploadButton').firstChild.textContent = busy ? 'Adding your stickers… ' : 'Choose sticker files ';
    $('stickerDropzone').classList.toggle('is-busy', busy);
    $('stickerEditor').hidden = !current;
    for (const [id, node] of tiles) if (!stickers.some(sticker => sticker.id === id)) { node.remove(); tiles.delete(id); }
    for (const [id, node] of handles) if (!stickers.some(sticker => sticker.id === id)) { node.remove(); handles.delete(id); }
    for (const [index, sticker] of stickers.entries()) {
      let tile = tiles.get(sticker.id);
      if (!tile) {
        tile = document.createElement('button'); tile.type = 'button'; tile.className = 'sticker-tile';
        const image = document.createElement('img'); image.src = sticker.src; image.alt = ''; tile.append(image);
        tile.addEventListener('click', () => select(sticker.id));
        tiles.set(sticker.id, tile); $('stickerList').append(tile);
      }
      tile.setAttribute('aria-label', `Edit sticker ${index + 1}: ${sticker.name}`);
      tile.setAttribute('aria-pressed', String(sticker.id === selectedId));
      tile.classList.toggle('selected', sticker.id === selectedId);
      let handle = handles.get(sticker.id);
      if (!handle) {
        handle = document.createElement('button'); handle.type = 'button'; handle.className = 'sticker-handle';
        handle.addEventListener('click', () => select(sticker.id));
        handle.addEventListener('pointerdown', event => startDrag(event, sticker.id, handle));
        handle.addEventListener('pointermove', moveDrag);
        handle.addEventListener('pointerup', event => endDrag(event, handle));
        handle.addEventListener('pointercancel', event => endDrag(event, handle));
        handle.addEventListener('keydown', event => {
          const direction = { ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down' }[event.key];
          if (direction) { event.preventDefault(); selectedId = sticker.id; move(direction, event.shiftKey ? .04 : .008); }
          else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); selectedId = sticker.id; removeSelected(); }
        });
        handles.set(sticker.id, handle); $('stickerHandles').append(handle);
      }
      handle.setAttribute('aria-label', `Move sticker ${index + 1}: ${sticker.name}. Use arrow keys to move, or Delete to remove.`);
      handle.setAttribute('aria-pressed', String(sticker.id === selectedId));
      handle.classList.toggle('selected', sticker.id === selectedId);
      handle.style.left = `${sticker.x * 100}%`; handle.style.top = `${sticker.y * 100}%`;
      handle.style.width = `${sticker.size * 100}%`; handle.style.transform = `translate(-50%, -50%) rotate(${sticker.rotation}deg)`;
    }
    if (current) {
      $('selectedStickerName').textContent = current.name;
      $('stickerSize').value = String(Math.round(current.size * 100)); $('stickerSizeValue').textContent = `${Math.round(current.size * 100)}%`;
      $('stickerRotation').value = String(Math.round(current.rotation)); $('stickerRotationValue').textContent = `${Math.round(current.rotation)}°`;
    }
  }
  async function addFiles(files) {
    if (!ready || busy) { status('Please wait for your flowers and stickers to finish loading.'); return; }
    if (!files.length) return;
    if (getStickers().length >= MAX_STICKERS) { status('Six little extras is the limit. Remove a sticker to add another.'); return; }
    busy = true; sync();
    const currentGeneration = generation;
    let added = 0; const errors = [];
    try {
      for (const file of files) {
        if (currentGeneration !== generation) break;
        if (getStickers().length >= MAX_STICKERS) { errors.push('Your keepsake can hold up to six stickers.'); break; }
        try {
          const sticker = await importSticker(file, getStickers().length);
          await loadStickerImages([sticker]);
          if (currentGeneration !== generation) break;
          selectedId = sticker.id;
          commit([...getStickers(), constrainSticker(sticker)], false); added += 1;
        } catch (error) { errors.push(error.message || 'That image couldn’t be opened. Try another PNG or WebP.'); }
      }
      if (currentGeneration === generation) {
        status([added ? `${added} sticker${added === 1 ? '' : 's'} added. Select one to move, resize or tilt it.` : '', ...errors].filter(Boolean).join(' '));
        if (added) await persist();
      }
    } finally { busy = false; $('stickerInput').value = ''; sync(); }
  }
  $('stickerUploadButton').addEventListener('click', () => $('stickerInput').click());
  $('stickerInput').addEventListener('change', event => void addFiles(Array.from(event.target.files || [])));
  const zone = $('stickerDropzone');
  zone.addEventListener('dragover', event => { event.preventDefault(); zone.classList.add('drag-over'); });
  zone.addEventListener('dragleave', event => { if (!zone.contains(event.relatedTarget)) zone.classList.remove('drag-over'); });
  zone.addEventListener('drop', event => { event.preventDefault(); zone.classList.remove('drag-over'); void addFiles(Array.from(event.dataTransfer.files)); });
  document.addEventListener('paste', event => {
    if (event.target.closest?.('input, textarea, [contenteditable="true"]')) return;
    const files = Array.from(event.clipboardData?.files || []);
    if (!files.length) return;
    event.preventDefault(); void addFiles(files);
  });
  $('stickerSize').addEventListener('input', event => patchSelected({ size: Number(event.target.value) / 100 }, false));
  $('stickerRotation').addEventListener('input', event => patchSelected({ rotation: Number(event.target.value) }, false));
  for (const id of ['stickerSize', 'stickerRotation']) $(id).addEventListener('change', () => void persist());
  document.querySelectorAll('[data-sticker-move]').forEach(button => button.addEventListener('click', () => move(button.dataset.stickerMove)));
  $('removeSticker').addEventListener('click', removeSelected);
  sync();
  return {
    setReady(value) { ready = value; sync(); },
    async restore() {
      if (restored) return; restored = true;
      const currentGeneration = generation;
      try {
        const stickers = await readStickerDraft(); await loadStickerImages(stickers);
        if (currentGeneration !== generation) return;
        selectedId = stickers[0]?.id || null;
        commit(stickers.map(constrainSticker), false);
        if (stickers.length) status('Your saved stickers are back, just where you left them.');
      } catch { status('Saved stickers couldn’t be restored. You can add them again, or continue without them.'); }
    },
    reset() { generation += 1; selectedId = null; commit([]); removeUnusedStickerImages([]); status(''); },
  };
}
