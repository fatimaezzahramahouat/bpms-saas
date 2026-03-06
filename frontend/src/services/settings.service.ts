import api from './api';

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  workflowUpdates: boolean;
  taskAssigned: boolean;
  recruitmentNotifications: boolean;
}

export interface ActiveSession {
  id: string;
  userAgent: string;
  ipAddress: string;
  createdAt: string;
  current?: boolean;
}

export interface OrganisationSettings {
  name: string;
  logo?: string;
  domain?: string;
  address?: string;
  city?: string;
  website?: string;
}

export const settingsService = {
  // Profile
  async updateProfile(data: UserProfile): Promise<{ message: string; data: any }> {
    const response = await api.patch('/settings/profile', data);
    return response.data;
  },

  // Password
  async updatePassword(data: any): Promise<{ message: string }> {
    const response = await api.patch('/settings/password', data);
    return response.data;
  },

  // Notifications
  async updateNotifications(data: NotificationSettings): Promise<{ message: string; data: any }> {
    const response = await api.patch('/settings/notifications', data);
    return response.data;
  },

  // Theme
  async updateTheme(theme: 'light' | 'dark' | 'system'): Promise<{ message: string }> {
    const response = await api.patch('/settings/theme', { theme });
    return response.data;
  },

  // Sessions
  async getSessions(): Promise<{ data: ActiveSession[] }> {
    const response = await api.get('/settings/sessions');
    return response.data;
  },

  async deleteSession(id: string): Promise<{ message: string }> {
    const response = await api.delete(`/settings/sessions/${id}`);
    return response.data;
  },

  // Organisation
  async updateOrganisation(data: Partial<OrganisationSettings>): Promise<{ message: string; data: any }> {
    const response = await api.patch('/settings/organisation', data);
    return response.data;
  },

  async deleteOrganisation(): Promise<{ message: string }> {
    const response = await api.delete('/settings/organisation');
    return response.data;
  }
};
