import { Response } from "express";
import { AuthRequest } from "../middleware/auth.middleware";
import { catchAsync } from "../utils/catchAsync";
import { candidateStatisticsService } from "../services/candidateStatistics.service";

export const candidateStatisticsController = {
  /**
   * GET /api/candidates/statistics
   * Get comprehensive candidate statistics
   */
  getStatistics: catchAsync(async (req: AuthRequest, res: Response) => {
    // Get organisation ID from authenticated user
    const organisationId = req.user?.organisationId;

    const statistics = await candidateStatisticsService.getStatistics(organisationId);

    res.status(200).json({
      success: true,
      data: statistics,
    });
  }),
};
