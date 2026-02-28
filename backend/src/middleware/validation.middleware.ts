import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

/**
 * Generic middleware to validate request body/params/query using Zod.
 */
export const validate = (schema: ZodSchema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            schema.parse(req.body); // Validating body by default for Nexflow CRUD
            return next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    message: "Validation failed",
                    errors: error.flatten().fieldErrors,
                });
            }
            return res.status(500).json({ message: "Internal Server Error" });
        }
    };
};
