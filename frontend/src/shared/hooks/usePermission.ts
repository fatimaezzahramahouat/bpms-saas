import { useMemo, useState, useEffect } from 'react';
import { canAccessWorkflow, canManageUsers, UserRole } from '../utils/permissions.util';

/**
 * Hook to handle permission checks in components.
 * Retrieves the current user role from localStorage and reacts to changes.
 */
export const usePermission = () => {
    // Initial state from localStorage
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    });

    // Listen for storage changes in the same window (or across windows)
    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
                setUser(updatedUser);
            } catch (e) {
                setUser({});
            }
        };

        // Listen for the standard storage event (works across tabs)
        window.addEventListener('storage', handleStorageChange);

        // Custom event for same-window updates (since storage event only fires on other windows)
        window.addEventListener('user-data-updated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('user-data-updated', handleStorageChange);
        };
    }, []);

    const role = useMemo(() => {
        // Preference: user.role (explicit string from backend)
        // Fallback: user.role_name or structure check
        const raw = user.role || user.role_name || (user.admin ? 'ADMIN' : (user.rh ? 'RH' : (user.manager ? 'MANAGER' : 'EMPLOYEE')));
        return raw.toString().toUpperCase().trim().replace(/[\s\u00A0]+/g, ' ');
    }, [user]);

    const canEdit = canAccessWorkflow(role);

    // Admin check: Exact ADMIN or ADMINISTRATEUR
    const isActuallyAdmin = role === 'ADMIN' || role === 'ADMINISTRATEUR' || !!user.isAdmin || !!user.admin;
    const isHR = canEdit && !isActuallyAdmin;

    return {
        user,
        role,
        canEditWorkflow: canEdit,
        canViewWorkflow: true,
        canManageUsers: canManageUsers(role),
        isAdmin: isActuallyAdmin,
        isHR,
        isEmployee: !isActuallyAdmin && !isHR
    };
};
