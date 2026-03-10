import api from './api';

export const organisationService = {
    getMembers: async () => {
        const response = await api.get('/organisation/members');
        return response.data;
    },
};

export default organisationService;
