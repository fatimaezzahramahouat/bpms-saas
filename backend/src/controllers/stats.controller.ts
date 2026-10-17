import { Request, Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { statsService } from "../services/stats.service";
import { AppError } from "../utils/AppError";

/** Extract organisationId from the JWT payload (set by authMiddleware). */
const getOrgId = (req: AuthRequest): string => {
    const organisationId = req.user?.organisationId;
    if (!organisationId) throw new AppError("Unauthorized: missing organisationId in token", 401);
    return organisationId;
};

export const statsController = {
    /**
     * GET /api/stats/workflows
     * Returns comprehensive workflow analytics for the authenticated organisation.
     */
    getWorkflowStats: catchAsync(async (req: Request, res: Response) => {
        const authReq = req as AuthRequest;
        const organisationId = getOrgId(authReq);

        const stats = await statsService.getWorkflowStats(organisationId);

        res.status(200).json({
            status: "success",
            data: stats
        });
    })
};
