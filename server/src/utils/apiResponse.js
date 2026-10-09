/**
 * Standardized API response formatters.
 */
export const apiResponse = {
  /**
   * Format a successful JSON response envelope.
   * @param {*} data - Payload data or message
   * @param {Object} [meta=null] - Optional pagination or metadata
   */
  success: (data, meta = null) => {
    const payload = {
      success: true,
      data,
    };
    if (meta) {
      payload.meta = meta;
    }
    return payload;
  },

  /**
   * Format a standardized error JSON response envelope.
   * @param {string} code - Error code identifier
   * @param {string} message - Human-readable error description
   * @param {*} [details=null] - Optional field details
   */
  error: (code, message, details = null) => {
    const payload = {
      success: false,
      error: {
        code,
        message,
      },
    };
    if (details !== null && details !== undefined) {
      payload.error.details = details;
    }
    return payload;
  },
};

export default apiResponse;
