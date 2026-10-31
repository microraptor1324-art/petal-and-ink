export const MAX_STICKERS = 6;

const MAX_INPUT_BYTES = 5 * 1024 * 1024;
const MAX_IMAGE_EDGE = 1024;
const MAX_SOURCE_PIXELS = 40000000;
const MAX_SOURCE_EDGE = 16384;
const PNG_PREFIX = 'data:image/png;base64,';
const DB_NAME = 'petal-and-ink-stickers';
const DB_STORE = 'drafts';
const DB_KEY = 'current';
const images = new Map();
let saveQueue = Promise.resolve();

function imageContext(canvas) {
  let context;
  try {
    context = canvas.getContext('2d', { alpha: true, colorSpace: 'srgb' });
  } catch {
    context = canvas.getContext('2d', { alpha: true });
  }
  if (!context) throw new Error('Your browser could not prepare this sticker. Please try another browser.');
  return context;
}

function imageType(bytes) {
  if (bytes.length >= 24 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return 'image/png';
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg';
  const text = (start, end) => String.fromCharCode(...bytes.subarray(start, end));
  if (bytes.length >= 10 && ['GIF87a', 'GIF89a'].includes(text(0, 6))) return 'image/gif';
  if (bytes.length >= 20 && text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
  throw new Error('Choose a PNG, WebP, JPG, or GIF image saved on your device. Other file types are not supported.');
}

function encodedDimensions(bytes, type) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (type === 'image/png' && bytes.length >= 24) return [view.getUint32(16), view.getUint32(20)];
  if (type === 'image/gif' && bytes.length >= 10) return [view.getUint16(6, true), view.getUint16(8, true)];
  if (type === 'image/webp' && bytes.length >= 30) {
    const chunk = String.fromCharCode(...bytes.subarray(12, 16));
    if (chunk === 'VP8X') return [1 + bytes[24] + bytes[25] * 256 + bytes[26] * 65536, 1 + bytes[27] + bytes[28] * 256 + bytes[29] * 65536];
    if (chunk === 'VP8 ') return [view.getUint16(26, true) & 16383, view.getUint16(28, true) & 16383];
    if (chunk === 'VP8L') {
      const bits = view.getUint32(21, true);
      return [(bits & 16383) + 1, ((bits >>> 14) & 16383) + 1];
    }
  }
  if (type === 'image/jpeg') {
    let offset = 2;
    while (offset + 3 < bytes.length) {
      if (bytes[offset++] !== 255) continue;
      while (offset < bytes.length && bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 217 || marker === 218) break;
      if (marker === 1 || (marker >= 208 && marker <= 215)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if ([192, 193, 194, 195, 197, 198, 199, 201, 202, 203, 205, 206, 207].includes(marker) && length >= 7) {
        return [view.getUint16(offset + 5), view.getUint16(offset + 3)];
      }
      offset += length;
    }
  }
  return null;
}

function checkDimensions(width, height, canonical = false) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width < 1 || height < 1) {
    throw new Error('This sticker image is damaged or empty. Please save it again and retry.');
  }
  if (canonical ? Math.max(width, height) > MAX_IMAGE_EDGE : width * height > MAX_SOURCE_PIXELS || Math.max(width, height) > MAX_SOURCE_EDGE) {
    throw new Error(canonical
      ? 'This saved sticker is too large to restore. Please add the original image again.'
      : 'This image has unusually large dimensions. Please resize it before adding it as a sticker.');
  }
}

async function decodeImage(blob) {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(blob);
    } catch {
      // Some browsers decode WebP or GIF through an image element instead.
    }
  }
  const url = URL.createObjectURL(blob);
  try {
    const image = new Image();
    image.decoding = 'async';
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error('This sticker could not be read. Please save the image again and retry.'));
      image.src = url;
    });
    if (typeof image.decode === 'function') await image.decode();
    return image;
  } catch {
    throw new Error('This sticker could not be read. Please save the image again and retry.');
  } finally {
    URL.revokeObjectURL(url);
  }
}

