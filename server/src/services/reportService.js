import { ApiError } from '../utils/apiError.js';
import { prisma } from '../config/database.js';
import {
  isValidUUID,
  toDbEnum,
  fromDbEnum,
} from '../constants/marketplace.js';

/**
 * Format strictly sanitized public report DTO for student viewing.
 * Strictly guarantees zero exposure of internal moderatorNotes, passwords, tokens, or private emails.
 */
export const formatReportDTO = (reportDoc) => {
  if (!reportDoc) return null;

  let listing = null;
  if (reportDoc.listing) {
    listing = {
      id: reportDoc.listing.id || reportDoc.listingId,
      title: reportDoc.listing.title || 'Marketplace Item',
      status: fromDbEnum(reportDoc.listing.status) || 'active',
      price: typeof reportDoc.listing.price === 'number' ? reportDoc.listing.price : 0,
    };
  }

  let reportedUser = null;
  if (reportDoc.reportedUser) {
    reportedUser = {
      id: reportDoc.reportedUser.id || reportDoc.reportedUserId,
      name: reportDoc.reportedUser.name || 'Campus Student',
      college: reportDoc.reportedUser.college || '',
    };
  }

  return {
    id: reportDoc.id,
    targetType: listing ? 'listing' : 'user',
    listing,
    reportedUser,
    reason: fromDbEnum(reportDoc.reason),
    description: reportDoc.description || '',
    status: fromDbEnum(reportDoc.status) || 'pending',
    createdAt: reportDoc.createdAt,
    updatedAt: reportDoc.updatedAt,
  };
};

/**
 * Create a new infraction report against a listing or student user.
 * Validates targets, rejects self-reports, prevents duplicate active reports, and ignores privileged fields.
 *
 * @param {string} reporterId - Authenticated student identifier (from req.userId)
 * @param {Object} data - Cleaned report data { listingId, reportedUserId, reason, description }
 * @returns {Promise<Object>} Formatted report DTO
 */
export const createReport = async (reporterId, data) => {
  const { listingId, reportedUserId, reason, description } = data;

  // 1. Direct user self-report check
  if (reportedUserId && reportedUserId.toString() === reporterId.toString()) {
    throw new ApiError(400, 'CANNOT_REPORT_SELF', 'You cannot file a report against your own account.');
  }

  let listingDoc = null;
  let targetUserId = reportedUserId || null;

  // 2. Validate listing target if provided
  if (listingId) {
    if (!isValidUUID(listingId)) {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found or is no longer available.');
    }

    listingDoc = await prisma.listing.findUnique({
      where: { id: listingId },
    });

    if (!listingDoc || fromDbEnum(listingDoc.status) === 'removed') {
      throw new ApiError(404, 'LISTING_NOT_FOUND', 'Listing not found or is no longer available.');
    }

    // Listing self-report check: student cannot report their own listing
    if (listingDoc.sellerId === reporterId.toString()) {
      throw new ApiError(400, 'CANNOT_REPORT_SELF', 'You cannot file a report against your own listing.');
    }

    // Automatically link listing's seller as reportedUser if not explicitly provided
    if (!targetUserId) {
      targetUserId = listingDoc.sellerId;
    }
  }

  // 3. Validate user target if explicitly provided
  if (reportedUserId) {
    if (!isValidUUID(reportedUserId)) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Reported user account does not exist.');
    }

    const userDoc = await prisma.user.findUnique({
      where: { id: reportedUserId },
    });

    if (!userDoc) {
      throw new ApiError(404, 'USER_NOT_FOUND', 'Reported user account does not exist.');
    }
  }

  // 4. Duplicate report prevention: Check for an existing pending or reviewing report
  const dbReason = toDbEnum(reason);
  const duplicateWhere = {
    reporterId,
    reason: dbReason,
    status: { in: ['PENDING', 'REVIEWING'] },
  };

  if (listingId) {
    duplicateWhere.listingId = listingId;
  } else {
    duplicateWhere.reportedUserId = targetUserId;
    duplicateWhere.listingId = null;
  }

  const existingActiveReport = await prisma.report.findFirst({
    where: duplicateWhere,
  });

  if (existingActiveReport) {
    throw new ApiError(
      409,
      'DUPLICATE_REPORT',
      `You already have an active report under review for this target with reason "${reason}".`
    );
  }

  // 5. Persist report with default pending status
  let report;
  try {
    report = await prisma.report.create({
      data: {
        reporterId,
        listingId: listingId || null,
        reportedUserId: targetUserId || null,
        reason: dbReason,
        description: description || '',
        status: 'PENDING',
        moderatorNotes: '',
      },
      include: {
        listing: {
          select: { id: true, title: true, status: true, price: true },
        },
        reportedUser: {
          select: { id: true, name: true, college: true },
        },
      },
    });
  } catch (err) {
    if (err.code === 'P2002') {
      throw new ApiError(
        409,
        'DUPLICATE_REPORT',
        `You already have an active report under review for this target with reason "${reason}".`
      );
    }
    throw err;
  }

  return formatReportDTO(report);
};

/**
 * Retrieve paginated reports submitted by the authenticated student.
 * Only returns reports where reporter equals req.userId.
 *
 * @param {string} reporterId - Authenticated student identifier
 * @param {Object} pagination - { page, limit }
 * @returns {Promise<Object>} { reports, pagination }
 */
export const getMyReports = async (reporterId, { page = 1, limit = 20 } = {}) => {
  const where = { reporterId };

  const [total, records] = await prisma.$transaction([
    prisma.report.count({ where }),
    prisma.report.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        listing: {
          select: { id: true, title: true, status: true, price: true },
        },
        reportedUser: {
          select: { id: true, name: true, college: true },
        },
      },
    }),
  ]);

  const reports = records.map(formatReportDTO);
  const totalPages = Math.ceil(total / limit) || (total === 0 ? 0 : 1);

  return {
    reports,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

export default {
  createReport,
  getMyReports,
  formatReportDTO,
};
