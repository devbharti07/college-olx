import { apiResponse } from '../utils/apiResponse.js';
import {
  createReport as createReportService,
  getMyReports as getMyReportsService,
} from '../services/reportService.js';

/**
 * Submit an infraction report against a listing or user.
 * POST /api/reports
 */
export const createReport = async (req, res, next) => {
  try {
    const report = await createReportService(req.userId, req.cleanReportData);
    return res.status(201).json(
      apiResponse.success(
        { report },
        { message: 'Report submitted successfully. Campus administrators will review the infraction.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve paginated reports submitted by the current authenticated student.
 * GET /api/reports/mine
 */
export const getMyReports = async (req, res, next) => {
  try {
    const result = await getMyReportsService(req.userId, req.pagination);
    return res.status(200).json(
      apiResponse.success(
        { reports: result.reports, pagination: result.pagination },
        result.pagination
      )
    );
  } catch (error) {
    next(error);
  }
};

export default {
  createReport,
  getMyReports,
};
