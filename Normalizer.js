export class Normalizer {
  static normalizeItem(raw) {
    return {
      id: String(raw.id || raw.guid || raw._id || Math.random().toString(36).substring(2, 9)),
      title: String(raw.title || raw.headline || 'Untitled Story').trim(),
      url: String(raw.url || raw.link || '#'),
      source: String(raw.source || raw.sourceName || raw.publisher || 'Unknown Source').trim(),
      publishedAt: Normalizer.parseTimestamp(raw.publishedAt || raw.pubDate || raw.timestamp),
      category: String(raw.category || raw.section || 'General').trim(),
      image: raw.image || raw.imageUrl || raw.urlToImage || null,
      location: Normalizer.extractLocation(raw)
    };
  }

  static normalizeBatch(rawArticles = []) {
    if (!Array.isArray(rawArticles)) return [];

    return rawArticles
      .map(item => {
        try {
          return Normalizer.normalizeItem(item);
        } catch (e) {
          console.warn('Skipping malformed raw article:', item, e);
          return null;
        }
      })
      .filter(Boolean);
  }

  static extractLocation(raw) {
    const loc = raw.location || raw.geo || raw.coordinates;
    if (!loc) return null;

    const lat = Number(loc.lat ?? loc.latitude);
    const lng = Number(loc.lng ?? loc.longitude ?? loc.lon);

    if (
      isNaN(lat) ||
      isNaN(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return null;
    }

    return {
      lat,
      lng,
      label: String(
        loc.label || loc.cityName || loc.name || 'Approximate Location'
      ).trim(),
      approximate: Boolean(loc.approximate ?? true)
    };
  }

  static parseTimestamp(input) {
    if (!input) return new Date().toISOString();

    const parsed = new Date(input);

    return isNaN(parsed.getTime())
      ? new Date().toISOString()
      : parsed.toISOString();
  }
}

export default Normalizer;
