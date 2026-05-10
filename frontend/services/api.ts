import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: API_BASE_URL,
    timeout: 90000, // 90 seconds
});

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
        console.warn(`🔄 Retrying request (${config.retryCount}/${config.retry})...`);
        
        // Exponential backoff
        const backoff = new Promise((resolve) => {
            setTimeout(() => resolve(true), Math.pow(2, config.retryCount) * 1000);
        });
        
        await backoff;
        return api(config);
    }
);

export default api;
