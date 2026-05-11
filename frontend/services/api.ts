import axios from 'axios';
import { API_BASE_URL } from '../config';

// Render free tier cold start can take 30-60s + processing takes 65s+
// Total worst-case: ~125s. We use 180s to have a safe margin.
const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 180000, // 3 minutes — handles Render cold start + processing
});

// Warmup ping: Call this on app load to pre-wake the Render backend
// so the user's first real request doesn't hit a cold start.
export const warmupBackend = async (): Promise<void> => {
    try {
        await axios.get(`${API_BASE_URL}/health`, { timeout: 60000 });
        console.log('[Warmup] Backend is awake.');
    } catch {
        // Silently ignore — backend will wake up on the real request
        console.log('[Warmup] Backend ping sent (may still be waking).');
    }
};

// Simple retry interceptor
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const { config } = error;
        if (!config || !config.retry) {
            return Promise.reject(error);
        }
        
        config.retryCount = config.retryCount || 0;
        
        if (config.retryCount >= config.retry) {
            return Promise.reject(error);
        }
        
        config.retryCount += 1;
        console.warn(`Retrying request (${config.retryCount}/${config.retry})...`);
        
        // Exponential backoff
        const backoff = new Promise((resolve) => {
            setTimeout(() => resolve(true), Math.pow(2, config.retryCount) * 1000);
        });
        
        await backoff;
        return api(config);
    }
);

export default api;
