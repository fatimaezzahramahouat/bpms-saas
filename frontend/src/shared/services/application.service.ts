import { API_BASE_URL } from '../constants';

export interface ApplicationInput {
  fullName: string;
  email: string;
  phone: string;
  cv: File;
}

export const applicationService = {
  /**
   * Submit a job application.
   * Uses FormData for multipart/form-data support (for file uploads).
   */
  async applyToJob(jobOfferId: string | number, data: ApplicationInput) {
    const formData = new FormData();
    formData.append('fullName', data.fullName);
    formData.append('email', data.email);
    formData.append('phone', data.phone);
    formData.append('cv', data.cv);

    const response = await fetch(`${API_BASE_URL}/applications/${jobOfferId}/apply`, {
      method: 'POST',
      body: formData,
      // Note: We don't set Content-Type header; fetch sets it automatically with the boundary for FormData
    });

    const result = await response.json();

    if (!response.ok) {
      // Handle backend validation errors or other issues
      const errorMessage = result.errors 
        ? Object.values(result.errors).flat().join(', ')
        : result.error || 'Une erreur est survenue lors de la soumission.';
      throw new Error(errorMessage);
    }

    return result;
  }
};
