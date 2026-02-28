/**
 * Auth Service
 * 
 * Authentication service for handling login, registration, and token management.
 * This service is prepared for JWT authentication implementation.
 * 
 * Current: Mock implementation
 * Future: Full JWT authentication with refresh tokens
 */

import type { LoginCredentials, OrganizationRegistration, AuthUser } from '../types';

/**
 * Mock login function
 * 
 * TODO: Replace with actual API call when backend is ready
 * Expected implementation:
 * - POST to /api/auth/login
 * - Store JWT in localStorage/sessionStorage
 * - Handle refresh tokens
 */
export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  // Simulate API call
  console.log('Login attempt:', credentials);
  
  // Mock response
  return {
    id: '1',
    email: credentials.email,
    role: 'user',
    token: 'mock-jwt-token',
  };
}

/**
 * Logout function
 */
export async function logout(): Promise<void> {
  try {
    await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    localStorage.removeItem('user');
    localStorage.removeItem('isAuthenticated');
  }
}

/**
 * Register organization
 */
export async function registerOrganization(data: OrganizationRegistration): Promise<{ success: boolean }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/register-organisation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erreur lors de l\'inscription');
    
    localStorage.setItem('user', JSON.stringify(result.data.user));
    localStorage.setItem('isAuthenticated', 'true');
    return { success: true };
  } catch (err: any) {
    throw new Error(err.message || 'Erreur réseau');
  }
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return localStorage.getItem('isAuthenticated') === 'true';
}

/**
 * Get current user
 */
export function getCurrentUser(): AuthUser | null {
  const user = localStorage.getItem('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

/**
 * Request password reset
 */
export async function requestPasswordReset(email: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
      credentials: 'include',
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erreur lors de la demande');
    return result;
  } catch (err: any) {
    throw new Error(err.message || 'Erreur réseau');
  }
}

/**
 * Reset password
 */
export async function resetPassword(token: string, password: string): Promise<{ message: string }> {
  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, password }),
      credentials: 'include',
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Erreur lors de la réinitialisation');
    return result;
  } catch (err: any) {
    throw new Error(err.message || 'Erreur réseau');
  }
}
