import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/auth.middleware";

// ─── Type Definitions ─────────────────────────────────────

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * catchAsync — wraps an async Express handler and forwards
 * any uncaught errors to the global Express error handler.
 *
 * Usage:
 *   export const myHandler = catchAsync(async (req, res) => { ... });
 */
export const catchAsync = (fn: AsyncHandler) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    fn(req, res, next).catch(next);
  };
};
