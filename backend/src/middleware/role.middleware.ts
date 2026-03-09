import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "./auth.middleware";
import prisma from "../lib/prisma";

/**
 * Middleware to enforce RH role requirement.
 * Verifies if the authenticated user has an entry in the RH model.
 */
export const requireRH = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authReq = req as AuthRequest;
  const id = authReq.user?.id;

  if (!id) {
    res.status(401).json({ error: "Unauthorized: User not found in request context" });
    return;
  }

  try {
    const rhRecord = await prisma.rH.findUnique({
      where: { userId: id },
    });

    if (!rhRecord) {
      res.status(403).json({ error: "Forbidden: RH role required" });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ error: "Internal Server Error during role verification" });
  }
};
