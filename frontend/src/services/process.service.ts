import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
    withCredentials: true,
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const processService = {
    /**
     * Starts a new workflow process instance.
     */
    async startProcess(workflowId: string, data?: any) {
        // If data is FormData, send it directly, otherwise send as JSON
        const response = await api.post('/process/start', data instanceof FormData ? data : { workflowId });
        return response.data;
    },
};

export default processService;
