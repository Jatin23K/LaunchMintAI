import { RealData, DSInsightsData } from '../types';

interface CachedResult {
  data: RealData;
  dsData: DSInsightsData | null;
  timestamp: number;
}

const CACHE_KEY_PREFIX = 'launchmint_cache_';
const TTL = 24 * 60 * 60 * 1000; // 24 hours

export const getCachedResult = (idea: string): { data: RealData, dsData: DSInsightsData | null } | null => {
  const key = CACHE_KEY_PREFIX + idea.trim().toLowerCase();
  const cached = localStorage.getItem(key);
  if (!cached) return null;

  try {
    const parsed: CachedResult = JSON.parse(cached);
    if (Date.now() - parsed.timestamp > TTL) {
      localStorage.removeItem(key);
      return null;
    }
    return { data: parsed.data, dsData: parsed.dsData };
  } catch (e) {
    localStorage.removeItem(key);
    return null;
  }
};

export const setCachedResult = (idea: string, data: RealData, dsData: DSInsightsData | null) => {
  const key = CACHE_KEY_PREFIX + idea.trim().toLowerCase();
  const cacheObj: CachedResult = {
    data,
    dsData,
    timestamp: Date.now()
  };
  localStorage.setItem(key, JSON.stringify(cacheObj));
};
