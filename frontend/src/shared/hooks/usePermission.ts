import { useMemo } from 'react';
import { canAccessWorkflow, canManageUsers, UserRole } from '../utils/permissions.util';

/**
 * Hook to handle permission checks in components.
 * Retrieves the current user role from localStorage.
 */
export const usePermission = () => {
    const user = useMemo(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    }, []);

    const role = useMemo(() => {
        const raw = user.role || user.role_name || (user.isAdmin || user.admin ? 'ADMIN' : (user.rh || user.isRH ? 'RH' : 'USER'));
        return raw.toString().toUpperCase().trim().replace(/[\s\u00A0]+/g, ' ');
    }, [user]);

    const canEdit = canAccessWorkflow(role);

    // Admin check includes both versions (normalized)
    const isActuallyAdmin = role === 'ADMIN' || role === 'ADMINISTRATEUR' || !!user.isAdmin || !!user.admin;
    const isHR = canEdit && !isActuallyAdmin;

    return {
        role,
        canEditWorkflow: canEdit,
        canViewWorkflow: true,
        canManageUsers: canManageUsers(role),
        isAdmin: isActuallyAdmin,
        isHR,
        isEmployee: !isActuallyAdmin && !isHR
    };
};
