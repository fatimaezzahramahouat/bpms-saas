import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";

/**
 * Middleware to enforce Admin role requirement.
 * Checks the isAdmin flag from the JWT payload.
 */
export const requireAdmin = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authReq = req as AuthRequest;
  if (!authReq.user?.isAdmin) {
    res.status(403).json({ error: "Forbidden: Admin role required" });
    return;
  }

  next();
};
