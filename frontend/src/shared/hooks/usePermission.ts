import { useMemo, useState, useEffect } from 'react';
import { canAccessWorkflow, canManageUsers, canApprove, UserRole } from '../utils/permissions.util';

/**
 * Hook to handle permission checks in components.
 * Roles match the Prisma schema User model relations: Admin, Manager, RH, Employee.
 */
export const usePermission = () => {
    const [user, setUser] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('user') || '{}');
        } catch (e) {
            return {};
        }
    });

    useEffect(() => {
        const handleStorageChange = () => {
            try {
                const updatedUser = JSON.parse(localStorage.getItem('user') || '{}');
                setUser(updatedUser);
            } catch (e) {
                setUser({});
            }
        };

        window.addEventListener('storage', handleStorageChange);
        window.addEventListener('user-data-updated', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('user-data-updated', handleStorageChange);
        };
    }, []);

    // Derive role from user object — matches Prisma relations: admin, manager, rh, employee
    const role = useMemo((): string => {
        if (user.role) return user.role.toString().toUpperCase().trim();
        // Fallback: infer from relation presence
        if (user.admin) return 'ADMIN';
        if (user.manager) return 'MANAGER';
        if (user.rh) return 'RH';
        if (user.employee) return 'EMPLOYEE';
        return 'EMPLOYEE';
    }, [user]);

    return {
        user,
        role,
        canEditWorkflow: canAccessWorkflow(role),
        canViewWorkflow: true,
        canManageUsers: canManageUsers(role),
        canApprove: canApprove(role),
        isAdmin: role === 'ADMIN',
        isManager: role === 'MANAGER',
        isHR: role === 'RH',
        isEmployee: role === 'EMPLOYEE',
    };
};

