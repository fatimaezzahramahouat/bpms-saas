// Roles strictly matching the Prisma schema User model relations:
// Admin, Manager, RH, Employee
export const ROLES = {
    ADMIN: 'ADMIN',
    MANAGER: 'MANAGER',
    RH: 'RH',
    EMPLOYEE: 'EMPLOYEE',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES] | string;

/**
 * Checks if a user has permission to access or edit workflows (Admin or RH).
 */
export const canAccessWorkflow = (role: UserRole): boolean => {
    if (!role) return false;
    const normalizedRole = role.toString().toUpperCase().trim();

    const adminRoles = ['ADMIN', 'ADMINISTRATEUR'];
    const hrRoles = ['RH', 'HR', 'HR_MANAGER', 'RESPONSABLE RH', 'RH RESPONSABLE'];

    return adminRoles.includes(normalizedRole) || hrRoles.includes(normalizedRole);
};

/**
 * Checks if a user has permission to manage users/team (Admin only).
 */
export const canManageUsers = (role: UserRole): boolean => {
    if (!role) return false;
    const normalizedRole = role.toString().toUpperCase().trim();
    return ['ADMIN', 'ADMINISTRATEUR'].includes(normalizedRole);
};

/**
 * Checks if a user can approve requests (Admin, Manager or RH).
 */
export const canApprove = (role: UserRole): boolean => {
    const normalizedRole = role.toString().toUpperCase().trim();
    return ['ADMIN', 'MANAGER', 'RH'].includes(normalizedRole);
};

/**
 * Generic check for multiple allowed roles.
 */
export const hasAnyRole = (currentRole: UserRole, allowedRoles: UserRole[]): boolean => {
    return allowedRoles.includes(currentRole);
};
