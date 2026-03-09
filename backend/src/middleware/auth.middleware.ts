import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    organisationId: string;
    isAdmin: boolean;
    role: string;
  };
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const authReq = req as AuthRequest;
  let token = req.cookies?.token;

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.split(" ")[1];
    }
  }

  if (!token) {
    res.status(401).json({ error: "Access denied. No token provided." });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      organisationId: string;
      isAdmin: boolean;
      role: string;
    };
    authReq.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token." });
  }
};
