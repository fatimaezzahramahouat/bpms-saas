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
        // Data contains metadata properties like custom fields. Send it as JSON under 'metadata'.
        const payload = data instanceof FormData
            ? data
            : { workflowId, metadata: data };

        const response = await api.post('/process/start', payload);
        return response.data;
    },

    /**
     * Gets all process instances initiated by the current user.
     */
    async getMyRequests() {
        const response = await api.get('/process/my-requests');
        return response.data;
    },
};

export default processService;
