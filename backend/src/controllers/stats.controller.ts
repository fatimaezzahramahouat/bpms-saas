import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { statsService } from "../services/stats.service";

/** Extract organisationId from the JWT payload (set by authMiddleware). */
const getOrgId = (req: AuthRequest): string => {
    const organisationId = req.user?.organisationId;
    if (!organisationId) throw new Error("Unauthorized: missing organisationId in token");
    return organisationId;
};

export const statsController = {
    /**
     * GET /api/stats/workflows
     * Returns comprehensive workflow analytics for the authenticated organisation.
     */
    getWorkflowStats: catchAsync(async (req: AuthRequest, res: Response) => {
        const organisationId = getOrgId(req);

        console.log(`[StatsController] Fetching workflow stats for org ${organisationId}`);
        const stats = await statsService.getWorkflowStats(organisationId);

        res.status(200).json({
            status: "success",
            data: stats
        });
    })
};
