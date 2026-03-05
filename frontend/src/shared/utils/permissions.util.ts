export const ROLES = {
    ADMIN: 'ADMIN',
    ADMINISTRATEUR: 'ADMINISTRATEUR',
    HR_MANAGER: 'HR_MANAGER',
    RESPONSABLE_RH: 'RESPONSABLE RH',
    RH: 'RH',
    USER: 'USER',
} as const;

export type UserRole = typeof ROLES[keyof typeof ROLES] | string;

/**
 * Checks if a user has permission to access or edit workflows.
 */
export const canAccessWorkflow = (role: UserRole): boolean => {
    if (!role) return false;
    // Deep normalization: uppercase, trim, and replace all types of spaces (including non-breaking) with single space
    const normalizedRole = role.toString().toUpperCase().trim().replace(/[\s\u00A0]+/g, ' ');

    const allowedRoles = [
        'ADMIN',
        'ADMINISTRATEUR',
        'HR_MANAGER',
        'RH',
        'RESPONSABLE RH',
        'HR',
        'RESPONSABLE_RH'
    ];

    return allowedRoles.includes(normalizedRole);
};

/**
 * Checks if a user has permission to manage users/team.
 */
export const canManageUsers = (role: UserRole): boolean => {
    const normalizedRole = role.toUpperCase().trim();
    return normalizedRole === ROLES.ADMIN || normalizedRole === ROLES.ADMINISTRATEUR;
};

/**
 * Generic check for multiple allowed roles.
 */
export const hasAnyRole = (currentRole: UserRole, allowedRoles: UserRole[]): boolean => {
    return allowedRoles.includes(currentRole);
};
