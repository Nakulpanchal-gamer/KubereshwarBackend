// controllers/_utils.js
function normalizeImageField(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    const url = input.trim();
    return url ? { url, publicId: null } : null;
  }
  const url = (input.url || '').trim();
  const publicId = ((input.publicId || '').trim()) || null;
  return url ? { url, publicId } : null;
}

function normalizeImageArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(x => {
      if (typeof x === 'string') return { url: x.trim(), publicId: null };
      const url = (x?.url || '').trim();
      const publicId = ((x?.publicId || '').trim()) || null;
      return url ? { url, publicId } : null;
    })
    .filter(Boolean);
}

module.exports = { normalizeImageField, normalizeImageArray };
