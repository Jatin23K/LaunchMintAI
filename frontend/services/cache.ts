import { RealData, DSInsightsData } from '../types';

interface CachedResult {
  data: RealData;
  dsData: DSInsightsData | null;
  warData: any | null;
  deepIntel: any | null;
  extData: any | null;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'launchmint_cache_';
const TTL = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedResult = (idea: string): {
  data: RealData;
  dsData: DSInsightsData | null;
  warData: any | null;
  deepIntel: any | null;
  extData: any | null;
} | null => {
  const key = CACHE_KEY_PREFIX + idea.trim().toLowerCase();
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  try {
    const parsed: CachedResult = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return {
      data: parsed.data,
      dsData: parsed.dsData,
      warData: parsed.warData ?? null,
      deepIntel: parsed.deepIntel ?? null,
      extData: parsed.extData ?? null,
    };
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

const MAX_CACHE_ENTRIES = 20;

const enforceMaxEntries = () => {
  const keys = Object.keys(localStorage).filter(k => k.startsWith(CACHE_KEY_PREFIX));
  if (keys.length <= MAX_CACHE_ENTRIES) return;
  // Find and evict the oldest entry
  let oldestKey = keys[0];
  let oldestTs = Infinity;
  keys.forEach(k => {
    try {
      const entry = JSON.parse(localStorage.getItem(k) || '{}');
      if ((entry.timestamp ?? Infinity) < oldestTs) {
        oldestTs = entry.timestamp;
        oldestKey = k;
      }
    } catch {}
  });
  localStorage.removeItem(oldestKey);
};

export const setCachedResult = (
  idea: string,
  data: RealData,
  dsData: DSInsightsData | null,
  warData: any | null = null,
  deepIntel: any | null = null,
  extData: any | null = null,
) => {
  const key = CACHE_KEY_PREFIX + idea.trim().toLowerCase();
  const cacheObj: CachedResult = {
    data,
    dsData,
    warData,
    deepIntel,
    extData,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(cacheObj));
  enforceMaxEntries(); // OPT 7: evict oldest if over 20 entries
};
