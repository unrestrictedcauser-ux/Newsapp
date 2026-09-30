/**
 * Normalizer.js
 * Standardizes raw news article objects into a clean, predictable structure.
 */

/**
 * Generates a deterministic 32-bit integer hash string from an input value.
 * Used as a fallback when upstream IDs are missing to ensure referential transparency.
 * 
 * @param {string} str - The string to hash
 * @returns {string} Base36 encoded hash string
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32-bit integer
  }
  return `id_${Math.abs(hash).toString(36)}`;
}

/**
 * Resolves a stable, deterministic article ID.
 * Prefers explicit upstream identifiers; falls back to hashing stable article metadata.
 * 
 * @param {Object} rawArticle - Raw input article object
 * @returns {string} A stable unique identifier
 */
function resolveArticleId(rawArticle) {
  // 1. Prefer explicit upstream IDs
  if (rawArticle.id) return String(rawArticle.id);
  if (rawArticle.guid) return String(rawArticle.guid);
  if (rawArticle._id) return String(rawArticle._id);

  // 2. Deterministic fallback based on stable fields (URL preferred)
  const primaryKey = rawArticle.url || rawArticle.link || rawArticle.canonicalUrl;
  if (primaryKey) {
    return hashString(String(primaryKey).trim().toLowerCase());
  }

  // 3. Composite fallback if URL is also missing
  const title = rawArticle.title || '';
  const source = rawArticle.source?.name || rawArticle.source || '';
  const publishedAt = rawArticle.publishedAt || rawArticle.pubDate || '';
  
  const compositeKey = `${source}:${title}:${publishedAt}`.toLowerCase();
  
  return hashString(compositeKey);
}

/**
 * Safely parses and normalizes dates into standard ISO 8601 format.
 * 
 * @param {string|number|Date} dateVal 
 * @returns {string|null} ISO date string or null if invalid
 */
function normalizeDate(dateVal) {
  if (!dateVal) return null;
  const parsed = new Date(dateVal);
  return isNaN(parsed.getTime()) ? null : parsed.toISOString();
}

/**
 * Normalizes a raw news article into a unified schema.
 * 
 * @param {Object} rawArticle - Raw article object from external API
 * @returns {Object} Standardized article object
 */
function normalizeArticle(rawArticle = {}) {
  return {
    id: resolveArticleId(rawArticle),
    title: rawArticle.title ? String(rawArticle.title).trim() : 'Untitled',
    description: rawArticle.description || rawArticle.summary || null,
    content: rawArticle.content || rawArticle.body || null,
    url: rawArticle.url || rawArticle.link || rawArticle.canonicalUrl || null,
    imageUrl: rawArticle.urlToImage || rawArticle.imageUrl || rawArticle.media || null,
    publishedAt: normalizeDate(rawArticle.publishedAt || rawArticle.pubDate || rawArticle.created_at),
    source: {
      id: rawArticle.source?.id || null,
      name: rawArticle.source?.name || (typeof rawArticle.source === 'string' ? rawArticle.source : 'Unknown Source'),
    },
    author: rawArticle.author || rawArticle.byline || null,
  };
}

/**
 * Batch normalizes an array of raw article objects.
 * 
 * @param {Array<Object>} articles - Array of raw article objects
 * @returns {Array<Object>} Array of normalized article objects
 */
function normalizeArticles(articles = []) {
  if (!Array.isArray(articles)) return [];
  return articles.map(normalizeArticle);
}

module.exports = {
  normalizeArticle,
  normalizeArticles,
  resolveArticleId,
};
