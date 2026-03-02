import api from './api';

export interface ApplicationData {
  fullName: string;
  email: string;
  phone?: string;
  cv: File;
}

export const applicationService = {
  /**
   * Submit a job application
   */
  async applyToJob(jobId: string, data: ApplicationData) {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    if (data.phone) {
      formData.append('phone', data.phone);
    }
    formData.append('cv', data.cv);

    const response = await api.post(`/applications/${jobId}/apply`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
  },
};
