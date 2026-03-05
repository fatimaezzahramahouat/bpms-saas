import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * Middleware to restrict access based on user roles.
 * @param allowedRoles Array of strings representing roles allowed to access the route.
 */
export const checkRole = (allowedRoles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role?.toUpperCase().trim();

        if (!userRole) {
            res.status(403).json({ error: "Forbidden: No role found for user" });
            return;
        }

        // Normalize allowed roles for comparison
        const normalizedAllowedRoles = allowedRoles.map(r => r.toUpperCase().trim());

        if (!normalizedAllowedRoles.includes(userRole)) {
            res.status(403).json({ error: `Forbidden: Insufficient permissions. Required roles: ${allowedRoles.join(", ")}` });
            return;
        }

        next();
    };
};
