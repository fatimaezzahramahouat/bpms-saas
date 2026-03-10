/**
 * Auth Feature Types
 * 
 * Type definitions for the authentication feature module.
 * These types support:
 * - User authentication (login/logout)
 * - Organization registration
 * - JWT token management (future)
 * - Role-based access control (future)
 */

/**
 * Login credentials
 */
export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Organization registration data
 */
export interface OrganizationRegistration {
  orgName: string;
  responsibleName: string;
  employeeCount: string;
  phone: string;
  email: string;
}

/**
 * User roles for RBAC
 */
export type UserRole = 'ADMIN' | 'MANAGER' | 'RH' | 'EMPLOYEE' | 'admin' | 'manager' | 'rh' | 'employee';

/**
 * Auth user type (for future JWT implementation)
 */
export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  organizationId?: string;
  token?: string;
  provider?: 'LOCAL' | 'GOOGLE';
}

/**
 * Auth state (for future context implementation)
 */
export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