function pngBytes(src) {
  if (typeof src !== 'string' || !src.startsWith(PNG_PREFIX)) {
    throw new Error('A saved sticker is not a valid PNG image. Please add that sticker again.');
  }
  const encoded = src.slice(PNG_PREFIX.length);
  if (!encoded || encoded.length > Math.ceil(MAX_INPUT_BYTES / 3) * 4 || encoded.length % 4 !== 0 || !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
    throw new Error('A saved sticker is damaged or too large. Please add that sticker again.');
  }
  let bytes;
  try {
    const binary = atob(encoded);
    bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  } catch {
    throw new Error('A saved sticker is damaged. Please add that sticker again.');
  }
  if (imageType(bytes) !== 'image/png') throw new Error('A saved sticker is not a valid PNG image. Please add that sticker again.');
  const dimensions = encodedDimensions(bytes, 'image/png');
  checkDimensions(...dimensions, true);
  return bytes;
}

function validateRecords(stickers) {
  if (!Array.isArray(stickers)) throw new Error('The saved sticker draft is damaged. Please add your stickers again.');
  if (stickers.length > MAX_STICKERS) throw new Error(`You can add up to ${MAX_STICKERS} stickers to one bouquet.`);
  const ids = new Set();
  return stickers.map(sticker => {
    if (!sticker || typeof sticker !== 'object' || Array.isArray(sticker)
      || typeof sticker.id !== 'string' || !/^[A-Za-z0-9_-]{1,128}$/.test(sticker.id)
      || typeof sticker.name !== 'string' || sticker.name.length > 160
      || ['x', 'y', 'size', 'rotation'].some(key => typeof sticker[key] !== 'number' || !Number.isFinite(sticker[key]))) {
      throw new Error('A saved sticker has damaged details. Please add that sticker again.');
    }
    if (ids.has(sticker.id)) throw new Error('The saved sticker draft contains repeated items. Please add your stickers again.');
    ids.add(sticker.id);
    if (!images.has(sticker.src)) pngBytes(sticker.src);
    return {
      id: sticker.id,
      name: sticker.name.replace(/[\u0000-\u001f\u007f]/g, ' ').trim() || 'Sticker',
      src: sticker.src,
      x: sticker.x,
      y: sticker.y,
      size: sticker.size,
      rotation: sticker.rotation,
    };
  });
}

function dimensionsOf(image) {
  return [image.naturalWidth || image.width, image.naturalHeight || image.height];
}

function loadOne(src) {
  let entry = images.get(src);
  if (!entry) {
    entry = { image: null, width: 0, height: 0, promise: null, pins: 0, releaseWhenUnused: false };
    images.set(src, entry);
    entry.promise = (async () => {
      try {
        const bytes = pngBytes(src);
        const image = await decodeImage(new Blob([bytes], { type: 'image/png' }));
        const [width, height] = dimensionsOf(image);
        checkDimensions(width, height, true);
        entry.image = image;
        entry.width = width;
        entry.height = height;
      } catch (error) {
        if (images.get(src) === entry) images.delete(src);
        throw error;
      }
    })();
  }
  return entry.promise;
}

/** Prepare every sticker before the synchronous bouquet preview is rendered. */
export async function loadStickerImages(stickers = []) {
  const records = validateRecords(stickers);
  await Promise.all(records.map(sticker => loadOne(sticker.src)));
}

