import { apiResponse } from '../utils/apiResponse.js';
import {
  getCurrentUserProfile,
  updateCurrentUserProfile,
  getPublicProfileById,
} from '../services/userService.js';

/**
 * Retrieve the current authenticated student profile.
 * GET /api/users/me
 */
export const getMe = async (req, res, next) => {
  try {
    const user = await getCurrentUserProfile(req.userId);
    return res.status(200).json(apiResponse.success({ user }));
  } catch (error) {
    next(error);
  }
};

/**
 * Update allowed fields of the current authenticated student profile.
 * PATCH /api/users/me
 */
export const updateMe = async (req, res, next) => {
  try {
    const user = await updateCurrentUserProfile(req.userId, req.cleanProfileUpdates);
    return res.status(200).json(
      apiResponse.success(
        { user },
        { message: 'Profile updated successfully.' }
      )
    );
  } catch (error) {
    next(error);
  }
};

/**
 * Retrieve public seller profile by user ID.
 * GET /api/users/:id
 */
export const getPublicUser = async (req, res, next) => {
  try {
    const user = await getPublicProfileById(req.params.id);
    return res.status(200).json(apiResponse.success({ user }));
  } catch (error) {
    next(error);
  }
};

export default {
  getMe,
  updateMe,
  getPublicUser,
};
