import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/AppError";
import { Prisma } from "@prisma/client";

export const errorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = err;

  // Ensure message and stack are captured if we are wrapping
  if (!(err instanceof AppError)) {
    const statusCode = err.statusCode || (err.status && typeof err.status === "number" ? err.status : 500);
    const message = err.message || "Internal Server Error";
    
    // Check if it's a Prisma error
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === "P2002") {
        const target = (err.meta?.target as string[])?.join(", ") || "field";
        error = new AppError(`Duplicate field value: ${target}. Please use another value!`, 409);
      } else if (err.code === "P2025") {
        error = new AppError("Record not found.", 404);
      } else if (err.code === "P2003") {
        error = new AppError("Invalid reference key error (Foreign Key Constraint Failed).", 400);
      } else {
        error = new AppError(`Database error: ${err.message}`, 400);
      }
    } else if (err.name === "JsonWebTokenError") {
      error = new AppError("Invalid token. Please log in again!", 401);
    } else if (err.name === "TokenExpiredError") {
      error = new AppError("Your token has expired! Please log in again.", 401);
    } else {
      // Create a new AppError but flag it as non-operational if it is a 500 unexpected crash
      const newErr = new AppError(message, statusCode);
      // If it was already set as an operational error, preserve it, otherwise it's not operational
      (newErr as any).isOperational = err.isOperational !== undefined ? err.isOperational : false;
      error = newErr;
    }
  }

  const statusCode = error.statusCode || 500;
  const message = error.message || "Internal Server Error";
  const isOperational = error.isOperational;

  // Log error
  if (!isOperational) {
    console.error(`[Error] UNEXPECTED ERROR on ${req.method} ${req.url}:`, err);
  } else {
    console.warn(`[Operational Error] ${req.method} ${req.url}: ${message}`);
  }

  res.status(statusCode).json({
    status: isOperational ? "fail" : "error",
    statusCode,
    message: isOperational ? message : "Internal server error",
    error: isOperational ? message : "Internal server error", // For frontend compatibility
    ...(process.env.NODE_ENV === "development" ? { stack: err.stack, details: err } : {}),
  });
};