/** Hold an export's decoded snapshot until its returned release callback is called. */
export async function retainStickerImages(stickers = []) {
  const records = validateRecords(stickers);
  const retained = [];
  let released = false;
  const release = () => {
    if (released) return;
    released = true;
    for (const { src, entry } of retained) {
      entry.pins = Math.max(0, entry.pins - 1);
      if (!entry.pins && entry.releaseWhenUnused && images.get(src) === entry) {
        entry.image?.close?.();
        images.delete(src);
      }
    }
  };
  try {
    const loading = records.map(sticker => {
      const promise = loadOne(sticker.src);
      const entry = images.get(sticker.src);
      if (entry) {
        entry.pins++;
        retained.push({ src: sticker.src, entry });
      }
      return promise;
    });
    await Promise.all(loading);
    return release;
  } catch (error) {
    release();
    throw error;
  }
}

function finite(value, fallback) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function constrainForCanvas(sticker, width, height) {
  const size = Math.min(0.32, Math.max(0.07, finite(sticker.size, 0.16)));
  const rotation = Math.min(180, Math.max(-180, finite(sticker.rotation, -8)));
  const entry = images.get(sticker.src);
  const imageWidth = entry?.width || 1;
  const imageHeight = entry?.height || 1;
  const longest = Math.max(imageWidth, imageHeight);
  const drawnWidth = size * width * imageWidth / longest;
  const drawnHeight = size * width * imageHeight / longest;
  const radians = rotation * Math.PI / 180;
  const horizontal = (Math.abs(Math.cos(radians)) * drawnWidth + Math.abs(Math.sin(radians)) * drawnHeight) / (2 * width);
  const vertical = (Math.abs(Math.sin(radians)) * drawnWidth + Math.abs(Math.cos(radians)) * drawnHeight) / (2 * height);
  return {
    ...sticker,
    x: Math.min(1 - horizontal, Math.max(horizontal, finite(sticker.x, 0.78))),
    y: Math.min(1 - vertical, Math.max(vertical, finite(sticker.y, 0.72))),
    size,
    rotation,
  };
}

/** Return a copy with the entire rotated sticker kept inside the portrait card. */
export function constrainSticker(sticker = {}) {
  return constrainForCanvas(sticker, 1000, 1250);
}

