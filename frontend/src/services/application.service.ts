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
 // 
async applyToJob(
  jobOfferId: string,
  data: {
    fullName: string;
    email: string;
    phone: string;
    cv: File;
  }
): Promise<any> {
  const formData = new FormData();
  formData.append('fullName', data.fullName);
  formData.append('email', data.email);
  formData.append('phone', data.phone);
  formData.append('cv', data.cv);

  const token = localStorage.getItem('token');
  
  const response = await fetch(`http://localhost:5000/api/applications/${jobOfferId}/apply`, {
    method: 'POST',
    headers: {
      ...(token && { 'Authorization': `Bearer ${token}` })
      
    },
    body: formData
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'Failed to submit application');
  }

  return await response.json();
}
};
