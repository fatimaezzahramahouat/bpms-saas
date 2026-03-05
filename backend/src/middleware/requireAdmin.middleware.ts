import { Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * Middleware to enforce Admin role requirement.
 * Checks the isAdmin flag from the JWT payload.
 */
export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user?.isAdmin) {
    res.status(403).json({ error: "Forbidden: Admin role required" });
    return;
  }

  next();
};