/** Rasterize a local image once; animated files become a still PNG. */
export async function importSticker(file, index = 0) {
  if (!file || typeof file.arrayBuffer !== 'function' || !Number.isFinite(file.size) || file.size < 1) {
    throw new Error('Choose a sticker image saved on your device.');
  }
  if (file.size > MAX_INPUT_BYTES) throw new Error('This sticker is larger than 5 MB. Please choose a smaller image.');
  const offset = Math.max(0, Math.floor(finite(index, 0)));
  if (offset >= MAX_STICKERS) throw new Error(`You can add up to ${MAX_STICKERS} stickers to one bouquet.`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = imageType(bytes);
  const declaredDimensions = encodedDimensions(bytes, type);
  if (declaredDimensions) checkDimensions(...declaredDimensions);
  const decoded = await decodeImage(new Blob([bytes], { type }));
  const canvas = document.createElement('canvas');
  try {
    const [width, height] = dimensionsOf(decoded);
    checkDimensions(width, height);
    const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(width, height));
    canvas.width = Math.max(1, Math.round(width * scale));
    canvas.height = Math.max(1, Math.round(height * scale));
    const context = imageContext(canvas);
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(decoded, 0, 0, canvas.width, canvas.height);
    const src = canvas.toDataURL('image/png');
    const id = globalThis.crypto?.randomUUID?.() || `sticker-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    const name = Array.from(String(file.name || 'Sticker').replace(/\.(png|webp|jpe?g|gif)$/i, '').replace(/[\u0000-\u001f\u007f]/g, ' ').trim()).slice(0, 60).join('') || 'Sticker';
    const sticker = { id, name, src, x: 0.78 - offset % 3 * 0.055, y: 0.72 - Math.floor(offset / 3) * 0.075, size: 0.16, rotation: -8 + offset * 4 };
    await loadStickerImages([sticker]);
    return constrainSticker(sticker);
  } finally {
    decoded.close?.();
    canvas.width = 0;
    canvas.height = 0;
  }
}

/** Paint prepared stickers on the shared scene; transparency and aspect are retained. */
export function drawStickers(context, stickers = [], width = 1000, height = 1250) {
  if (!Array.isArray(stickers) || stickers.length > MAX_STICKERS) throw new Error(`A bouquet can contain up to ${MAX_STICKERS} stickers.`);
  for (const original of stickers) {
    const entry = images.get(original.src);
    if (!entry?.image) throw new Error('A sticker is still loading. Please wait a moment and try again.');
    const sticker = constrainForCanvas(original, width, height);
    const scale = sticker.size * width / Math.max(entry.width, entry.height);
    const drawnWidth = entry.width * scale;
    const drawnHeight = entry.height * scale;
    context.save();
    context.translate(sticker.x * width, sticker.y * height);
    context.rotate(sticker.rotation * Math.PI / 180);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = 'high';
    context.drawImage(entry.image, -drawnWidth / 2, -drawnHeight / 2, drawnWidth, drawnHeight);
    context.restore();
  }
}

function storageError(error, action) {
  if (error?.name === 'QuotaExceededError') return new Error('Your device has no room to save these stickers. Remove a sticker or free some space, then try again.');
  return new Error(`Your sticker draft could not be ${action} on this device. Your current bouquet can still be downloaded.`);
}

function openDatabase() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) {
      reject(new Error('This browser cannot save sticker drafts. You can still add stickers and download this bouquet.'));
      return;
    }
    let settled = false;
    let request;
    try {
      request = indexedDB.open(DB_NAME, 1);
    } catch (error) {
      reject(storageError(error, 'opened'));
      return;
    }
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(DB_STORE)) request.result.createObjectStore(DB_STORE);
    };
    request.onsuccess = () => {
      if (settled) request.result.close();
      else { settled = true; resolve(request.result); }
    };
    request.onerror = () => { settled = true; reject(storageError(request.error, 'opened')); };
    request.onblocked = () => {
      settled = true;
      reject(new Error('Close other Petal & Ink tabs, then try saving your sticker draft again.'));
    };
  });
}

async function draftTransaction(mode, value) {
  const database = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      let transaction;
      let request;
      let result;
      try {
        transaction = database.transaction(DB_STORE, mode);
        request = mode === 'readonly' ? transaction.objectStore(DB_STORE).get(DB_KEY) : transaction.objectStore(DB_STORE).put(value, DB_KEY);
      } catch (error) {
        reject(storageError(error, mode === 'readonly' ? 'restored' : 'saved'));
        return;
      }
      request.onsuccess = () => { result = request.result; };
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () => reject(storageError(transaction.error || request.error, mode === 'readonly' ? 'restored' : 'saved'));
    });
  } finally {
    database.close();
  }
}

/** Restore local-only sticker records; corrupt drafts and storage errors are reported. */
export async function readStickerDraft() {
  await saveQueue;
  const value = await draftTransaction('readonly');
  if (value === undefined) return [];
  const records = validateRecords(value);
  await loadStickerImages(records);
  return records.map(constrainSticker);
}

/** Snapshot immediately, then commit local draft writes in invocation order. */
export async function saveStickerDraft(stickers = []) {
  const snapshot = validateRecords(stickers);
  const operation = saveQueue.then(async () => {
    await loadStickerImages(snapshot);
    await draftTransaction('readwrite', snapshot.map(constrainSticker));
  });
  saveQueue = operation.catch(() => {});
  return operation;
}

/** Release decoded images no longer used by the current draft. */
export function removeUnusedStickerImages(stickers = []) {
  const retained = new Set(stickers.map(sticker => sticker.src));
  for (const [src, entry] of images) {
    if (retained.has(src)) {
      entry.releaseWhenUnused = false;
    } else if (entry.pins) {
      entry.releaseWhenUnused = true;
    } else if (entry.image) {
      entry.image.close?.();
      images.delete(src);
    }
  }
}
